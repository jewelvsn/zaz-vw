import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { Vector3Like, QualityPreset } from "../schema/types";

export interface LimbRotations {
  leftLegX?: number;
  leftLegY?: number;
  leftLegZ?: number;
  rightLegX?: number;
  rightLegY?: number;
  rightLegZ?: number;
  leftKneeX?: number;
  rightKneeX?: number;
  leftArmX?: number;
  leftArmY?: number;
  leftArmZ?: number;
  rightArmX?: number;
  rightArmY?: number;
  rightArmZ?: number;
  headX?: number;
  headY?: number;
  headZ?: number;
}

export interface CharacterAdapterOptions {
  instanceId: string;
  assetId: string;
  modelUrl: string;
  scene: BABYLON.Scene;
  shadowGenerator?: BABYLON.ShadowGenerator | null;
  qualityPreset?: QualityPreset;
  initialPosition?: Vector3Like;
  initialRotation?: Vector3Like;
  initialScale?: Vector3Like;
}

export class BabylonCharacterAdapter {
  public readonly instanceId: string;
  public readonly assetId: string;
  private scene: BABYLON.Scene;
  private shadowGenerator: BABYLON.ShadowGenerator | null;
  private qualityPreset: QualityPreset;

  // Transform hierarchy
  public root: BABYLON.TransformNode;
  public visual: BABYLON.TransformNode;
  private modelRoot: BABYLON.TransformNode | null = null;

  // Anatomical pivots
  public leftLegPivot: BABYLON.TransformNode | null = null;
  public rightLegPivot: BABYLON.TransformNode | null = null;
  public leftKneePivot: BABYLON.TransformNode | null = null;
  public rightKneePivot: BABYLON.TransformNode | null = null;
  public leftArmPivot: BABYLON.TransformNode | null = null;
  public rightArmPivot: BABYLON.TransformNode | null = null;
  public headPivot: BABYLON.TransformNode | null = null;

  // Particle systems
  private thrusterSystem: BABYLON.IParticleSystem | null = null;
  private splashSystem: BABYLON.IParticleSystem | null = null;

  private isReady: boolean = false;
  private readyPromise: Promise<void>;

  constructor(options: CharacterAdapterOptions) {
    this.instanceId = options.instanceId;
    this.assetId = options.assetId;
    this.scene = options.scene;
    this.shadowGenerator = options.shadowGenerator || null;
    this.qualityPreset = options.qualityPreset || "preview";

    // 1. Root node for positioning in world space
    this.root = new BABYLON.TransformNode(`char_${options.instanceId}_root`, this.scene);
    if (options.initialPosition) {
      this.root.position = new BABYLON.Vector3(
        options.initialPosition.x,
        options.initialPosition.y,
        options.initialPosition.z
      );
    }
    if (options.initialRotation) {
      this.root.rotation = new BABYLON.Vector3(
        options.initialRotation.x,
        options.initialRotation.y,
        options.initialRotation.z
      );
    }

    // 2. Visual node for procedural secondary animations (bounce, pitch lean, roll)
    this.visual = new BABYLON.TransformNode(`char_${options.instanceId}_visual`, this.scene);
    this.visual.parent = this.root;
    if (options.initialScale) {
      this.visual.scaling = new BABYLON.Vector3(
        options.initialScale.x,
        options.initialScale.y,
        options.initialScale.z
      );
    }

    this.readyPromise = this.loadAndRig(options.modelUrl);
  }

  public whenReady(): Promise<void> {
    return this.readyPromise;
  }

  public getIsReady(): boolean {
    return this.isReady;
  }

  private async loadAndRig(modelUrl: string): Promise<void> {
    try {
      const urlParts = modelUrl.split("/");
      const fileName = urlParts.pop() || "faceless_kids_robot.glb";
      const rootUrl = urlParts.length > 0 ? urlParts.join("/") + "/" : "/";

      const result = await BABYLON.SceneLoader.ImportMeshAsync("", rootUrl, fileName, this.scene);

      // Locate robot root or first mesh
      let robotRoot = this.scene.getTransformNodeByName("Faceless Kids Robot");
      if (!robotRoot && result.meshes.length > 0) {
        robotRoot = result.meshes[0] as unknown as BABYLON.TransformNode;
      }

      if (robotRoot) {
        this.modelRoot = robotRoot;
        robotRoot.parent = this.visual;
        robotRoot.rotation.y = 0;
        robotRoot.scaling.setAll(0.45);

        // Rig pivots using anatomical profile
        this.buildAnatomicalPivots(robotRoot);

        // Shadow configuration based on quality preset
        if (this.qualityPreset !== "draft" && this.shadowGenerator) {
          result.meshes.forEach((mesh) => {
            mesh.receiveShadows = true;
            if (mesh.name !== "__root__") {
              this.shadowGenerator?.addShadowCaster(mesh, true);
            }
          });
        }
      }

      this.setupParticles();
      this.isReady = true;
    } catch {
      // In tests or offline without GLB, build fallback hierarchy and pivots
      this.createFallbackMesh();
      this.isReady = true;
    }
  }

