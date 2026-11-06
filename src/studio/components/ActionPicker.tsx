import React from "react";
import {
  Footprints,
  Flame,
  Hand,
  Armchair,
  Trees,
  Droplets,
  Rocket,
  ArrowUp,
  Smile,
  Plus,
} from "lucide-react";
import { actionRegistry } from "../../actions/registry";
import { editorStore, useEditorStore } from "../state/editorStore";
import { generateId } from "../../domain/project";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  idle: <Smile size={14} />,
  walk_to: <Footprints size={14} />,
  run_to: <Flame size={14} />,
  wave: <Hand size={14} />,
  sit_on: <Armchair size={14} />,
  climb: <Trees size={14} />,
  take_shower: <Droplets size={14} />,
  fly: <Rocket size={14} />,
  jump: <ArrowUp size={14} />,
};

export const ActionPicker: React.FC = () => {
  const project = useEditorStore((s) => s.project);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  const selectedEntityId = useEditorStore((s) => s.selectedEntityId);

  const activeScene = project.episodes[0]?.scenes[0];
  const tracks = activeScene?.tracks || [];

  const handleInsertAction = (actionId: string) => {
    const actDef = actionRegistry.getAction(actionId);
    if (!actDef) return;

    // Find or create track for the target character
    const targetCharId = selectedEntityId || "char_robot_main";
    let targetTrack = tracks.find(
      (t) => t.type === "character" && t.targetEntityId === targetCharId
    );

    if (!targetTrack) {
      targetTrack = tracks.find((t) => t.type === "character");
    }

    if (!targetTrack) return;

    const newClip = {
      id: generateId("clip"),
      name: actDef.displayName,
      trackId: targetTrack.id,
      startFrame: currentFrame,
      durationFrames: actDef.defaultDurationFrames,
      type: "action" as const,
      action: {
        actionId: actDef.actionId,
        parameters: actDef.actionId === "fly" ? { altitude: 2.5 } : {},
      },
    };

    editorStore.addClipToTrack(targetTrack.id, newClip);
  };

  const actions = actionRegistry.listActions();

  return (
    <div className="action-picker-bar">
      <span className="picker-label">Action Palette:</span>
      <div className="picker-buttons">
        {actions.map((act) => (
          <button
            key={act.actionId}
            className="btn-action-palette"
            onClick={() => handleInsertAction(act.actionId)}
            title={`Insert ${act.displayName} at Frame ${currentFrame}`}
          >
            {ACTION_ICONS[act.actionId] || <Plus size={14} />}
            <span>{act.displayName}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
