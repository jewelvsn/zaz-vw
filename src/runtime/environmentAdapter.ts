import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { QualityPreset, Vector3Like } from "../schema/types";
import { assetRegistry } from "../assets/registry";

export interface EnvironmentAdapterOptions {
  assetId: string;
  modelUrl: string;
  scene: BABYLON.Scene;
  shadowGenerator?: BABYLON.ShadowGenerator | null;
  qualityPreset?: QualityPreset;
  initialPosition?: Vector3Like;
}

export class BabylonEnvironmentAdapter {
  public readonly assetId: string;
  private scene: BABYLON.Scene;
  private shadowGenerator: BABYLON.ShadowGenerator | null;
  private qualityPreset: QualityPreset;

  public root: BABYLON.TransformNode;
  private anchorNodes: Map<string, BABYLON.TransformNode> = new Map();
  private loadedMeshes: BABYLON.AbstractMesh[] = [];
  private waterMeshes: BABYLON.AbstractMesh[] = [];
  private isReady: boolean = false;
  private readyPromise: Promise<void>;

  constructor(options: EnvironmentAdapterOptions) {
    this.assetId = options.assetId;
    this.scene = options.scene;
    this.shadowGenerator = options.shadowGenerator || null;
    this.qualityPreset = options.qualityPreset || "preview";

    this.root = new BABYLON.TransformNode(`env_${options.assetId}_root`, this.scene);
    if (options.initialPosition) {
      this.root.position.set(
        options.initialPosition.x,
        options.initialPosition.y,
        options.initialPosition.z
      );
    }

    this.setupAnchorNodes();
    this.readyPromise = this.loadEnvironment(options.modelUrl);
  }

  public whenReady(): Promise<void> {
    return this.readyPromise;
  }

  public getIsReady(): boolean {
    return this.isReady;
  }

  private setupAnchorNodes(): void {
    const anchors = assetRegistry.getAllAnchors(this.assetId);
    anchors.forEach((anchor) => {
      const node = new BABYLON.TransformNode(`anchor_${anchor.id}`, this.scene);
      node.parent = this.root;
      const [px, py, pz] = anchor.position;
      node.position.set(px, py, pz);
      if (anchor.rotation) {
        const [rx, ry, rz] = anchor.rotation;
        node.rotation.set(rx, ry, rz);
      }
      this.anchorNodes.set(anchor.id, node);
    });
  }

  public getAnchorWorldPosition(anchorId: string): BABYLON.Vector3 | null {
    const node = this.anchorNodes.get(anchorId);
    if (node) {
      return node.getAbsolutePosition().clone();
    }
    return null;
  }

  public getAnchorWorldRotation(anchorId: string): BABYLON.Vector3 | null {
    const node = this.anchorNodes.get(anchorId);
    if (node) {
      return node.rotation.clone();
    }
    return null;
  }

  private async loadEnvironment(modelUrl: string): Promise<void> {
    try {
      const urlParts = modelUrl.split("/");
      const fileName = urlParts.pop() || "jungle_waterfall_hq.glb";
      const rootUrl = urlParts.length > 0 ? urlParts.join("/") + "/" : "/";

      const result = await BABYLON.SceneLoader.ImportMeshAsync("", rootUrl, fileName, this.scene);
      this.loadedMeshes = result.meshes;

      result.meshes.forEach((mesh) => {
        mesh.parent = this.root;
        mesh.receiveShadows = true;

        if (mesh.name !== "__root__") {
          // Add primary vertical occluders as shadow casters based on quality preset
          if (this.qualityPreset !== "draft" && this.shadowGenerator) {
            if (/cliff|stone|rock|trunk|tree/i.test(mesh.name)) {
              this.shadowGenerator.addShadowCaster(mesh, false);
            }
          }

          if (/waterfall|falling water|foam|lagoon|plunge pool/i.test(mesh.name)) {
            this.waterMeshes.push(mesh);
          }
        }
      });

      this.isReady = true;
    } catch (err) {
      // In tests or headless environments, file loading might be mocked or fail gracefully
      this.createFallbackTerrain();
      this.isReady = true;
    }
  }

  private createFallbackTerrain(): void {
    const ground = BABYLON.MeshBuilder.CreateGround(`env_${this.assetId}_fallback_ground`, {
      width: 40,
      height: 40,
      subdivisions: 2,
    }, this.scene);
    ground.parent = this.root;
    ground.receiveShadows = true;
    this.loadedMeshes.push(ground);

    const groundMat = new BABYLON.StandardMaterial(`env_${this.assetId}_ground_mat`, this.scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.08, 0.22, 0.12);
    ground.material = groundMat;
  }

  public updateProceduralEffects(currentFrame: number, fps: number): void {
    const time = currentFrame / fps;
    if (this.waterMeshes.length > 0) {
      this.waterMeshes.forEach((wm, i) => {
        if (wm.name.includes("foam")) {
          const scale = 1.0 + Math.sin(time * 3 + i) * 0.05;
          wm.scaling.set(scale, scale, scale);
        }
      });
    }
  }

  public dispose(): void {
    this.anchorNodes.forEach((node) => node.dispose());
    this.anchorNodes.clear();
    this.loadedMeshes.forEach((mesh) => mesh.dispose());
    this.loadedMeshes = [];
    this.waterMeshes = [];
    this.root.dispose();
  }
}
