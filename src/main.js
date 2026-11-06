import * as BABYLON from "@babylonjs/core";
import { createScene } from "./scene.js";
import { setupLights } from "./lights.js";

// Re-export core modular functions for convenience and testing
export { createScene, setupLights };

/**
 * Initializes and configures the Babylon.js 3D engine.
 *
 * @param {HTMLCanvasElement} canvas - Target render canvas
 * @returns {BABYLON.Engine}
 */
export function initEngine(canvas) {
  if (!canvas) {
    throw new Error("Cannot initialize Babylon.js engine: Canvas not found.");
  }

  const engine = new BABYLON.Engine(canvas, true, {
    antialias: true,
    adaptToDeviceRatio: true,
    preserveDrawingBuffer: true,
    stencil: true,
  });

  return engine;
}

/**
 * Main application bootstrap function.
 */
function main() {
  const canvas = document.getElementById("renderCanvas");
  if (!canvas) {
    console.error("Failed to find #renderCanvas element.");
    return;
  }

  // 1. Initialize Engine
  const engine = initEngine(canvas);

  // 2. Initialize Scene
  const scene = createScene(engine);

  // 3. Standard Render Loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // 4. Window Resize Event Listener & ResizeObserver
  window.addEventListener("resize", () => {
    engine.resize();
  });

  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
    });
    resizeObserver.observe(canvas);
  }
}

// Start application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
