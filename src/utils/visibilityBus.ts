"use client";

type Handler = (...args: any[]) => void;

class SimpleBus {
  private map = new Map<string, Set<Handler>>();

  on(evt: string, fn: Handler) {
    const s = this.map.get(evt) ?? new Set<Handler>();
    s.add(fn);
    this.map.set(evt, s);
    return () => this.off(evt, fn);
  }

  off(evt: string, fn: Handler) {
    const s = this.map.get(evt);
    if (!s) return;
    s.delete(fn);
    if (s.size === 0) this.map.delete(evt);
  }

  emit(evt: string, ...args: any[]) {
    const s = this.map.get(evt);
    if (!s) return;
    for (const fn of Array.from(s)) fn(...args);
  }
}

export const bus = new SimpleBus();


