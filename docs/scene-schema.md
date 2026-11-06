# Scene Schema Specification (Draft 2020-12)

## Overview
All project data in the Cinematic Animation Studio is serialized according to JSON Schema Draft 2020-12 (`src/schema/v1.schema.json`).

The schema enforces strict validation through Zod 4 runtime validators (`src/schema/zod.ts`) and TypeScript types (`src/schema/types.ts`).

---

## Hierarchy

$$\text{Project} \longrightarrow \text{Episodes} \longrightarrow \text{Scenes} \longrightarrow \begin{cases} \text{EnvironmentConfig} \\ \text{Characters} \\ \text{Props} \\ \text{Shots} \\ \text{TimelineTracks} \longrightarrow \text{TimelineClips} \end{cases}$$

---

## Coordinate & Timing Conventions
1. **Coordinate System**: Left-handed Y-up (Babylon.js standard):
   - $+X$: Screen right / East
   - $+Y$: Upwards elevation
   - $+Z$: Forward depth / North
2. **Rotations**: Euler angles in radians `[pitchX, yawY, rollZ]`.
3. **Timing**: Integer frames ($0, 1, 2, \dots$) referenced to `project.settings.fps` (default: 30 FPS).
4. **Time in Seconds**: $t = \frac{\text{frame}}{\text{fps}}$.

---

## Core Entities

### Project
```json
{
  "schemaVersion": "1.0.0",
  "id": "proj_sanctuary_01",
  "title": "Sanctuary Cinematic Studio",
  "createdAt": "2026-11-07T04:00:00.000Z",
  "updatedAt": "2026-11-07T04:00:00.000Z",
  "settings": {
    "title": "Sanctuary Cinematic Studio",
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "qualityPreset": "preview"
  },
  "assets": [...],
  "episodes": [...]
}
```

### CharacterInstance
```json
{
  "id": "char_robot_main",
  "name": "Faceless Kids Robot",
  "assetId": "char_faceless_robot",
  "initialPosition": [0, 0, 1.8],
  "initialRotation": [0, 3.14159, 0],
  "initialScale": [0.45, 0.45, 0.45]
}
```

### Shot
```json
{
  "id": "shot_01",
  "name": "Opening Establishing Wide",
  "startFrame": 0,
  "durationFrames": 90,
  "cameraPreset": "establishing_wide",
  "primaryTargetId": "char_robot_main"
}
```

### TimelineTrack & TimelineClip
```json
{
  "id": "track_robot",
  "name": "Robot Action Track",
  "type": "character",
  "targetEntityId": "char_robot_main",
  "clips": [
    {
      "id": "clip_walk",
      "name": "Walk to Waterfall",
      "trackId": "track_robot",
      "startFrame": 0,
      "durationFrames": 90,
      "type": "action",
      "action": {
        "actionId": "walk_to",
        "targetAnchorId": "waterfall_shower_spot",
        "parameters": { "speed": 1.0 }
      }
    }
  ]
}
```
