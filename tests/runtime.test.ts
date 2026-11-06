import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as BABYLON from "@babylonjs/core";
import { BabylonCharacterAdapter } from "../src/runtime/characterAdapter";
import { BabylonEnvironmentAdapter } from "../src/runtime/environmentAdapter";
import { BabylonSceneBridge } from "../src/runtime/sceneBridge";
import { createDefaultProject } from "../src/domain/project";

describe("Babylon Runtime Adapters", () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  it("initializes BabylonCharacterAdapter with default transform and pivots", () => {
    const adapter = new BabylonCharacterAdapter({
      instanceId: "char_test",
      assetId: "char_faceless_robot",
      modelUrl: "/faceless_kids_robot.glb",
      scene,
      initialPosition: { x: 1, y: 0, z: 2 },
      initialRotation: { x: 0, y: Math.PI, z: 0 },
    });

    expect(adapter.instanceId).toBe("char_test");
    expect(adapter.root.position.x).toBe(1);
    expect(adapter.root.position.y).toBe(0);
    expect(adapter.root.position.z).toBe(2);
    expect(adapter.root.rotation.y).toBeCloseTo(Math.PI);

    // Apply limb rotations
    adapter.setLimbRotations({
      leftLegX: 0.5,
      rightLegX: -0.5,
      leftArmX: -0.3,
      rightArmX: 0.3,
    });

    // Visual transform
    adapter.setVisualTransform(0.1, 0.05, -0.02, 1.05, 0.95);
    expect(adapter.visual.position.y).toBe(0.1);
    expect(adapter.visual.rotation.x).toBe(0.05);

    adapter.dispose();
  });

  it("initializes BabylonEnvironmentAdapter and resolves semantic anchors", () => {
    const envAdapter = new BabylonEnvironmentAdapter({
      assetId: "env_jungle_waterfall",
      modelUrl: "/jungle_waterfall_hq.glb",
      scene,
      initialPosition: { x: 0, y: 0, z: 0 },
    });

    expect(envAdapter.assetId).toBe("env_jungle_waterfall");

    // Semantic anchors from registry
    const clearingPos = envAdapter.getAnchorWorldPosition("clearing_center");
    expect(clearingPos).not.toBeNull();
    expect(clearingPos?.x).toBeCloseTo(0);
    expect(clearingPos?.z).toBeCloseTo(1.8);

    const showerPos = envAdapter.getAnchorWorldPosition("waterfall_shower_spot");
    expect(showerPos).not.toBeNull();
    expect(showerPos?.x).toBeCloseTo(0.35);

    const treeStartPos = envAdapter.getAnchorWorldPosition("tree_climb_start");
    expect(treeStartPos).not.toBeNull();
    expect(treeStartPos?.x).toBeCloseTo(-4.2);

    const treeBranchPos = envAdapter.getAnchorWorldPosition("tree_climb_branch");
    expect(treeBranchPos).not.toBeNull();
    expect(treeBranchPos?.y).toBeCloseTo(2.05);

    // Test procedural water update at frame 30
    envAdapter.updateProceduralEffects(30, 30);

    envAdapter.dispose();
  });

  it("initializes BabylonSceneBridge with domain scene and characters", () => {
    const project = createDefaultProject("Test Studio");
    const domainScene = project.episodes[0].scenes[0];

    const bridge = new BabylonSceneBridge({
      engine,
      domainScene,
      qualityPreset: "draft",
    });

    expect(bridge.getScene()).toBeDefined();
    expect(bridge.getQualityPreset()).toBe("draft");
    expect(bridge.getEnvironmentAdapter()).toBeDefined();
    expect(bridge.getCharacterAdapter("char_robot_main")).toBeDefined();

    bridge.dispose();
  });
});
