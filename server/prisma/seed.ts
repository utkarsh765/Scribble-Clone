// Seeds the database with starter words across categories.
// Run with: npm run seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WORDS: Record<string, string[]> = {
  Animals: [
    "elephant",
    "giraffe",
    "penguin",
    "octopus",
    "kangaroo",
    "panda",
    "dolphin",
    "rhino",
    "cheetah",
    "owl",
    "shark",
    "butterfly",
    "spider",
    "horse",
  ],
  Movies: [
    "titanic",
    "avatar",
    "inception",
    "frozen",
    "shrek",
    "joker",
    "matrix",
    "rocky",
    "gladiator",
    "jaws",
    "up",
    "coco",
  ],
  Food: [
    "pizza",
    "sushi",
    "burger",
    "pancake",
    "tacos",
    "ramen",
    "donut",
    "spaghetti",
    "ice cream",
    "salad",
    "burrito",
    "waffle",
  ],
  Objects: [
    "umbrella",
    "guitar",
    "telescope",
    "backpack",
    "toothbrush",
    "camera",
    "laptop",
    "scissors",
    "anchor",
    "candle",
    "compass",
    "violin",
  ],
  Actions: [
    "jumping",
    "sleeping",
    "running",
    "swimming",
    "dancing",
    "reading",
    "cooking",
    "fishing",
    "painting",
    "skating",
    "climbing",
    "diving",
  ],
};

async function main() {
  for (const [category, words] of Object.entries(WORDS)) {
    for (const text of words) {
      await prisma.word.upsert({
        where: { text },
        update: { category },
        create: { text, category },
      });
    }
  }
  const count = await prisma.word.count();
  console.log(`Seeded ${count} words.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
