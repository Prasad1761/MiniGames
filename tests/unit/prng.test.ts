import { describe, it, expect } from 'vitest';
import { PRNG, getDailySeed } from '@/lib/prng';

describe('PRNG (Mulberry32)', () => {
  it('generates identical sequence given the same seed', () => {
    const rng1 = new PRNG(4242);
    const rng2 = new PRNG(4242);

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('generates different sequence given different seeds', () => {
    const rng1 = new PRNG(100);
    const rng2 = new PRNG(200);

    const val1 = rng1.next();
    const val2 = rng2.next();

    expect(val1).not.toEqual(val2);
  });

  it('produces floats in [0, 1)', () => {
    const rng = new PRNG(9999);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces integers within [min, max] inclusive', () => {
    const rng = new PRNG(555);
    for (let i = 0; i < 100; i++) {
      const intVal = rng.rangeInt(5, 10);
      expect(intVal).toBeGreaterThanOrEqual(5);
      expect(intVal).toBeLessThanOrEqual(10);
      expect(Number.isInteger(intVal)).toBe(true);
    }
  });

  it('picks elements uniformly from an array', () => {
    const rng = new PRNG(777);
    const colors = ['red', 'blue', 'green', 'yellow'];
    for (let i = 0; i < 20; i++) {
      const choice = rng.pick(colors);
      expect(colors).toContain(choice);
    }
  });

  it('computes deterministic daily seed formatted YYYYMMDD', () => {
    const seed = getDailySeed();
    const now = new Date();
    const expected =
      now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
    expect(seed).toBe(expected);
  });
});
