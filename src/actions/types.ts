import type { ActionCategory, Vector3Like } from "../schema/types";
import type { LimbRotations } from "../runtime/characterAdapter";

export interface ActionEvaluationContext {
  globalFrame: number;
  localFrame: number;
  durationFrames: number;
  fps: number;
  parameters: Record<string, unknown>;
  initialTransform: {
    position: Vector3Like;
    rotation: Vector3Like;
  };
  targetAnchorPosition?: Vector3Like | null;
  targetAnchorRotation?: Vector3Like | null;
}

export interface ActionPoseResult {
  position: Vector3Like;
  rotation: Vector3Like;
  visualTransform: {
    bounceY: number;
    pitchX: number;
    rollZ: number;
    scaleY: number;
    scaleX: number;
  };
  limbRotations: LimbRotations;
  effects?: {
    thrusters?: boolean;
    waterSplash?: boolean;
    chestGlow?: boolean;
  };
}

export interface ActionParameterSpec {
  name: string;
  type: "number" | "string" | "boolean" | "vec3" | "anchor" | "entity";
  label: string;
  description: string;
  defaultValue: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface ActionDefinition {
  actionId: string;
  displayName: string;
  category: ActionCategory;
  description: string;
  defaultDurationFrames: number;
  isLooping: boolean;
  capabilitiesRequired: string[];
  parameters: ActionParameterSpec[];
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult;
}
