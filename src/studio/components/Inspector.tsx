import React from "react";
import { Sliders, Trash2, Video, Activity, MapPin } from "lucide-react";
import { editorStore, useEditorStore } from "../state/editorStore";
import { CAMERA_PRESETS } from "../../camera/presets";
import { actionRegistry } from "../../actions/registry";
import { assetRegistry } from "../../assets/registry";
import type { CameraPresetType } from "../../schema/types";

export const Inspector: React.FC = () => {
  const project = useEditorStore((s) => s.project);
  const selectedEntityId = useEditorStore((s) => s.selectedEntityId);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectedShotId = useEditorStore((s) => s.selectedShotId);

  const activeScene = project.episodes[0]?.scenes[0];
  const characters = activeScene?.characters || [];
  const shots = activeScene?.shots || [];
  const tracks = activeScene?.tracks || [];
  const anchors = activeScene ? assetRegistry.getAllAnchors(activeScene.environment.assetId) : [];

  // Find selected item
  const selectedCharacter = characters.find((c) => c.id === selectedEntityId);
  const selectedAnchor = anchors.find((a) => a.id === selectedEntityId);
  const selectedShot = shots.find((s) => s.id === selectedShotId);

  let selectedClipTrackId = "";
  let selectedClip = tracks.flatMap((t) => {
    const c = t.clips.find((clip) => clip.id === selectedClipId);
    if (c) selectedClipTrackId = t.id;
    return c ? [c] : [];
  })[0];

  return (
    <aside className="studio-panel inspector-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Sliders size={15} />
          <span>Properties Inspector</span>
        </div>
      </div>

      <div className="panel-content scrollable">
        {/* CHARACTER INSPECTION */}
        {selectedCharacter && (
          <div className="inspector-group">
            <div className="group-title">
              <Activity size={14} />
              <span>Character: {selectedCharacter.name}</span>
            </div>

            <div className="field-row">
              <label>Asset ID:</label>
              <span className="field-value-pill">{selectedCharacter.assetId}</span>
            </div>

            <div className="field-row">
              <label>Position X/Y/Z:</label>
              <div className="vec3-inputs">
                <span>{selectedCharacter.initialPosition[0].toFixed(2)}</span>
                <span>{selectedCharacter.initialPosition[1].toFixed(2)}</span>
                <span>{selectedCharacter.initialPosition[2].toFixed(2)}</span>
              </div>
            </div>

            <div className="field-row">
              <label>Rotation Y:</label>
              <span className="field-value-pill">
                {(selectedCharacter.initialRotation[1] * (180 / Math.PI)).toFixed(1)}°
              </span>
            </div>
          </div>
        )}

        {/* TIMELINE CLIP INSPECTION */}
        {selectedClip && selectedClip.action && (
          <div className="inspector-group">
            <div className="group-title">
              <Activity size={14} />
              <span>Action Clip: {selectedClip.name}</span>
              <button
                className="btn-danger-icon"
                onClick={() => editorStore.removeClip(selectedClip!.id)}
                title="Delete Clip"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="field-row">
              <label>Action:</label>
              <span className="field-value-pill">{selectedClip.action.actionId}</span>
            </div>

            <div className="field-row">
              <label>Duration (Frames):</label>
              <input
                type="number"
                min={10}
                max={600}
                step={5}
                value={selectedClip.durationFrames}
                onChange={(e) =>
                  editorStore.updateClip(selectedClip!.id, {
                    durationFrames: parseInt(e.target.value) || 30,
                  })
                }
                className="num-input"
              />
            </div>

            <div className="field-row">
              <label>Target Anchor:</label>
              <select
                value={selectedClip.action.targetAnchorId || ""}
                onChange={(e) => {
                  const val = e.target.value || undefined;
                  editorStore.updateClip(selectedClip!.id, {
                    action: {
                      ...selectedClip!.action!,
                      targetAnchorId: val,
                    },
                  });
                }}
                className="select-input"
              >
                <option value="">None (Forward)</option>
                {anchors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Parameters for Action */}
            {selectedClip.action.actionId === "fly" && (
              <div className="field-row">
                <label>Altitude (m):</label>
                <input
                  type="range"
                  min={1.2}
                  max={8.0}
                  step={0.2}
                  value={
                    typeof selectedClip.action.parameters?.altitude === "number"
                      ? selectedClip.action.parameters.altitude
                      : 2.5
                  }
                  onChange={(e) =>
                    editorStore.updateClip(selectedClip!.id, {
                      action: {
                        ...selectedClip!.action!,
                        parameters: {
                          ...selectedClip!.action!.parameters,
                          altitude: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                />
              </div>
            )}

            {selectedClip.action.actionId === "walk_to" && (
              <div className="field-row">
                <label>Speed Multiplier:</label>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  value={
                    typeof selectedClip.action.parameters?.speed === "number"
                      ? selectedClip.action.parameters.speed
                      : 1.0
                  }
                  onChange={(e) =>
                    editorStore.updateClip(selectedClip!.id, {
                      action: {
                        ...selectedClip!.action!,
                        parameters: {
                          ...selectedClip!.action!.parameters,
                          speed: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* CAMERA SHOT INSPECTION */}
        {selectedShot && (
          <div className="inspector-group">
            <div className="group-title">
              <Video size={14} />
              <span>Camera Shot: {selectedShot.name}</span>
              <button
                className="btn-danger-icon"
                onClick={() => editorStore.removeShot(selectedShot!.id)}
                title="Delete Shot"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="field-row">
              <label>Preset:</label>
              <select
                value={selectedShot.cameraPreset}
                onChange={(e) =>
                  editorStore.updateShot(selectedShot!.id, {
                    cameraPreset: e.target.value as CameraPresetType,
                  })
                }
                className="select-input"
              >
                {Object.entries(CAMERA_PRESETS).map(([k, cfg]) => (
                  <option key={k} value={k}>
                    {cfg.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <label>Primary Target:</label>
              <select
                value={selectedShot.primaryTargetId || ""}
                onChange={(e) =>
                  editorStore.updateShot(selectedShot!.id, {
                    primaryTargetId: e.target.value || undefined,
                  })
                }
                className="select-input"
              >
                <option value="">World Origin (0,0,0)</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Character: {c.name}
                  </option>
                ))}
                {anchors.map((a) => (
                  <option key={a.id} value={a.id}>
                    Anchor: {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <label>Start Frame:</label>
              <input
                type="number"
                min={0}
                value={selectedShot.startFrame}
                onChange={(e) =>
                  editorStore.updateShot(selectedShot!.id, {
                    startFrame: parseInt(e.target.value) || 0,
                  })
                }
                className="num-input"
              />
            </div>

            <div className="field-row">
              <label>Duration (Frames):</label>
              <input
                type="number"
                min={15}
                value={selectedShot.durationFrames}
                onChange={(e) =>
                  editorStore.updateShot(selectedShot!.id, {
                    durationFrames: parseInt(e.target.value) || 30,
                  })
                }
                className="num-input"
              />
            </div>
          </div>
        )}

        {/* ANCHOR INSPECTION */}
        {selectedAnchor && (
          <div className="inspector-group">
            <div className="group-title">
              <MapPin size={14} />
              <span>Anchor: {selectedAnchor.name}</span>
            </div>
            <div className="field-row">
              <label>Type:</label>
              <span className="field-value-pill">{selectedAnchor.type}</span>
            </div>
            <div className="field-row">
              <label>Coordinates:</label>
              <span className="field-value-pill">
                [{selectedAnchor.position.map((v) => v.toFixed(2)).join(", ")}]
              </span>
            </div>
          </div>
        )}

        {!selectedCharacter && !selectedClip && !selectedShot && !selectedAnchor && (
          <div className="empty-state">
            <p>Select a character, action clip, camera shot, or anchor to view properties.</p>
          </div>
        )}
      </div>
    </aside>
  );
};
