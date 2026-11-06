import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { setupLights } from "./lights.js";
import { setupShadows } from "./shadows.js";
import { setupCharacter } from "./character.js";
import { setupCamera } from "./camera.js";
import { LocomotionController } from "./locomotion.js";
import { ProceduralAnimationEngine } from "./animation.js";
import { ActionManager } from "./actions.js";
import { inputManager } from "./input.js";
import { DebugHud } from "./hud.js";

/**
 * Creates and initializes the 3D Jungle Waterfall Sanctuary playground scene with interactive actions.
 *
 * @param {BABYLON.Engine} engine
 * @returns {BABYLON.Scene}
 */
export function createScene(engine) {
  const scene = new BABYLON.Scene(engine);

  // Background clear color: Tropical rainforest mist
  scene.clearColor = new BABYLON.Color4(14 / 255, 30 / 255, 32 / 255, 1.0);

  // Atmospheric background fog matching rainforest mist
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.016;
  scene.fogColor = new BABYLON.Color3(14 / 255, 30 / 255, 32 / 255);

  // 1. Tropical Sunlight & Soft Dynamic Shadows
  const { directionalLight } = setupLights(scene);
  const shadowGenerator = setupShadows(directionalLight);

  // 2. 3D Character Rig (Faceless Kids Robot)
  const character = setupCharacter(scene, shadowGenerator);

  // 3. Third-Person Follow Camera
  const canvas = engine.getRenderingCanvas();
  const camera = setupCamera(scene, canvas, character.root);

  // 4. Load 3D Jungle Waterfall Sanctuary Environment
  setupJungleEnvironment(scene, shadowGenerator);

  // 5. Locomotion Controller, Action Manager & Procedural Animation Engine
  const locomotion = new LocomotionController(character.root, camera, scene);
  const actionManager = new ActionManager(character, scene, locomotion);
  const animation = new ProceduralAnimationEngine(character);
  const hud = new DebugHud();

  // 6. Frame-rate Independent Update Loop
  scene.onBeforeRenderObservable.add(() => {
    // Delta time in seconds (clamped to prevent physics jumps after background tab freeze)
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.1);

    const input = inputManager.getMovementInput();
    const isTurboActive = actionManager.isTurboActive;
    const isFlightActive = actionManager.isFlightActive;

    // Update Action Manager (climbs tree, triggers waterfall shower, particles, etc.)
    actionManager.update(dt, input.isMoving);
    const activeAction = actionManager.getActiveAction();

    // While performing stationary special actions (sit, dance, shower, tree perch), pause standard locomotion
    const isStationaryAction = [
      "CLIMB_TREE",
      "SHOWER",
      "DANCE",
      "SIT",
    ].includes(activeAction);

    if (!isStationaryAction) {
      locomotion.update(dt, isTurboActive, isFlightActive);
    }

    const telemetry = locomotion.getTelemetry();

    // Drive procedural animation curves (including flight jet banking)
    animation.update(
      dt,
      telemetry.state,
      telemetry.speed,
      activeAction,
      telemetry.turnDiff
    );

    // Update Debug HUD readings
    hud.update(telemetry.state, telemetry.speed, activeAction);
  });

  return scene;
}

/**
 * Loads the Jungle Waterfall HQ environment and configures shadow reception and water animation.
 *
 * @param {BABYLON.Scene} scene
 * @param {BABYLON.ShadowGenerator} shadowGenerator
 */
function setupJungleEnvironment(scene, shadowGenerator) {
  BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "/",
    "jungle_waterfall_hq.glb",
    scene
  )
    .then((result) => {
      console.log("Jungle Waterfall Sanctuary loaded successfully!");

      const waterElements = [];

      result.meshes.forEach((mesh) => {
        // All ground, terrain, rocks, and foliage receive shadows
        mesh.receiveShadows = true;

        if (mesh.name !== "__root__") {
          // Add primary vertical occluders as shadow casters for rich canopy shadow play
          if (/cliff|stone|rock|trunk|tree|banana|shrub/i.test(mesh.name)) {
            if (shadowGenerator) {
              shadowGenerator.addShadowCaster(mesh, false);
            }
          }

          // Identify water elements for animated shimmer
          if (/waterfall|falling water|foam|lagoon|plunge pool/i.test(mesh.name)) {
            waterElements.push(mesh);
          }
        }
      });

      // Subtle procedural animation for waterfall foam and strands
      if (waterElements.length > 0) {
        scene.onBeforeRenderObservable.add(() => {
          const t = performance.now() * 0.004;
          waterElements.forEach((wm, i) => {
            if (wm.name.includes("foam")) {
              const scale = 1.0 + Math.sin(t * 2 + i) * 0.05;
              wm.scaling.set(scale, scale, scale);
            }
          });
        });
      }
    })
    .catch((err) => {
      console.error("Failed to load jungle_waterfall_hq.glb:", err);
    });
}
