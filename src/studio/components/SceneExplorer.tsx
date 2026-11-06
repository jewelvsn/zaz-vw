import React from "react";
import {
  Users,
  Camera,
  MapPin,
  Box,
  Compass,
  Plus,
} from "lucide-react";
import { editorStore, useEditorStore } from "../state/editorStore";
import { assetRegistry } from "../../assets/registry";
import { generateId } from "../../domain/project";

export const SceneExplorer: React.FC = () => {
  const project = useEditorStore((s) => s.project);
  const selectedEntityId = useEditorStore((s) => s.selectedEntityId);
  const selectedShotId = useEditorStore((s) => s.selectedShotId);

  const activeScene = project.episodes[0]?.scenes[0];
  const characters = activeScene?.characters || [];
  const shots = activeScene?.shots || [];
  const anchors = activeScene ? assetRegistry.getAllAnchors(activeScene.environment.assetId) : [];

  const handleAddShot = () => {
    const lastShot = shots[shots.length - 1];
    const startFrame = lastShot ? lastShot.startFrame + lastShot.durationFrames : 0;
    const newShot = {
      id: generateId("shot"),
      name: `Shot ${shots.length + 1}`,
      startFrame,
      durationFrames: 90,
      cameraPreset: "medium" as const,
      primaryTargetId: characters[0]?.id || "char_robot_main",
    };
    editorStore.addShot(newShot);
  };

  return (
    <aside className="studio-panel scene-explorer">
      <div className="panel-header">
        <div className="panel-title">
          <Compass size={15} />
          <span>Scene Hierarchy</span>
        </div>
      </div>

      <div className="panel-content scrollable">
        {/* Characters Section */}
        <div className="explorer-section">
          <div className="section-header">
            <Users size={13} />
            <span>Characters ({characters.length})</span>
          </div>
          <ul className="item-list">
            {characters.map((char) => (
              <li
                key={char.id}
                className={`item-row ${selectedEntityId === char.id ? "selected" : ""}`}
                onClick={() => editorStore.selectEntity(char.id)}
              >
                <span className="item-dot character-dot" />
                <span className="item-name">{char.name}</span>
                <span className="item-sub">({char.assetId})</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Camera Shots Section */}
        <div className="explorer-section">
          <div className="section-header">
            <Camera size={13} />
            <span>Camera Shots ({shots.length})</span>
            <button
              className="btn-add-mini"
              onClick={handleAddShot}
              title="Add Camera Shot"
            >
              <Plus size={12} />
            </button>
          </div>
          <ul className="item-list">
            {shots.map((shot) => (
              <li
                key={shot.id}
                className={`item-row ${selectedShotId === shot.id ? "selected" : ""}`}
                onClick={() => editorStore.selectShot(shot.id)}
              >
                <span className="item-dot camera-dot" />
                <div className="item-meta">
                  <span className="item-name">{shot.name}</span>
                  <span className="item-sub">
                    F{shot.startFrame}-{shot.startFrame + shot.durationFrames} ({shot.cameraPreset})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Semantic Interaction Anchors */}
        <div className="explorer-section">
          <div className="section-header">
            <MapPin size={13} />
            <span>Interaction Anchors ({anchors.length})</span>
          </div>
          <ul className="item-list">
            {anchors.map((anchor) => (
              <li
                key={anchor.id}
                className={`item-row ${selectedEntityId === anchor.id ? "selected" : ""}`}
                onClick={() => editorStore.selectEntity(anchor.id)}
              >
                <span className="item-dot anchor-dot" />
                <div className="item-meta">
                  <span className="item-name">{anchor.name}</span>
                  <span className="item-sub">
                    [{anchor.position.map((v) => v.toFixed(1)).join(", ")}] ({anchor.type})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};