  private buildAnatomicalPivots(robotRoot: BABYLON.TransformNode): void {
    const scene = this.scene;

    // --- LEFT LEG ---
    this.leftLegPivot = new BABYLON.TransformNode(`char_${this.instanceId}_leftLegPivot`, scene);
    this.leftLegPivot.parent = robotRoot;
    this.leftLegPivot.position.set(-0.34, 0.78, 0);

    ["left hip joint", "left thigh shell"].forEach((name) => {
      const m = scene.getMeshByName(name);
      if (m) {
        m.position.subtractInPlace(this.leftLegPivot!.position);
        m.parent = this.leftLegPivot;
      }
    });

    this.leftKneePivot = new BABYLON.TransformNode(`char_${this.instanceId}_leftKneePivot`, scene);
    this.leftKneePivot.parent = this.leftLegPivot;
    this.leftKneePivot.position.set(0, 0.41 - 0.78, 0.07);

    const leftKneeWorld = new BABYLON.Vector3(-0.34, 0.41, 0.07);
    [
      "left knee joint",
      "left lower leg boot",
      "left giant mint boot toe",
      "left blue outer ankle bolt",
    ].forEach((name) => {
      const m = scene.getMeshByName(name);
      if (m) {
        m.position.subtractInPlace(leftKneeWorld);
        m.parent = this.leftKneePivot;
      }
    });

    // --- RIGHT LEG ---
    this.rightLegPivot = new BABYLON.TransformNode(`char_${this.instanceId}_rightLegPivot`, scene);
    this.rightLegPivot.parent = robotRoot;
    this.rightLegPivot.position.set(0.34, 0.78, 0);

    ["right hip joint", "right thigh shell"].forEach((name) => {
      const m = scene.getMeshByName(name);
      if (m) {
        m.position.subtractInPlace(this.rightLegPivot!.position);
        m.parent = this.rightLegPivot;
      }
    });

    this.rightKneePivot = new BABYLON.TransformNode(`char_${this.instanceId}_rightKneePivot`, scene);
    this.rightKneePivot.parent = this.rightLegPivot;
    this.rightKneePivot.position.set(0, 0.41 - 0.78, 0.07);

    const rightKneeWorld = new BABYLON.Vector3(0.34, 0.41, 0.07);
    [
      "right knee joint",
      "right lower leg boot",
      "right giant mint boot toe",
      "right blue outer ankle bolt",
    ].forEach((name) => {
      const m = scene.getMeshByName(name);
      if (m) {
        m.position.subtractInPlace(rightKneeWorld);
        m.parent = this.rightKneePivot;
      }
    });

    // --- LEFT ARM ---
    this.leftArmPivot = new BABYLON.TransformNode(`char_${this.instanceId}_leftArmPivot`, scene);
    this.leftArmPivot.parent = robotRoot;
    this.leftArmPivot.position.set(-0.65, 1.5, 0.015);

    [
      "Left shoulder joint",
      "Left shoulder cap",
      "Left upper arm",
      "Left elbow joint",
      "Left forearm",
      "Left mint mitten palm",
      "Left thumb",
    ].forEach((name) => {
      const m = scene.getMeshByName(name);
      if (m) {
        m.position.subtractInPlace(this.leftArmPivot!.position);
        m.parent = this.leftArmPivot;
      }
    });

    // --- RIGHT ARM ---
    this.rightArmPivot = new BABYLON.TransformNode(`char_${this.instanceId}_rightArmPivot`, scene);
    this.rightArmPivot.parent = robotRoot;
    this.rightArmPivot.position.set(0.65, 1.51, 0.015);

    [
      "Right shoulder joint",
      "Right shoulder cap",
      "Right upper arm",
      "Right elbow joint",
      "Right raised forearm",
      "Right wrist blue cuff",
      "Right mint waving palm",
      "Rounded waving finger 1",
      "Rounded waving finger 2",
      "Rounded waving finger 3",
      "Right thumb",
    ].forEach((name) => {
      const m = scene.getMeshByName(name);
      if (m) {
        m.position.subtractInPlace(this.rightArmPivot!.position);
        m.parent = this.rightArmPivot;
      }
    });

    // --- HEAD ---
    this.headPivot = new BABYLON.TransformNode(`char_${this.instanceId}_headPivot`, scene);
    this.headPivot.parent = robotRoot;
    this.headPivot.position.set(0, 1.77, 0);

    [
      "Oversized blank ivory head",
      "Neck joint",
      "Mint neck collar",
      "left mint ear housing",
      "left blue ear insert",
      "right mint ear housing",
      "right blue ear insert",
    ].forEach((name) => {
      const m = scene.getMeshByName(name);
      if (m) {
        m.position.subtractInPlace(this.headPivot!.position);
        m.parent = this.headPivot;
      }
    });
  }

