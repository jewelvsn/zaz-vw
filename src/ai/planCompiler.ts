import type {
  Project,
  AiScenePlan,
  Shot,
  TimelineTrack,
  TimelineClip,
  Vector3Tuple,
} from "../schema/types";
import { generateId } from "../domain/project";
import { assetRegistry } from "../assets/registry";

export function compilePlanToProject(
  currentProject: Project,
  plan: AiScenePlan
): Project {
  // Deep clone current project
  const project: Project = JSON.parse(JSON.stringify(currentProject));
  const scene = project.episodes[0]?.scenes[0];
  if (!scene) return project;

  scene.name = plan.title;
  scene.environment.assetId = plan.environmentAssetId;

  // 1. Reconcile Characters
  plan.characters.forEach((planChar) => {
    let spawnPos: Vector3Tuple = [0, 0, 1.8];
    if (Array.isArray(planChar.initialAnchorOrPosition)) {
      spawnPos = planChar.initialAnchorOrPosition;
    } else if (typeof planChar.initialAnchorOrPosition === "string") {
      const anchor = assetRegistry.findAnchor(
        plan.environmentAssetId,
        planChar.initialAnchorOrPosition
      );
      if (anchor) spawnPos = anchor.position;
    }

    let existing = scene.characters.find((c) => c.id === planChar.characterId);
    if (!existing) {
      existing = {
        id: planChar.characterId,
        name: planChar.name,
        assetId: planChar.assetId,
        initialPosition: spawnPos,
        initialRotation: [0, Math.PI, 0],
        initialScale: [0.45, 0.45, 0.45],
      };
      scene.characters.push(existing);
    } else {
      existing.name = planChar.name;
      existing.assetId = planChar.assetId;
      existing.initialPosition = spawnPos;
    }
  });

  // 2. Build Camera Shots & Collect Timed Actions
  let currentFrameOffset = 0;
  const newShots: Shot[] = [];
  const actionClipsByChar = new Map<string, TimelineClip[]>();
  const dialogueClips: TimelineClip[] = [];

  const dialogueTrackId = generateId("track_dialogue");

  plan.shots.forEach((s, shotIndex) => {
    const startFrame = currentFrameOffset;
    const duration = s.durationFrames || 90;

    newShots.push({
      id: s.shotId || generateId("shot"),
      name: s.name || `Shot ${shotIndex + 1}`,
      startFrame,
      durationFrames: duration,
      cameraPreset: s.cameraPreset,
      primaryTargetId: s.targetEntityId,
      description: s.description,
    });

    // Process actions in this shot
    s.actions.forEach((act, actIndex) => {
      const list = actionClipsByChar.get(act.characterId) || [];
      list.push({
        id: generateId("clip"),
        name: `${act.actionId} (Shot ${shotIndex + 1})`,
        trackId: "", // Will be assigned to track
        startFrame,
        durationFrames: duration,
        type: "action",
        action: {
          actionId: act.actionId,
          targetAnchorId: act.targetAnchorId,
          parameters: act.parameters || {},
        },
      });
      actionClipsByChar.set(act.characterId, list);

      if (act.dialogue) {
        dialogueClips.push({
          id: generateId("clip"),
          name: `Line ${shotIndex + 1}.${actIndex + 1}`,
          trackId: dialogueTrackId,
          startFrame: startFrame + 10,
          durationFrames: Math.max(30, duration - 15),
          type: "dialogue",
          dialogue: {
            characterId: act.characterId,
            text: act.dialogue,
          },
        });
      }
    });

    currentFrameOffset += duration;
  });

  scene.shots = newShots;

  // 3. Assemble Timeline Tracks
  const newTracks: TimelineTrack[] = [];

  actionClipsByChar.forEach((clips, charId) => {
    const trackId = generateId("track");
    clips.forEach((c) => (c.trackId = trackId));

    const charInstance = scene.characters.find((c) => c.id === charId);
    newTracks.push({
      id: trackId,
      name: `${charInstance?.name || charId} Track`,
      type: "character",
      targetEntityId: charId,
      clips,
    });
  });

  if (dialogueClips.length > 0) {
    newTracks.push({
      id: dialogueTrackId,
      name: "Dialogue Subtitles",
      type: "dialogue",
      clips: dialogueClips,
    });
  }

  scene.tracks = newTracks;
  return project;
}
