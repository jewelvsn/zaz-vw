import type {
  ActionDefinition,
  ActionEvaluationContext,
  ActionPoseResult,
} from "./types";
import type { Vector3Like } from "../schema/types";

// Helper for linear interpolation between 3D vectors
function lerpVec3(a: Vector3Like, b: Vector3Like, t: number): Vector3Like {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    x: a.x + (b.x - a.x) * clamped,
    y: a.y + (b.y - a.y) * clamped,
    z: a.z + (b.z - a.z) * clamped,
  };
}

// Compute yaw rotation angle (in radians) facing from point A to point B
function yawFacing(from: Vector3Like, to: Vector3Like): number {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (Math.abs(dx) < 0.0001 && Math.abs(dz) < 0.0001) return 0;
  return Math.atan2(dx, dz);
}

// -------------------------------------------------------------
// 1. IDLE ACTION
// -------------------------------------------------------------
export const IdleAction: ActionDefinition = {
  actionId: "idle",
  displayName: "Idle Rest",
  category: "posture",
  description: "Natural breathing oscillation and relaxed resting posture",
  defaultDurationFrames: 90,
  isLooping: true,
  capabilitiesRequired: ["idle"],
  parameters: [],
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult {
    const t = context.localFrame / context.fps;
    const breathe = Math.sin(t * 3.0);
    return {
      position: { ...context.initialTransform.position },
      rotation: { ...context.initialTransform.rotation },
      visualTransform: {
        bounceY: 0,
        pitchX: 0,
        rollZ: 0,
        scaleY: 1.0 + breathe * 0.02,
        scaleX: 1.0 - breathe * 0.01,
      },
      limbRotations: {
        leftLegX: 0,
        rightLegX: 0,
        leftKneeX: 0,
        rightKneeX: 0,
        leftArmX: 0,
        rightArmX: 0,
        leftArmZ: -0.05,
        rightArmZ: 0.05,
        headX: 0,
        headY: 0,
        headZ: 0,
      },
    };
  },
};

// -------------------------------------------------------------
// 2. WALK TO ACTION
// -------------------------------------------------------------
export const WalkToAction: ActionDefinition = {
  actionId: "walk_to",
  displayName: "Walk To Target",
  category: "locomotion",
  description: "Bipedal human-like walking gait toward an anchor or destination",
  defaultDurationFrames: 90,
  isLooping: false,
  capabilitiesRequired: ["walk_to"],
  parameters: [
    {
      name: "speed",
      type: "number",
      label: "Walking Speed",
      description: "Movement speed multiplier",
      defaultValue: 1.0,
      min: 0.2,
      max: 2.5,
      step: 0.1,
    },
  ],
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult {
    const progress = Math.max(0, Math.min(1, context.localFrame / Math.max(1, context.durationFrames)));
    const t = context.localFrame / context.fps;
    const walkCadence = 9.5;
    const phi = t * walkCadence;

    let targetPos = context.initialTransform.position;
    let targetRot = { ...context.initialTransform.rotation };

    if (context.targetAnchorPosition) {
      targetPos = lerpVec3(context.initialTransform.position, context.targetAnchorPosition, progress);
      targetRot = {
        x: context.initialTransform.rotation.x,
        y: yawFacing(context.initialTransform.position, context.targetAnchorPosition),
        z: context.initialTransform.rotation.z,
      };
    }

    const bounceY = Math.abs(Math.sin(phi)) * 0.08;
    const pitchX = 0.06;
    const rollZ = Math.sin(phi * 0.5) * 0.03;

    const leftLegX = Math.sin(phi) * 0.55;
    const rightLegX = -Math.sin(phi) * 0.55;
    const leftKneeX = Math.max(0, -Math.sin(phi) * 0.65);
    const rightKneeX = Math.max(0, Math.sin(phi) * 0.65);

    const leftArmX = -Math.sin(phi) * 0.45;
    const rightArmX = Math.sin(phi) * 0.45;

    return {
      position: targetPos,
      rotation: targetRot,
      visualTransform: {
        bounceY,
        pitchX,
        rollZ,
        scaleY: 1.0,
        scaleX: 1.0,
      },
      limbRotations: {
        leftLegX,
        rightLegX,
        leftKneeX,
        rightKneeX,
        leftArmX,
        rightArmX,
        leftArmZ: -0.05,
        rightArmZ: 0.05,
        headX: 0,
        headY: 0,
        headZ: 0,
      },
    };
  },
};

