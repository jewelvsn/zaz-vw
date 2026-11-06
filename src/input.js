/**
 * Input manager for continuous keyboard control.
 */
class InputManager {
  constructor() {
    this.keys = new Set();
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("keydown", (e) => {
      // Prevent default page scrolling for space and arrow keys
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }
      this.keys.add(e.code);
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });

    // Reset pressed keys if window loses focus
    window.addEventListener("blur", () => {
      this.keys.clear();
    });
  }

  /**
   * Returns normalized input vector and vertical flight modifiers.
   *
   * @returns {{ rawX: number, rawY: number, rawZ: number, isRunning: boolean, isMoving: boolean, isAscending: boolean, isDescending: boolean }}
   */
  getMovementInput() {
    let rawX = 0;
    let rawY = 0;
    let rawZ = 0;

    // Forward / Backward
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) {
      rawZ += 1;
    }
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) {
      rawZ -= 1;
    }

    // Left / Right
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) {
      rawX -= 1;
    }
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) {
      rawX += 1;
    }

    // Flight Vertical: Space to Ascend, Q/Ctrl/C to Descend
    const isAscending = this.keys.has("Space");
    const isDescending =
      this.keys.has("KeyQ") ||
      this.keys.has("ControlLeft") ||
      this.keys.has("KeyZ");

    if (isAscending) rawY += 1;
    if (isDescending) rawY -= 1;

    const isRunning =
      this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const isMoving = rawX !== 0 || rawZ !== 0 || rawY !== 0;

    return {
      rawX,
      rawY,
      rawZ,
      isRunning,
      isMoving,
      isAscending,
      isDescending,
    };
  }
}

export const inputManager = new InputManager();
