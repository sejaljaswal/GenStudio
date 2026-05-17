import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { fal } from "@fal-ai/client";

export async function POST(req: NextRequest) {
  let generationId: string | undefined;
  
  try {
    const body = await req.json();
    const {
      prompt,
      negativePrompt,
      width = 1024,
      height = 1024,
      steps = 4,
      seed = Math.floor(Math.random() * 1000000),
    } = body;

    if (!prompt || typeof prompt !== "string" || prompt.length < 3) {
      return NextResponse.json(
        { error: "Prompt must be a string of at least 3 characters" },
        { status: 400 }
      );
    }

    const generation = await prisma.generation.create({
      data: {
        prompt,
        negativePrompt,
        width,
        height,
        steps,
        seed,
        status: "pending",
      },
    });
    
    generationId = generation.id;

    const { request_id } = await fal.queue.submit("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: { width, height },
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
    console.error("Generate API error:", error);
    
    if (generationId) {
      try {
        await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: "failed",
            errorMessage: error.message || "Failed to submit generation",
          },
        });
      } catch (dbError) {
        console.error("Failed to update status to failed:", dbError);
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
