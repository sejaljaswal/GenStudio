import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { fal } from "@fal-ai/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    let generation = await prisma.generation.findFirst({
      where: { falRequestId: requestId },
    });

    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    if (generation.status === "completed" || generation.status === "failed") {
      return NextResponse.json(generation);
    }

    const falStatus = await fal.queue.status("fal-ai/flux/schnell", {
      requestId,
      logs: false,
    });

    if (falStatus.status === "COMPLETED") {
      const result = await fal.queue.result("fal-ai/flux/schnell", { requestId }) as any;

      generation = await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "completed",
          imageUrl: result?.images?.[0]?.url || null,
          completedAt: new Date(),
        },
      });
    } else if ((falStatus as any).status === "FAILED" || (falStatus as any).status === "ERROR") {
      generation = await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "failed",
          errorMessage: (falStatus as any).error || "Generation failed at fal.ai",
        },
      });
    }

    return NextResponse.json(generation);
  } catch (error: any) {
    console.error("Status API error:", error);

    try {
      const { requestId } = await params;
      const generation = await prisma.generation.findFirst({ where: { falRequestId: requestId } });
      if (generation && generation.status !== "failed" && generation.status !== "completed") {
        await prisma.generation.update({
          where: { id: generation.id },
          data: {
            status: "failed",
            errorMessage: error.message || "Generation failed",
          },
        });
      }
    } catch (dbError) {
      console.error("Failed to update status to failed:", dbError);
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
