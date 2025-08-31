"use client";

type EventMap = {
  "hexagon:enter": void;
  "hexagon:leave": void;
  "footer:reveal": boolean;
  // New events for full-viewport hex section and header logo flight
  "hex:page-full-on": void;
  "hex:page-full-off": void;
  "header:logo-flyToHex": void;
  "header:logo-flyToHex:done": void;
  "header:resetLogoFlight": void;
  // Coordination with Testimonies section
  "testimonies:done": void;
};

type Handler<T = any> = (payload: T) => void;

class Bus {
  private map = new Map<keyof EventMap, Set<Handler>>();

  on<K extends keyof EventMap>(type: K, cb: Handler<EventMap[K]>) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type)!.add(cb as Handler);
    return () => this.off(type, cb);
  }

  off<K extends keyof EventMap>(type: K, cb: Handler<EventMap[K]>) {
    this.map.get(type)?.delete(cb as Handler);
    if ((this.map.get(type)?.size || 0) === 0) this.map.delete(type);
  }

  emit<K extends keyof EventMap>(type: K, payload?: EventMap[K]) {
    this.map.get(type)?.forEach((cb) => (cb as Handler)(payload as any));
  }
}

export const bus = new Bus();


