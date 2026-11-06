import { describe, it, expect } from "vitest";
import { assetRegistry } from "../src/assets/registry";

describe("Asset Registry & Interaction Anchors", () => {
  it("registers built-in character and environment assets", () => {
    expect(assetRegistry.hasAsset("char_faceless_robot")).toBe(true);
    expect(assetRegistry.hasAsset("env_jungle_waterfall")).toBe(true);

    const robot = assetRegistry.getAsset("char_faceless_robot");
    expect(robot).toBeDefined();
    expect(robot?.type).toBe("character");
    expect(robot?.rigProfileId).toBe("rig_anatomical_pivot");

    const jungle = assetRegistry.getAsset("env_jungle_waterfall");
    expect(jungle).toBeDefined();
    expect(jungle?.type).toBe("environment");
    expect(jungle?.anchors?.length).toBeGreaterThan(0);
  });

  it("resolves rig profile capabilities and anatomical pivot mappings", () => {
    const rig = assetRegistry.getRig("rig_anatomical_pivot");
    expect(rig).toBeDefined();
    expect(rig?.capabilities).toContain("walk_to");
    expect(rig?.capabilities).toContain("take_shower");
    expect(rig?.capabilities).toContain("climb");
    expect(rig?.capabilities).toContain("fly");
    expect(rig?.boneOrPivotMap.hipLeft).toBe("leftLegPivot");
  });

  it("locates semantic interaction anchors on the jungle sanctuary", () => {
    const showerAnchor = assetRegistry.findAnchor(
      "env_jungle_waterfall",
      "waterfall_shower_spot"
    );
    expect(showerAnchor).toBeDefined();
    expect(showerAnchor?.type).toBe("shower_spot");
    expect(showerAnchor?.position).toEqual([0.35, 0.05, -2.55]);

    const climbStart = assetRegistry.findAnchor(
      "env_jungle_waterfall",
      "tree_climb_start"
    );
    expect(climbStart).toBeDefined();
    expect(climbStart?.type).toBe("climb_start");

    const allAnchors = assetRegistry.getAllAnchors("env_jungle_waterfall");
    expect(allAnchors.length).toBeGreaterThanOrEqual(5);
  });

  it("returns undefined for non-existent assets and anchors without crashing", () => {
    expect(assetRegistry.getAsset("non_existent_asset")).toBeUndefined();
    expect(
      assetRegistry.findAnchor("env_jungle_waterfall", "imaginary_anchor")
    ).toBeUndefined();
  });
});
