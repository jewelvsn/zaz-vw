import * as BABYLON from "@babylonjs/core";

/**
 * Creates a water droplet splash particle system for the waterfall shower action.
 *
 * @param {BABYLON.Scene} scene
 * @param {BABYLON.TransformNode} emitterNode
 * @returns {BABYLON.ParticleSystem}
 */
export function createWaterSplashParticles(scene, emitterNode) {
  const dynamicTexture = new BABYLON.DynamicTexture(
    "dropletTexture",
    64,
    scene,
    false
  );
  const ctx = dynamicTexture.getContext();
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.4, "rgba(180, 230, 255, 0.85)");
  grad.addColorStop(0.8, "rgba(100, 200, 255, 0.4)");
  grad.addColorStop(1, "rgba(100, 200, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  dynamicTexture.update();

  const particleSystem = new BABYLON.ParticleSystem(
    "waterSplashParticles",
    300,
    scene
  );
  particleSystem.particleTexture = dynamicTexture;
  particleSystem.emitter = emitterNode;

  particleSystem.minEmitBox = new BABYLON.Vector3(-0.35, 0.2, -0.35);
  particleSystem.maxEmitBox = new BABYLON.Vector3(0.35, 1.2, 0.35);

  particleSystem.color1 = new BABYLON.Color4(0.85, 0.95, 1.0, 0.9);
  particleSystem.color2 = new BABYLON.Color4(0.5, 0.85, 1.0, 0.7);
  particleSystem.colorDead = new BABYLON.Color4(0.3, 0.6, 0.9, 0.0);

  particleSystem.minSize = 0.04;
  particleSystem.maxSize = 0.14;
  particleSystem.minLifeTime = 0.4;
  particleSystem.maxLifeTime = 0.8;
  particleSystem.emitRate = 120;

  particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
  particleSystem.direction1 = new BABYLON.Vector3(-0.8, 2.5, -0.8);
  particleSystem.direction2 = new BABYLON.Vector3(0.8, 4.0, 0.8);
  particleSystem.minEmitPower = 0.8;
  particleSystem.maxEmitPower = 2.2;
  particleSystem.updateSpeed = 0.015;
  particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  particleSystem.stop();

  return particleSystem;
}

/**
 * Creates Iron Man style boot thruster plasma jet particle system.
 *
 * @param {BABYLON.Scene} scene
 * @param {BABYLON.TransformNode} emitterNode
 * @returns {BABYLON.ParticleSystem}
 */
export function createThrusterParticles(scene, emitterNode) {
  const dynamicTexture = new BABYLON.DynamicTexture(
    "thrusterTexture",
    64,
    scene,
    false
  );
  const ctx = dynamicTexture.getContext();
  const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.25, "rgba(100, 240, 255, 0.95)");
  grad.addColorStop(0.65, "rgba(20, 150, 255, 0.6)");
  grad.addColorStop(1, "rgba(0, 100, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  dynamicTexture.update();

  const thrusters = new BABYLON.ParticleSystem("thrusterParticles", 450, scene);
  thrusters.particleTexture = dynamicTexture;
  thrusters.emitter = emitterNode;

  // Emit from both boot soles
  thrusters.minEmitBox = new BABYLON.Vector3(-0.25, 0.05, -0.15);
  thrusters.maxEmitBox = new BABYLON.Vector3(0.25, 0.15, 0.15);

  // Plasma colors: White-hot core transitioning to bright electric cyan
  thrusters.color1 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
  thrusters.color2 = new BABYLON.Color4(0.2, 0.85, 1.0, 0.85);
  thrusters.colorDead = new BABYLON.Color4(0.05, 0.4, 0.9, 0.0);

  thrusters.minSize = 0.06;
  thrusters.maxSize = 0.22;
  thrusters.minLifeTime = 0.15;
  thrusters.maxLifeTime = 0.35;
  thrusters.emitRate = 220;

  // High speed downward jet stream
  thrusters.direction1 = new BABYLON.Vector3(-0.1, -1.0, -0.1);
  thrusters.direction2 = new BABYLON.Vector3(0.1, -1.0, 0.1);
  thrusters.minEmitPower = 3.5;
  thrusters.maxEmitPower = 6.0;
  thrusters.updateSpeed = 0.02;

  thrusters.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  thrusters.stop();

  return thrusters;
}
