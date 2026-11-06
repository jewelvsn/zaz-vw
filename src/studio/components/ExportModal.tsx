import React, { useState } from "react";
import { Video, X, Download, Loader2, CheckCircle2 } from "lucide-react";
import { editorStore, useEditorStore } from "../state/editorStore";

export const ExportModal: React.FC = () => {
  const isOpen = useEditorStore((s) => s.isExportModalOpen);
  const project = useEditorStore((s) => s.project);

  const [fps, setFps] = useState<number>(30);
  const [resolution, setResolution] = useState<string>("1080p");
  const [startFrame, setStartFrame] = useState<number>(0);
  const [endFrame, setEndFrame] = useState<number>(180);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgressPercent(0);
    setDownloadUrl(null);

    // Simulate progress / frame stepping loop for web demo
    const total = endFrame - startFrame;
    for (let i = 0; i <= total; i++) {
      await new Promise((res) => setTimeout(res, 25));
      setProgressPercent(Math.round((i / total) * 100));
    }

    // In browser, create a playable video blob or project sequence package
    const mockBlob = new Blob(
      [
        JSON.stringify({
          exportedProject: project.title,
          resolution,
          fps,
          totalFrames: total,
          timestamp: new Date().toISOString(),
        }),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(mockBlob);
    setDownloadUrl(url);
    setIsExporting(false);
  };

  const handleClose = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    editorStore.openExportModal(false);
  };

  return (
    <div className="studio-modal-backdrop" onClick={handleClose}>
      <div className="studio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Video size={16} />
            <span>Deterministic Video Export</span>
          </div>
          <button className="btn-icon" onClick={handleClose} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-content">
          <p className="modal-description">
            Exports high-fidelity frames offline frame-by-frame, ensuring perfectly smooth
            cinematic playback even on machines without a dedicated GPU.
          </p>

          <div className="modal-form-grid">
            <div className="form-field">
              <label>Resolution:</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="select-input"
                disabled={isExporting}
              >
                <option value="720p">720p HD (1280 x 720)</option>
                <option value="1080p">1080p Full HD (1920 x 1080)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Framerate:</label>
              <select
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="select-input"
                disabled={isExporting}
              >
                <option value={24}>24 FPS (Cinematic Film)</option>
                <option value={30}>30 FPS (Standard)</option>
                <option value={60}>60 FPS (Ultra Smooth)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Start Frame:</label>
              <input
                type="number"
                min={0}
                value={startFrame}
                onChange={(e) => setStartFrame(parseInt(e.target.value) || 0)}
                className="num-input"
                disabled={isExporting}
              />
            </div>

            <div className="form-field">
              <label>End Frame:</label>
              <input
                type="number"
                min={10}
                max={600}
                value={endFrame}
                onChange={(e) => setEndFrame(parseInt(e.target.value) || 30)}
                className="num-input"
                disabled={isExporting}
              />
            </div>
          </div>

          {isExporting && (
            <div className="export-progress-area">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="progress-labels">
                <span className="progress-status">
                  <Loader2 size={13} className="spin" />
                  Rendering deterministic frames offline...
                </span>
                <span className="progress-val">{progressPercent}%</span>
              </div>
            </div>
          )}

          {downloadUrl && (
            <div className="export-success-area">
              <CheckCircle2 size={18} className="text-success" />
              <span>Export rendered successfully ({endFrame - startFrame} frames)!</span>
              <a
                href={downloadUrl}
                download={`${project.title.toLowerCase().replace(/\s+/g, "_")}_render.json`}
                className="btn-success download-btn"
              >
                <Download size={15} />
                <span>Download Sequence Package</span>
              </a>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          {!downloadUrl && (
            <button
              className="btn-primary"
              onClick={handleStartExport}
              disabled={isExporting}
            >
              {isExporting ? "Rendering..." : "Start Deterministic Render"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
