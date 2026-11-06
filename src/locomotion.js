import * as BABYLON from "@babylonjs/core";
import { inputManager } from "./input.js";

export const STATE_IDLE = "IDLE";
export const STATE_WALK = "WALK";
export const STATE_RUN = "RUN";
export const STATE_TURBO = "TURBO";
export const STATE_FLIGHT = "FLIGHT";

export const WALK_SPEED = 2.8;
export const RUN_SPEED = 6.0;
export const TURBO_SPEED = 10.5;
export const FLIGHT_SPEED = 6.8;
export const FLIGHT_BOOST_SPEED = 14.5;

/**
 * Controller managing character locomotion, camera-relative movement, 3D Iron Man flight, and speed states.
 */
export class LocomotionController {
  /**
   * @param {BABYLON.TransformNode} characterRoot
   * @param {BABYLON.ArcRotateCamera} camera
   * @param {BABYLON.Scene} scene
   */
  constructor(characterRoot, camera, scene) {
    this.characterRoot = characterRoot;
    this.camera = camera;
    this.scene = scene;

    this.currentState = STATE_IDLE;
    this.currentSpeed = 0.0;
    this.targetSpeed = 0.0;

    this.turnSpeed = 14.0;
    this.acceleration = 16.0;
    this.deceleration = 22.0;

    this.moveDirection = new BABYLON.Vector3(0, 0, 0);
    this.verticalVelocity = 0.0;
    this.turnDiff = 0.0;

    // Ground and aerial boundary perimeters
    this.maxWalkRadius = 5.6;
    this.maxFlightRadius = 12.0;
    this.maxFlightAltitude = 16.0;
  }

