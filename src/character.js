import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

/**
 * Creates and rigs the 3D Faceless Kids Robot character hierarchy with anatomical pivots
 * for realistic human-like walking and running gait.
 *
 * @param {BABYLON.Scene} scene
 * @param {BABYLON.ShadowGenerator} shadowGenerator
 * @returns {object} characterRig object containing root, visual, and anatomical pivots
 */
export function setupCharacter(scene, shadowGenerator) {
  // 1. Root node: spawn in the jungle clearing at (0, 0, 1.8) facing the waterfall
  const root = new BABYLON.TransformNode("characterRoot", scene);
  root.position = new BABYLON.Vector3(0, 0, 1.8);
  root.rotation = new BABYLON.Vector3(0, Math.PI, 0);

  // 2. Visual node for procedural secondary animations (bounce, pitch lean, roll tilt)
  const visual = new BABYLON.TransformNode("characterVisual", scene);
  visual.parent = root;
  visual.position = new BABYLON.Vector3(0, 0, 0);
  visual.rotation = new BABYLON.Vector3(0, 0, 0);
  visual.scaling = new BABYLON.Vector3(1, 1, 1);

  // Character Rig state object
  const rig = {
    root,
    visual,
    isReady: false,
    leftLegPivot: null,
    rightLegPivot: null,
    leftKneePivot: null,
    rightKneePivot: null,
    leftArmPivot: null,
    rightArmPivot: null,
    headPivot: null,
  };

  // 3. Load 3D Character Model (GLB)
  BABYLON.SceneLoader.ImportMeshAsync("", "/", "faceless_kids_robot.glb", scene)
    .then((result) => {
      const robotRoot = scene.getTransformNodeByName("Faceless Kids Robot");
      if (!robotRoot) {
        console.error("Faceless Kids Robot root node not found in GLB");
        return;
      }

      // Parent entire model to characterVisual
      robotRoot.parent = visual;
      // Facing orientation: aligns character front face to +Z locomotion heading
      robotRoot.rotation.y = 0;
      // Scale character so height is ~1.4m, perfectly proportioned for the jungle sanctuary
      robotRoot.scaling.setAll(0.45);

      // 4. Create Anatomical Pivot Nodes

      // --- LEFT LEG ---
      // Hip joint located at (-0.34, 0.78, 0)
      const leftLegPivot = new BABYLON.TransformNode("leftLegPivot", scene);
      leftLegPivot.parent = robotRoot;
      leftLegPivot.position.set(-0.34, 0.78, 0);

      ["left hip joint", "left thigh shell"].forEach((name) => {
        const m = scene.getMeshByName(name);
        if (m) {
          m.position.subtractInPlace(leftLegPivot.position);
          m.parent = leftLegPivot;
        }
      });

      // Left Knee joint located at (-0.34, 0.41, 0.07)
      const leftKneePivot = new BABYLON.TransformNode("leftKneePivot", scene);
      leftKneePivot.parent = leftLegPivot;
      leftKneePivot.position.set(0, 0.41 - 0.78, 0.07 - 0);

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
          m.parent = leftKneePivot;
        }
      });

      // --- RIGHT LEG ---
      // Hip joint located at (0.34, 0.78, 0)
      const rightLegPivot = new BABYLON.TransformNode("rightLegPivot", scene);
      rightLegPivot.parent = robotRoot;
      rightLegPivot.position.set(0.34, 0.78, 0);

      ["right hip joint", "right thigh shell"].forEach((name) => {
        const m = scene.getMeshByName(name);
        if (m) {
          m.position.subtractInPlace(rightLegPivot.position);
          m.parent = rightLegPivot;
        }
      });

      // Right Knee joint located at (0.34, 0.41, 0.07)
      const rightKneePivot = new BABYLON.TransformNode("rightKneePivot", scene);
      rightKneePivot.parent = rightLegPivot;
      rightKneePivot.position.set(0, 0.41 - 0.78, 0.07 - 0);

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
          m.parent = rightKneePivot;
        }
      });

      // --- LEFT ARM ---
      // Shoulder joint located at (-0.65, 1.5, 0.015)
      const leftArmPivot = new BABYLON.TransformNode("leftArmPivot", scene);
      leftArmPivot.parent = robotRoot;
      leftArmPivot.position.set(-0.65, 1.5, 0.015);

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
          m.position.subtractInPlace(leftArmPivot.position);
          m.parent = leftArmPivot;
        }
      });

      // --- RIGHT ARM ---
      // Shoulder joint located at (0.65, 1.51, 0.015)
      const rightArmPivot = new BABYLON.TransformNode("rightArmPivot", scene);
      rightArmPivot.parent = robotRoot;
      rightArmPivot.position.set(0.65, 1.51, 0.015);

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
          m.position.subtractInPlace(rightArmPivot.position);
          m.parent = rightArmPivot;
        }
      });

      // --- HEAD & NECK ---
      // Neck joint located at (0, 1.77, 0)
      const headPivot = new BABYLON.TransformNode("headPivot", scene);
      headPivot.parent = robotRoot;
      headPivot.position.set(0, 1.77, 0);

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
          m.position.subtractInPlace(headPivot.position);
          m.parent = headPivot;
        }
      });

      // 5. Register all robot meshes for Dynamic Shadows
      result.meshes.forEach((mesh) => {
        mesh.receiveShadows = true;
        if (shadowGenerator && mesh.name !== "__root__") {
          shadowGenerator.addShadowCaster(mesh, true);
        }
      });

      // Expose pivots to the rig
      rig.leftLegPivot = leftLegPivot;
      rig.rightLegPivot = rightLegPivot;
      rig.leftKneePivot = leftKneePivot;
      rig.rightKneePivot = rightKneePivot;
      rig.leftArmPivot = leftArmPivot;
      rig.rightArmPivot = rightArmPivot;
      rig.headPivot = headPivot;
      rig.isReady = true;

      console.log("Faceless Kids Robot successfully rigged with anatomical pivots!");
    })
    .catch((err) => {
      console.error("Failed to load faceless_kids_robot.glb:", err);
    });

  return rig;
}