// -------------------------------------------------------------
// 3. RUN TO ACTION
// -------------------------------------------------------------
export const RunToAction: ActionDefinition = {
  actionId: "run_to",
  displayName: "Run / Turbo Sprint",
  category: "locomotion",
  description: "High-cadence athletic sprint with deep forward lean and stride",
  defaultDurationFrames: 60,
  isLooping: false,
  capabilitiesRequired: ["run_to"],
  parameters: [
    {
      name: "speed",
      type: "number",
      label: "Speed",
      description: "Sprint speed tier",
      defaultValue: 1.5,
      min: 1.0,
      max: 3.0,
      step: 0.1,
    },
  ],
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult {
    const progress = Math.max(0, Math.min(1, context.localFrame / Math.max(1, context.durationFrames)));
    const t = context.localFrame / context.fps;
    const runCadence = 16.5;
    const phi = t * runCadence;

    let targetPos = context.initialTransform.position;
    let targetRot = { ...context.initialTransform.rotation };

    if (context.targetAnchorPosition) {
      targetPos = lerpVec3(context.initialTransform.position, context.targetAnchorPosition, progress);
      targetRot = {
        x: context.initialTransform.rotation.x,
        y: yawFacing(context.initialTransform.position, context.targetAnchorPosition),
        z: context.initialTransform.rotation.z,
      };
    }

    const bounceY = Math.abs(Math.sin(phi)) * 0.16;
    const pitchX = 0.16;
    const rollZ = Math.sin(phi * 0.5) * 0.06;

    const leftLegX = Math.sin(phi) * 0.85;
    const rightLegX = -Math.sin(phi) * 0.85;
    const leftKneeX = Math.max(0, -Math.sin(phi) * 1.1);
    const rightKneeX = Math.max(0, Math.sin(phi) * 1.1);

    const leftArmX = -Math.sin(phi) * 0.8;
    const rightArmX = Math.sin(phi) * 0.8;

    return {
      position: targetPos,
      rotation: targetRot,
      visualTransform: {
        bounceY,
        pitchX,
        rollZ,
        scaleY: 1.0,
        scaleX: 1.0,
      },
      limbRotations: {
        leftLegX,
        rightLegX,
        leftKneeX,
        rightKneeX,
        leftArmX,
        rightArmX,
        leftArmZ: -0.08,
        rightArmZ: 0.08,
        headX: 0,
        headY: 0,
        headZ: 0,
      },
    };
  },
};

// -------------------------------------------------------------
// 4. WAVE ACTION
// -------------------------------------------------------------
export const WaveAction: ActionDefinition = {
  actionId: "wave",
  displayName: "Friendly Wave",
  category: "gesture",
  description: "Friendly hand wave with smiling head tilt",
  defaultDurationFrames: 75,
  isLooping: false,
  capabilitiesRequired: ["wave"],
  parameters: [],
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult {
    const t = context.localFrame / context.fps;
    const waveProgress = Math.sin(t * 8.0);
    return {
      position: { ...context.initialTransform.position },
      rotation: { ...context.initialTransform.rotation },
      visualTransform: {
        bounceY: Math.sin(t * 4.0) * 0.02,
        pitchX: 0,
        rollZ: 0,
        scaleY: 1.0,
        scaleX: 1.0,
      },
      limbRotations: {
        leftLegX: 0,
        rightLegX: 0,
        leftKneeX: 0,
        rightKneeX: 0,
        leftArmX: 0,
        leftArmZ: -0.05,
        rightArmX: -0.3 + waveProgress * 0.15,
        rightArmZ: 1.15 + waveProgress * 0.1,
        headX: -0.05,
        headZ: Math.sin(t * 4.0) * 0.08,
      },
    };
  },
};

// -------------------------------------------------------------
// 5. SIT ON ACTION
// -------------------------------------------------------------
export const SitOnAction: ActionDefinition = {
  actionId: "sit_on",
  displayName: "Sit On Seat",
  category: "posture",
  description: "Sit on a chair, boulder, or bench anchor with relaxed seated posture",
  defaultDurationFrames: 90,
  isLooping: true,
  capabilitiesRequired: ["sit_on"],
  parameters: [],
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult {
    const pos = context.targetAnchorPosition || context.initialTransform.position;
    const rot = context.targetAnchorRotation || context.initialTransform.rotation;

    return {
      position: { ...pos },
      rotation: { ...rot },
      visualTransform: {
        bounceY: -0.32,
        pitchX: 0.04,
        rollZ: 0,
        scaleY: 1.0,
        scaleX: 1.0,
      },
      limbRotations: {
        leftLegX: -1.45,
        rightLegX: -1.45,
        leftKneeX: 1.45,
        rightKneeX: 1.45,
        leftArmX: 0.2,
        rightArmX: 0.2,
        leftArmZ: -0.15,
        rightArmZ: 0.15,
        headX: 0,
        headY: 0,
        headZ: 0,
      },
    };
  },
};

