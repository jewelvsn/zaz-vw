# Migration & Backwards Compatibility Guide

## Overview
The studio preserves full compatibility with legacy character models (`faceless_kids_robot.glb`), sanctuary environments (`jungle_waterfall_hq.glb`), and previous camera positions.

---

## Automatic Schema Migration
The persistence serializer (`src/persistence/serializer.ts`) automatically detects legacy JSON files lacking `schemaVersion: "1.0.0"` and runs `ProjectSerializer.migrateLegacy(raw)`:
- Legacy character coordinates `characterPosition: [x, y, z]` are mapped to `initialPosition`.
- Legacy camera settings are translated to corresponding camera shot presets (`medium`, `establishing_wide`).
- Empty tracks are populated with default `idle` actions.
- Output is validated against JSON Schema Draft 2020-12.

---

## Preservation of Procedural Gaits & Stunts
All original procedural kinematics and interactive stunts are retained and upgraded to deterministic evaluation:
- **Bipedal Gait**: Hip pivot swinging, knee flexion, counter-balancing arms, stride pitch lean, and footstep bounce.
- **Iron Man Flight**: Vertical liftoff, hover altitude floating, aerodynamic pitch lean, repulsor arm stabilization, thruster particles, and arc reactor glow.
- **Tree Climbing**: Transition from base anchor to canopy branch perch.
- **Waterfall Shower**: Splashing droplet dance under the cascading waterfall stream.
- **Sitting & Resting**: Anatomically aligned hip lowering and knee bending on the mossy boulder seat anchor.
