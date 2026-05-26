"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, AlertCircle, Wand2, ArrowLeftRight, Paintbrush, Trash2, Loader2 } from "lucide-react";
import { mutate } from "swr";
import { Generation } from "@/types";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CanvasEditor } from "@/components/CanvasEditor";
import { cn } from "@/lib/utils";

export function GenerationCard({ generation }: { generation: Generation }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this creation?")) {
      try {
        setIsDeleting(true);
        const res = await fetch(`/api/generations/${generation.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          mutate('/api/generations');
        } else {
          setIsDeleting(false);
        }
      } catch (err) {
        console.error("Failed to delete", err);
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card
      className="group relative overflow-hidden w-full border-0 bg-muted/30 shadow-sm transition-all duration-300 hover:shadow-md"
      style={{ aspectRatio: generation.width && generation.height ? `${generation.width} / ${generation.height}` : '1 / 1' }}
    >
      {/* Background Error State */}
      {generation.status === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-destructive/5 text-destructive space-y-2">
          <AlertCircle className="w-8 h-8 opacity-50" />
          <p className="text-xs font-medium opacity-80">Generation Failed</p>
        </div>
      )}

      {/* Image Skeleton */}
      {generation.imageUrl && !isLoaded && (
        <div className="absolute inset-0 bg-muted/40 animate-pulse" />
      )}

      {/* Image */}
      {generation.imageUrl && (
        <Image
          src={generation.imageUrl}
          alt={generation.prompt}
          fill
          className={`object-cover transition-all duration-700 ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          onLoad={() => setIsLoaded(true)}
        />
      )}

      {/* Tweaked Badge */}
      {generation.parentId && (
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border-transparent text-[10px] py-0.5 pointer-events-none">
            <ArrowLeftRight className="w-3 h-3 mr-1" />
            Tweaked
          </Badge>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">

        {/* Top section of overlay (Status & Actions) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 items-end">
          {/* Status Badge */}
          {generation.status === 'completed' && (
            <Badge className="bg-green-500/80 backdrop-blur-sm text-white border-none shadow-sm pointer-events-none">Completed</Badge>
          )}
          {generation.status === 'processing' || generation.status === 'pending' ? (
            <Badge className="bg-yellow-500/80 backdrop-blur-sm text-white border-none shadow-sm animate-pulse pointer-events-none">Processing</Badge>
          ) : null}
          {generation.status === 'failed' && (
            <Badge className="bg-destructive/80 backdrop-blur-sm text-white border-none shadow-sm pointer-events-none">Failed</Badge>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-1">
            {generation.imageUrl && (
              <a
                href={generation.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={cn(buttonVariants({ size: "icon", variant: "secondary" }), "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background")}
              >
                <Download className="w-4 h-4 text-foreground" />
              </a>
            )}

            {generation.status !== "failed" && (
              <Link
                href={`/tweak/${generation.id}`}
                className={cn(buttonVariants({ size: "icon", variant: "default" }), "h-8 w-8 rounded-full bg-primary/90 backdrop-blur-sm hover:bg-primary shadow-sm")}
              >
                <Wand2 className="w-4 h-4 text-primary-foreground" />
              </Link>
            )}

            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-full bg-destructive/80 backdrop-blur-sm hover:bg-destructive text-white shadow-sm"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete creation"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {/* Edit button */}
          {generation.status === "completed" && generation.imageUrl && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-2 mt-1 text-xs bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={() => setIsEditing(true)}
            >
              <Paintbrush className="w-3 h-3 mr-1" />
              Edit on Canvas
            </Button>
          )}
        </div>

        {/* Bottom Content (Prompt & Time) */}
        <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white text-sm font-medium line-clamp-2 mb-1.5 leading-snug shadow-sm">
            {generation.prompt}
          </p>
          <div className="text-white/70 text-[11px] flex items-center justify-between">
            <RelativeTime date={generation.createdAt} />
            <span className="bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white">
              {generation.width || 1024}x{generation.height || 1024} • {generation.steps || 4} steps
            </span>
          </div>
        </div>
      </div>

      {isEditing && generation.imageUrl && (
        <CanvasEditor imageUrl={generation.imageUrl} generationId={generation.id} onClose={() => setIsEditing(false)} />
      )}
    </Card>
  );
}
