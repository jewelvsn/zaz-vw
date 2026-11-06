export type FrameListener = (currentFrame: number, isPlaying: boolean) => void;

export interface ClockOptions {
  fps?: number;
  maxFrames?: number;
  initialFrame?: number;
}

export class DeterministicClock {
  private currentFrame: number = 0;
  private fps: number = 30;
  private maxFrames: number = 300;
  private isPlaying: boolean = false;
  private listeners: Set<FrameListener> = new Set();
  private rafId: number | null = null;
  private lastTimestamp: number = 0;
  private accumulatedTime: number = 0;

  constructor(options: ClockOptions = {}) {
    this.fps = options.fps ?? 30;
    this.maxFrames = options.maxFrames ?? 300;
    this.currentFrame = options.initialFrame ?? 0;
  }

  public getFrame(): number {
    return this.currentFrame;
  }

  public getFps(): number {
    return this.fps;
  }

  public getMaxFrames(): number {
    return this.maxFrames;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setMaxFrames(max: number): void {
    this.maxFrames = Math.max(1, max);
    if (this.currentFrame >= this.maxFrames) {
      this.seek(this.maxFrames - 1);
    }
  }

  public setFps(fps: number): void {
    this.fps = Math.max(1, fps);
  }

  public subscribe(listener: FrameListener): () => void {
    this.listeners.add(listener);
    listener(this.currentFrame, this.isPlaying);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      listener(this.currentFrame, this.isPlaying);
    });
  }

  public seek(frame: number): void {
    const clamped = Math.max(0, Math.min(this.maxFrames - 1, Math.round(frame)));
    if (this.currentFrame !== clamped) {
      this.currentFrame = clamped;
      this.notify();
    }
  }

  public step(delta: number): void {
    this.seek(this.currentFrame + delta);
  }

  public play(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTimestamp = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.accumulatedTime = 0;
    this.notify();
    this.tick();
  }

  public pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.notify();
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  private tick = (): void => {
    if (!this.isPlaying) return;

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const deltaMs = Math.min(now - this.lastTimestamp, 100); // Clamp large delta
    this.lastTimestamp = now;

    this.accumulatedTime += deltaMs / 1000;
    const frameDuration = 1.0 / this.fps;

    let framesToAdvance = 0;
    while (this.accumulatedTime >= frameDuration) {
      framesToAdvance++;
      this.accumulatedTime -= frameDuration;
    }

    if (framesToAdvance > 0) {
      let nextFrame = this.currentFrame + framesToAdvance;
      if (nextFrame >= this.maxFrames) {
        nextFrame = 0; // Loop playback
      }
      this.currentFrame = nextFrame;
      this.notify();
    }

    if (typeof requestAnimationFrame !== "undefined") {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.pause();
    this.listeners.clear();
  }
}
