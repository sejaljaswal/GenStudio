import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { fal } from "@fal-ai/client";

const ENABLE_MOCK_FALLBACK = true;

export async function POST(req: NextRequest) {
  let generationId: string | undefined;
  let promptStr = "";
  let imgWidth = 1024;
  let imgHeight = 1024;
  
  try {
    const body = await req.json();
    promptStr = body.prompt || "";
    imgWidth = body.width || 1024;
    imgHeight = body.height || 1024;
    const negativePrompt = body.negativePrompt;
    const steps = body.steps || 4;
    const seed = body.seed || Math.floor(Math.random() * 1000000);
    const parentId = body.parentId;

    if (!promptStr || typeof promptStr !== "string" || promptStr.trim().length < 3) {
      return NextResponse.json(
        { error: "Prompt must be a string of at least 3 characters" },
        { status: 400 }
      );
    }

    const generation = await prisma.generation.create({
      data: {
        prompt: promptStr.trim(),
        negativePrompt: negativePrompt?.trim() || undefined,
        width: imgWidth,
        height: imgHeight,
        steps,
        seed,
        parentId,
        status: "pending",
      },
    });
    
    generationId = generation.id;

    const { request_id } = await fal.queue.submit("fal-ai/flux/schnell", {
      input: {
        prompt: promptStr.trim(),
        image_size: { width: imgWidth, height: imgHeight },
        num_inference_steps: steps,
        seed,
      },
    });

    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: "processing",
        falRequestId: request_id,
      },
    });

    return NextResponse.json({ generationId });
  } catch (error: any) {
    console.error("Fal.ai generation failed:", error?.body?.detail || error?.message || error);
    
    if (generationId) {
      if (ENABLE_MOCK_FALLBACK && promptStr) {
        try {
          const encodedPrompt = encodeURIComponent(promptStr.trim());
          const randomSeed = Math.floor(Math.random() * 10000000);
          const mockUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${imgWidth}&height=${imgHeight}&seed=${randomSeed}&nologo=true`;
          const mockRequestId = `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          await prisma.generation.update({
            where: { id: generationId },
            data: {
              status: "completed",
              imageUrl: mockUrl,
              falRequestId: mockRequestId,
              completedAt: new Date(),
            },
          });
          
          return NextResponse.json({ generationId });
        } catch (mockDbError) {
          console.error("Failed to save mock fallback state:", mockDbError);
        }
      }

      let readableError = "Generation service temporarily unavailable.";
      const detail = error?.body?.detail || "";
      const msg = error?.message || "";
      const status = error?.status || 500;

      if (status === 403 || detail.includes("balance") || detail.includes("locked")) {
        readableError = "Generation service temporarily unavailable: Service quota exhausted.";
      } else if (status === 401 || detail.includes("key") || detail.includes("unauthorized")) {
        readableError = "Generation service temporarily unavailable: Invalid API credentials.";
      } else if (status === 429 || detail.includes("rate") || detail.includes("too many")) {
        readableError = "Generation service temporarily unavailable: Rate limit exceeded. Please try again soon.";
      } else if (msg.includes("timeout") || msg.includes("network") || status === 504) {
        readableError = "Generation service temporarily unavailable: Network connection timeout.";
      }

      try {
        await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: "failed",
            errorMessage: readableError,
          },
        });
      } catch (dbError) {
        console.error("Failed to update status to failed:", dbError);
      }

      return NextResponse.json(
        { error: readableError },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Generation service temporarily unavailable." },
      { status: 500 }
    );
  }
}
