import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as BABYLON from "@babylonjs/core";
import { BabylonSceneBridge } from "../src/runtime/sceneBridge";
import { CameraDirector } from "../src/camera/director";
import { sceneTrackEvaluator } from "../src/timeline/trackEvaluator";
import { createDefaultProject, generateId } from "../src/domain/project";
import { MockAiProvider } from "../src/ai/providerInterface";
import { validateAndRepairPlan } from "../src/ai/planValidator";
import { compilePlanToProject } from "../src/ai/planCompiler";

describe("Studio End-to-End Fixtures", () => {
  let engine: BABYLON.NullEngine;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
  });

  afterEach(() => {
    engine.dispose();
  });

  it("Fixture 1: Character walking to tree base with tracking camera", () => {
    const project = createDefaultProject("Fixture 1");
    const scene = project.episodes[0].scenes[0];

    // Configure walk to tree climb start
    const track = scene.tracks.find((t) => t.type === "character")!;
    track.clips = [
      {
        id: generateId("clip"),
        name: "Walk to Tree",
        trackId: track.id,
        startFrame: 0,
        durationFrames: 90,
        type: "action",
        action: {
          actionId: "walk_to",
          targetAnchorId: "tree_climb_start",
          parameters: { speed: 1.0 },
        },
      },
    ];

    scene.shots = [
      {
        id: generateId("shot"),
        name: "Tracking Side",
        startFrame: 0,
        durationFrames: 90,
        cameraPreset: "tracking_side",
        primaryTargetId: "char_robot_main",
      },
    ];

    const bridge = new BabylonSceneBridge({
      engine,
      domainScene: scene,
      qualityPreset: "draft",
    });
    const camera = new CameraDirector(bridge);

    // Evaluate frame 45 (halfway)
    const result = sceneTrackEvaluator.evaluateFrame(
      45,
      30,
      scene,
      scene.tracks,
      bridge,
      camera
    );

    const pose = result.characterPoses.get("char_robot_main")!;
    expect(pose).toBeDefined();
    // Character should have walked from x=0 toward tree at x=-4.2
    expect(pose.position.x).toBeLessThan(-1.0);
    expect(camera.getCamera().alpha).toBeCloseTo(0); // Tracking side alpha

    camera.dispose();
    bridge.dispose();
  });

  it("Fixture 2: Character sitting on rock bench anchor", () => {
    const project = createDefaultProject("Fixture 2");
    const scene = project.episodes[0].scenes[0];

    const track = scene.tracks.find((t) => t.type === "character")!;
    track.clips = [
      {
        id: generateId("clip"),
        name: "Sit on Rock",
        trackId: track.id,
        startFrame: 0,
        durationFrames: 90,
        type: "action",
        action: {
          actionId: "sit_on",
          targetAnchorId: "moss_rock_bench",
          parameters: {},
        },
      },
    ];

    const bridge = new BabylonSceneBridge({
      engine,
      domainScene: scene,
      qualityPreset: "draft",
    });

    const result = sceneTrackEvaluator.evaluateFrame(
      30,
      30,
      scene,
      scene.tracks,
      bridge
    );

    const pose = result.characterPoses.get("char_robot_main")!;
    expect(pose).toBeDefined();
    // Positioned at moss rock bench anchor (2.5, 0.25, 0.5)
    expect(pose.position.x).toBeCloseTo(2.5);
    expect(pose.position.z).toBeCloseTo(0.5);
    // Sitting posture limb bends
    expect(pose.limbRotations.leftLegX).toBeLessThan(-1.0);
    expect(pose.limbRotations.leftKneeX).toBeGreaterThan(1.0);

    bridge.dispose();
  });

  it("Fixture 3: Two characters with over-the-shoulder camera alternation", () => {
    const project = createDefaultProject("Fixture 3");
    const scene = project.episodes[0].scenes[0];

    // Add second character
    scene.characters.push({
      id: "char_robot_buddy",
      name: "Robot Buddy",
      assetId: "char_faceless_robot",
      initialPosition: [1.2, 0, 0.5],
      initialRotation: [0, -Math.PI / 2, 0],
      initialScale: [0.45, 0.45, 0.45],
    });

    scene.shots = [
      {
        id: "shot1",
        name: "Main OTS",
        startFrame: 0,
        durationFrames: 45,
        cameraPreset: "over_shoulder",
        primaryTargetId: "char_robot_main",
      },
      {
        id: "shot2",
        name: "Buddy OTS",
        startFrame: 45,
        durationFrames: 45,
        cameraPreset: "over_shoulder",
        primaryTargetId: "char_robot_buddy",
      },
    ];

    const bridge = new BabylonSceneBridge({
      engine,
      domainScene: scene,
      qualityPreset: "draft",
    });
    const camera = new CameraDirector(bridge);

    // Frame 20 targeting main character
    sceneTrackEvaluator.evaluateFrame(20, 30, scene, scene.tracks, bridge, camera);
    const target1 = camera.getCamera().target.clone();
    expect(target1.z).toBeCloseTo(1.8);

    // Frame 60 targeting buddy character
    sceneTrackEvaluator.evaluateFrame(60, 30, scene, scene.tracks, bridge, camera);
    const target2 = camera.getCamera().target.clone();
    expect(target2.x).toBeCloseTo(1.2);

    camera.dispose();
    bridge.dispose();
  });

  it("Fixture 4: AI scene prompt compiled and applied to project", async () => {
    const project = createDefaultProject("Fixture 4");
    const provider = new MockAiProvider();

    const planJson = await provider.generateScenePlan("climb the tree", "");
    const report = validateAndRepairPlan(planJson);
    expect(report.valid).toBe(true);

    const compiledProject = compilePlanToProject(project, report.plan!);
    const scene = compiledProject.episodes[0].scenes[0];

    expect(scene.shots.length).toBe(3);
    const bridge = new BabylonSceneBridge({
      engine,
      domainScene: scene,
      qualityPreset: "draft",
    });

    // Evaluate climbing frame 120
    const result = sceneTrackEvaluator.evaluateFrame(120, 30, scene, scene.tracks, bridge);
    expect(result.activeShot?.name).toContain("Trunk Vertical Ascent");

    bridge.dispose();
  });
});
