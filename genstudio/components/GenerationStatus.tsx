"use client";

import { useEffect, useState } from "react";
import { useGenerationStore } from "@/store/generationStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import Image from "next/image";

export function GenerationStatus() {
  const { activeJobId, activeJobStatus, activeJobImageUrl, activeJobError, clearActiveJob } = useGenerationStore();
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (activeJobStatus === "completed" && activeJobImageUrl) {
      const t = setTimeout(() => setShowImage(true), 50);
      const clearT = setTimeout(() => clearActiveJob(), 3000);
      return () => {
        clearTimeout(t);
        clearTimeout(clearT);
      };
    } else {
      setShowImage(false);
    }
  }, [activeJobStatus, activeJobImageUrl, clearActiveJob]);

  if (!activeJobId) return null;

  if (activeJobStatus === "processing" || activeJobStatus === "pending") {
    return (
      <Card className="w-full overflow-hidden border-primary/20 relative animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
        <div className="flex flex-col sm:flex-row gap-6 p-6 items-center">
          <Skeleton className="w-full sm:w-48 aspect-square rounded-md shrink-0" />
          <div className="space-y-4 flex-1 w-full text-center sm:text-left">
            <h3 className="text-xl font-medium animate-pulse bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Generating your image...
            </h3>
            <p className="text-sm text-muted-foreground">
              This usually takes a few seconds with Flux Schnell.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (activeJobStatus === "failed") {
    return (
      <Card className="w-full overflow-hidden border-destructive/50 bg-destructive/5 animate-in slide-in-from-top-2 duration-300">
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-destructive">Generation Failed</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {activeJobError || "An unexpected error occurred while generating."}
            </p>
          </div>
          <Button variant="outline" onClick={clearActiveJob} className="mt-2">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (activeJobStatus === "completed" && activeJobImageUrl) {
    return (
      <Card className="w-full overflow-hidden border-green-500/20 bg-green-500/5 animate-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col sm:flex-row gap-6 p-6 items-center">
          <div className={`relative w-full sm:w-48 aspect-square rounded-md overflow-hidden shrink-0 transition-opacity duration-700 ease-in-out ${showImage ? 'opacity-100' : 'opacity-0'}`}>
            <Image 
              src={activeJobImageUrl} 
              alt="Generated image" 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 192px"
            />
          </div>
          <div className="space-y-4 flex-1 w-full text-center sm:text-left">
            <Badge className="bg-green-500 hover:bg-green-600 text-white border-transparent">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Generation complete
            </Badge>
            <h3 className="text-lg font-medium text-foreground">
              Your masterpiece is ready!
            </h3>
            <p className="text-xs text-muted-foreground">
              Closing automatically...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
