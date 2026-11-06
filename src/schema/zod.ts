import { z } from "zod";
import type {
  Project,
  AiScenePlan,
  InteractionAnchor,
  AssetManifest,
  TimelineClip,
  TimelineTrack,
  Scene,
} from "./types";

export const Vector3TupleSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
]);

export const Rotation3TupleSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
]);

export const ColorRGBSchema = z.tuple([
  z.number().min(0).max(1),
  z.number().min(0).max(1),
  z.number().min(0).max(1),
]);

export const ColorRGBASchema = z.tuple([
  z.number().min(0).max(1),
  z.number().min(0).max(1),
  z.number().min(0).max(1),
  z.number().min(0).max(1),
]);

export const AnchorTypeSchema = z.enum([
  "seat",
  "approach",
  "climb_start",
  "climb_end",
  "shower_spot",
  "hand_grab",
  "look_target",
  "spawn",
  "custom",
]);

export const InteractionAnchorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: AnchorTypeSchema,
  position: Vector3TupleSchema,
  rotation: Rotation3TupleSchema.optional(),
  description: z.string().optional(),
});

export const RigTypeSchema = z.enum([
  "anatomical-pivot",
  "humanoid-skeleton",
  "generic",
]);

export const RigProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: RigTypeSchema,
  boneOrPivotMap: z.record(z.string(), z.string()),
  defaultHeight: z.number().positive(),
  capabilities: z.array(z.string()),
});

export const AssetTypeSchema = z.enum([
  "character",
  "environment",
  "prop",
  "audio",
]);

export const AssetManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: AssetTypeSchema,
  uri: z.string().min(1),
  rigProfileId: z.string().optional(),
  anchors: z.array(InteractionAnchorSchema).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ActionInvocationSchema = z.object({
  actionId: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()).default({}),
  targetAnchorId: z.string().optional(),
  targetEntityId: z.string().optional(),
  blendInFrames: z.number().int().nonnegative().optional(),
  blendOutFrames: z.number().int().nonnegative().optional(),
});

export const CameraPresetTypeSchema = z.enum([
  "establishing_wide",
  "medium",
  "close_up",
  "extreme_close_up",
  "over_shoulder",
  "tracking_side",
  "follow",
  "orbit",
  "low_angle",
  "high_angle",
  "reveal",
  "static",
  "dolly_in",
  "dolly_out",
]);

export const EasingTypeSchema = z.enum([
  "linear",
  "easeIn",
  "easeOut",
  "easeInOut",
]);

export const CameraShotSchema = z.object({
  preset: CameraPresetTypeSchema,
  targetEntityId: z.string().optional(),
  targetAnchorId: z.string().optional(),
  targetPosition: Vector3TupleSchema.optional(),
  startTransform: z
    .object({
      position: Vector3TupleSchema,
      rotation: Rotation3TupleSchema,
      fov: z.number().positive().optional(),
    })
    .optional(),
  endTransform: z
    .object({
      position: Vector3TupleSchema,
      rotation: Rotation3TupleSchema,
      fov: z.number().positive().optional(),
    })
    .optional(),
  easing: EasingTypeSchema.optional(),
});

export const DialoguePayloadSchema = z.object({
  characterId: z.string().min(1),
  text: z.string().min(1),
  audioClipId: z.string().optional(),
  voice: z.string().optional(),
});

export const AudioPayloadSchema = z.object({
  assetId: z.string().min(1),
  volume: z.number().min(0).max(1).default(1),
  loop: z.boolean().optional(),
});

export const EffectPayloadSchema = z.object({
  effectId: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const ClipTypeSchema = z.enum([
  "action",
  "camera",
  "dialogue",
  "audio",
  "effect",
]);

export const TimelineClipSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  trackId: z.string().min(1),
  startFrame: z.number().int().nonnegative(),
  durationFrames: z.number().int().positive(),
  type: ClipTypeSchema,
  action: ActionInvocationSchema.optional(),
  camera: CameraShotSchema.optional(),
  dialogue: DialoguePayloadSchema.optional(),
  audio: AudioPayloadSchema.optional(),
  effect: EffectPayloadSchema.optional(),
});

export const TrackTypeSchema = z.enum([
  "character",
  "camera",
  "dialogue",
  "audio",
  "effect",
]);

export const TimelineTrackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: TrackTypeSchema,
  targetEntityId: z.string().optional(),
  muted: z.boolean().optional(),
  locked: z.boolean().optional(),
  clips: z.array(TimelineClipSchema).default([]),
});

