import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const generation = await prisma.generation.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            prompt: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    return NextResponse.json(generation);
  } catch (error: any) {
    console.error("Generation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.generation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete generation error:", error);
    return NextResponse.json({ error: "Failed to delete generation" }, { status: 500 });
  }
}
