import { useSyncExternalStore } from "react";
import type {
  Project,
  QualityPreset,
  TimelineClip,
  Shot,
  Vector3Tuple,
  Rotation3Tuple,
} from "../../schema/types";
import { createDefaultProject, generateId } from "../../domain/project";
import { DeterministicClock } from "../../timeline/clock";

export interface EditorState {
  project: Project;
  currentFrame: number;
  isPlaying: boolean;
  qualityPreset: QualityPreset;
  selectedEntityId: string | null;
  selectedClipId: string | null;
  selectedShotId: string | null;
  isAiDrawerOpen: boolean;
  isExportModalOpen: boolean;
  activeDialogueText: string | null;
  canUndo: boolean;
  canRedo: boolean;
}

class EditorStore {
  private state: EditorState;
  private history: Project[] = [];
  private future: Project[] = [];
  private listeners: Set<() => void> = new Set();
  public readonly clock: DeterministicClock;

  constructor() {
    const defaultProject = createDefaultProject("Sanctuary Cinematic Studio");
    this.clock = new DeterministicClock({
      fps: defaultProject.settings.fps || 30,
      maxFrames: 360,
      initialFrame: 0,
    });

    this.state = {
      project: defaultProject,
      currentFrame: 0,
      isPlaying: false,
      qualityPreset: "preview",
      selectedEntityId: "char_robot_main",
      selectedClipId: null,
      selectedShotId: null,
      isAiDrawerOpen: false,
      isExportModalOpen: false,
      activeDialogueText: null,
      canUndo: false,
      canRedo: false,
    };

    // Synchronize clock frame changes into store state
    this.clock.subscribe((frame, isPlaying) => {
      this.setState({
        currentFrame: frame,
        isPlaying,
      });
    });
  }

  public getState(): EditorState {
    return this.state;
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private setState(updates: Partial<EditorState>): void {
    this.state = {
      ...this.state,
      ...updates,
      canUndo: this.history.length > 0,
      canRedo: this.future.length > 0,
    };
    this.listeners.forEach((l) => l());
  }

  private pushHistory(project: Project): void {
    this.history.push(JSON.parse(JSON.stringify(this.state.project)));
    if (this.history.length > 50) this.history.shift();
    this.future = [];
  }

  public setProject(project: Project, recordHistory = true): void {
    if (recordHistory) {
      this.pushHistory(this.state.project);
    }
    this.clock.setFps(project.settings.fps);
    this.setState({ project });
  }

  public undo(): void {
    if (this.history.length === 0) return;
    const previous = this.history.pop()!;
    this.future.push(JSON.parse(JSON.stringify(this.state.project)));
    this.setState({ project: previous });
  }

  public redo(): void {
    if (this.future.length === 0) return;
    const next = this.future.pop()!;
    this.history.push(JSON.parse(JSON.stringify(this.state.project)));
    this.setState({ project: next });
  }

  public seekFrame(frame: number): void {
    this.clock.seek(frame);
  }

  public togglePlay(): void {
    this.clock.togglePlay();
  }

  public setQualityPreset(qualityPreset: QualityPreset): void {
    this.setState({ qualityPreset });
  }

  public selectEntity(id: string | null): void {
    this.setState({ selectedEntityId: id, selectedClipId: null, selectedShotId: null });
  }

  public selectClip(id: string | null): void {
    this.setState({ selectedClipId: id, selectedEntityId: null, selectedShotId: null });
  }

  public selectShot(id: string | null): void {
    this.setState({ selectedShotId: id, selectedEntityId: null, selectedClipId: null });
  }

  public openAiDrawer(open: boolean): void {
    this.setState({ isAiDrawerOpen: open });
  }

  public openExportModal(open: boolean): void {
    this.setState({ isExportModalOpen: open });
  }

  public setActiveDialogueText(text: string | null): void {
    if (this.state.activeDialogueText !== text) {
      this.setState({ activeDialogueText: text });
    }
  }

  // --- Domain Mutations ---

  public addClipToTrack(trackId: string, clip: TimelineClip): void {
    this.pushHistory(this.state.project);
    const newProj = JSON.parse(JSON.stringify(this.state.project)) as Project;
    const scene = newProj.episodes[0]?.scenes[0];
    if (!scene) return;

    const track = scene.tracks.find((t) => t.id === trackId);
    if (track) {
      track.clips.push(clip);
      track.clips.sort((a, b) => a.startFrame - b.startFrame);
      this.setState({ project: newProj, selectedClipId: clip.id });
    }
  }

  public updateClip(clipId: string, updates: Partial<TimelineClip>): void {
    this.pushHistory(this.state.project);
    const newProj = JSON.parse(JSON.stringify(this.state.project)) as Project;
    const scene = newProj.episodes[0]?.scenes[0];
    if (!scene) return;

    for (const track of scene.tracks) {
      const idx = track.clips.findIndex((c) => c.id === clipId);
      if (idx !== -1) {
        track.clips[idx] = { ...track.clips[idx], ...updates };
        track.clips.sort((a, b) => a.startFrame - b.startFrame);
        this.setState({ project: newProj });
        return;
      }
    }
  }

  public removeClip(clipId: string): void {
    this.pushHistory(this.state.project);
    const newProj = JSON.parse(JSON.stringify(this.state.project)) as Project;
    const scene = newProj.episodes[0]?.scenes[0];
    if (!scene) return;

    for (const track of scene.tracks) {
      track.clips = track.clips.filter((c) => c.id !== clipId);
    }
    this.setState({
      project: newProj,
      selectedClipId: this.state.selectedClipId === clipId ? null : this.state.selectedClipId,
    });
  }

  public addShot(shot: Shot): void {
    this.pushHistory(this.state.project);
    const newProj = JSON.parse(JSON.stringify(this.state.project)) as Project;
    const scene = newProj.episodes[0]?.scenes[0];
    if (!scene) return;

    scene.shots.push(shot);
    scene.shots.sort((a, b) => a.startFrame - b.startFrame);
    this.setState({ project: newProj, selectedShotId: shot.id });
  }

  public updateShot(shotId: string, updates: Partial<Shot>): void {
    this.pushHistory(this.state.project);
    const newProj = JSON.parse(JSON.stringify(this.state.project)) as Project;
    const scene = newProj.episodes[0]?.scenes[0];
    if (!scene) return;

    const idx = scene.shots.findIndex((s) => s.id === shotId);
    if (idx !== -1) {
      scene.shots[idx] = { ...scene.shots[idx], ...updates };
      scene.shots.sort((a, b) => a.startFrame - b.startFrame);
      this.setState({ project: newProj });
    }
  }

  public removeShot(shotId: string): void {
    this.pushHistory(this.state.project);
    const newProj = JSON.parse(JSON.stringify(this.state.project)) as Project;
    const scene = newProj.episodes[0]?.scenes[0];
    if (!scene) return;

    scene.shots = scene.shots.filter((s) => s.id !== shotId);
    this.setState({
      project: newProj,
      selectedShotId: this.state.selectedShotId === shotId ? null : this.state.selectedShotId,
    });
  }
}

export const editorStore = new EditorStore();

export function useEditorStore<T>(selector: (state: EditorState) => T): T {
  return useSyncExternalStore(
    editorStore.subscribe,
    () => selector(editorStore.getState()),
    () => selector(editorStore.getState())
  );
}
