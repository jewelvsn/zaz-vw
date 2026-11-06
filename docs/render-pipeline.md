# Deterministic Render Pipeline & Offline Export

## Overview
Traditional screen recording suffers from GPU framerate dips, stuttering, and tab switching lags. The studio includes an offline deterministic frame stepper (`src/render/frameStepper.ts`) and video exporter (`src/render/videoExporter.ts`).

---

## Deterministic Frame Stepping Principle

Instead of relying on `performance.now()` or `engine.getDeltaTime()`:
```typescript
for (let f = startFrame; f <= endFrame; f++) {
  // 1. Evaluate exact kinematics, anchors, camera, and effects at frame f
  sceneTrackEvaluator.evaluateFrame(f, fps, domainScene, tracks, sceneBridge, camera);

  // 2. Synchronous render step
  sceneBridge.render();

  // 3. Process frame (capture to WebM / Canvas)
  await onFrameRendered(f, canvas);
}
```

Even if a complex 4K frame takes 400ms to render on an integrated GPU, the captured sequence plays back at a locked, buttery-smooth 30 or 60 FPS with zero dropped frames.

---

## Quality Tiers & Performance Tuning

1. **`draft`**:
   - `hardwareScalingLevel`: 1.33 (low fillrate cost)
   - Shadows: Disabled
   - Fog: Disabled
   - Ideal for low-spec laptops and rapid timeline scrubbing.
2. **`preview`**:
   - `hardwareScalingLevel`: 1.0 (native 1:1)
   - Shadows: Enabled on key vertical occluders with Poisson sampling
   - Fog: Exponential fog enabled
   - Balanced performance (60 FPS on integrated GPUs).
3. **`cinematic`**:
   - `hardwareScalingLevel`: $1.0 / \text{DPR}$ (retina super-sampling)
   - Shadows: 2048x2048 map, blurred exponential shadow mapping (BESM)
   - Dynamic soft transparent shadows and particle plumes.
