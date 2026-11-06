/**
 * Strict TypeScript types for the Cinematic Cartoon Animation Studio project schema.
 * All units:
 * - Time: frames (integer >= 0), frame rates typically 24, 30, or 60 fps.
 * - Distance: meters / 3D world units (float).
 * - Angles: radians (Euler X, Y, Z).
 */

export type Vector3Tuple = [number, number, number];
export type Rotation3Tuple = [number, number, number];

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}
export type ColorRGB = [number, number, number];
export type ColorRGBA = [number, number, number, number];

export type AnchorType =
  | "seat"
  | "approach"
  | "climb_start"
  | "climb_end"
  | "shower_spot"
  | "hand_grab"
  | "look_target"
  | "spawn"
  | "custom";

export interface InteractionAnchor {
  id: string;
  name: string;
  type: AnchorType;
  position: Vector3Tuple;
  rotation?: Rotation3Tuple;
  description?: string;
}

export type RigType = "anatomical-pivot" | "humanoid-skeleton" | "generic";

export interface RigProfile {
  id: string;
  name: string;
  type: RigType;
  boneOrPivotMap: Record<string, string>;
  defaultHeight: number;
  capabilities: string[];
}

export type AssetType = "character" | "environment" | "prop" | "audio";

export interface AssetManifest {
  id: string;
  name: string;
  type: AssetType;
  uri: string;
  rigProfileId?: string;
  anchors?: InteractionAnchor[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export type ActionCategory =
  | "locomotion"
  | "gesture"
  | "posture"
  | "interaction"
  | "special";

export interface ActionInvocation {
  actionId: string;
  parameters: Record<string, unknown>;
  targetAnchorId?: string;
  targetEntityId?: string;
  blendInFrames?: number;
  blendOutFrames?: number;
}

export type CameraPresetType =
  | "establishing_wide"
  | "medium"
  | "close_up"
  | "extreme_close_up"
  | "over_shoulder"
  | "tracking_side"
  | "follow"
  | "orbit"
  | "low_angle"
  | "high_angle"
  | "reveal"
  | "static"
  | "dolly_in"
  | "dolly_out";

export type EasingType = "linear" | "easeIn" | "easeOut" | "easeInOut";

export interface CameraShot {
  preset: CameraPresetType;
  targetEntityId?: string;
  targetAnchorId?: string;
  targetPosition?: Vector3Tuple;
  startTransform?: {
    position: Vector3Tuple;
    rotation: Rotation3Tuple;
    fov?: number;
  };
  endTransform?: {
    position: Vector3Tuple;
    rotation: Rotation3Tuple;
    fov?: number;
  };
  easing?: EasingType;
}

export interface DialoguePayload {
  characterId: string;
  text: string;
  audioClipId?: string;
  voice?: string;
}

export interface AudioPayload {
  assetId: string;
  volume: number;
  loop?: boolean;
}

export interface EffectPayload {
  effectId: string;
  parameters?: Record<string, unknown>;
}

export type ClipType = "action" | "camera" | "dialogue" | "audio" | "effect";

export interface TimelineClip {
  id: string;
  name: string;
  trackId: string;
  startFrame: number;
  durationFrames: number;
  type: ClipType;
  action?: ActionInvocation;
  camera?: CameraShot;
  dialogue?: DialoguePayload;
  audio?: AudioPayload;
  effect?: EffectPayload;
}

export type TrackType =
  | "character"
  | "camera"
  | "dialogue"
  | "audio"
  | "effect";

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  targetEntityId?: string;
  muted?: boolean;
  locked?: boolean;
  clips: TimelineClip[];
}

export interface Shot {
  id: string;
  name: string;
  startFrame: number;
  durationFrames: number;
  cameraPreset: CameraPresetType;
  primaryTargetId?: string;
  description?: string;
}

export interface CharacterInstance {
  id: string;
  name: string;
  assetId: string;
  initialPosition: Vector3Tuple;
  initialRotation: Rotation3Tuple;
  initialScale?: Vector3Tuple;
  colorOverrides?: Record<string, ColorRGB>;
}

export interface PropInstance {
  id: string;
  name: string;
  assetId: string;
  initialPosition: Vector3Tuple;
  initialRotation: Rotation3Tuple;
  initialScale?: Vector3Tuple;
  attachedToEntityId?: string;
  attachedAnchorId?: string;
}

export interface EnvironmentConfig {
  assetId: string;
  fogMode?: "none" | "exp" | "exp2" | "linear";
  fogDensity?: number;
  fogColor?: ColorRGB;
  clearColor?: ColorRGBA;
  sunlight?: {
    direction: Vector3Tuple;
    intensity: number;
    color: ColorRGB;
    shadowEnabled: boolean;
  };
  ambientLight?: {
    intensity: number;
    skyColor: ColorRGB;
    groundColor: ColorRGB;
  };
}

export interface Scene {
  id: string;
  name: string;
  environment: EnvironmentConfig;
  characters: CharacterInstance[];
  props: PropInstance[];
  tracks: TimelineTrack[];
  shots: Shot[];
}

export interface Episode {
  id: string;
  name: string;
  scenes: Scene[];
}

export type QualityPreset = "draft" | "preview" | "cinematic";

export interface ProjectSettings {
  title: string;
  fps: number;
  width: number;
  height: number;
  author?: string;
  qualityPreset?: QualityPreset;
}

export interface Project {
  schemaVersion: "1.0.0";
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  settings: ProjectSettings;
  assets: AssetManifest[];
  episodes: Episode[];
}

/**
 * AI-generated scene proposal schema.
 */
export interface AiScenePlan {
  title: string;
  synopsis: string;
  environmentAssetId: string;
  characters: {
    characterId: string;
    assetId: string;
    name: string;
    initialAnchorOrPosition: string | Vector3Tuple;
  }[];
  props?: {
    propId: string;
    assetId: string;
    name: string;
    position: Vector3Tuple;
  }[];
  shots: {
    shotId: string;
    name: string;
    durationFrames: number;
    cameraPreset: CameraPresetType;
    targetEntityId?: string;
    description: string;
    actions: {
      characterId: string;
      actionId: string;
      parameters?: Record<string, unknown>;
      targetAnchorId?: string;
      dialogue?: string;
    }[];
  }[];
}
