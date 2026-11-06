import { describe, it, expect } from "vitest";
import { actionRegistry } from "../src/actions/registry";
import { actionExecutor } from "../src/actions/executor";
import { createDefaultProject } from "../src/domain/project";

describe("Action Registry & Definitions", () => {
  it("has all core cinematic studio actions registered", () => {
    const coreActions = [
      "idle",
      "walk_to",
      "run_to",
      "wave",
      "sit_on",
      "climb",
      "take_shower",
      "fly",
      "jump",
    ];

    coreActions.forEach((id) => {
      expect(actionRegistry.hasAction(id)).toBe(true);
      const def = actionRegistry.getAction(id);
      expect(def).toBeDefined();
      expect(def?.actionId).toBe(id);
      expect(def?.capabilitiesRequired.length).toBeGreaterThan(0);
    });
  });

  it("filters actions based on actor capabilities", () => {
    const flightOnly = actionRegistry.getActionsForCapabilities(["fly"]);
    expect(flightOnly.some((a) => a.actionId === "fly")).toBe(true);
  });

  it("evaluates Idle action deterministically with breathing oscillation", () => {
    const idleDef = actionRegistry.getAction("idle")!;
    const pose0 = idleDef.evaluatePose({
      globalFrame: 0,
      localFrame: 0,
      durationFrames: 90,
      fps: 30,
      parameters: {},
      initialTransform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    });

    const pose30 = idleDef.evaluatePose({
      globalFrame: 30,
      localFrame: 30,
      durationFrames: 90,
      fps: 30,
      parameters: {},
      initialTransform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    });

    expect(pose0.position.x).toBe(0);
    expect(pose0.visualTransform.scaleY).toBeCloseTo(1.0);
    // After 1 sec (30 frames at 30 fps), breathing changes scale
    expect(pose30.visualTransform.scaleY).not.toBe(1.0);
  });

  it("evaluates WalkTo action interpolating toward target anchor", () => {
    const walkDef = actionRegistry.getAction("walk_to")!;
    const startPos = { x: 0, y: 0, z: 0 };
    const targetAnchor = { x: 0, y: 0, z: 10 };

    const halfPose = walkDef.evaluatePose({
      globalFrame: 45,
      localFrame: 45,
      durationFrames: 90,
      fps: 30,
      parameters: {},
      initialTransform: {
        position: startPos,
        rotation: { x: 0, y: 0, z: 0 },
      },
      targetAnchorPosition: targetAnchor,
    });

    // At 50% duration, z should be roughly halfway (5.0)
    expect(halfPose.position.z).toBeCloseTo(5.0);
    // Gait features active
    expect(halfPose.limbRotations.leftLegX).toBeDefined();
    expect(halfPose.limbRotations.rightLegX).toBeDefined();
  });

  it("evaluates Iron Man Flight action with hover altitude, pitch lean, and effects", () => {
    const flyDef = actionRegistry.getAction("fly")!;
    const pose = flyDef.evaluatePose({
      globalFrame: 15,
      localFrame: 15,
      durationFrames: 60,
      fps: 30,
      parameters: { altitude: 3.5 },
      initialTransform: {
        position: { x: 1, y: 0, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    });

    // Altitude should be around 3.5m + hover sine
    expect(pose.position.y).toBeGreaterThan(3.3);
    // Aerodynamic flight lean
    expect(pose.visualTransform.pitchX).toBeCloseTo(0.45);
    // Thrusters and chest glow effects enabled
    expect(pose.effects?.thrusters).toBe(true);
    expect(pose.effects?.chestGlow).toBe(true);
  });

  it("actionExecutor falls back to Idle when no active clip is found", () => {
    const project = createDefaultProject("Test");
    const domainScene = project.episodes[0].scenes[0];
    const tracks = domainScene.tracks;

    const pose = actionExecutor.evaluateCharacterPose(
      "char_robot_main",
      9999, // frame beyond clips
      30,
      domainScene,
      tracks
    );

    expect(pose).toBeDefined();
    expect(pose.visualTransform.scaleY).toBeDefined();
  });
});
