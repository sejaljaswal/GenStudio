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
      mutate('/api/generations');

      let pollCount = 0;
      const MAX_POLLS = 30;

      intervalRef.current = setInterval(async () => {
        try {
          pollCount++;
          
          if (pollCount > MAX_POLLS) {
            cleanup();
            updateActiveJob({ activeJobStatus: 'failed', activeJobError: 'Timeout waiting for generation' });
            setIsSubmitting(false);
            return;
          }

          const genRes = await fetch(`/api/generations/${generationId}`);
          if (!genRes.ok) return; 
          
          const generation = await genRes.json() as any;
          const falRequestId = generation.falRequestId;

          if (!falRequestId) {
            if (generation.status === 'failed') {
              cleanup();
              updateActiveJob({ 
                activeJobStatus: 'failed', 
                activeJobError: generation.errorMessage || 'Generation failed' 
              });
              setIsSubmitting(false);
            }
            return;
          }

          const statusRes = await fetch(`/api/status/${falRequestId}`);
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
            if (statusData.status === 'completed') {
              mutate('/api/generations');
            }
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
