import * as BABYLON from "@babylonjs/core";
import {
  createWaterSplashParticles,
  createThrusterParticles,
} from "./particles.js";

export const ACTION_NONE = "NONE";
export const ACTION_CLIMB_TREE = "CLIMB_TREE";
export const ACTION_SHOWER = "SHOWER";
export const ACTION_TURBO = "TURBO";
export const ACTION_DANCE = "DANCE";
export const ACTION_SIT = "SIT";
export const ACTION_FLIGHT = "FLIGHT";

/**
 * Manages special contextual actions: Climbing Trees, Waterfall Showers, Turbo Sprint, Dancing, Sitting, and Iron Man Flight.
 */
export class ActionManager {
  /**
   * @param {object} characterRig
   * @param {BABYLON.Scene} scene
   * @param {object} locomotionController
   */
  constructor(characterRig, scene, locomotionController) {
    this.rig = characterRig;
    this.scene = scene;
    this.locomotion = locomotionController;

    this.currentAction = ACTION_NONE;
    this.actionTime = 0;

    // Landmark coordinates
    this.treeBasePos = new BABYLON.Vector3(-4.2, 0, -1.8);
    this.treeBranchPos = new BABYLON.Vector3(-4.1, 2.05, -1.4);
    this.waterfallPos = new BABYLON.Vector3(0.35, 0.05, -2.55);

    // Tree climb progression
    this.climbProgress = 0;
    this.isPerchedOnBranch = false;

    // Water splash particles for waterfall shower
    this.splashParticles = createWaterSplashParticles(scene, this.rig.root);

    // Iron Man boot thruster plasma particles
    this.thrusterParticles = createThrusterParticles(scene, this.rig.root);

    // Turbo & Flight flags
    this.isTurboActive = false;
    this.isFlightActive = false;

    // Cache chest light mesh for Arc Reactor glow
    this.chestLightMesh = null;
    this.chestLightMat = null;

    this.setupKeyListeners();
    this.setupUIListeners();
  }

