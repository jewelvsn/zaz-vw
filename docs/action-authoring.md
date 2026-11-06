# Action Authoring Guide

## Overview
Actions in the Cinematic Animation Studio are modular, deterministic procedural animation generators registered in `src/actions/registry.ts`.

Every action implements the `ActionDefinition` interface from `src/actions/types.ts`:
- `actionId`: Unique identifier (e.g. `"fly"`, `"climb"`, `"sit_on"`).
- `displayName`: Human-readable label in the UI palette.
- `category`: `"locomotion"` | `"gesture"` | `"posture"` | `"interaction"` | `"special"`.
- `capabilitiesRequired`: Array of capabilities actor must possess to execute action.
- `defaultDurationFrames`: Default clip length when inserted.
- `parameters`: Customizable knobs (speed, altitude, etc.).
- `evaluatePose(context)`: Pure evaluation function returning `ActionPoseResult`.

---

## Authoring an Action Example

```typescript
import type { ActionDefinition, ActionEvaluationContext, ActionPoseResult } from "./types";

export const MoonwalkAction: ActionDefinition = {
  actionId: "moonwalk",
  displayName: "Moonwalk Slide",
  category: "locomotion",
  description: "Smooth reverse gliding slide with alternating foot flexions",
  defaultDurationFrames: 90,
  isLooping: true,
  capabilitiesRequired: ["walk_to"],
  parameters: [
    {
      name: "slideDistance",
      type: "number",
      label: "Slide Distance",
      description: "Backward distance in meters",
      defaultValue: 3.0,
      min: 1.0,
      max: 6.0,
    },
  ],
  evaluatePose(context: ActionEvaluationContext): ActionPoseResult {
    const progress = context.localFrame / context.durationFrames;
    const t = context.localFrame / context.fps;
    const cadence = 10.0;
    const phi = t * cadence;

    // Slide backwards along current heading
    const dist = (typeof context.parameters.slideDistance === "number" ? context.parameters.slideDistance : 3.0) * progress;
    const position = {
      x: context.initialTransform.position.x,
      y: context.initialTransform.position.y,
      z: context.initialTransform.position.z - dist,
    };

    return {
      position,
      rotation: { ...context.initialTransform.rotation },
      visualTransform: {
        bounceY: Math.abs(Math.sin(phi)) * 0.03,
        pitchX: -0.05, // Slight cool backward lean
        rollZ: 0,
        scaleY: 1.0,
        scaleX: 1.0,
      },
      limbRotations: {
        leftLegX: Math.sin(phi) * 0.5,
        rightLegX: -Math.sin(phi) * 0.5,
        leftKneeX: Math.max(0, Math.sin(phi) * 0.8),
        rightKneeX: Math.max(0, -Math.sin(phi) * 0.8),
        leftArmX: -Math.sin(phi) * 0.3,
        rightArmX: Math.sin(phi) * 0.3,
        headX: 0.1,
      },
    };
  },
};
```

---

## Registering the Action
In `src/actions/registry.ts`:
```typescript
actionRegistry.registerAction(MoonwalkAction);
```
Once registered, the action automatically appears in the Studio action palette, can be chosen in timeline clips, and is understood by the AI scene planner!
