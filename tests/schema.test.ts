import { describe, it, expect } from "vitest";
import { validateProject, validateAiScenePlan } from "../src/schema/zod";
import { createDefaultProject } from "../src/domain/project";
import type { AiScenePlan } from "../src/schema/types";

describe("Project Schema & Validation", () => {
  it("validates default project against schema v1.0.0", () => {
    const proj = createDefaultProject("Test Studio Scene");
    const result = validateProject(proj);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schemaVersion).toBe("1.0.0");
      expect(result.data.settings.fps).toBe(30);
      expect(result.data.episodes.length).toBeGreaterThan(0);
      expect(result.data.episodes[0].scenes[0].characters.length).toBeGreaterThan(0);
    }
  });

  it("rejects project with invalid schemaVersion", () => {
    const proj = createDefaultProject();
    // @ts-expect-error Testing invalid schema version
    proj.schemaVersion = "2.0.0";
    const result = validateProject(proj);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("schemaVersion"))).toBe(true);
    }
  });

  it("rejects project with invalid fps or negative frames", () => {
    const proj = createDefaultProject();
    proj.settings.fps = 5; // minimum is 12
    const result = validateProject(proj);
    expect(result.success).toBe(false);
  });

  it("validates correct AiScenePlan structure", () => {
    const plan: AiScenePlan = {
      title: "Hero Enters the Jungle",
      synopsis: "The robot walks to the waterfall to cool off after a long journey.",
      environmentAssetId: "env_jungle_waterfall",
      characters: [
        {
          characterId: "char_robot_main",
          assetId: "char_faceless_robot",
          name: "Faceless Kids Robot",
          initialAnchorOrPosition: "clearing_center",
        },
      ],
      shots: [
        {
          shotId: "shot_1",
          name: "Establishing Wide",
          durationFrames: 90,
          cameraPreset: "establishing_wide",
          targetEntityId: "char_robot_main",
          description: "Wide shot showing the whole waterfall sanctuary",
          actions: [
            {
              characterId: "char_robot_main",
              actionId: "walk_to",
              targetAnchorId: "waterfall_shower_spot",
            },
          ],
        },
      ],
    };

    const result = validateAiScenePlan(plan);
    expect(result.success).toBe(true);
  });

  it("rejects AiScenePlan with zero shots or empty fields", () => {
    const invalidPlan = {
      title: "",
      synopsis: "",
      environmentAssetId: "",
      characters: [],
      shots: [],
    };
    const result = validateAiScenePlan(invalidPlan);
    expect(result.success).toBe(false);
  });
});
