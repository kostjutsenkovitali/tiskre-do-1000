export type LaserChannel = "t" | "d";

type ChannelVolumes = { move: number; cut: number };

/**
 * Simple helper to manage looping move/cut sounds with per-channel level control.
 * - create(): async factory to construct and preload audio elements
 * - unlock(): call on first user gesture to satisfy autoplay policies
 * - setChannel(): update per-channel volumes; the helper mixes channels into two tracks (move, cut)
 * - stop(): pause and reset
 */
export class LaserAudio {
  private moveEl: HTMLAudioElement;
  private cutEl: HTMLAudioElement;
  private vols: Record<LaserChannel, ChannelVolumes> = {
    t: { move: 0, cut: 0 },
    d: { move: 0, cut: 0 },
  };

  private constructor(moveEl: HTMLAudioElement, cutEl: HTMLAudioElement) {
    this.moveEl = moveEl;
    this.cutEl = cutEl;
  }

  static async create(moveSrc: string, cutSrc: string): Promise<LaserAudio> {
    // Ensure we're in the browser
    if (typeof window === "undefined") {
      throw new Error("LaserAudio can only be created in the browser");
    }

    const moveEl = new Audio(moveSrc);
    moveEl.loop = true;
    moveEl.volume = 0;

    const cutEl = new Audio(cutSrc);
    cutEl.loop = true;
    cutEl.volume = 0;

    // Preload; ignore errors (network may still allow play on user gesture)
    try { moveEl.load(); } catch {}
    try { cutEl.load(); } catch {}

    return new LaserAudio(moveEl, cutEl);
  }

  unlock(): void {
    // Attempt to start playback; browsers require a user gesture beforehand
    // If this throws, caller may retry on the next gesture.
    this.moveEl.play().catch(() => {});
    this.cutEl.play().catch(() => {});
  }

  setChannel(channel: LaserChannel, volumes: ChannelVolumes): void {
    this.vols[channel] = {
      move: clamp01(volumes.move),
      cut: clamp01(volumes.cut),
    };
    this.updateMix();
  }

  stop(): void {
    try { this.moveEl.pause(); } catch {}
    try { this.cutEl.pause(); } catch {}
    try { this.moveEl.currentTime = 0; } catch {}
    try { this.cutEl.currentTime = 0; } catch {}
    this.moveEl.volume = 0;
    this.cutEl.volume = 0;
  }

  private updateMix(): void {
    // Simple mix: take the max per track across both channels
    const moveVol = Math.max(this.vols.t.move, this.vols.d.move);
    const cutVol = Math.max(this.vols.t.cut, this.vols.d.cut);
    this.moveEl.volume = clamp01(moveVol);
    this.cutEl.volume = clamp01(cutVol);
  }
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x || 0));
}


