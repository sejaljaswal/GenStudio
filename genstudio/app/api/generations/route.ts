import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const generations = await prisma.generation.findMany({
      select: {
        id: true,
        prompt: true,
        status: true,
        imageUrl: true,
        createdAt: true,
        parentId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(generations);
  } catch (error: any) {
    console.error("Generations API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
