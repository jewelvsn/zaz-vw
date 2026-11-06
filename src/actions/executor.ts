import type {
  Scene as DomainScene,
  TimelineTrack,
  TimelineClip,
  Vector3Like,
} from "../schema/types";
import type { ActionPoseResult, ActionEvaluationContext } from "./types";
import { actionRegistry, IdleAction } from "./registry";
import { BabylonCharacterAdapter } from "../runtime/characterAdapter";
import { BabylonEnvironmentAdapter } from "../runtime/environmentAdapter";

export class ActionExecutor {
  /**
   * Evaluates the action pose for a given character at a specific frame.
   */
  public evaluateCharacterPose(
    characterId: string,
    frame: number,
    fps: number,
    domainScene: DomainScene,
    tracks: TimelineTrack[],
    envAdapter?: BabylonEnvironmentAdapter | null
  ): ActionPoseResult {
    const charInstance = domainScene.characters.find((c) => c.id === characterId);
    const initialPos: Vector3Like = charInstance
      ? {
          x: charInstance.initialPosition[0],
          y: charInstance.initialPosition[1],
          z: charInstance.initialPosition[2],
        }
      : { x: 0, y: 0, z: 0 };

    const initialRot: Vector3Like = charInstance
      ? {
          x: charInstance.initialRotation[0],
          y: charInstance.initialRotation[1],
          z: charInstance.initialRotation[2],
        }
      : { x: 0, y: 0, z: 0 };

    // Find track targeting this character
    const charTrack = (tracks || []).find(
      (t) => t.type === "character" && t.targetEntityId === characterId
    );

    let activeClip: TimelineClip | undefined;
    if (charTrack) {
      activeClip = charTrack.clips.find(
        (c) =>
          c.startFrame <= frame && frame < c.startFrame + c.durationFrames
      );
    }

    if (!activeClip || !activeClip.action) {
      // Fallback to default Idle action
      return IdleAction.evaluatePose({
        globalFrame: frame,
        localFrame: frame % 90,
        durationFrames: 90,
        fps,
        parameters: {},
        initialTransform: {
          position: initialPos,
          rotation: initialRot,
        },
      });
    }

    const actionDef = actionRegistry.getAction(activeClip.action.actionId) || IdleAction;
    const localFrame = frame - activeClip.startFrame;

    // Resolve target anchor if specified
    let targetAnchorPos: Vector3Like | null = null;
    let targetAnchorRot: Vector3Like | null = null;
    const anchorId = activeClip.action.targetAnchorId;

    if (anchorId && envAdapter) {
      const babylonPos = envAdapter.getAnchorWorldPosition(anchorId);
      if (babylonPos) {
        targetAnchorPos = { x: babylonPos.x, y: babylonPos.y, z: babylonPos.z };
      }
      const babylonRot = envAdapter.getAnchorWorldRotation(anchorId);
      if (babylonRot) {
        targetAnchorRot = { x: babylonRot.x, y: babylonRot.y, z: babylonRot.z };
      }
    }

    const context: ActionEvaluationContext = {
      globalFrame: frame,
      localFrame,
      durationFrames: activeClip.durationFrames,
      fps,
      parameters: activeClip.action.parameters || {},
      initialTransform: {
        position: initialPos,
        rotation: initialRot,
      },
      targetAnchorPosition: targetAnchorPos,
      targetAnchorRotation: targetAnchorRot,
    };

    return actionDef.evaluatePose(context);
  }

  /**
   * Applies an evaluated pose directly to a BabylonCharacterAdapter.
   */
  public applyPoseToAdapter(
    adapter: BabylonCharacterAdapter,
    pose: ActionPoseResult
  ): void {
    adapter.setPosition(pose.position);
    adapter.setRotation(pose.rotation);
    adapter.setVisualTransform(
      pose.visualTransform.bounceY,
      pose.visualTransform.pitchX,
      pose.visualTransform.rollZ,
      pose.visualTransform.scaleY,
      pose.visualTransform.scaleX
    );
    adapter.setLimbRotations(pose.limbRotations);
  }
}

export const actionExecutor = new ActionExecutor();
