// WordManager: picks random words from the DB and builds the masked
// "_ _ a _ _" hint that guessers see.
import { PrismaClient } from "@prisma/client";

export class WordManager {
  constructor(private prisma: PrismaClient) {}

  /** Returns N random {word, category} options. */
  async getOptions(n = 3) {
    // SQLite: load all ids and pick at random — fine for seed-sized lists.
    const all = await this.prisma.word.findMany();
    const shuffled = all.sort(() => Math.random() - 0.5).slice(0, n);
    return shuffled.map((w) => ({ word: w.text, category: w.category }));
  }

  /** Hide every letter except spaces. */
  static mask(word: string): string {
    return [...word].map((c) => (c === " " ? " " : "_")).join("");
  }

  /** Reveal `extra` more random letters in the existing mask. */
  static revealMore(word: string, mask: string, extra = 1): string {
    const arr = mask.split("");
    const hiddenIdx: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (arr[i] === "_") hiddenIdx.push(i);
    }
    // Always keep at least 1-2 letters hidden
    const maxReveal = Math.max(0, hiddenIdx.length - 2);
    const toReveal = Math.min(extra, maxReveal);
    for (let i = 0; i < toReveal; i++) {
      const pick = hiddenIdx.splice(
        Math.floor(Math.random() * hiddenIdx.length),
        1,
      )[0];
      arr[pick] = word[pick];
    }
    return arr.join("");
  }
}
