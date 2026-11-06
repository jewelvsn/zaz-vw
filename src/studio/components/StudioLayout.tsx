import React, { useEffect } from "react";
import { TopToolbar } from "./TopToolbar";
import { Viewport } from "./Viewport";
import { SceneExplorer } from "./SceneExplorer";
import { Inspector } from "./Inspector";
import { TimelinePanel } from "./TimelinePanel";
import { AiPlanningDrawer } from "./AiPlanningDrawer";
import { ExportModal } from "./ExportModal";
import { editorStore } from "../state/editorStore";

export const StudioLayout: React.FC = () => {
  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in inputs or textareas
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        editorStore.togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        const current = editorStore.getState().currentFrame;
        editorStore.seekFrame(current - (e.shiftKey ? 10 : 1));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        const current = editorStore.getState().currentFrame;
        editorStore.seekFrame(current + (e.shiftKey ? 10 : 1));
      } else if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        if (e.shiftKey) {
          editorStore.redo();
        } else {
          editorStore.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === "KeyY") {
        e.preventDefault();
        editorStore.redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="studio-app-root">
      {/* 1. Header Toolbar */}
      <TopToolbar />

      {/* 2. Main Middle Workspace: Scene Explorer, 3D Viewport, Properties Inspector */}
      <div className="studio-middle-workspace">
        <SceneExplorer />
        <main className="studio-center-stage">
          <Viewport />
        </main>
        <Inspector />
      </div>

      {/* 3. Bottom Multi-Track Sequencer Timeline */}
      <TimelinePanel />

      {/* 4. Modals & Drawers */}
      <AiPlanningDrawer />
      <ExportModal />
    </div>
  );
};
