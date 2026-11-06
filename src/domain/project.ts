import type {
  Project,
  Episode,
  Scene,
  CharacterInstance,
  PropInstance,
  TimelineTrack,
  TimelineClip,
  Shot,
  CameraPresetType,
  Vector3Tuple,
  Rotation3Tuple,
  ActionInvocation,
} from "../schema/types";

export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

export function createDefaultProject(title = "New Animation Project"): Project {
  const timestamp = new Date().toISOString();
  const sceneId = generateId("scene");
  const episodeId = generateId("ep");

  const defaultScene: Scene = {
    id: sceneId,
    name: "Jungle Waterfall Scene",
    environment: {
      assetId: "env_jungle_waterfall",
      fogMode: "exp2",
      fogDensity: 0.016,
      fogColor: [14 / 255, 30 / 255, 32 / 255],
      clearColor: [14 / 255, 30 / 255, 32 / 255, 1.0],
      sunlight: {
        direction: [-0.6, -1.2, 0.5],
        intensity: 1.45,
        color: [1.0, 0.97, 0.9],
        shadowEnabled: true,
      },
      ambientLight: {
        intensity: 0.55,
        skyColor: [0.85, 0.95, 1.0],
        groundColor: [0.12, 0.24, 0.16],
      },
    },
    characters: [
      {
        id: "char_robot_main",
        name: "Faceless Kids Robot",
        assetId: "char_faceless_robot",
        initialPosition: [0, 0, 1.8],
        initialRotation: [0, Math.PI, 0],
        initialScale: [0.45, 0.45, 0.45],
      },
    ],
    props: [],
    shots: [
      {
        id: generateId("shot"),
        name: "Opening Establishing Shot",
        startFrame: 0,
        durationFrames: 90, // 3 seconds at 30 fps
        cameraPreset: "establishing_wide",
        primaryTargetId: "char_robot_main",
        description: "Wide cinematic view of the jungle waterfall with robot in clearing",
      },
      {
        id: generateId("shot"),
        name: "Approach Waterfall",
        startFrame: 90,
        durationFrames: 120, // 4 seconds
        cameraPreset: "tracking_side",
        primaryTargetId: "char_robot_main",
        description: "Tracking camera following robot walking toward lagoon",
      },
      {
        id: generateId("shot"),
        name: "Shower Close-up",
        startFrame: 210,
        durationFrames: 90, // 3 seconds
        cameraPreset: "medium",
        primaryTargetId: "char_robot_main",
        description: "Medium shot of robot catching waterfall splash droplets",
      },
    ],
    tracks: [
      {
        id: generateId("track"),
        name: "Robot Action Track",
        type: "character",
        targetEntityId: "char_robot_main",
        clips: [
          {
            id: generateId("clip"),
            name: "Idle Surveying",
            trackId: "",
            startFrame: 0,
            durationFrames: 60,
            type: "action",
            action: {
              actionId: "idle",
              parameters: { breathIntensity: 1.0 },
            },
          },
          {
            id: generateId("clip"),
            name: "Walk to Waterfall",
            trackId: "",
            startFrame: 60,
            durationFrames: 150,
            type: "action",
            action: {
              actionId: "walk_to",
              targetAnchorId: "waterfall_shower_spot",
              parameters: { speed: 2.8 },
            },
          },
          {
            id: generateId("clip"),
            name: "Waterfall Shower",
            trackId: "",
            startFrame: 210,
            durationFrames: 90,
            type: "action",
            action: {
              actionId: "take_shower",
              parameters: { splashIntensity: 1.0 },
            },
          },
        ],
      },
      {
        id: generateId("track"),
        name: "Cinematic Camera Track",
        type: "camera",
        clips: [
          {
            id: generateId("clip"),
            name: "Establishing Wide",
            trackId: "",
            startFrame: 0,
            durationFrames: 90,
            type: "camera",
            camera: {
              preset: "establishing_wide",
              targetEntityId: "char_robot_main",
            },
          },
          {
            id: generateId("clip"),
            name: "Follow Tracking",
            trackId: "",
            startFrame: 90,
            durationFrames: 120,
            type: "camera",
            camera: {
              preset: "tracking_side",
              targetEntityId: "char_robot_main",
            },
          },
          {
            id: generateId("clip"),
            name: "Medium Shot",
            trackId: "",
            startFrame: 210,
            durationFrames: 90,
            type: "camera",
            camera: {
              preset: "medium",
              targetEntityId: "char_robot_main",
            },
          },
        ],
      },
    ],
  };

  // Associate trackId with its clips
  defaultScene.tracks.forEach((track) => {
    track.clips.forEach((clip) => {
      clip.trackId = track.id;
    });
  });

  const defaultEpisode: Episode = {
    id: episodeId,
    name: "Episode 1: The Sanctuary",
    scenes: [defaultScene],
  };

  return {
    schemaVersion: "1.0.0",
    id: generateId("proj"),
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    settings: {
      title,
      fps: 30,
      width: 1920,
      height: 1080,
      qualityPreset: "preview",
    },
    assets: [
      {
        id: "char_faceless_robot",
        name: "Faceless Kids Robot",
        type: "character",
        uri: "/faceless_kids_robot.glb",
        rigProfileId: "rig_anatomical_pivot",
        tags: ["robot", "chibi", "hero"],
      },
      {
        id: "env_jungle_waterfall",
        name: "Jungle Waterfall Sanctuary",
        type: "environment",
        uri: "/jungle_waterfall_hq.glb",
        tags: ["nature", "jungle", "waterfall", "lagoon"],
      },
    ],
    episodes: [defaultEpisode],
  };
}
