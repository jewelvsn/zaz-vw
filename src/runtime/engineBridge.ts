import * as BABYLON from "@babylonjs/core";
import type { QualityPreset } from "../schema/types";

export interface EngineBridgeOptions {
  canvas: HTMLCanvasElement;
  qualityPreset?: QualityPreset;
  onResize?: (width: number, height: number) => void;
}

export class BabylonEngineBridge {
  private engine: BABYLON.Engine;
  private canvas: HTMLCanvasElement;
  private qualityPreset: QualityPreset;
  private resizeObserver: ResizeObserver | null = null;
  private resizeHandler: (() => void) | null = null;

  constructor(options: EngineBridgeOptions) {
    this.canvas = options.canvas;
    this.qualityPreset = options.qualityPreset || "preview";

    const antialias = this.qualityPreset !== "draft";
    this.engine = new BABYLON.Engine(this.canvas, antialias, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: this.qualityPreset === "cinematic",
    });

    this.applyQualityPreset(this.qualityPreset);
    this.setupResizeListeners(options.onResize);
  }

  getEngine(): BABYLON.Engine {
    return this.engine;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getQualityPreset(): QualityPreset {
    return this.qualityPreset;
  }

  applyQualityPreset(preset: QualityPreset): void {
    this.qualityPreset = preset;
    if (preset === "draft") {
      this.engine.setHardwareScalingLevel(1.33); // Lower resolution for fast preview on low-spec hardware
    } else if (preset === "preview") {
      this.engine.setHardwareScalingLevel(1.0); // Standard 1:1
    } else if (preset === "cinematic") {
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      this.engine.setHardwareScalingLevel(1.0 / Math.min(dpr, 2)); // High-res retina
    }
    this.engine.resize();
  }

  private setupResizeListeners(callback?: (w: number, h: number) => void): void {
    this.resizeHandler = () => {
      this.engine.resize();
      if (callback) {
        callback(this.canvas.width, this.canvas.height);
      }
    };

    window.addEventListener("resize", this.resizeHandler);

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.engine.resize();
        if (callback) {
          callback(this.canvas.width, this.canvas.height);
        }
      });
      this.resizeObserver.observe(this.canvas);
    }
  }

  startRenderLoop(renderFn: () => void): void {
    this.engine.stopRenderLoop();
    this.engine.runRenderLoop(renderFn);
  }

  stopRenderLoop(): void {
    this.engine.stopRenderLoop();
  }

  dispose(): void {
    this.stopRenderLoop();
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.engine.dispose();
  }
}
