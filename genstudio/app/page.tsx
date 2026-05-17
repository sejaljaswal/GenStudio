"use client";

import { GenerateForm } from "@/components/GenerateForm";
import { GenerationStatus } from "@/components/GenerationStatus";
import { GalleryGrid } from "@/components/GalleryGrid";
import { useGenerate } from "@/hooks/useGenerate";
import { Sparkles } from "lucide-react";

export default function Home() {
  const { generate, isSubmitting } = useGenerate();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">GenStudio</h1>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <span className="text-foreground border-b-2 border-primary py-5">Generate</span>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors py-5">Gallery</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-12">
        
        {/* Generator Section */}
        <section className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Create beautiful AI art
            </h2>
            <p className="text-muted-foreground text-lg">
              Powered by Flux Schnell. Fast, high-quality image generation.
            </p>
          </div>

          <GenerateForm onGenerate={generate} isSubmitting={isSubmitting} />
          
          <div className="pt-2">
            <GenerationStatus />
          </div>
        </section>

        {/* Gallery Section */}
        <section className="pt-12 border-t border-border/40">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-semibold tracking-tight">Recent Creations</h3>
          </div>
          <GalleryGrid />
        </section>

      </main>
    </div>
  );
}
