import React, { useState } from "react";
import { Sparkles, X, Check, AlertTriangle, ArrowRight, Wand2 } from "lucide-react";
import { editorStore, useEditorStore } from "../state/editorStore";
import { MockAiProvider } from "../../ai/providerInterface";
import { buildCatalogSystemPrompt } from "../../ai/promptBuilder";
import { validateAndRepairPlan, PlanValidationReport } from "../../ai/planValidator";
import { compilePlanToProject } from "../../ai/planCompiler";

const aiProvider = new MockAiProvider();

export const AiPlanningDrawer: React.FC = () => {
  const isOpen = useEditorStore((s) => s.isAiDrawerOpen);
  const project = useEditorStore((s) => s.project);

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<PlanValidationReport | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const catalogContext = buildCatalogSystemPrompt();
      const rawOutput = await aiProvider.generateScenePlan(prompt, catalogContext);
      const valReport = validateAndRepairPlan(rawOutput);
      setReport(valReport);
    } catch (err: any) {
      alert("AI Generation error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!report?.plan) return;
    const updatedProject = compilePlanToProject(project, report.plan);
    editorStore.setProject(updatedProject);
    editorStore.openAiDrawer(false);
  };

  const setPresetPrompt = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="studio-drawer-backdrop" onClick={() => editorStore.openAiDrawer(false)}>
      <div className="studio-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <Sparkles size={16} />
            <span>AI Natural-Language Scene Planner</span>
          </div>
          <button
            className="btn-icon"
            onClick={() => editorStore.openAiDrawer(false)}
            title="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-content scrollable">
          <div className="ai-intro-card">
            <p>
              Type any story prompt in plain English. The AI text planner constructs
              structured camera shots, character locomotion, and dialogue clips adhering
              strictly to the sanctuary catalog.
            </p>
          </div>

          <div className="prompt-presets">
            <span className="preset-label">Quick Ideas:</span>
            <button
              className="chip-btn"
              onClick={() => setPresetPrompt("The robot activates Iron Man flight mode and hovers in the sky")}
            >
              🚀 Iron Man Flight
            </button>
            <button
              className="chip-btn"
              onClick={() => setPresetPrompt("Robot walks to giant tree, climbs to high branch, and waves")}
            >
              🌳 Tree Climb & Wave
            </button>
            <button
              className="chip-btn"
              onClick={() => setPresetPrompt("Robot walks to waterfall and takes a refreshing splash shower")}
            >
              💧 Waterfall Shower
            </button>
          </div>

          <div className="prompt-input-area">
            <textarea
              className="prompt-textarea"
              placeholder="Describe what the robot and camera should do in this scene..."
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <button
              className="btn-primary generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <span>Generating Scene Plan...</span>
              ) : (
                <>
                  <Wand2 size={15} />
                  <span>Generate Structured Scene Plan</span>
                </>
              )}
            </button>
          </div>

          {report && (
            <div className="ai-result-section">
              <div className="result-header">
                <h3>{report.plan?.title || "Generated Plan"}</h3>
                <span className="badge-tag">
                  {report.valid ? "Validated Schema" : "Validation Errors"}
                </span>
              </div>

              {report.warnings.length > 0 && (
                <div className="ai-warnings-box">
                  <AlertTriangle size={15} />
                  <div>
                    <strong>Warnings Resolved:</strong>
                    <ul>
                      {report.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {report.plan && (
                <div className="plan-summary-view">
                  <p className="summary-desc">{report.plan.synopsis}</p>

                  <div className="plan-items-grid">
                    <div className="plan-column">
                      <h4>Camera Shots ({report.plan.shots.length})</h4>
                      <ul>
                        {report.plan.shots.map((s, i) => (
                          <li key={i}>
                            <strong>{s.name}</strong>: {s.cameraPreset} ({s.durationFrames}F)
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="plan-column">
                      <h4>Actions & Dialogue</h4>
                      <ul>
                        {report.plan.shots.flatMap((s) => s.actions).map((a, i) => (
                          <li key={i}>
                            <strong>{a.actionId}</strong>
                            {a.targetAnchorId ? ` -> ${a.targetAnchorId}` : ""}
                            {a.dialogue ? ` ("${a.dialogue}")` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button className="btn-success apply-btn" onClick={handleApply}>
                    <Check size={16} />
                    <span>Apply Plan to Timeline & Viewport</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