// -------------------------------------------------------------
// 6. CLIMB ACTION
// -------------------------------------------------------------
export const ClimbAction: ActionDefinition = {
  actionId: "climb",
  displayName: "Climb Tree",
  category: "interaction",
  description: "Climbs trunk from base anchor to high canopy branch perch",
  defaultDurationFrames: 120,
  isLooping: false,
  capabilitiesRequired: ["climb"],
  parameters: [],
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult {
    const progress = Math.max(0, Math.min(1, context.localFrame / Math.max(1, context.durationFrames)));
    const startPos = { x: -4.2, y: 0, z: -1.8 };
    const branchPos = { x: -4.1, y: 2.05, z: -1.4 };

    const pos = lerpVec3(startPos, branchPos, progress);
    const t = context.localFrame / context.fps;
    const climbFreq = t * 10.0;

    const leftArmX = -1.2 + Math.sin(climbFreq) * 0.4;
    const rightArmX = -1.2 - Math.sin(climbFreq) * 0.4;
    const leftLegX = -0.5 + Math.sin(climbFreq) * 0.3;
    const rightLegX = -0.5 - Math.sin(climbFreq) * 0.3;
    const leftKneeX = 0.8 + Math.max(0, -Math.sin(climbFreq) * 0.5);
    const rightKneeX = 0.8 + Math.max(0, Math.sin(climbFreq) * 0.5);

    return {
      position: pos,
      rotation: { x: 0, y: Math.PI / 4, z: 0 },
      visualTransform: {
        bounceY: Math.sin(climbFreq) * 0.04,
        pitchX: 0.1,
        rollZ: Math.sin(climbFreq * 0.5) * 0.05,
        scaleY: 1.0,
        scaleX: 1.0,
      },
      limbRotations: {
        leftLegX,
        rightLegX,
        leftKneeX,
        rightKneeX,
        leftArmX,
        rightArmX,
        leftArmZ: -0.2,
        rightArmZ: 0.2,
        headX: -0.3,
        headY: 0,
        headZ: 0,
      },
    };
  },
};

// -------------------------------------------------------------
// 7. TAKE SHOWER ACTION
// -------------------------------------------------------------
export const TakeShowerAction: ActionDefinition = {
  actionId: "take_shower",
  displayName: "Waterfall Shower",
  category: "interaction",
  description: "Stand under refreshing cascading waterfall stream with splashing droplets",
  defaultDurationFrames: 120,
  isLooping: true,
  capabilitiesRequired: ["take_shower"],
  parameters: [],
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult {
    const showerSpot: Vector3Like = { x: 0.35, y: 0.05, z: -2.55 };
    const t = context.localFrame / context.fps;

    return {
      position: showerSpot,
      rotation: { x: 0, y: 0.2, z: 0 },
      visualTransform: {
        bounceY: Math.sin(t * 3.0) * 0.03,
        pitchX: 0,
        rollZ: Math.sin(t * 2.5) * 0.06,
        scaleY: 1.0,
        scaleX: 1.0,
      },
      limbRotations: {
        leftLegX: 0,
        rightLegX: 0,
        leftKneeX: 0,
        rightKneeX: 0,
        leftArmX: -0.3,
        rightArmX: -0.3,
        leftArmZ: -0.4,
        rightArmZ: 0.4,
        headX: -0.25,
        headY: Math.sin(t * 1.5) * 0.1,
        headZ: 0,
      },
      effects: {
        waterSplash: true,
      },
    };
  },
};

