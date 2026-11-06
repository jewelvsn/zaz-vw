import React, { useRef } from "react";
import { Film, Video, MessageSquare, Layers } from "lucide-react";
import { editorStore, useEditorStore } from "../state/editorStore";
import { ActionPicker } from "./ActionPicker";

const FRAME_WIDTH_PX = 3.5; // Pixels per frame

export const TimelinePanel: React.FC = () => {
  const project = useEditorStore((s) => s.project);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectedShotId = useEditorStore((s) => s.selectedShotId);

  const rulerRef = useRef<HTMLDivElement>(null);

  const activeScene = project.episodes[0]?.scenes[0];
  const tracks = activeScene?.tracks || [];
  const shots = activeScene?.shots || [];
  const totalFrames = 360;

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetFrame = Math.max(0, Math.min(totalFrames - 1, Math.round(clickX / FRAME_WIDTH_PX)));
    editorStore.seekFrame(targetFrame);
  };

  const rulerTicks = [];
  for (let f = 0; f <= totalFrames; f += 10) {
    const isMajor = f % 30 === 0;
    rulerTicks.push(
      <div
        key={f}
        className={`ruler-tick ${isMajor ? "major" : "minor"}`}
        style={{ left: `${f * FRAME_WIDTH_PX}px` }}
      >
        {isMajor && <span className="ruler-label">F{f}</span>}
      </div>
    );
  }

  return (
    <section className="studio-timeline-panel">
      {/* Top Action Quick Palette */}
      <ActionPicker />

      {/* Sequencer Track Headers & Timeline Canvas */}
      <div className="sequencer-container">
        {/* Left Track Headers */}
        <div className="track-headers-column">
          <div className="ruler-header">
            <span>Ruler</span>
          </div>

          <div className="track-header shots-track-header">
            <Video size={13} />
            <span>Camera Shots</span>
          </div>

          {tracks.map((track) => (
            <div key={track.id} className="track-header">
              {track.type === "character" && <Film size={13} />}
              {track.type === "dialogue" && <MessageSquare size={13} />}
              {track.type !== "character" && track.type !== "dialogue" && <Layers size={13} />}
              <span className="track-name">{track.name}</span>
            </div>
          ))}
        </div>

        {/* Scrollable Tracks and Playhead */}
        <div className="tracks-scroll-area" ref={rulerRef} onClick={handleRulerClick}>
          {/* Frame Ruler */}
          <div className="timeline-ruler" style={{ width: `${totalFrames * FRAME_WIDTH_PX}px` }}>
            {rulerTicks}
          </div>

          {/* Red Playhead Cursor */}
          <div
            className="timeline-playhead"
            style={{ left: `${currentFrame * FRAME_WIDTH_PX}px` }}
          >
            <div className="playhead-needle" />
            <div className="playhead-line" />
          </div>

          {/* Camera Shots Track */}
          <div
            className="track-lane shots-lane"
            style={{ width: `${totalFrames * FRAME_WIDTH_PX}px` }}
          >
            {shots.map((shot) => {
              const left = shot.startFrame * FRAME_WIDTH_PX;
              const width = shot.durationFrames * FRAME_WIDTH_PX;
              const isSelected = selectedShotId === shot.id;

              return (
                <div
                  key={shot.id}
                  className={`timeline-block shot-block ${isSelected ? "selected" : ""}`}
                  style={{ left: `${left}px`, width: `${width}px` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    editorStore.selectShot(shot.id);
                  }}
                  title={`${shot.name} (${shot.cameraPreset})`}
                >
                  <span className="block-title">{shot.name}</span>
                  <span className="block-sub">[{shot.cameraPreset}]</span>
                </div>
              );
            })}
          </div>

          {/* Tracks Lanes */}
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`track-lane ${track.type}-lane`}
              style={{ width: `${totalFrames * FRAME_WIDTH_PX}px` }}
            >
              {track.clips.map((clip) => {
                const left = clip.startFrame * FRAME_WIDTH_PX;
                const width = clip.durationFrames * FRAME_WIDTH_PX;
                const isSelected = selectedClipId === clip.id;

                let blockTypeClass = "action-block";
                if (clip.action?.actionId === "fly") blockTypeClass += " flight-block";
                else if (clip.action?.actionId === "take_shower") blockTypeClass += " shower-block";
                else if (clip.action?.actionId === "climb") blockTypeClass += " climb-block";
                else if (clip.type === "dialogue") blockTypeClass = "dialogue-block";

                return (
                  <div
                    key={clip.id}
                    className={`timeline-block ${blockTypeClass} ${isSelected ? "selected" : ""}`}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      editorStore.selectClip(clip.id);
                    }}
                    title={`${clip.name} (F${clip.startFrame}-${clip.startFrame + clip.durationFrames})`}
                  >
                    <span className="block-title">{clip.name}</span>
                    <span className="block-sub">{clip.action?.actionId || clip.type}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
