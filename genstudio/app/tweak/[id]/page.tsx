"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Sparkles, AlertCircle } from "lucide-react";
import { GenerateForm } from "@/components/GenerateForm";
import { useGenerate } from "@/hooks/useGenerate";
import { Generation, GenerateRequest } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { mutate } from "swr";

export default function TweakPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [generation, setGeneration] = useState<Generation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { generate, isSubmitting } = useGenerate();

  useEffect(() => {
    async function fetchGeneration() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/generations/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Generation not found");
          throw new Error("Failed to fetch generation");
        }
        const data = await res.json();
        setGeneration(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGeneration();
  }, [id]);

  const handleGenerate = async (params: GenerateRequest) => {
    await generate({ ...params, parentId: id });
    mutate('/api/generations');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !generation) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
        <p className="text-muted-foreground mb-6">{error || "Generation not found"}</p>
        <Link href="/" className="text-primary hover:underline flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Tweaking:</span>
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-md">
            {generation.prompt}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Original */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-border/40">
              {generation.imageUrl ? (
                <div className="relative aspect-square w-full bg-muted/20">
                  <Image
                    src={generation.imageUrl}
                    alt={generation.prompt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
            </Card>

            <div className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">Original Generation</Badge>
                <div className="p-4 bg-muted/30 border border-border/50 rounded-lg text-sm leading-relaxed text-foreground/90">
                  {generation.prompt}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Settings used</p>
                  <p className="font-medium">
                    {generation.width || 1024} × {generation.height || 1024} <span className="text-muted-foreground ml-1">({generation.steps || 4} steps)</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Generated</p>
                  <p className="font-medium flex items-center gap-1">
                    <RelativeTime date={generation.createdAt} />
                  </p>
                </div>
              </div>

              {generation.seed && (
                <div className="text-sm">
                  <span className="text-muted-foreground mr-2">Seed:</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{generation.seed}</code>
                </div>
              )}

              {(generation as any).parent?.prompt && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">This was itself a tweak of:</p>
                    <p className="line-clamp-2 text-foreground/80 italic">"{(generation as any).parent.prompt}"</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Tweak Form */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-2">Modify & Rerun</h2>
              <p className="text-muted-foreground text-sm">
                Tweak the prompt or change the settings below to generate a new variation.
              </p>
            </div>

            <GenerateForm
              onGenerate={handleGenerate}
              isSubmitting={isSubmitting}
              buttonText="Re-generate"
              initialValues={{
                prompt: generation.prompt,
                negativePrompt: generation.negativePrompt || "",
                width: generation.width || 1024,
                height: generation.height || 1024,
                steps: generation.steps || 4,
                seed: generation.seed || undefined,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
