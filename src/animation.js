import * as BABYLON from "@babylonjs/core";
import {
  STATE_IDLE,
  STATE_WALK,
  STATE_RUN,
  STATE_TURBO,
  STATE_FLIGHT,
  WALK_SPEED,
  RUN_SPEED,
  TURBO_SPEED,
} from "./locomotion.js";
import {
  ACTION_NONE,
  ACTION_CLIMB_TREE,
  ACTION_SHOWER,
  ACTION_DANCE,
  ACTION_SIT,
  ACTION_FLIGHT,
} from "./actions.js";

/**
 * Procedural animation engine driving:
 * - Bipedal walking, running, and turbo sprint
 * - Iron Man 3D Flight (Hover, Aerodynamic Pitch, Jet Banking, Repulsor Arms)
 * - Tree climbing and branch perching
 * - Waterfall shower & water splash dance
 * - Groovy robot celebratory dance
 * - Calm seated rest
 */
export class ProceduralAnimationEngine {
  /**
   * @param {object} characterRig - Rig object from setupCharacter
   */
  constructor(characterRig) {
    this.rig = characterRig;

    // Animation clocks
    this.idleTime = 0;
    this.strideTime = 0;

    // Output channels
    this.currentBounceY = 0;
    this.currentPitchX = 0;
    this.currentRollZ = 0;
    this.currentScaleY = 1;
    this.currentScaleX = 1;

    // Limb rotation channels
    this.leftLegX = 0;
    this.rightLegX = 0;
    this.leftKneeX = 0;
    this.rightKneeX = 0;
    this.leftArmX = 0;
    this.rightArmX = 0;
    this.leftArmZ = 0;
    this.rightArmZ = 0;
    this.headX = 0;
    this.headY = 0;
    this.headZ = 0;

    // Cadence speeds
    this.walkCadence = 9.5;
    this.runCadence = 16.5;
    this.turboCadence = 24.0;
  }

