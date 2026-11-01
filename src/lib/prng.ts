// Mulberry32 Seeded Pseudo-Random Number Generator
export class PRNG {
  private s: number;

  constructor(seed: number = 1337) {
    this.s = Math.floor(seed);
  }

  // Returns float in [0, 1)
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns float in [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Returns int in [min, max]
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Pick random item from array
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export function getDailySeed(): number {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  return year * 10000 + month * 100 + day;
}
