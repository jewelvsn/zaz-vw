import { assetRegistry } from "../assets/registry";
import { actionRegistry } from "../actions/registry";
import { CAMERA_PRESETS } from "../camera/presets";

export function buildCatalogSystemPrompt(): string {
  const characters = assetRegistry.listAssets("character");
  const environments = assetRegistry.listAssets("environment");
  const actions = actionRegistry.listActions();

  const characterListing = characters
    .map(
      (c) =>
        `- ID: "${c.id}", Name: "${c.name}", Rig: "${c.rigProfileId || "default"}"`
    )
    .join("\n");

  const environmentListing = environments
    .map((e) => {
      const anchorList = (e.anchors || [])
        .map((a) => `    * Anchor ID: "${a.id}" (${a.type}) - ${a.name}`)
        .join("\n");
      return `- Environment ID: "${e.id}", Name: "${e.name}"\n  Anchors:\n${anchorList}`;
    })
    .join("\n");

  const actionListing = actions
    .map(
      (a) =>
        `- Action ID: "${a.actionId}" (${a.category}): ${a.description}. DefaultDuration: ${a.defaultDurationFrames} frames.`
    )
    .join("\n");

  const cameraPresetListing = Object.entries(CAMERA_PRESETS)
    .map(([k, cfg]) => `- Preset: "${k}": ${cfg.description}`)
    .join("\n");

  return `You are an expert cinematic storyboard planner and animation director for Babylon.js.
Translate natural-language story prompts into an exact, valid JSON scene plan.

CRITICAL RULES:
1. ONLY reference IDs that exist in the catalog below. NEVER invent non-existent asset IDs, anchor IDs, or action IDs.
2. The output must be pure, valid JSON matching the specified schema.
3. Every shot must have: name, cameraPreset, primaryTargetId, and durationFrames (minimum 30 frames).
4. Frame numbering starts at 0 and increments chronologically.

CATALOG CONTEXT:

CHARACTERS:
${characterListing}

ENVIRONMENTS & INTERACTION ANCHORS:
${environmentListing}

ACTIONS:
${actionListing}

CAMERA PRESETS:
${cameraPresetListing}

JSON OUTPUT SCHEMA EXAMPLE:
{
  "sceneTitle": "Title of Scene",
  "summary": "Brief story summary",
  "environmentAssetId": "env_jungle_waterfall",
  "characters": [
    {
      "instanceId": "char_robot_main",
      "assetId": "char_faceless_robot",
      "name": "Faceless Kids Robot",
      "spawnPosition": [0, 0, 1.8]
    }
  ],
  "shots": [
    {
      "name": "Establishing Shot",
      "cameraPreset": "establishing_wide",
      "primaryTargetId": "char_robot_main",
      "durationFrames": 90
    }
  ],
  "characterActions": [
    {
      "characterId": "char_robot_main",
      "actionId": "walk_to",
      "targetAnchorId": "waterfall_shower_spot",
      "startFrame": 0,
      "durationFrames": 90,
      "parameters": { "speed": 1.0 }
    }
  ],
  "dialogue": [
    {
      "characterId": "char_robot_main",
      "text": "What a majestic waterfall!",
      "startFrame": 15,
      "durationFrames": 60
    }
  ]
}`;
}
