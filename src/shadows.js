import * as BABYLON from "@babylonjs/core";

/**
 * Creates and configures a dynamic shadow generator using exponential shadow mapping.
 *
 * @param {BABYLON.DirectionalLight} directionalLight
 * @param {object} [options]
 * @param {number} [options.mapSize=2048]
 * @param {boolean} [options.useBlurExponential=true]
 * @returns {BABYLON.ShadowGenerator}
 */
export function setupShadows(directionalLight, options = {}) {
  const { mapSize = 2048, useBlurExponential = true } = options;

  const shadowGenerator = new BABYLON.ShadowGenerator(
    mapSize,
    directionalLight
  );

  if (useBlurExponential) {
    // Soft blurred exponential shadow map for smooth penumbra
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.blurScale = 2;
    shadowGenerator.depthScale = 50.0;
  } else {
    shadowGenerator.usePoissonSampling = true;
  }

  // Enable transparent/alpha cutout shadow casting
  shadowGenerator.enableSoftTransparentShadow = true;
  shadowGenerator.transparencyShadow = true;

  // Optimize shadow bias to eliminate acne and light leaking
  shadowGenerator.bias = 0.0008;
  shadowGenerator.normalBias = 0.01;
  shadowGenerator.darkness = 0.8;

  return shadowGenerator;
}
