import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadsDir = path.join(process.cwd(), 'public', 'edits');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `${params.id}.png`);
    await fs.promises.writeFile(filePath, buffer);

    const imageUrl = `/edits/${params.id}.png`;

    await prisma.generation.update({
      where: { id: Number(params.id) },
      data: { imageUrl },
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error saving edited image', error);
    return NextResponse.json({ error: 'Failed to save edited image' }, { status: 500 });
  }
}
