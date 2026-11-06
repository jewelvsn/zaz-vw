import React, { useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Download,
  Upload,
  Video,
  Undo2,
  Redo2,
} from "lucide-react";
import { editorStore, useEditorStore } from "../state/editorStore";
import type { QualityPreset } from "../../schema/types";
import { serializeProject, deserializeProject } from "../../persistence/serializer";

export const TopToolbar: React.FC = () => {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  const qualityPreset = useEditorStore((s) => s.qualityPreset);
  const project = useEditorStore((s) => s.project);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fps = project.settings.fps || 30;
  const seconds = (currentFrame / fps).toFixed(2);

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    editorStore.setQualityPreset(e.target.value as QualityPreset);
  };

  const handleExportJson = () => {
    const jsonStr = serializeProject(project);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const loadedProject = deserializeProject(text);
        editorStore.setProject(loadedProject);
      } catch (err: any) {
        alert("Failed to load project JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <header className="studio-topbar">
      <div className="topbar-section left">
        <div className="studio-brand">
          <span className="brand-dot" />
          <span className="brand-title">{project.title}</span>
          <span className="brand-tag">v{project.schemaVersion}</span>
        </div>

        <div className="history-controls">
          <button
            className="btn-icon"
            onClick={() => editorStore.undo()}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            className="btn-icon"
            onClick={() => editorStore.redo()}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>
        </div>
      </div>

      <div className="topbar-section center">
        <div className="transport-controls">
          <button
            className="btn-icon"
            onClick={() => editorStore.seekFrame(0)}
            title="Rewind to Start"
          >
            <RotateCcw size={15} />
          </button>
          <button
            className="btn-icon"
            onClick={() => editorStore.seekFrame(currentFrame - 1)}
            title="Previous Frame"
          >
            <SkipBack size={15} />
          </button>
          <button
            className={`btn-play ${isPlaying ? "playing" : ""}`}
            onClick={() => editorStore.togglePlay()}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button
            className="btn-icon"
            onClick={() => editorStore.seekFrame(currentFrame + 1)}
            title="Next Frame"
          >
            <SkipForward size={15} />
          </button>
        </div>

        <div className="frame-counter">
          <span className="frame-num">F {String(currentFrame).padStart(3, "0")}</span>
          <span className="frame-time">{seconds}s</span>
        </div>
      </div>

      <div className="topbar-section right">
        <div className="quality-selector">
          <label htmlFor="qualityPreset">Quality:</label>
          <select
            id="qualityPreset"
            value={qualityPreset}
            onChange={handleQualityChange}
            className="select-input"
          >
            <option value="draft">Draft (Fast)</option>
            <option value="preview">Preview (Balanced)</option>
            <option value="cinematic">Cinematic (High-DPR)</option>
          </select>
        </div>

        <button
          className="btn-pill ai-btn"
          onClick={() => editorStore.openAiDrawer(true)}
          title="Open AI Natural Language Scene Planner"
        >
          <Sparkles size={14} />
          <span>AI Scene Planner</span>
        </button>

        <button
          className="btn-pill export-btn"
          onClick={() => editorStore.openExportModal(true)}
          title="Export Video / Frames"
        >
          <Video size={14} />
          <span>Export</span>
        </button>

        <div className="file-actions">
          <button className="btn-icon" onClick={handleExportJson} title="Save Project JSON">
            <Download size={15} />
          </button>
          <button
            className="btn-icon"
            onClick={() => fileInputRef.current?.click()}
            title="Load Project JSON"
          >
            <Upload size={15} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJson}
            accept=".json"
            style={{ display: "none" }}
          />
        </div>
      </div>
    </header>
  );
};