export const ShotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  startFrame: z.number().int().nonnegative(),
  durationFrames: z.number().int().positive(),
  cameraPreset: CameraPresetTypeSchema,
  primaryTargetId: z.string().optional(),
  description: z.string().optional(),
});

export const CharacterInstanceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  assetId: z.string().min(1),
  initialPosition: Vector3TupleSchema,
  initialRotation: Rotation3TupleSchema,
  initialScale: Vector3TupleSchema.optional(),
  colorOverrides: z.record(z.string(), ColorRGBSchema).optional(),
});

export const PropInstanceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  assetId: z.string().min(1),
  initialPosition: Vector3TupleSchema,
  initialRotation: Rotation3TupleSchema,
  initialScale: Vector3TupleSchema.optional(),
  attachedToEntityId: z.string().optional(),
  attachedAnchorId: z.string().optional(),
});

export const EnvironmentConfigSchema = z.object({
  assetId: z.string().min(1),
  fogMode: z.enum(["none", "exp", "exp2", "linear"]).optional(),
  fogDensity: z.number().nonnegative().optional(),
  fogColor: ColorRGBSchema.optional(),
  clearColor: ColorRGBASchema.optional(),
  sunlight: z
    .object({
      direction: Vector3TupleSchema,
      intensity: z.number().nonnegative(),
      color: ColorRGBSchema,
      shadowEnabled: z.boolean(),
    })
    .optional(),
  ambientLight: z
    .object({
      intensity: z.number().nonnegative(),
      skyColor: ColorRGBSchema,
      groundColor: ColorRGBSchema,
    })
    .optional(),
});

export const SceneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  environment: EnvironmentConfigSchema,
  characters: z.array(CharacterInstanceSchema).default([]),
  props: z.array(PropInstanceSchema).default([]),
  tracks: z.array(TimelineTrackSchema).default([]),
  shots: z.array(ShotSchema).default([]),
});

export const EpisodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  scenes: z.array(SceneSchema).min(1),
});

export const QualityPresetSchema = z.enum(["draft", "preview", "cinematic"]);

export const ProjectSettingsSchema = z.object({
  title: z.string().min(1),
  fps: z.number().int().min(12).max(120).default(30),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  author: z.string().optional(),
  qualityPreset: QualityPresetSchema.default("preview"),
});

export const ProjectSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  id: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  settings: ProjectSettingsSchema,
  assets: z.array(AssetManifestSchema).default([]),
  episodes: z.array(EpisodeSchema).min(1),
});

export const AiScenePlanSchema = z.object({
  title: z.string().min(1),
  synopsis: z.string().min(1),
  environmentAssetId: z.string().min(1),
  characters: z.array(
    z.object({
      characterId: z.string().min(1),
      assetId: z.string().min(1),
      name: z.string().min(1),
      initialAnchorOrPosition: z.union([z.string(), Vector3TupleSchema]),
    })
  ).min(1),
  props: z
    .array(
      z.object({
        propId: z.string().min(1),
        assetId: z.string().min(1),
        name: z.string().min(1),
        position: Vector3TupleSchema,
      })
    )
    .optional(),
  shots: z.array(
    z.object({
      shotId: z.string().min(1),
      name: z.string().min(1),
      durationFrames: z.number().int().positive(),
      cameraPreset: CameraPresetTypeSchema,
      targetEntityId: z.string().optional(),
      description: z.string().min(1),
      actions: z.array(
        z.object({
          characterId: z.string().min(1),
          actionId: z.string().min(1),
          parameters: z.record(z.string(), z.unknown()).optional(),
          targetAnchorId: z.string().optional(),
          dialogue: z.string().optional(),
        })
      ),
    })
  ).min(1),
});

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function validateProject(input: unknown): ValidationResult<Project> {
  const result = ProjectSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data as Project };
  }
  const issues = result.error.issues ?? [];
  return {
    success: false,
    errors: issues.map(
      (e) => `[${e.path.join(".")}] ${e.message}`
    ),
  };
}

export function validateAiScenePlan(
  input: unknown
): ValidationResult<AiScenePlan> {
  const result = AiScenePlanSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data as AiScenePlan };
  }
  const issues = result.error.issues ?? [];
  return {
    success: false,
    errors: issues.map(
      (e) => `[${e.path.join(".")}] ${e.message}`
    ),
  };
}
