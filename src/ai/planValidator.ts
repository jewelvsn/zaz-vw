import type { AiScenePlan } from "../schema/types";
import { validateAiScenePlan } from "../schema/zod";
import { assetRegistry } from "../assets/registry";
import { actionRegistry } from "../actions/registry";
import { CAMERA_PRESETS } from "../camera/presets";

export interface PlanValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  plan: AiScenePlan | null;
}

export function validateAndRepairPlan(rawJson: string): PlanValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: any;
  try {
    const cleaned = rawJson
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```\s*$/, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    return {
      valid: false,
      errors: [`JSON syntax error: ${err.message}`],
      warnings,
      plan: null,
    };
  }

  // Pre-sanitize camera presets if model returned a non-standard name
  if (parsed && Array.isArray(parsed.shots)) {
    parsed.shots.forEach((shot: any) => {
      if (shot && (!shot.cameraPreset || !CAMERA_PRESETS[shot.cameraPreset as keyof typeof CAMERA_PRESETS])) {
        warnings.push(
          `Camera preset "${shot.cameraPreset}" unknown; falling back to "medium".`
        );
        shot.cameraPreset = "medium";
      }
    });
  }

  // 1. Zod Schema Validation
  const zodRes = validateAiScenePlan(parsed);
  if (!zodRes.success) {
    return {
      valid: false,
      errors: zodRes.errors,
      warnings,
      plan: null,
    };
  }

  const plan = zodRes.data;

  // 2. Semantic Reference Checks
  // Check Environment
  if (!assetRegistry.hasAsset(plan.environmentAssetId)) {
    warnings.push(
      `Environment ID "${plan.environmentAssetId}" was not found in catalog; falling back to "env_jungle_waterfall".`
    );
    plan.environmentAssetId = "env_jungle_waterfall";
  }

  // Check Characters
  plan.characters.forEach((char) => {
    if (!assetRegistry.hasAsset(char.assetId)) {
      warnings.push(
        `Character asset "${char.assetId}" is unknown; falling back to "char_faceless_robot".`
      );
      char.assetId = "char_faceless_robot";
    }
  });

  // Check Shots & Actions
  plan.shots.forEach((shot) => {
    shot.actions.forEach((act) => {
      if (!actionRegistry.hasAction(act.actionId)) {
        warnings.push(
          `Action "${act.actionId}" is unknown; replacing with "idle".`
        );
        act.actionId = "idle";
      }

      if (act.targetAnchorId) {
        const anchorExists = assetRegistry.findAnchor(
          plan.environmentAssetId,
          act.targetAnchorId
        );
        if (!anchorExists) {
          warnings.push(
            `Target anchor "${act.targetAnchorId}" not found in environment "${plan.environmentAssetId}". Removed anchor target.`
          );
          delete act.targetAnchorId;
        }
      }
    });
  });

  return {
    valid: true,
    errors,
    warnings,
    plan,
  };
}
