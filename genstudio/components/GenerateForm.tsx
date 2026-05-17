"use client";

import { useState, KeyboardEvent } from "react";
import { GenerateRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";

interface GenerateFormProps {
  onGenerate: (params: GenerateRequest) => Promise<void>;
  isSubmitting: boolean;
  initialValues?: Partial<GenerateRequest>;
  buttonText?: string;
}

export function GenerateForm({ onGenerate, isSubmitting, initialValues, buttonText = "Generate Image" }: GenerateFormProps) {
  const [prompt, setPrompt] = useState(initialValues?.prompt || "");
  const [negativePrompt, setNegativePrompt] = useState(initialValues?.negativePrompt || "");
  const [width, setWidth] = useState<number>(initialValues?.width || 1024);
  const [height, setHeight] = useState<number>(initialValues?.height || 1024);
  const [steps, setSteps] = useState<number>(initialValues?.steps || 4);
  const [showAdvanced, setShowAdvanced] = useState(!!initialValues);

  const handleSubmit = () => {
    if (!prompt || prompt.trim().length < 3) return;
    onGenerate({
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim() || undefined,
      width,
      height,
      steps,
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="w-full border-border/40 shadow-sm backdrop-blur-sm bg-background/95">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Describe the image you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            className="min-h-[120px] text-lg resize-none border-0 focus-visible:ring-1 focus-visible:ring-primary/20 bg-muted/50"
          />
        </div>

        <div className="border-t border-border/40 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            Advanced Settings
          </button>

          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-3">
                <label className="text-sm font-medium">Aspect Ratio</label>
                <div className="flex gap-4">
                  <div className="space-y-1.5 flex-1">
                    <span className="text-xs text-muted-foreground">Width</span>
                    <Select value={width.toString()} onValueChange={(v) => { if (v) setWidth(parseInt(v)); }} disabled={isSubmitting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="512">512px</SelectItem>
                        <SelectItem value="768">768px</SelectItem>
                        <SelectItem value="1024">1024px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <span className="text-xs text-muted-foreground">Height</span>
                    <Select value={height.toString()} onValueChange={(v) => { if (v) setHeight(parseInt(v)); }} disabled={isSubmitting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="512">512px</SelectItem>
                        <SelectItem value="768">768px</SelectItem>
                        <SelectItem value="1024">1024px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Inference Steps</label>
                  <span className="text-xs text-muted-foreground">{steps}</span>
                </div>
                <Slider
                  min={1}
                  max={8}
                  step={1}
                  value={[steps]}
                  onValueChange={(vals) => setSteps(typeof vals === 'number' ? vals : vals[0])}
                  disabled={isSubmitting}
                  className="py-1"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium">Negative Prompt</label>
                <Textarea
                  placeholder="Things to exclude from the image..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  disabled={isSubmitting}
                  className="min-h-[80px] text-sm resize-none bg-muted/50"
                />
              </div>
            </div>
          )}
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || prompt.trim().length < 3}
          className="w-full h-12 text-base font-medium relative overflow-hidden group"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              {buttonText}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
