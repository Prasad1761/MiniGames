import { describe, it, expect, vi } from 'vitest';
import { TimerManager } from '@/game-engine/core/TimerManager';

describe('TimerManager', () => {
  it('executes scheduled timeout', async () => {
    const tm = new TimerManager();
    let executed = false;

    tm.setTimeout(() => {
      executed = true;
    }, 10);

    await new Promise((r) => setTimeout(r, 25));
    expect(executed).toBe(true);
  });

  it('cancels scheduled timeout when clearAll is called', async () => {
    const tm = new TimerManager();
    let executed = false;

    tm.setTimeout(() => {
      executed = true;
    }, 50);

    tm.clearAll();
    await new Promise((r) => setTimeout(r, 70));
    expect(executed).toBe(false);
  });

  it('cancels scheduled interval when clearInterval is called', async () => {
    const tm = new TimerManager();
    let count = 0;

    const id = tm.setInterval(() => {
      count++;
    }, 15);

    await new Promise((r) => setTimeout(r, 40));
    tm.clearInterval(id);
    const countAfterClear = count;

    await new Promise((r) => setTimeout(r, 40));
    expect(count).toBe(countAfterClear);
  });
});
