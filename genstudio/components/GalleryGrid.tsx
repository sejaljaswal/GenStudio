"use client";

import { useGallery } from "@/hooks/useGallery";
import { GenerationCard } from "@/components/GenerationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ImageOff, RefreshCcw, Sparkles } from "lucide-react";

export function GalleryGrid() {
  const { generations, isLoading, error, refetch } = useGallery();

  const safeGenerations = Array.isArray(generations) ? generations : [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed rounded-2xl bg-destructive/5 border-destructive/20 animate-in fade-in">
        <ImageOff className="w-10 h-10 text-destructive/50 mb-4" />
        <h3 className="text-lg font-medium text-destructive mb-2">Failed to load creations</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {typeof error === "string" ? error : "There was an issue fetching your creations. Please try again."}
        </p>
        <Button variant="outline" onClick={refetch} className="hover:bg-destructive/10">
          <RefreshCcw className="w-4 h-4 mr-2 animate-spin-hover" />
          Click to retry
        </Button>
      </div>
    );
  }

  if (isLoading && safeGenerations.length === 0) {
    return (
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl bg-muted/60 break-inside-avoid shadow-sm" />
        ))}
      </div>
    );
  }

  if (safeGenerations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center border border-dashed rounded-2xl border-border/50 bg-muted/10 animate-in fade-in">
        <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
          <Sparkles className="w-8 h-8 text-primary/50 animate-pulse" />
        </div>
        <h3 className="text-xl font-medium mb-2">No creations yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Your stunning AI creations will appear here. Start generating above!
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {safeGenerations.map((gen) => (
        <div key={gen.id} className="break-inside-avoid">
          <GenerationCard generation={gen} />
        </div>
      ))}
    </div>
  );
}
