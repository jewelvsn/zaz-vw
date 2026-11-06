import type {
  AssetManifest,
  RigProfile,
  InteractionAnchor,
} from "../schema/types";

export const ANATOMICAL_PIVOT_RIG: RigProfile = {
  id: "rig_anatomical_pivot",
  name: "Anatomical Multi-Pivot Chibi Rig",
  type: "anatomical-pivot",
  defaultHeight: 1.44,
  boneOrPivotMap: {
    hipLeft: "leftLegPivot",
    hipRight: "rightLegPivot",
    kneeLeft: "leftKneePivot",
    kneeRight: "rightKneePivot",
    shoulderLeft: "leftArmPivot",
    shoulderRight: "rightArmPivot",
    neck: "headPivot",
    root: "characterRoot",
    visual: "characterVisual",
  },
  capabilities: [
    "idle",
    "walk_to",
    "run_to",
    "turn_to",
    "jump",
    "sit_on",
    "stand_up",
    "climb",
    "look_at",
    "wave",
    "dance",
    "fly",
    "take_shower",
    "interact",
  ],
};

export const JUNGLE_ANCHORS: InteractionAnchor[] = [
  {
    id: "clearing_center",
    name: "Sanctuary Clearing Center",
    type: "spawn",
    position: [0, 0, 1.8],
    rotation: [0, Math.PI, 0],
    description: "Central opening facing the waterfall",
  },
  {
    id: "waterfall_shower_spot",
    name: "Waterfall Shower Spot",
    type: "shower_spot",
    position: [0.35, 0.05, -2.55],
    rotation: [0, 0.2, 0],
    description: "Directly under cascading waterfall stream",
  },
  {
    id: "lagoon_plunge_pool",
    name: "Lagoon Plunge Pool Edge",
    type: "approach",
    position: [0, 0.15, -1.8],
    rotation: [0, Math.PI, 0],
    description: "Edge of the deep aquamarine lagoon",
  },
  {
    id: "tree_climb_start",
    name: "Giant Mahogany Trunk Base",
    type: "climb_start",
    position: [-4.2, 0, -1.8],
    rotation: [0, Math.PI / 4, 0],
    description: "Base of climbable mahogany tree trunk",
  },
  {
    id: "tree_climb_branch",
    name: "Canopy Branch Perch",
    type: "climb_end",
    position: [-4.1, 2.05, -1.4],
    rotation: [0, Math.PI / 1.3, 0],
    description: "Sturdy branch overlooking the jungle waterfall",
  },
  {
    id: "moss_rock_bench",
    name: "Mossy Rock Seat",
    type: "seat",
    position: [2.5, 0.25, 0.5],
    rotation: [0, -Math.PI / 3, 0],
    description: "Flat moss-covered boulder suitable for sitting",
  },
];

export const BUILTIN_ASSETS: AssetManifest[] = [
  {
    id: "char_faceless_robot",
    name: "Faceless Kids Robot",
    type: "character",
    uri: "/faceless_kids_robot.glb",
    rigProfileId: "rig_anatomical_pivot",
    tags: ["robot", "chibi", "hero", "biped"],
    metadata: {
      defaultScale: [0.45, 0.45, 0.45],
      speedTiers: {
        walk: 2.8,
        run: 6.0,
        turbo: 10.5,
        fly: 6.8,
        flyBoost: 14.5,
      },
    },
  },
  {
    id: "env_jungle_waterfall",
    name: "Jungle Waterfall Sanctuary",
    type: "environment",
    uri: "/jungle_waterfall_hq.glb",
    tags: ["jungle", "waterfall", "nature", "lagoon", "tropical"],
    anchors: JUNGLE_ANCHORS,
    metadata: {
      boundsRadius: 5.6,
      flightCeiling: 16.0,
    },
  },
  {
    id: "prop_rock_bench",
    name: "Mossy Boulder",
    type: "prop",
    uri: "/jungle_waterfall_hq.glb",
    tags: ["nature", "rock", "seat"],
    anchors: [
      {
        id: "rock_seat_surface",
        name: "Boulder Top Seat",
        type: "seat",
        position: [0, 0.3, 0],
      },
    ],
  },
  {
    id: "prop_wooden_crate",
    name: "Supply Crate",
    type: "prop",
    uri: "",
    tags: ["prop", "container"],
    anchors: [
      {
        id: "crate_top",
        name: "Crate Top Surface",
        type: "seat",
        position: [0, 0.6, 0],
      },
    ],
  },
];

export class AssetRegistry {
  private assets = new Map<string, AssetManifest>();
  private rigs = new Map<string, RigProfile>();

  constructor() {
    // Register builtins
    this.registerRig(ANATOMICAL_PIVOT_RIG);
    BUILTIN_ASSETS.forEach((asset) => this.registerAsset(asset));
  }

  registerAsset(asset: AssetManifest): void {
    this.assets.set(asset.id, asset);
  }

  getAsset(id: string): AssetManifest | undefined {
    return this.assets.get(id);
  }

  hasAsset(id: string): boolean {
    return this.assets.has(id);
  }

  listAssets(type?: AssetManifest["type"]): AssetManifest[] {
    const list = Array.from(this.assets.values());
    if (type) {
      return list.filter((a) => a.type === type);
    }
    return list;
  }

  registerRig(rig: RigProfile): void {
    this.rigs.set(rig.id, rig);
  }

  getRig(id: string): RigProfile | undefined {
    return this.rigs.get(id);
  }

  findAnchor(
    environmentAssetId: string,
    anchorId: string
  ): InteractionAnchor | undefined {
    const env = this.getAsset(environmentAssetId);
    if (!env || !env.anchors) return undefined;
    return env.anchors.find((a) => a.id === anchorId);
  }

  getAllAnchors(environmentAssetId: string): InteractionAnchor[] {
    const env = this.getAsset(environmentAssetId);
    return env?.anchors || [];
  }
}

export const assetRegistry = new AssetRegistry();
