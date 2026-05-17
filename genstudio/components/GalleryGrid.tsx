"use client";

import { useGallery } from "@/hooks/useGallery";
import { GenerationCard } from "@/components/GenerationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ImageOff, RefreshCcw, Sparkles } from "lucide-react";

export function GalleryGrid() {
  const { generations, isLoading, error, refetch } = useGallery();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed rounded-2xl bg-destructive/5 border-destructive/20 animate-in fade-in">
        <ImageOff className="w-10 h-10 text-destructive/50 mb-4" />
        <h3 className="text-lg font-medium text-destructive mb-2">Failed to load gallery</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          There was an issue fetching your generated images. Please try again.
        </p>
        <Button variant="outline" onClick={refetch}>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Click to retry
        </Button>
      </div>
    );
  }

  if (isLoading && generations.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl bg-muted/60" />
        ))}
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center border border-dashed rounded-2xl border-border/50 bg-muted/10 animate-in fade-in">
        <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary/50" />
        </div>
        <h3 className="text-xl font-medium mb-2">No generations yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Your generations will appear here. Create your first one above!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-500">
      {generations.map((gen) => (
        <GenerationCard key={gen.id} generation={gen} />
      ))}
    </div>
  );
}
