// Safe Timer Manager preventing dangling timeouts and memory leaks

export class TimerManager {
  private timeoutIds: Set<any> = new Set();
  private intervalIds: Set<any> = new Set();

  setTimeout(handler: () => void, timeoutMs: number): any {
    const id = setTimeout(() => {
      this.timeoutIds.delete(id);
      handler();
    }, timeoutMs);
    this.timeoutIds.add(id);
    return id;
  }

  clearTimeout(id: any) {
    if (id) {
      clearTimeout(id);
      this.timeoutIds.delete(id);
    }
  }

  setInterval(handler: () => void, intervalMs: number): any {
    const id = setInterval(handler, intervalMs);
    this.intervalIds.add(id);
    return id;
  }

  clearInterval(id: any) {
    if (id) {
      clearInterval(id);
      this.intervalIds.delete(id);
    }
  }

  clearAll() {
    this.timeoutIds.forEach((id) => clearTimeout(id));
    this.timeoutIds.clear();
    this.intervalIds.forEach((id) => clearInterval(id));
    this.intervalIds.clear();
  }
}
