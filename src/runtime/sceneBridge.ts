import * as BABYLON from "@babylonjs/core";
import type { Scene as DomainScene, QualityPreset } from "../schema/types";
import { BabylonCharacterAdapter } from "./characterAdapter";
import { BabylonEnvironmentAdapter } from "./environmentAdapter";
import { assetRegistry } from "../assets/registry";

export interface SceneBridgeOptions {
  engine: BABYLON.Engine;
  domainScene: DomainScene;
  qualityPreset?: QualityPreset;
}

export class BabylonSceneBridge {
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private qualityPreset: QualityPreset;

  // Lights & Shadows
  private directionalLight: BABYLON.DirectionalLight | null = null;
  private hemisphericLight: BABYLON.HemisphericLight | null = null;
  private shadowGenerator: BABYLON.ShadowGenerator | null = null;

  // Adapters
  private environmentAdapter: BabylonEnvironmentAdapter | null = null;
  private characterAdapters: Map<string, BabylonCharacterAdapter> = new Map();

  // Active Camera
  private activeCamera: BABYLON.Camera | null = null;

  constructor(options: SceneBridgeOptions) {
    this.engine = options.engine;
    this.qualityPreset = options.qualityPreset || "preview";
    this.scene = new BABYLON.Scene(this.engine);

    this.setupAtmosphere(options.domainScene);
    this.setupLighting(options.domainScene);
    this.setupEnvironment(options.domainScene);
    this.setupCharacters(options.domainScene);
  }

  public getScene(): BABYLON.Scene {
    return this.scene;
  }

  public getQualityPreset(): QualityPreset {
    return this.qualityPreset;
  }

  public getShadowGenerator(): BABYLON.ShadowGenerator | null {
    return this.shadowGenerator;
  }

  public getEnvironmentAdapter(): BabylonEnvironmentAdapter | null {
    return this.environmentAdapter;
  }

  public getCharacterAdapter(instanceId: string): BabylonCharacterAdapter | undefined {
    return this.characterAdapters.get(instanceId);
  }

  public getAllCharacterAdapters(): BabylonCharacterAdapter[] {
    return Array.from(this.characterAdapters.values());
  }

  public getActiveCamera(): BABYLON.Camera | null {
    return this.activeCamera;
  }

  public setActiveCamera(camera: BABYLON.Camera): void {
    this.activeCamera = camera;
    this.scene.activeCamera = camera;
  }

  private setupAtmosphere(domainScene: DomainScene): void {
    const env = domainScene.environment;
    if (env.clearColor) {
      const [r, g, b, a] = env.clearColor;
      this.scene.clearColor = new BABYLON.Color4(r, g, b, a);
    } else {
      this.scene.clearColor = new BABYLON.Color4(14 / 255, 30 / 255, 32 / 255, 1.0);
    }

    if (this.qualityPreset !== "draft") {
      this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
      this.scene.fogDensity = env.fogDensity ?? 0.016;
      if (env.fogColor) {
        const [fr, fg, fb] = env.fogColor;
        this.scene.fogColor = new BABYLON.Color3(fr, fg, fb);
      } else {
        this.scene.fogColor = new BABYLON.Color3(14 / 255, 30 / 255, 32 / 255);
      }
    } else {
      this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
    }
  }

