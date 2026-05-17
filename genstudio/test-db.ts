import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
    console.log("Success:", generations);
  } catch (error) {
    console.error("Prisma Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