  private createFallbackMesh(): void {
    const box = BABYLON.MeshBuilder.CreateCylinder(`char_${this.instanceId}_fallback`, {
      height: 1.4,
      diameter: 0.5,
    }, this.scene);
    box.position.y = 0.7;
    box.parent = this.visual;

    // Create fallback pivots
    this.leftLegPivot = new BABYLON.TransformNode(`char_${this.instanceId}_leftLegPivot`, this.scene);
    this.leftLegPivot.parent = this.visual;
    this.rightLegPivot = new BABYLON.TransformNode(`char_${this.instanceId}_rightLegPivot`, this.scene);
    this.rightLegPivot.parent = this.visual;
    this.leftArmPivot = new BABYLON.TransformNode(`char_${this.instanceId}_leftArmPivot`, this.scene);
    this.leftArmPivot.parent = this.visual;
    this.rightArmPivot = new BABYLON.TransformNode(`char_${this.instanceId}_rightArmPivot`, this.scene);
    this.rightArmPivot.parent = this.visual;
    this.headPivot = new BABYLON.TransformNode(`char_${this.instanceId}_headPivot`, this.scene);
    this.headPivot.parent = this.visual;
  }

  private setupParticles(): void {
    // Optional particle emitters can be hooked here
  }

  public setPosition(pos: Vector3Like): void {
    this.root.position.set(pos.x, pos.y, pos.z);
  }

  public setRotation(rot: Vector3Like): void {
    this.root.rotation.set(rot.x, rot.y, rot.z);
  }

  public setVisualTransform(
    bounceY: number = 0,
    pitchX: number = 0,
    rollZ: number = 0,
    scaleY: number = 1.0,
    scaleX: number = 1.0
  ): void {
    this.visual.position.y = bounceY;
    this.visual.rotation.x = pitchX;
    this.visual.rotation.z = rollZ;
    this.visual.scaling.set(scaleX, scaleY, scaleX);
  }

  public setLimbRotations(limbs: LimbRotations): void {
    if (this.leftLegPivot && limbs.leftLegX !== undefined) {
      this.leftLegPivot.rotation.x = limbs.leftLegX;
      if (limbs.leftLegY !== undefined) this.leftLegPivot.rotation.y = limbs.leftLegY;
      if (limbs.leftLegZ !== undefined) this.leftLegPivot.rotation.z = limbs.leftLegZ;
    }
    if (this.rightLegPivot && limbs.rightLegX !== undefined) {
      this.rightLegPivot.rotation.x = limbs.rightLegX;
      if (limbs.rightLegY !== undefined) this.rightLegPivot.rotation.y = limbs.rightLegY;
      if (limbs.rightLegZ !== undefined) this.rightLegPivot.rotation.z = limbs.rightLegZ;
    }
    if (this.leftKneePivot && limbs.leftKneeX !== undefined) {
      this.leftKneePivot.rotation.x = limbs.leftKneeX;
    }
    if (this.rightKneePivot && limbs.rightKneeX !== undefined) {
      this.rightKneePivot.rotation.x = limbs.rightKneeX;
    }
    if (this.leftArmPivot) {
      if (limbs.leftArmX !== undefined) this.leftArmPivot.rotation.x = limbs.leftArmX;
      if (limbs.leftArmY !== undefined) this.leftArmPivot.rotation.y = limbs.leftArmY;
      if (limbs.leftArmZ !== undefined) this.leftArmPivot.rotation.z = limbs.leftArmZ;
    }
    if (this.rightArmPivot) {
      if (limbs.rightArmX !== undefined) this.rightArmPivot.rotation.x = limbs.rightArmX;
      if (limbs.rightArmY !== undefined) this.rightArmPivot.rotation.y = limbs.rightArmY;
      if (limbs.rightArmZ !== undefined) this.rightArmPivot.rotation.z = limbs.rightArmZ;
    }
    if (this.headPivot) {
      if (limbs.headX !== undefined) this.headPivot.rotation.x = limbs.headX;
      if (limbs.headY !== undefined) this.headPivot.rotation.y = limbs.headY;
      if (limbs.headZ !== undefined) this.headPivot.rotation.z = limbs.headZ;
    }
  }

  public dispose(): void {
    if (this.thrusterSystem) {
      this.thrusterSystem.dispose();
      this.thrusterSystem = null;
    }
    if (this.splashSystem) {
      this.splashSystem.dispose();
      this.splashSystem = null;
    }
    this.root.dispose();
  }
}