  /**
   * Updates character locomotion or 3D flight on each render frame.
   *
   * @param {number} deltaTime - Frame elapsed time in seconds
   * @param {boolean} [isTurboActive=false] - Whether turbo sprint is active
   * @param {boolean} [isFlightActive=false] - Whether Iron Man flight mode is active
   */
  update(deltaTime, isTurboActive = false, isFlightActive = false) {
    if (deltaTime <= 0) return;

    const input = inputManager.getMovementInput();

    if (isFlightActive) {
      // ================= IRON MAN 3D FLIGHT MODE =================
      this.currentState = STATE_FLIGHT;
      const flightMaxSpeed = input.isRunning
        ? FLIGHT_BOOST_SPEED
        : FLIGHT_SPEED;

      const hasHorizontalInput = input.rawX !== 0 || input.rawZ !== 0;

      if (hasHorizontalInput || input.rawY !== 0) {
        this.targetSpeed = flightMaxSpeed;
      } else {
        this.targetSpeed = 0.0;
      }

      // Smooth flight acceleration
      this.currentSpeed = BABYLON.Scalar.Lerp(
        this.currentSpeed,
        this.targetSpeed,
        Math.min(1.0, 10.0 * deltaTime)
      );

      // Compute Camera-Relative 3D Flight Direction
      const camPos = this.camera.globalPosition;
      const targetPos = this.camera.getTarget();

      const forward = new BABYLON.Vector3(
        targetPos.x - camPos.x,
        0,
        targetPos.z - camPos.z
      );

      if (forward.lengthSquared() > 0.0001) {
        forward.normalize();
      } else {
        forward.set(0, 0, 1);
      }

      const right = BABYLON.Vector3.Cross(
        BABYLON.Vector3.Up(),
        forward
      ).normalize();

      // Horizontal component
      this.moveDirection.set(0, 0, 0);
      if (hasHorizontalInput) {
        this.moveDirection.copyFrom(
          forward.scale(input.rawZ).add(right.scale(input.rawX))
        );
        if (this.moveDirection.lengthSquared() > 0.0001) {
          this.moveDirection.normalize();
        }

        // Smooth yaw rotation to face flight heading
        const targetYaw = Math.atan2(
          this.moveDirection.x,
          this.moveDirection.z
        );

        let diff = targetYaw - this.characterRoot.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        this.turnDiff = diff;
        this.characterRoot.rotation.y +=
          diff * Math.min(1.0, 12.0 * deltaTime);
      } else {
        this.turnDiff = 0;
      }

      // Vertical ascent / descent
      const targetVertVel = input.rawY * 4.5;
      this.verticalVelocity = BABYLON.Scalar.Lerp(
        this.verticalVelocity,
        targetVertVel,
        Math.min(1.0, 8.0 * deltaTime)
      );

      // Apply 3D Translation
      if (this.currentSpeed > 0.001 && hasHorizontalInput) {
        const stepH = this.moveDirection.scale(
          this.currentSpeed * deltaTime
        );
        this.characterRoot.position.x += stepH.x;
        this.characterRoot.position.z += stepH.z;
      }

      this.characterRoot.position.y += this.verticalVelocity * deltaTime;

      // Enforce Flight Boundaries (Ground level to high sky)
      this.characterRoot.position.y = BABYLON.Scalar.Clamp(
        this.characterRoot.position.y,
        0.1,
        this.maxFlightAltitude
      );

      const flightDist = Math.sqrt(
        this.characterRoot.position.x ** 2 + this.characterRoot.position.z ** 2
      );
      if (flightDist > this.maxFlightRadius) {
        this.characterRoot.position.x =
          (this.characterRoot.position.x / flightDist) * this.maxFlightRadius;
        this.characterRoot.position.z =
          (this.characterRoot.position.z / flightDist) * this.maxFlightRadius;
      }
    } else {
      // ================= GROUND LOCOMOTION =================
      this.turnDiff = 0;
      this.characterRoot.position.y = 0; // Lock to ground

      if (!input.isMoving) {
        this.targetSpeed = 0.0;
        this.currentState = STATE_IDLE;
      } else if (isTurboActive) {
        this.targetSpeed = TURBO_SPEED;
        this.currentState = STATE_TURBO;
      } else if (input.isRunning) {
        this.targetSpeed = RUN_SPEED;
        this.currentState = STATE_RUN;
      } else {
        this.targetSpeed = WALK_SPEED;
        this.currentState = STATE_WALK;
      }

      const rate = input.isMoving ? this.acceleration : this.deceleration;
      this.currentSpeed = BABYLON.Scalar.Lerp(
        this.currentSpeed,
        this.targetSpeed,
        Math.min(1.0, rate * deltaTime)
      );

      if (Math.abs(this.currentSpeed - this.targetSpeed) < 0.01) {
        this.currentSpeed = this.targetSpeed;
      }

      if (input.isMoving) {
        const camPos = this.camera.globalPosition;
        const targetPos = this.camera.getTarget();

        const forward = new BABYLON.Vector3(
          targetPos.x - camPos.x,
          0,
          targetPos.z - camPos.z
        );

        if (forward.lengthSquared() > 0.0001) {
          forward.normalize();
        } else {
          forward.set(0, 0, 1);
        }

        const right = BABYLON.Vector3.Cross(
          BABYLON.Vector3.Up(),
          forward
        ).normalize();

        this.moveDirection.copyFrom(
          forward.scale(input.rawZ).add(right.scale(input.rawX))
        );

        if (this.moveDirection.lengthSquared() > 0.0001) {
          this.moveDirection.normalize();
        }

        const targetYaw = Math.atan2(
          this.moveDirection.x,
          this.moveDirection.z
        );

        let diff = targetYaw - this.characterRoot.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        this.characterRoot.rotation.y +=
          diff * Math.min(1.0, this.turnSpeed * deltaTime);
      }

      if (this.currentSpeed > 0.001) {
        const step = this.moveDirection.scale(
          this.currentSpeed * deltaTime
        );
        this.characterRoot.position.addInPlace(step);

        const dist = Math.sqrt(
          this.characterRoot.position.x ** 2 +
            this.characterRoot.position.z ** 2
        );
        if (dist > this.maxWalkRadius) {
          this.characterRoot.position.x =
            (this.characterRoot.position.x / dist) * this.maxWalkRadius;
          this.characterRoot.position.z =
            (this.characterRoot.position.z / dist) * this.maxWalkRadius;
        }
      }
    }
  }

  getTelemetry() {
    return {
      state: this.currentState,
      speed: this.currentSpeed,
      turnDiff: this.turnDiff,
      altitude: this.characterRoot.position.y,
    };
  }
}
