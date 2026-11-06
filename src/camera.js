import * as BABYLON from "@babylonjs/core";

/**
 * Creates and configures a third-person ArcRotateCamera locked to the character.
 *
 * @param {BABYLON.Scene} scene
 * @param {HTMLCanvasElement} canvas
 * @param {BABYLON.TransformNode} characterRoot
 * @returns {BABYLON.ArcRotateCamera}
 */
export function setupCamera(scene, canvas, characterRoot) {
  // Initial third-person perspective behind character looking toward waterfall
  const alpha = Math.PI / 2;
  const beta = Math.PI / 2.7; // ~66 degrees elevated view
  const radius = 4.8;

  const camera = new BABYLON.ArcRotateCamera(
    "thirdPersonCamera",
    alpha,
    beta,
    radius,
    BABYLON.Vector3.Zero(),
    scene
  );

  // Target node positioned at character's chest (Y = 0.65m for scaled 1.4m character)
  if (characterRoot) {
    const cameraTarget = new BABYLON.TransformNode("cameraTarget", scene);
    cameraTarget.parent = characterRoot;
    cameraTarget.position.set(0, 0.65, 0);
    camera.lockedTarget = cameraTarget;
  }

  // Smooth camera tracking and orbit damping
  camera.inertia = 0.72;
  camera.angularSensibilityX = 1200;
  camera.angularSensibilityY = 1200;

  // Zoom distance limits for intimate jungle exploration
  camera.lowerRadiusLimit = 2.0;
  camera.upperRadiusLimit = 12.0;

  // Pitch constraints: avoid clipping below ground
  camera.lowerBetaLimit = 0.15;
  camera.upperBetaLimit = Math.PI / 2 - 0.08;

  // Smooth zoom response
  camera.wheelPrecision = 50;

  // Disable panning so mouse dragging solely orbits around the character
  camera.panningSensibility = 0;

  // Attach mouse and pointer input controls
  camera.attachControl(canvas, true);

  return camera;
}