// -------------------------------------------------------------
// 8. FLY ACTION (IRON MAN MODE)
// -------------------------------------------------------------
export const FlyAction: ActionDefinition = {
  actionId: "fly",
  displayName: "Iron Man Flight",
  category: "special",
  description: "Hover and fly through the air with boot thrusters and repulsor arm stabilization",
  defaultDurationFrames: 120,
  isLooping: true,
  capabilitiesRequired: ["fly"],
  parameters: [
    {
      name: "altitude",
      type: "number",
      label: "Hover Altitude",
      description: "Flight altitude above ground",
      defaultValue: 2.5,
      min: 1.2,
      max: 12.0,
      step: 0.5,
    },
  ],
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult {
    const t = context.localFrame / context.fps;
    const altitude = typeof context.parameters.altitude === "number" ? context.parameters.altitude : 2.5;

    const hoverPos: Vector3Like = {
      x: context.initialTransform.position.x,
      y: altitude + Math.sin(t * 3.0) * 0.12,
      z: context.initialTransform.position.z,
    };

    return {
      position: hoverPos,
      rotation: { ...context.initialTransform.rotation },
      visualTransform: {
        bounceY: 0,
        pitchX: 0.45, // Aerodynamic forward flight lean
        rollZ: Math.sin(t * 2.0) * 0.04,
        scaleY: 1.0,
        scaleX: 1.0,
      },
      limbRotations: {
        leftLegX: 0.2,
        rightLegX: 0.2,
        leftKneeX: 0,
        rightKneeX: 0,
        leftArmX: 0.45,
        rightArmX: 0.45,
        leftArmZ: -0.15,
        rightArmZ: 0.15,
        headX: -0.4, // Face oriented forward
        headY: 0,
        headZ: 0,
      },
      effects: {
        thrusters: true,
        chestGlow: true,
      },
    };
  },
};

// -------------------------------------------------------------
// 9. JUMP ACTION
// -------------------------------------------------------------
export const JumpAction: ActionDefinition = {
  actionId: "jump",
  displayName: "Athletic Jump",
  category: "locomotion",
  description: "Upward jump with squat anticipation, apex tuck, and landing squash",
  defaultDurationFrames: 45,
  isLooping: false,
  capabilitiesRequired: ["jump"],
  parameters: [],
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult {
    const p = Math.max(0, Math.min(1, context.localFrame / Math.max(1, context.durationFrames)));
    const jumpHeight = 1.6;
    const arc = Math.sin(p * Math.PI);
    const bounceY = arc * jumpHeight;

    const legTuck = arc * -0.7;
    const kneeBend = arc * 0.9;

    let scaleY = 1.0;
    let scaleX = 1.0;
    if (p < 0.2) {
      // Crouch before jump
      scaleY = 0.88;
      scaleX = 1.08;
    } else if (p > 0.8) {
      // Landing squash
      scaleY = 0.9;
      scaleX = 1.06;
    }

    return {
      position: { ...context.initialTransform.position },
      rotation: { ...context.initialTransform.rotation },
      visualTransform: {
        bounceY,
        pitchX: 0.05,
        rollZ: 0,
        scaleY,
        scaleX,
      },
      limbRotations: {
        leftLegX: legTuck,
        rightLegX: legTuck,
        leftKneeX: kneeBend,
        rightKneeX: kneeBend,
        leftArmX: -arc * 0.8,
        rightArmX: -arc * 0.8,
        leftArmZ: -0.2,
        rightArmZ: 0.2,
        headX: 0,
        headY: 0,
        headZ: 0,
      },
    };
  },
};

// -------------------------------------------------------------
// ACTION REGISTRY
// -------------------------------------------------------------
export class ActionRegistry {
  private actions = new Map<string, ActionDefinition>();

  constructor() {
    this.registerAction(IdleAction);
    this.registerAction(WalkToAction);
    this.registerAction(RunToAction);
    this.registerAction(WaveAction);
    this.registerAction(SitOnAction);
    this.registerAction(ClimbAction);
    this.registerAction(TakeShowerAction);
    this.registerAction(FlyAction);
    this.registerAction(JumpAction);
  }

  registerAction(action: ActionDefinition): void {
    this.actions.set(action.actionId, action);
  }

  getAction(id: string): ActionDefinition | undefined {
    return this.actions.get(id);
  }

  hasAction(id: string): boolean {
    return this.actions.has(id);
  }

  listActions(category?: ActionDefinition["category"]): ActionDefinition[] {
    const list = Array.from(this.actions.values());
    if (category) {
      return list.filter((a) => a.category === category);
    }
    return list;
  }

  getActionsForCapabilities(capabilities: string[]): ActionDefinition[] {
    const capSet = new Set(capabilities);
    return Array.from(this.actions.values()).filter((act) =>
      act.capabilitiesRequired.every((c) => capSet.has(c))
    );
  }
}

export const actionRegistry = new ActionRegistry();
