/**
 * Controller for the HTML Debug HUD overlay and Action indicators.
 */
export class DebugHud {
  constructor() {
    this.stateEl = document.getElementById("hudState");
    this.speedEl = document.getElementById("hudSpeed");
  }

  /**
   * Updates HUD telemetry readings.
   *
   * @param {string} state - IDLE | WALK | RUN | TURBO
   * @param {number} speed - Current velocity in units/second
   * @param {string} [activeAction="NONE"] - Special active action
   */
  update(state, speed, activeAction = "NONE") {
    if (!this.stateEl || !this.speedEl) return;

    let displayState = "IDLE";
    let stateClass = "idle";

    if (activeAction === "FLIGHT" || state === "FLIGHT") {
      displayState = "IRON MAN FLIGHT";
      stateClass = "flight";
    } else if (activeAction === "CLIMB_TREE") {
      displayState = "CLIMBING TREE";
      stateClass = "climb";
    } else if (activeAction === "SHOWER") {
      displayState = "WATERFALL SHOWER";
      stateClass = "shower";
    } else if (activeAction === "DANCE") {
      displayState = "HAPPY DANCE";
      stateClass = "dance";
    } else if (activeAction === "SIT") {
      displayState = "RELAXING";
      stateClass = "sit";
    } else if (state === "TURBO" || activeAction === "TURBO") {
      displayState = "TURBO DASH";
      stateClass = "turbo";
    } else if (state === "WALK") {
      displayState = "WALKING";
      stateClass = "walk";
    } else if (state === "RUN") {
      displayState = "RUNNING";
      stateClass = "run";
    }

    if (this.stateEl.textContent !== displayState) {
      this.stateEl.textContent = displayState;
      this.stateEl.className = `hud-badge ${stateClass}`;
    }

    this.speedEl.textContent = `${speed.toFixed(1)} m/s`;
  }
}
