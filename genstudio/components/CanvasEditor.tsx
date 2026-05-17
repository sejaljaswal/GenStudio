"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crop, Type, Undo, Download, X, Check, XCircle } from "lucide-react";

interface CanvasEditorProps {
  imageUrl: string;
  onClose: () => void;
}

export function CanvasEditor({ imageUrl, onClose }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<any>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<any>(null);

  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState("#ffffff");

  const saveHistory = useCallback((canvas: any) => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      if (prev[prev.length - 1] === json) return prev;
      return [...prev, json];
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initFabric = async () => {
      const fabric = await import('fabric');

      if (!isMounted || !canvasRef.current || !containerRef.current) return;

      const fCanvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#000',
        selection: true,
      });
      fabricRef.current = fCanvas;

      try {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(imageUrl)}`;
        const img = await fabric.FabricImage.fromURL(proxyUrl, { crossOrigin: 'anonymous' });

        if (!isMounted) return;

        const maxDim = Math.min(800, window.innerWidth - 40, window.innerHeight - 150);
        const scale = Math.min(maxDim / img.width!, maxDim / img.height!);
        const scaledWidth = img.width! * scale;
        const scaledHeight = img.height! * scale;

        fCanvas.setDimensions({
          width: scaledWidth,
          height: scaledHeight
        });

        img.scale(scale);
        img.set({
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top',
          left: 0,
          top: 0
        });

        fCanvas.add(img);
        fCanvas.sendObjectToBack(img);
        fCanvas.renderAll();

        saveHistory(fCanvas);

        fCanvas.on('object:modified', () => saveHistory(fCanvas));
        fCanvas.on('object:added', () => saveHistory(fCanvas));
      } catch (err) {
        console.error("Failed to load image for canvas", err);
      }
    };

    initFabric();

    return () => {
      isMounted = false;
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
    };
  }, [imageUrl, saveHistory]);

  const undo = async () => {
    if (history.length > 1) {
      const prev = history[history.length - 2];
      try {
        await fabricRef.current.loadFromJSON(JSON.parse(prev));
        fabricRef.current.renderAll();
        setHistory(h => h.slice(0, -1));
      } catch (err) {
        console.error("Failed to undo:", err);
      }
    }
  };

  const addText = async () => {
    const fabric = await import('fabric');
    const text = new fabric.Textbox('Your Text Here', {
      left: fabricRef.current.width / 2,
      top: fabricRef.current.height / 2,
      originX: 'center',
      originY: 'center',
      fill: color,
      fontSize: fontSize,
      fontFamily: 'sans-serif',
      selectable: true,
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
    saveHistory(fabricRef.current);
  };

  const startCrop = async () => {
    if (isCropping) return;
    setIsCropping(true);

    const fabric = await import('fabric');
    const rect = new fabric.Rect({
      left: fabricRef.current.width / 4,
      top: fabricRef.current.height / 4,
      width: fabricRef.current.width / 2,
      height: fabricRef.current.height / 2,
      fill: 'rgba(255, 255, 255, 0.3)',
      stroke: '#ffffff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      transparentCorners: false,
      cornerColor: '#ffffff',
      borderColor: '#ffffff',
      selectable: true,
    });

    fabricRef.current.add(rect);
    fabricRef.current.setActiveObject(rect);
    setCropRect(rect);
    fabricRef.current.renderAll();
  };

  const applyCrop = () => {
    if (!cropRect || !fabricRef.current) return;

    const canvas = fabricRef.current;

    const left = cropRect.left || 0;
    const top = cropRect.top || 0;
    const width = Math.max(1, (cropRect.width || 0) * (cropRect.scaleX || 1));
    const height = Math.max(1, (cropRect.height || 0) * (cropRect.scaleY || 1));

    canvas.remove(cropRect);

    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      obj.set({
        left: obj.left! - left,
        top: obj.top! - top
      });
      obj.setCoords();
    });

    canvas.setDimensions({
      width: width,
      height: height
    });
    canvas.renderAll();

    setIsCropping(false);
    setCropRect(null);
    saveHistory(canvas);
  };

  const cancelCrop = () => {
    if (cropRect && fabricRef.current) {
      fabricRef.current.remove(cropRect);
      fabricRef.current.renderAll();
    }
    setIsCropping(false);
    setCropRect(null);
  };

  const download = () => {
    if (!fabricRef.current) return;
    const dataURL = fabricRef.current.toDataURL({
      format: 'png',
      multiplier: 1, // Full size
    });
    const link = document.createElement('a');
    link.download = 'genstudio-edit.png';
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur border border-border/40 p-2 rounded-xl flex items-center gap-1.5 shadow-xl overflow-x-auto max-w-[95vw]">
        {!isCropping ? (
          <>
            <Button variant="ghost" size="sm" onClick={startCrop}>
              <Crop className="w-4 h-4 mr-2" /> Crop
            </Button>

            <div className="w-px h-6 bg-border/50 mx-1" />

            <Button variant="ghost" size="sm" onClick={addText}>
              <Type className="w-4 h-4 mr-2" /> Text
            </Button>

            <div className="flex items-center gap-2 px-2 bg-muted/50 rounded-md py-1">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 p-0 border-0 rounded overflow-hidden cursor-pointer bg-transparent"
              />
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 32)}
                className="w-14 h-6 text-xs bg-transparent border-0 focus-visible:ring-0 p-0 text-center"
                min="8" max="120"
              />
            </div>

            <div className="w-px h-6 bg-border/50 mx-1" />

            <Button variant="ghost" size="sm" onClick={undo} disabled={history.length <= 1}>
              <Undo className="w-4 h-4 mr-2" /> Undo
            </Button>

            <Button variant="default" size="sm" onClick={download} className="ml-2">
              <Download className="w-4 h-4 mr-2" /> Save
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={cancelCrop}>
              <XCircle className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button variant="default" size="sm" onClick={applyCrop}>
              <Check className="w-4 h-4 mr-2" /> Apply Crop
            </Button>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-10 w-10"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative shadow-2xl overflow-hidden mt-16 flex items-center justify-center max-w-[90vw] max-h-[80vh] border border-white/10"
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
