"use client";

import { useGallery } from "@/hooks/useGallery";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

export function GalleryGrid() {
  const { generations, isLoading } = useGallery();

  if (isLoading && generations.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  const validGenerations = generations.filter(g => g.status === 'completed' && g.imageUrl);

  if (validGenerations.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed rounded-xl border-border/50 bg-muted/10">
        <p className="text-muted-foreground">No images generated yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {validGenerations.map((gen) => (
        <Card key={gen.id} className="overflow-hidden group border-0 bg-muted/30">
          <div className="relative aspect-square w-full">
            <Image
              src={gen.imageUrl!}
              alt={gen.prompt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <p className="text-white text-xs font-medium line-clamp-3 mb-1 leading-relaxed shadow-sm">
                {gen.prompt}
              </p>
              <span className="text-white/70 text-[10px]">
                {formatDistanceToNow(new Date(gen.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
