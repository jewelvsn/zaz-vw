import { describe, it, expect } from "vitest";
import { MockAiProvider } from "../src/ai/providerInterface";
import { buildCatalogSystemPrompt } from "../src/ai/promptBuilder";
import { validateAndRepairPlan } from "../src/ai/planValidator";
import { compilePlanToProject } from "../src/ai/planCompiler";
import { createDefaultProject } from "../src/domain/project";

describe("AI Text-to-Scene Planner", () => {
  const provider = new MockAiProvider();

  it("builds catalog system prompt containing registered characters, environments, and actions", () => {
    const prompt = buildCatalogSystemPrompt();
    expect(prompt).toContain("char_faceless_robot");
    expect(prompt).toContain("env_jungle_waterfall");
    expect(prompt).toContain("waterfall_shower_spot");
    expect(prompt).toContain("tree_climb_start");
    expect(prompt).toContain("fly");
    expect(prompt).toContain("establishing_wide");
  });

  it("generates and validates an Iron Man flight scene plan", async () => {
    const raw = await provider.generateScenePlan("The robot activates iron man flight mode", "");
    const report = validateAndRepairPlan(raw);

    expect(report.valid).toBe(true);
    expect(report.errors.length).toBe(0);
    expect(report.plan).toBeDefined();
    const hasFlight = report.plan?.shots.some((s) => s.actions.some((a) => a.actionId === "fly"));
    expect(hasFlight).toBe(true);
  });

  it("generates and validates a tree climbing scene plan", async () => {
    const raw = await provider.generateScenePlan("climb the tree", "");
    const report = validateAndRepairPlan(raw);

    expect(report.valid).toBe(true);
    const hasClimb = report.plan?.shots.some((s) => s.actions.some((a) => a.actionId === "climb"));
    expect(hasClimb).toBe(true);
  });

  it("handles unknown IDs gracefully with repair warnings", () => {
    const badJson = JSON.stringify({
      title: "Unknown Test",
      synopsis: "Testing fallback",
      environmentAssetId: "non_existent_env",
      characters: [
        {
          characterId: "c1",
          assetId: "non_existent_char",
          name: "Test",
          initialAnchorOrPosition: [0, 0, 0],
        },
      ],
      shots: [
        {
          shotId: "s1",
          name: "S1",
          cameraPreset: "unknown_preset",
          durationFrames: 60,
          description: "Test description",
          actions: [
            {
              characterId: "c1",
              actionId: "non_existent_action",
            },
          ],
        },
      ],
    });

    const report = validateAndRepairPlan(badJson);
    expect(report.valid).toBe(true);
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(report.plan?.environmentAssetId).toBe("env_jungle_waterfall");
    expect(report.plan?.characters[0].assetId).toBe("char_faceless_robot");
    expect(report.plan?.shots[0].cameraPreset).toBe("medium");
    expect(report.plan?.shots[0].actions[0].actionId).toBe("idle");
  });

  it("compiles plan into editable Project with matching shots and tracks", async () => {
    const project = createDefaultProject("Base Project");
    const raw = await provider.generateScenePlan("fly like iron man", "");
    const report = validateAndRepairPlan(raw);

    const updated = compilePlanToProject(project, report.plan!);
    const scene = updated.episodes[0].scenes[0];

    expect(scene.shots.length).toBe(report.plan!.shots.length);
    expect(scene.tracks.length).toBeGreaterThan(0);

    const robotTrack = scene.tracks.find((t) => t.type === "character");
    expect(robotTrack).toBeDefined();
    expect(robotTrack?.clips[0].action?.actionId).toBe("fly");
  });
});