  /**
   * Listens for keyboard shortcuts:
   * 1 / C: Climb Tree
   * 2 / E: Shower in Waterfall
   * 3 / R: Turbo Run
   * 4 / V: Happy Dance
   * 5 / X: Sit & Relax
   * 6 / F: Iron Man Flight Mode
   */
  setupKeyListeners() {
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Digit1" || e.code === "KeyC") {
        this.toggleClimbTree();
      } else if (e.code === "Digit2" || e.code === "KeyE") {
        this.toggleShower();
      } else if (e.code === "Digit3" || e.code === "KeyR") {
        this.toggleTurbo();
      } else if (e.code === "Digit4" || e.code === "KeyV") {
        this.toggleDance();
      } else if (e.code === "Digit5" || e.code === "KeyX") {
        this.toggleSit();
      } else if (e.code === "Digit6" || e.code === "KeyF") {
        this.toggleFlight();
      }
    });
  }

  setupUIListeners() {
    const btnClimb = document.getElementById("btnActClimb");
    const btnShower = document.getElementById("btnActShower");
    const btnTurbo = document.getElementById("btnActTurbo");
    const btnDance = document.getElementById("btnActDance");
    const btnSit = document.getElementById("btnActSit");
    const btnFlight = document.getElementById("btnActFlight");

    if (btnClimb) btnClimb.addEventListener("click", () => this.toggleClimbTree());
    if (btnShower) btnShower.addEventListener("click", () => this.toggleShower());
    if (btnTurbo) btnTurbo.addEventListener("click", () => this.toggleTurbo());
    if (btnDance) btnDance.addEventListener("click", () => this.toggleDance());
    if (btnSit) btnSit.addEventListener("click", () => this.toggleSit());
    if (btnFlight) btnFlight.addEventListener("click", () => this.toggleFlight());
  }

  toggleFlight() {
    if (this.isFlightActive) {
      // Land
      this.isFlightActive = false;
      this.thrusterParticles.stop();
      this.cancelAction();
      this.rig.root.position.y = 0;
    } else {
      this.isFlightActive = true;
      this.setAction(ACTION_FLIGHT);
      // Lift off ground to initial hover altitude
      if (this.rig.root.position.y < 1.5) {
        this.rig.root.position.y = 2.2;
      }
      this.thrusterParticles.start();
      this.updateChestGlow(true);
    }
    this.updateUIButtons();
  }

  toggleClimbTree() {
    if (this.currentAction === ACTION_CLIMB_TREE) {
      this.cancelAction();
      this.rig.root.position.set(-3.8, 0, -1.2);
    } else {
      this.setAction(ACTION_CLIMB_TREE);
      this.climbProgress = 0;
      this.isPerchedOnBranch = false;
    }
  }

  toggleShower() {
    if (this.currentAction === ACTION_SHOWER) {
      this.cancelAction();
    } else {
      this.setAction(ACTION_SHOWER);
      this.rig.root.position.copyFrom(this.waterfallPos);
      this.rig.root.rotation.y = 0.2;
      this.splashParticles.start();
    }
  }

  toggleTurbo() {
    this.isTurboActive = !this.isTurboActive;
    if (this.isTurboActive) {
      this.currentAction = ACTION_TURBO;
      this.locomotion.targetSpeed = 10.5;
    } else {
      this.currentAction = ACTION_NONE;
      this.locomotion.targetSpeed = 0;
    }
    this.updateChestGlow(this.isTurboActive);
    this.updateUIButtons();
  }

  toggleDance() {
    if (this.currentAction === ACTION_DANCE) {
      this.cancelAction();
    } else {
      this.setAction(ACTION_DANCE);
    }
  }

  toggleSit() {
    if (this.currentAction === ACTION_SIT) {
      this.cancelAction();
    } else {
      this.setAction(ACTION_SIT);
    }
  }

  setAction(action) {
    if (this.currentAction === ACTION_SHOWER && action !== ACTION_SHOWER) {
      this.splashParticles.stop();
    }
    if (this.currentAction === ACTION_FLIGHT && action !== ACTION_FLIGHT) {
      this.isFlightActive = false;
      this.thrusterParticles.stop();
      this.rig.root.position.y = 0;
    }
    if (this.currentAction === ACTION_TURBO && action !== ACTION_TURBO) {
      this.isTurboActive = false;
      this.updateChestGlow(false);
    }

    this.currentAction = action;
    this.actionTime = 0;
    this.updateUIButtons();
  }

  cancelAction() {
    if (this.currentAction === ACTION_SHOWER) {
      this.splashParticles.stop();
    }
    if (this.isFlightActive) {
      this.isFlightActive = false;
      this.thrusterParticles.stop();
      this.rig.root.position.y = 0;
    }
    if (this.isTurboActive) {
      this.isTurboActive = false;
      this.updateChestGlow(false);
    }
    this.currentAction = ACTION_NONE;
    this.isPerchedOnBranch = false;
    this.actionTime = 0;
    this.updateUIButtons();
  }

  /**
   * Updates current action state each frame.
   *
   * @param {number} deltaTime
   * @param {boolean} isMoving - Whether movement keys are pressed
   */
  update(deltaTime, isMoving) {
    if (deltaTime <= 0) return;

    // Movement key input breaks out of stationary actions (sit, dance, shower, tree perch)
    if (
      isMoving &&
      [ACTION_DANCE, ACTION_SIT, ACTION_SHOWER, ACTION_CLIMB_TREE].includes(
        this.currentAction
      )
    ) {
      if (this.currentAction === ACTION_CLIMB_TREE && this.isPerchedOnBranch) {
        this.rig.root.position.set(-3.8, 0, -1.2);
      }
      this.cancelAction();
      return;
    }

    this.actionTime += deltaTime;

    // Update thruster particle rate based on flight speed
    if (this.isFlightActive) {
      const isBoosting = this.locomotion.currentSpeed > 8.0;
      this.thrusterParticles.emitRate = isBoosting ? 450 : 220;
      this.thrusterParticles.minEmitPower = isBoosting ? 5.5 : 3.5;
      this.thrusterParticles.maxEmitPower = isBoosting ? 9.0 : 6.0;
    }

    // Handle Tree Climbing Interpolation
    if (this.currentAction === ACTION_CLIMB_TREE && !this.isPerchedOnBranch) {
      this.climbProgress = Math.min(1.0, this.climbProgress + deltaTime * 0.7);

      const curX = BABYLON.Scalar.Lerp(
        this.treeBasePos.x,
        this.treeBranchPos.x,
        this.climbProgress
      );
      const curY = BABYLON.Scalar.Lerp(
        0,
        this.treeBranchPos.y,
        this.climbProgress
      );
      const curZ = BABYLON.Scalar.Lerp(
        this.treeBasePos.z,
        this.treeBranchPos.z,
        this.climbProgress
      );

      this.rig.root.position.set(curX, curY, curZ);
      this.rig.root.rotation.y = Math.PI / 4;

      if (this.climbProgress >= 1.0) {
        this.isPerchedOnBranch = true;
        this.rig.root.rotation.y = Math.PI / 1.3;
      }
    }
  }

  updateChestGlow(enable) {
    if (!this.chestLightMesh) {
      this.chestLightMesh = this.scene.getMeshByName("Round blue chest light");
      if (this.chestLightMesh) {
        this.chestLightMat = this.chestLightMesh.material;
      }
    }

    if (this.chestLightMat) {
      if (enable) {
        this.chestLightMat.emissiveColor = new BABYLON.Color3(0.2, 0.85, 1.0);
      } else {
        this.chestLightMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
      }
    }
  }

  updateUIButtons() {
    const mapping = {
      btnActClimb: ACTION_CLIMB_TREE,
      btnActShower: ACTION_SHOWER,
      btnActTurbo: ACTION_TURBO,
      btnActDance: ACTION_DANCE,
      btnActSit: ACTION_SIT,
      btnActFlight: ACTION_FLIGHT,
    };

    Object.entries(mapping).forEach(([id, act]) => {
      const el = document.getElementById(id);
      if (el) {
        if (this.currentAction === act) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      }
    });
  }

  getActiveAction() {
    return this.currentAction;
  }
}
