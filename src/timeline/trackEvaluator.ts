import type {
  Scene as DomainScene,
  TimelineTrack,
  DialoguePayload,
  Shot,
} from "../schema/types";
import { BabylonSceneBridge } from "../runtime/sceneBridge";
import { CameraDirector } from "../camera/director";
import { actionExecutor } from "../actions/executor";
import type { ActionPoseResult } from "../actions/types";

export interface FrameEvaluationResult {
  frame: number;
  activeShot?: Shot;
  characterPoses: Map<string, ActionPoseResult>;
  activeDialogue?: DialoguePayload;
  effects: {
    thrusters?: boolean;
    waterSplash?: boolean;
    chestGlow?: boolean;
  };
}

export class SceneTrackEvaluator {
  public evaluateFrame(
    frame: number,
    fps: number,
    domainScene: DomainScene,
    tracks: TimelineTrack[],
    sceneBridge: BabylonSceneBridge,
    cameraDirector?: CameraDirector
  ): FrameEvaluationResult {
    const characterPoses = new Map<string, ActionPoseResult>();
    const envAdapter = sceneBridge.getEnvironmentAdapter();

    const mergedEffects = {
      thrusters: false,
      waterSplash: false,
      chestGlow: false,
    };

    // 1. Evaluate Characters
    domainScene.characters.forEach((charInstance) => {
      const pose = actionExecutor.evaluateCharacterPose(
        charInstance.id,
        frame,
        fps,
        domainScene,
        tracks,
        envAdapter
      );
      characterPoses.set(charInstance.id, pose);

      if (pose.effects?.thrusters) mergedEffects.thrusters = true;
      if (pose.effects?.waterSplash) mergedEffects.waterSplash = true;
      if (pose.effects?.chestGlow) mergedEffects.chestGlow = true;

      // Apply to Babylon character adapter if available
      const adapter = sceneBridge.getCharacterAdapter(charInstance.id);
      if (adapter) {
        actionExecutor.applyPoseToAdapter(adapter, pose);
      }
    });

    // 2. Evaluate Camera
    if (cameraDirector) {
      cameraDirector.evaluateShotAtFrame(frame, fps, domainScene.shots || []);
    }

    // 3. Update Procedural Environment Effects
    if (envAdapter) {
      envAdapter.updateProceduralEffects(frame, fps);
    }

    // 4. Resolve Active Shot
    const activeShot = (domainScene.shots || []).find(
      (s) => s.startFrame <= frame && frame < s.startFrame + s.durationFrames
    );

    // 5. Resolve Active Dialogue
    let activeDialogue: DialoguePayload | undefined;
    const dialogueTrack = tracks.find((t) => t.type === "dialogue");
    if (dialogueTrack) {
      const clip = dialogueTrack.clips.find(
        (c) => c.startFrame <= frame && frame < c.startFrame + c.durationFrames
      );
      if (clip?.dialogue) {
        activeDialogue = clip.dialogue;
      }
    }

    return {
      frame,
      activeShot,
      characterPoses,
      activeDialogue,
      effects: mergedEffects,
    };
  }
}

export const sceneTrackEvaluator = new SceneTrackEvaluator();
