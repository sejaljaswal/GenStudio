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
        width: true,
        height: true,
        steps: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Defensive limit to prevent database exhaustion
    });

    if (!Array.isArray(generations)) {
      throw new Error("Invalid database response format");
    }

    return NextResponse.json(generations);
  } catch (error: any) {
    console.error("Generations API error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to load generations" },
      { status: 500 }
    );
  }
}
