import * as BABYLON from "@babylonjs/core";

/**
 * Sets up tropical sunlight and lush rainforest ambient fill for the jungle waterfall.
 *
 * @param {BABYLON.Scene} scene
 * @returns {{ directionalLight: BABYLON.DirectionalLight, hemisphericLight: BABYLON.HemisphericLight }}
 */
export function setupLights(scene) {
  // Tropical sunlight streaming down through the rainforest canopy
  const sunDirection = new BABYLON.Vector3(-0.6, -1.2, 0.5).normalize();
  const directionalLight = new BABYLON.DirectionalLight(
    "sunLight",
    sunDirection,
    scene
  );

  // Position source in world space above the sanctuary
  directionalLight.position = new BABYLON.Vector3(12, 25, 12);
  directionalLight.intensity = 1.45;
  directionalLight.diffuse = new BABYLON.Color3(1.0, 0.97, 0.90); // Warm golden tropical sun
  directionalLight.specular = new BABYLON.Color3(0.7, 0.7, 0.7);

  // Automatically calculate shadow frustum bounds for active meshes
  directionalLight.autoCalcShadowZBounds = true;
  directionalLight.autoUpdateExtends = true;

  // Soft HemisphericLight for ambient jungle illumination
  const hemisphericLight = new BABYLON.HemisphericLight(
    "ambientFillLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  hemisphericLight.intensity = 0.55;
  hemisphericLight.diffuse = new BABYLON.Color3(0.85, 0.95, 1.0); // Tropical sky fill
  hemisphericLight.groundColor = new BABYLON.Color3(0.12, 0.24, 0.16); // Forest moss green bounce

  return { directionalLight, hemisphericLight };
}
