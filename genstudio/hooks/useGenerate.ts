import { useState, useRef, useEffect } from 'react';
import { useGenerationStore } from '@/store/generationStore';
import { GenerateRequest } from '@/types';
import { mutate } from 'swr';

export function useGenerate() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const setActiveJob = useGenerationStore((state) => state.setActiveJob);
  const updateActiveJob = useGenerationStore((state) => state.updateActiveJob);

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  const generate = async (params: GenerateRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);
      cleanup();

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit generation');
      }

      const { generationId } = await res.json();
      setActiveJob(generationId);

      // Optimistically insert the new generation into the SWR cache immediately
      mutate('/api/generations', (current: any) => {
        const list = Array.isArray(current) ? current : [];
        if (list.some((g: any) => g.id === generationId)) return list;
        return [
          {
            id: generationId,
            prompt: params.prompt.trim(),
            status: 'processing',
            imageUrl: null,
            createdAt: new Date().toISOString(),
            parentId: params.parentId || null,
            width: params.width || 1024,
            height: params.height || 1024,
            steps: params.steps || 4,
          },
          ...list,
        ];
      }, { revalidate: false });

      let pollCount = 0;
      const MAX_POLLS = 30;

      intervalRef.current = setInterval(async () => {
        try {
          pollCount++;

          if (pollCount > MAX_POLLS) {
            cleanup();
            updateActiveJob({ activeJobStatus: 'failed', activeJobError: 'Timeout waiting for generation' });
            setIsSubmitting(false);
            mutate('/api/generations');
            return;
          }

          const genRes = await fetch(`/api/generations/${generationId}`, { cache: 'no-store' });
          if (!genRes.ok) return;

          const generation = await genRes.json() as any;

          // For mock fallback: the generation is already completed in the DB
          if (generation.status === 'completed' && generation.imageUrl) {
            cleanup();
            setIsSubmitting(false);
            updateActiveJob({
              activeJobStatus: 'completed',
              activeJobImageUrl: generation.imageUrl,
              activeJobError: null,
            });
            // Force SWR to refetch from server to get the completed generation
            mutate('/api/generations');
            return;
          }

          if (generation.status === 'failed') {
            cleanup();
            updateActiveJob({
              activeJobStatus: 'failed',
              activeJobError: generation.errorMessage || 'Generation failed',
            });
            setIsSubmitting(false);
            mutate('/api/generations');
            return;
          }

          const falRequestId = generation.falRequestId;
          if (!falRequestId) return;

          const statusRes = await fetch(`/api/status/${falRequestId}`, { cache: 'no-store' });
          if (!statusRes.ok) return;

          const statusData = await statusRes.json() as any;

          updateActiveJob({
            activeJobStatus: statusData.status,
            activeJobImageUrl: statusData.imageUrl,
            activeJobError: statusData.errorMessage || null,
          });

          if (statusData.status === 'completed' || statusData.status === 'failed') {
            setIsSubmitting(false);
            cleanup();
            // Force SWR to refetch from server to get the latest data
            mutate('/api/generations');
          }
        } catch (pollError) {
          console.error("Polling error:", pollError);
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
      updateActiveJob({ activeJobStatus: 'failed', activeJobError: err.message });
      cleanup();
    }
  };

  return { generate, isSubmitting, error };
}
