import React, { useEffect, useRef, useState } from "react";
import { BabylonEngineBridge } from "../../runtime/engineBridge";
import { BabylonSceneBridge } from "../../runtime/sceneBridge";
import { CameraDirector } from "../../camera/director";
import { sceneTrackEvaluator } from "../../timeline/trackEvaluator";
import { editorStore, useEditorStore } from "../state/editorStore";
import { CAMERA_PRESETS } from "../../camera/presets";

export const Viewport: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineBridgeRef = useRef<BabylonEngineBridge | null>(null);
  const sceneBridgeRef = useRef<BabylonSceneBridge | null>(null);
  const cameraDirectorRef = useRef<CameraDirector | null>(null);

  const project = useEditorStore((s) => s.project);
  const qualityPreset = useEditorStore((s) => s.qualityPreset);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  const activeDialogueText = useEditorStore((s) => s.activeDialogueText);

  const [activeShotName, setActiveShotName] = useState<string>("Establishing Wide");
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [fpsReading, setFpsReading] = useState<number>(60);

  const activeScene = project.episodes[0]?.scenes[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeScene) return;

    // 1. Initialize Babylon Engine Bridge
    const engineBridge = new BabylonEngineBridge({
      canvas,
      qualityPreset,
    });
    engineBridgeRef.current = engineBridge;

    // 2. Initialize Babylon Scene Bridge
    const sceneBridge = new BabylonSceneBridge({
      engine: engineBridge.getEngine(),
      domainScene: activeScene,
      qualityPreset,
    });
    sceneBridgeRef.current = sceneBridge;

    // 3. Initialize Camera Director
    const cameraDirector = new CameraDirector(sceneBridge, canvas);
    cameraDirectorRef.current = cameraDirector;

    // 4. Start Render Loop
    engineBridge.startRenderLoop(() => {
      sceneBridge.render();
      setFpsReading(Math.round(engineBridge.getEngine().getFps()));
    });

    // 5. Initial evaluation at current frame
    const result = sceneTrackEvaluator.evaluateFrame(
      currentFrame,
      project.settings.fps,
      activeScene,
      activeScene.tracks,
      sceneBridge,
      cameraDirector
    );

    if (result.activeShot) {
      const presetInfo = CAMERA_PRESETS[result.activeShot.cameraPreset];
      setActiveShotName(presetInfo?.displayName || result.activeShot.cameraPreset);
    }
    editorStore.setActiveDialogueText(result.activeDialogue?.text || null);

    // Cleanup on unmount or scene change
    return () => {
      cameraDirector.dispose();
      sceneBridge.dispose();
      engineBridge.dispose();
      cameraDirectorRef.current = null;
      sceneBridgeRef.current = null;
      engineBridgeRef.current = null;
    };
  }, [project.id, activeScene?.id]);

  // Update quality preset if changed in store
  useEffect(() => {
    if (engineBridgeRef.current) {
      engineBridgeRef.current.applyQualityPreset(qualityPreset);
    }
  }, [qualityPreset]);

  // Evaluate frame on scrub or tick
  useEffect(() => {
    if (!sceneBridgeRef.current || !activeScene) return;

    const result = sceneTrackEvaluator.evaluateFrame(
      currentFrame,
      project.settings.fps,
      activeScene,
      activeScene.tracks,
      sceneBridgeRef.current,
      cameraDirectorRef.current || undefined
    );

    if (result.activeShot) {
      const presetInfo = CAMERA_PRESETS[result.activeShot.cameraPreset];
      setActiveShotName(`${result.activeShot.name} (${presetInfo?.displayName || result.activeShot.cameraPreset})`);
    } else {
      setActiveShotName("Free Camera Orbit");
    }

    editorStore.setActiveDialogueText(result.activeDialogue?.text || null);

    const effList: string[] = [];
    if (result.effects.thrusters) effList.push("Iron Man Thrusters");
    if (result.effects.waterSplash) effList.push("Waterfall Splashes");
    if (result.effects.chestGlow) effList.push("Arc Reactor Glow");
    setActiveEffects(effList);
  }, [currentFrame, project, activeScene]);

  return (
    <div className="studio-viewport-container">
      <canvas ref={canvasRef} className="babylon-canvas" />

      {/* Cinematic 16:9 Letterbox Guides */}
      <div className="viewport-overlay-guides">
        <div className="guide-frame" />
      </div>

      {/* Active Shot Badge */}
      <div className="viewport-shot-badge">
        <span className="rec-dot" />
        <span className="shot-label">{activeShotName}</span>
      </div>

      {/* Viewport Telemetry HUD */}
      <div className="viewport-hud-telemetry">
        <span className="hud-metric">{fpsReading} FPS</span>
        <span className="hud-metric uppercase">{qualityPreset}</span>
        {activeEffects.map((eff) => (
          <span key={eff} className="hud-pill effect-pill">
            {eff}
          </span>
        ))}
      </div>

      {/* Dialogue Subtitle Overlay */}
      {activeDialogueText && (
        <div className="viewport-subtitle-bar">
          <p className="subtitle-text">{activeDialogueText}</p>
        </div>
      )}
    </div>
  );
};
