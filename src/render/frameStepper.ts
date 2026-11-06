import * as BABYLON from "@babylonjs/core";
import type { Scene as DomainScene, TimelineTrack } from "../schema/types";
import { BabylonSceneBridge } from "../runtime/sceneBridge";
import { CameraDirector } from "../camera/director";
import { sceneTrackEvaluator } from "../timeline/trackEvaluator";

export interface FrameStepProgress {
  frame: number;
  totalFrames: number;
  percent: number;
}

export interface FrameStepperOptions {
  sceneBridge: BabylonSceneBridge;
  cameraDirector?: CameraDirector;
  domainScene: DomainScene;
  tracks: TimelineTrack[];
  fps: number;
  startFrame: number;
  endFrame: number;
  onProgress?: (progress: FrameStepProgress) => void;
  shouldCancel?: () => boolean;
}

export class DeterministicFrameStepper {
  public static async stepRange(
    options: FrameStepperOptions,
    onFrameRendered: (frame: number, canvas: HTMLCanvasElement | null) => Promise<void>
  ): Promise<boolean> {
    const {
      sceneBridge,
      cameraDirector,
      domainScene,
      tracks,
      fps,
      startFrame,
      endFrame,
      onProgress,
      shouldCancel,
    } = options;

    const canvas = sceneBridge.getScene().getEngine().getRenderingCanvas();
    const total = endFrame - startFrame + 1;

    for (let f = startFrame; f <= endFrame; f++) {
      if (shouldCancel && shouldCancel()) {
        return false; // Cancelled
      }

      // 1. Deterministically evaluate scene and characters at exact frame
      sceneTrackEvaluator.evaluateFrame(
        f,
        fps,
        domainScene,
        tracks,
        sceneBridge,
        cameraDirector
      );

      // 2. Synchronous offline render call
      sceneBridge.render();

      // 3. Callback with rendered canvas
      await onFrameRendered(f, canvas);

      // 4. Progress update
      if (onProgress) {
        const completed = f - startFrame + 1;
        onProgress({
          frame: f,
          totalFrames: total,
          percent: Math.round((completed / total) * 100),
        });
      }

      // Yield event loop to allow UI to remain responsive during export
      await new Promise((res) => setTimeout(res, 0));
    }

    return true; // Finished successfully
  }
}
