import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
