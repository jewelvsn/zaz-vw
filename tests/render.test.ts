import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as BABYLON from "@babylonjs/core";
import { DeterministicFrameStepper } from "../src/render/frameStepper";
import { BabylonSceneBridge } from "../src/runtime/sceneBridge";
import { CameraDirector } from "../src/camera/director";
import { createDefaultProject } from "../src/domain/project";

describe("Deterministic Rendering Pipeline", () => {
  let engine: BABYLON.NullEngine;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
  });

  afterEach(() => {
    engine.dispose();
  });

  it("steps through frame range deterministically and reports progress", async () => {
    const project = createDefaultProject("Render Test");
    const domainScene = project.episodes[0].scenes[0];

    const bridge = new BabylonSceneBridge({
      engine,
      domainScene,
      qualityPreset: "draft",
    });

    const cameraDirector = new CameraDirector(bridge);

    const renderedFrames: number[] = [];
    const progressList: number[] = [];

    const completed = await DeterministicFrameStepper.stepRange(
      {
        sceneBridge: bridge,
        cameraDirector,
        domainScene,
        tracks: domainScene.tracks,
        fps: 30,
        startFrame: 0,
        endFrame: 5,
        onProgress: (p) => progressList.push(p.percent),
      },
      async (frame) => {
        renderedFrames.push(frame);
      }
    );

    expect(completed).toBe(true);
    expect(renderedFrames).toEqual([0, 1, 2, 3, 4, 5]);
    expect(progressList.length).toBe(6);
    expect(progressList[progressList.length - 1]).toBe(100);

    cameraDirector.dispose();
    bridge.dispose();
  });

  it("supports cancellation mid-render", async () => {
    const project = createDefaultProject("Cancel Test");
    const domainScene = project.episodes[0].scenes[0];

    const bridge = new BabylonSceneBridge({
      engine,
      domainScene,
      qualityPreset: "draft",
    });

    const cameraDirector = new CameraDirector(bridge);

    let cancel = false;
    let frameCount = 0;

    const completed = await DeterministicFrameStepper.stepRange(
      {
        sceneBridge: bridge,
        cameraDirector,
        domainScene,
        tracks: domainScene.tracks,
        fps: 30,
        startFrame: 0,
        endFrame: 10,
        shouldCancel: () => cancel,
      },
      async (frame) => {
        frameCount++;
        if (frame === 2) {
          cancel = true; // Trigger cancellation at frame 2
        }
      }
    );

    expect(completed).toBe(false);
    expect(frameCount).toBe(3); // Rendered 0, 1, 2 then halted

    cameraDirector.dispose();
    bridge.dispose();
  });
});