  /**
   * Updates procedural animation curves and drives the articulated 3D character rig.
   *
   * @param {number} deltaTime - Frame elapsed time in seconds
   * @param {string} state - Active locomotion state (IDLE | WALK | RUN | TURBO | FLIGHT)
   * @param {number} speed - Current movement speed
   * @param {string} activeAction - Special action (NONE | CLIMB_TREE | SHOWER | DANCE | SIT | FLIGHT)
   * @param {number} [turnDiff=0] - Turn difference for flight banking
   */
  update(deltaTime, state, speed, activeAction = ACTION_NONE, turnDiff = 0) {
    if (deltaTime <= 0) return;

    let targetBounceY = 0;
    let targetPitchX = 0;
    let targetRollZ = 0;
    let targetScaleY = 1.0;
    let targetScaleX = 1.0;

    let targetLeftLegX = 0;
    let targetRightLegX = 0;
    let targetLeftKneeX = 0;
    let targetRightKneeX = 0;
    let targetLeftArmX = 0;
    let targetRightArmX = 0;
    let targetLeftArmZ = -0.05;
    let targetRightArmZ = 0.05;
    let targetHeadX = 0;
    let targetHeadY = 0;
    let targetHeadZ = 0;

    // ================= IRON MAN FLIGHT MODE =================
    if (activeAction === ACTION_FLIGHT || state === STATE_FLIGHT) {
      this.idleTime += deltaTime * 5.0;

      if (speed < 0.2) {
        // --- HOVER IN PLACE ---
        targetBounceY = Math.sin(this.idleTime) * 0.05; // Thruster vertical float

        // Legs straight down with subtle stabilizer angle
        targetLeftLegX = 0.12;
        targetRightLegX = 0.12;
        targetLeftKneeX = -0.15;
        targetRightKneeX = -0.15;

        // Repulsor stabilizer arms angled out and slightly back
        targetLeftArmX = 0.25;
        targetRightArmX = 0.25;
        targetLeftArmZ = -0.32;
        targetRightArmZ = 0.32;

        targetHeadX = -0.05;
        targetPitchX = 0.08;
      } else {
        // --- HIGH SPEED IRON MAN FLIGHT ---
        const isBoost = speed > 8.0;

        // Aerodynamic horizontal flight posture (~77° to 86° pitch lean)
        targetPitchX = isBoost ? 1.5 : 1.35;

        // Jet Banking into turns
        const clampedBank = BABYLON.Scalar.Clamp(turnDiff * 0.7, -0.65, 0.65);
        targetRollZ = -clampedBank;

        // Legs straight together trailing behind
        targetLeftLegX = 0.05;
        targetRightLegX = 0.05;
        targetLeftKneeX = -0.08;
        targetRightKneeX = -0.08;

        // Arms stretched back along the torso in classic Iron Man flight pose
        targetLeftArmX = 1.35;
        targetRightArmX = 1.35;
        targetLeftArmZ = -0.12;
        targetRightArmZ = 0.12;

        // Head tilted up to look forward while body is horizontal
        targetHeadX = -1.2;

        // Aerodynamic compression
        targetScaleX = 0.95;
        targetScaleY = 1.05;
      }
    } else if (activeAction === ACTION_CLIMB_TREE) {
      // ================= CLIMB TREE =================
      this.idleTime += deltaTime * 4.0;

      targetLeftLegX = -1.35;
      targetRightLegX = -1.35;

      const footSwing = Math.sin(this.idleTime * 0.8) * 0.25;
      targetLeftKneeX = -1.45 + footSwing;
      targetRightKneeX = -1.45 - footSwing;

      targetLeftArmX = -0.7;
      targetRightArmX = -0.7;
      targetLeftArmZ = -0.15;
      targetRightArmZ = 0.15;

      targetHeadY = Math.sin(this.idleTime * 0.4) * 0.3;
      targetHeadX = -0.1;
    } else if (activeAction === ACTION_SHOWER) {
      // ================= WATERFALL SHOWER =================
      this.idleTime += deltaTime * 4.0;

      targetLeftArmX = -2.3 + Math.sin(this.idleTime) * 0.15;
      targetRightArmX = -2.3 - Math.sin(this.idleTime) * 0.15;
      targetLeftArmZ = -0.35;
      targetRightArmZ = 0.35;

      targetHeadX = -0.45;
      targetHeadZ = Math.sin(this.idleTime * 2.0) * 0.18;

      targetBounceY = 0.04 + Math.abs(Math.sin(this.idleTime * 1.5)) * 0.08;

      targetLeftLegX = 0.1;
      targetRightLegX = -0.1;
    } else if (activeAction === ACTION_DANCE) {
      // ================= HAPPY DANCE =================
      this.idleTime += deltaTime * 7.0;

      targetRollZ = Math.sin(this.idleTime) * 0.16;
      targetBounceY = Math.abs(Math.sin(this.idleTime)) * 0.15;

      targetLeftArmX = -1.4 + Math.sin(this.idleTime) * 0.85;
      targetRightArmX = -1.4 - Math.sin(this.idleTime) * 0.85;
      targetLeftArmZ = -0.3 + Math.cos(this.idleTime) * 0.25;
      targetRightArmZ = 0.3 - Math.cos(this.idleTime) * 0.25;

      targetHeadY = Math.sin(this.idleTime) * 0.2;
      targetHeadX = Math.abs(Math.sin(this.idleTime)) * 0.12;

      targetLeftLegX = Math.sin(this.idleTime) * 0.25;
      targetRightLegX = -Math.sin(this.idleTime) * 0.25;
    } else if (activeAction === ACTION_SIT) {
      // ================= SIT & RELAX =================
      this.idleTime += deltaTime * 2.5;

      targetLeftLegX = -1.45;
      targetRightLegX = -1.45;
      targetLeftKneeX = -1.4;
      targetRightKneeX = -1.4;

      targetBounceY = -0.18;

      targetLeftArmX = -0.7;
      targetRightArmX = -0.7;

      const breath = Math.sin(this.idleTime * 1.8) * 0.02;
      targetScaleY = 1.0 + breath;
      targetScaleX = 1.0 / Math.sqrt(Math.max(0.5, targetScaleY));

      targetHeadX = -0.08;
      targetHeadY = Math.sin(this.idleTime * 0.3) * 0.1;
    } else if (state === STATE_TURBO) {
      // ================= TURBO SPRINT =================
      const cadence = this.turboCadence * (speed / TURBO_SPEED);
      this.strideTime += deltaTime * cadence;

      const legAmplitude = 1.15;
      targetLeftLegX = Math.sin(this.strideTime) * legAmplitude;
      targetRightLegX = -Math.sin(this.strideTime) * legAmplitude;

      const kneeAmplitude = 1.45;
      targetLeftKneeX = -Math.max(0, -Math.sin(this.strideTime)) * kneeAmplitude;
      targetRightKneeX = -Math.max(0, Math.sin(this.strideTime)) * kneeAmplitude;

      targetLeftArmX = -targetLeftLegX * 1.1;
      targetRightArmX = -targetRightLegX * 1.1;
      targetLeftArmZ = -0.16;
      targetRightArmZ = 0.16;

      targetPitchX = 0.28;
      targetBounceY = Math.abs(Math.sin(this.strideTime)) * 0.26;
      targetRollZ = Math.sin(this.strideTime) * 0.1;

      const squash = Math.cos(this.strideTime * 2.0) * 0.12;
      targetScaleY = 1.0 + squash;
      targetScaleX = 1.0 / Math.sqrt(Math.max(0.5, targetScaleY));
    } else if (state === STATE_IDLE || speed < 0.1) {
      // ================= IDLE STATE =================
      this.idleTime += deltaTime * 3.0;

      const breath = Math.sin(this.idleTime) * 0.018;
      targetScaleY = 1.0 + breath;
      targetScaleX = 1.0 / Math.sqrt(Math.max(0.5, targetScaleY));
      targetBounceY = Math.sin(this.idleTime) * 0.02;

      targetLeftArmX = Math.sin(this.idleTime) * 0.04;

      targetRightArmX = Math.sin(this.idleTime * 1.5) * 0.08;
      targetRightArmZ = Math.sin(this.idleTime * 2.5) * 0.14;

      targetHeadY = Math.sin(this.idleTime * 0.5) * 0.15;
      targetHeadX = Math.sin(this.idleTime) * 0.03;
      targetHeadZ = Math.sin(this.idleTime * 0.7) * 0.04;
    } else if (state === STATE_WALK) {
      // ================= WALK STATE =================
      const cadence = this.walkCadence * (speed / WALK_SPEED);
      this.strideTime += deltaTime * cadence;

      const legAmplitude = 0.52;
      targetLeftLegX = Math.sin(this.strideTime) * legAmplitude;
      targetRightLegX = -Math.sin(this.strideTime) * legAmplitude;

      const kneeAmplitude = 0.78;
      targetLeftKneeX = -Math.max(0, -Math.sin(this.strideTime)) * kneeAmplitude;
      targetRightKneeX = -Math.max(0, Math.sin(this.strideTime)) * kneeAmplitude;

      targetLeftArmX = -targetLeftLegX * 0.8;
      targetRightArmX = -targetRightLegX * 0.8;
      targetLeftArmZ = -0.08;
      targetRightArmZ = 0.08;

      targetBounceY = Math.abs(Math.sin(this.strideTime)) * 0.1;
      targetRollZ = Math.sin(this.strideTime) * 0.05;
      targetPitchX = 0.06;

      targetHeadY = -Math.sin(this.strideTime) * 0.03;
      targetHeadZ = -Math.sin(this.strideTime) * 0.03;
    } else if (state === STATE_RUN) {
      // ================= RUN STATE =================
      const cadence = this.runCadence * (speed / RUN_SPEED);
      this.strideTime += deltaTime * cadence;

      const legAmplitude = 0.95;
      targetLeftLegX = Math.sin(this.strideTime) * legAmplitude;
      targetRightLegX = -Math.sin(this.strideTime) * legAmplitude;

      const kneeAmplitude = 1.25;
      targetLeftKneeX = -Math.max(0, -Math.sin(this.strideTime)) * kneeAmplitude;
      targetRightKneeX = -Math.max(0, Math.sin(this.strideTime)) * kneeAmplitude;

      targetLeftArmX = -targetLeftLegX * 0.95;
      targetRightArmX = -targetRightLegX * 0.95;
      targetLeftArmZ = -0.12;
      targetRightArmZ = 0.12;

      targetPitchX = 0.18;
      targetBounceY = Math.abs(Math.sin(this.strideTime)) * 0.22;
      targetRollZ = Math.sin(this.strideTime) * 0.08;

      const squash = Math.cos(this.strideTime * 2.0) * 0.08;
      targetScaleY = 1.0 + squash;
      targetScaleX = 1.0 / Math.sqrt(Math.max(0.5, targetScaleY));
    }

    // Smoothly blend animation channels
    const blendRate = 12.0;
    const blend = Math.min(1.0, blendRate * deltaTime);

    this.currentBounceY = BABYLON.Scalar.Lerp(this.currentBounceY, targetBounceY, blend);
    this.currentPitchX = BABYLON.Scalar.Lerp(this.currentPitchX, targetPitchX, blend);
    this.currentRollZ = BABYLON.Scalar.Lerp(this.currentRollZ, targetRollZ, blend);
    this.currentScaleY = BABYLON.Scalar.Lerp(this.currentScaleY, targetScaleY, blend);
    this.currentScaleX = BABYLON.Scalar.Lerp(this.currentScaleX, targetScaleX, blend);

    this.leftLegX = BABYLON.Scalar.Lerp(this.leftLegX, targetLeftLegX, blend);
    this.rightLegX = BABYLON.Scalar.Lerp(this.rightLegX, targetRightLegX, blend);
    this.leftKneeX = BABYLON.Scalar.Lerp(this.leftKneeX, targetLeftKneeX, blend);
    this.rightKneeX = BABYLON.Scalar.Lerp(this.rightKneeX, targetRightKneeX, blend);
    this.leftArmX = BABYLON.Scalar.Lerp(this.leftArmX, targetLeftArmX, blend);
    this.rightArmX = BABYLON.Scalar.Lerp(this.rightArmX, targetRightArmX, blend);
    this.leftArmZ = BABYLON.Scalar.Lerp(this.leftArmZ, targetLeftArmZ, blend);
    this.rightArmZ = BABYLON.Scalar.Lerp(this.rightArmZ, targetRightArmZ, blend);
    this.headX = BABYLON.Scalar.Lerp(this.headX, targetHeadX, blend);
    this.headY = BABYLON.Scalar.Lerp(this.headY, targetHeadY, blend);
    this.headZ = BABYLON.Scalar.Lerp(this.headZ, targetHeadZ, blend);

    // Apply to Visual Root
    this.rig.visual.position.y = this.currentBounceY;
    this.rig.visual.rotation.x = this.currentPitchX;
    this.rig.visual.rotation.z = this.currentRollZ;
    this.rig.visual.scaling.set(this.currentScaleX, this.currentScaleY, 1.0);

    // Apply to Articulated Anatomical Pivots if model is ready
    if (this.rig.isReady) {
      if (this.rig.leftLegPivot) this.rig.leftLegPivot.rotation.x = this.leftLegX;
      if (this.rig.rightLegPivot) this.rig.rightLegPivot.rotation.x = this.rightLegX;
      if (this.rig.leftKneePivot) this.rig.leftKneePivot.rotation.x = this.leftKneeX;
      if (this.rig.rightKneePivot) this.rig.rightKneePivot.rotation.x = this.rightKneeX;
      if (this.rig.leftArmPivot) {
        this.rig.leftArmPivot.rotation.x = this.leftArmX;
        this.rig.leftArmPivot.rotation.z = this.leftArmZ;
      }
      if (this.rig.rightArmPivot) {
        this.rig.rightArmPivot.rotation.x = this.rightArmX;
        this.rig.rightArmPivot.rotation.z = this.rightArmZ;
      }
      if (this.rig.headPivot) {
        this.rig.headPivot.rotation.x = this.headX;
        this.rig.headPivot.rotation.y = this.headY;
        this.rig.headPivot.rotation.z = this.headZ;
      }
    }
  }
}