  private setupLighting(domainScene: DomainScene): void {
    const env = domainScene.environment;
    let sunDir = new BABYLON.Vector3(-0.6, -1.2, 0.5).normalize();
    let sunIntensity = 1.45;
    let sunColor = new BABYLON.Color3(1.0, 0.97, 0.9);

    if (env.sunlight) {
      const [sx, sy, sz] = env.sunlight.direction;
      sunDir = new BABYLON.Vector3(sx, sy, sz).normalize();
      sunIntensity = env.sunlight.intensity;
      const [cr, cg, cb] = env.sunlight.color;
      sunColor = new BABYLON.Color3(cr, cg, cb);
    }

    this.directionalLight = new BABYLON.DirectionalLight("sunLight", sunDir, this.scene);
    this.directionalLight.position = new BABYLON.Vector3(12, 25, 12);
    this.directionalLight.intensity = sunIntensity;
    this.directionalLight.diffuse = sunColor;
    this.directionalLight.specular = new BABYLON.Color3(0.7, 0.7, 0.7);
    this.directionalLight.autoCalcShadowZBounds = true;
    this.directionalLight.autoUpdateExtends = true;

    this.hemisphericLight = new BABYLON.HemisphericLight("ambientFillLight", new BABYLON.Vector3(0, 1, 0), this.scene);
    this.hemisphericLight.intensity = env.ambientLight?.intensity ?? 0.55;
    if (env.ambientLight?.skyColor) {
      const [sr, sg, sb] = env.ambientLight.skyColor;
      this.hemisphericLight.diffuse = new BABYLON.Color3(sr, sg, sb);
    } else {
      this.hemisphericLight.diffuse = new BABYLON.Color3(0.85, 0.95, 1.0);
    }
    if (env.ambientLight?.groundColor) {
      const [gr, gg, gb] = env.ambientLight.groundColor;
      this.hemisphericLight.groundColor = new BABYLON.Color3(gr, gg, gb);
    } else {
      this.hemisphericLight.groundColor = new BABYLON.Color3(0.12, 0.24, 0.16);
    }

    if (this.qualityPreset !== "draft") {
      const mapSize = this.qualityPreset === "cinematic" ? 2048 : 1024;
      this.shadowGenerator = new BABYLON.ShadowGenerator(mapSize, this.directionalLight);

      if (this.qualityPreset === "cinematic") {
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator.blurKernel = 32;
        this.shadowGenerator.blurScale = 2;
        this.shadowGenerator.depthScale = 50.0;
      } else {
        this.shadowGenerator.usePoissonSampling = true;
      }

      this.shadowGenerator.enableSoftTransparentShadow = true;
      this.shadowGenerator.transparencyShadow = true;
      this.shadowGenerator.bias = 0.0008;
      this.shadowGenerator.normalBias = 0.01;
      this.shadowGenerator.darkness = 0.8;
    }
  }

  private setupEnvironment(domainScene: DomainScene): void {
    const envAssetId = domainScene.environment.assetId;
    const assetMeta = assetRegistry.getAsset(envAssetId);
    const modelUrl = assetMeta ? assetMeta.uri : "/jungle_waterfall_hq.glb";

    this.environmentAdapter = new BabylonEnvironmentAdapter({
      assetId: envAssetId,
      modelUrl,
      scene: this.scene,
      shadowGenerator: this.shadowGenerator,
      qualityPreset: this.qualityPreset,
    });
  }

  private setupCharacters(domainScene: DomainScene): void {
    domainScene.characters.forEach((charInstance) => {
      const assetMeta = assetRegistry.getAsset(charInstance.assetId);
      const modelUrl = assetMeta ? assetMeta.uri : "/faceless_kids_robot.glb";

      const [px, py, pz] = charInstance.initialPosition;
      const [rx, ry, rz] = charInstance.initialRotation;
      const initialScale = charInstance.initialScale
        ? {
            x: charInstance.initialScale[0],
            y: charInstance.initialScale[1],
            z: charInstance.initialScale[2],
          }
        : undefined;

      const adapter = new BabylonCharacterAdapter({
        instanceId: charInstance.id,
        assetId: charInstance.assetId,
        modelUrl,
        scene: this.scene,
        shadowGenerator: this.shadowGenerator,
        qualityPreset: this.qualityPreset,
        initialPosition: { x: px, y: py, z: pz },
        initialRotation: { x: rx, y: ry, z: rz },
        initialScale,
      });

      this.characterAdapters.set(charInstance.id, adapter);
    });
  }

  public async whenAllReady(): Promise<void> {
    const promises: Promise<void>[] = [];
    if (this.environmentAdapter) {
      promises.push(this.environmentAdapter.whenReady());
    }
    this.characterAdapters.forEach((adapter) => {
      promises.push(adapter.whenReady());
    });
    await Promise.all(promises);
  }

  public render(): void {
    this.scene.render();
  }

  public dispose(): void {
    this.characterAdapters.forEach((adapter) => adapter.dispose());
    this.characterAdapters.clear();

    if (this.environmentAdapter) {
      this.environmentAdapter.dispose();
      this.environmentAdapter = null;
    }

    if (this.shadowGenerator) {
      this.shadowGenerator.dispose();
      this.shadowGenerator = null;
    }

    if (this.directionalLight) {
      this.directionalLight.dispose();
      this.directionalLight = null;
    }

    if (this.hemisphericLight) {
      this.hemisphericLight.dispose();
      this.hemisphericLight = null;
    }

    this.scene.dispose();
  }
}
