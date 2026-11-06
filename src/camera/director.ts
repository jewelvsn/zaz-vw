import * as BABYLON from "@babylonjs/core";
import type { Shot, CameraPresetType } from "../schema/types";
import { CAMERA_PRESETS } from "./presets";
import { BabylonSceneBridge } from "../runtime/sceneBridge";

export class CameraDirector {
  private camera: BABYLON.ArcRotateCamera;
  private sceneBridge: BabylonSceneBridge;
  private isUserInteracting: boolean = false;

  constructor(sceneBridge: BabylonSceneBridge, canvas?: HTMLCanvasElement) {
    this.sceneBridge = sceneBridge;
    const scene = sceneBridge.getScene();

    // Setup ArcRotateCamera
    this.camera = new BABYLON.ArcRotateCamera(
      "studioCinematicCamera",
      -Math.PI / 2,
      1.25,
      10.0,
      new BABYLON.Vector3(0, 0.8, 0),
      scene
    );

    this.camera.minZ = 0.1;
    this.camera.maxZ = 300.0;
    this.camera.wheelPrecision = 45;
    this.camera.fov = 0.8;
    this.camera.inertia = 0.85;

    // Set as active camera in bridge
    sceneBridge.setActiveCamera(this.camera);

    if (canvas) {
      this.camera.attachControl(canvas, true);
    }
  }

  public getCamera(): BABYLON.ArcRotateCamera {
    return this.camera;
  }

  public setUserInteracting(interacting: boolean): void {
    this.isUserInteracting = interacting;
  }

  public evaluateShotAtFrame(
    frame: number,
    fps: number,
    shots: Shot[],
    fallbackPreset: CameraPresetType = "establishing_wide"
  ): void {
    if (this.isUserInteracting) {
      // Don't override camera when user is manually orbiting/framing in the viewport
      return;
    }

    // Find active shot covering current frame
    const activeShot = shots.find(
      (s) => s.startFrame <= frame && frame < s.startFrame + s.durationFrames
    );

    const presetType = activeShot ? activeShot.cameraPreset : fallbackPreset;
    const presetConfig = CAMERA_PRESETS[presetType] || CAMERA_PRESETS.establishing_wide;

    // Resolve Target position
    let targetPos = new BABYLON.Vector3(0, presetConfig.targetOffsetY, 0);
    const targetId = activeShot?.primaryTargetId;

    if (targetId) {
      const charAdapter = this.sceneBridge.getCharacterAdapter(targetId);
      if (charAdapter) {
        targetPos = charAdapter.root.position.clone();
        targetPos.y += presetConfig.targetOffsetY;
      } else {
        const envAdapter = this.sceneBridge.getEnvironmentAdapter();
        if (envAdapter) {
          const anchorPos = envAdapter.getAnchorWorldPosition(targetId);
          if (anchorPos) {
            targetPos = anchorPos.clone();
            targetPos.y += presetConfig.targetOffsetY;
          }
        }
      }
    }

    // Dynamic shot progress
    let alpha = presetConfig.alpha;
    let beta = presetConfig.beta;
    let radius = presetConfig.radius;
    let fov = presetConfig.fov;

    if (activeShot) {
      const localFrame = frame - activeShot.startFrame;
      const progress = Math.max(0, Math.min(1, localFrame / Math.max(1, activeShot.durationFrames)));

      if (presetType === "orbit") {
        alpha = presetConfig.alpha + progress * Math.PI * 0.75;
      } else if (presetType === "dolly_in") {
        radius = 8.5 - progress * 4.5;
        fov = 0.85 - progress * 0.15;
      } else if (presetType === "dolly_out") {
        radius = 2.5 + progress * 5.0;
        fov = 0.7 + progress * 0.15;
      } else if (presetType === "reveal") {
        beta = 1.7 - progress * 0.45;
        targetPos.y += progress * 0.3;
      }
    }

    // Apply smoothly or directly to camera
    this.camera.setTarget(targetPos);
    this.camera.alpha = alpha;
    this.camera.beta = beta;
    this.camera.radius = radius;
    this.camera.fov = fov;
  }

  public dispose(): void {
    this.camera.dispose();
  }
}
