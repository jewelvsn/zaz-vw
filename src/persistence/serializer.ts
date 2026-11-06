import type { Project } from "../schema/types";
import { validateProject } from "../schema/zod";
import { createDefaultProject, generateId } from "../domain/project";

export interface MigrationResult {
  migrated: boolean;
  project: Project;
  warnings?: string[];
}

export class ProjectSerializer {
  /**
   * Serializes a Project domain object into a formatted or compact JSON string.
   */
  static serialize(project: Project, pretty = true): string {
    return JSON.stringify(project, null, pretty ? 2 : 0);
  }

  /**
   * Parses, validates, and if necessary migrates a JSON string into a validated Project.
   */
  static deserialize(
    jsonString: string
  ): { success: true; data: Project; migrated?: boolean } | { success: false; errors: string[] } {
    let raw: unknown;
    try {
      raw = JSON.parse(jsonString);
    } catch (err) {
      return {
        success: false,
        errors: [`Invalid JSON syntax: ${(err as Error).message}`],
      };
    }

    // Check if migration is needed
    if (typeof raw === "object" && raw !== null) {
      const obj = raw as Record<string, unknown>;
      if (!obj.schemaVersion || obj.schemaVersion !== "1.0.0") {
        const migration = this.migrateLegacy(obj);
        const validation = validateProject(migration.project);
        if (validation.success) {
          return { success: true, data: validation.data, migrated: true };
        }
        return { success: false, errors: validation.errors };
      }
    }

    const validation = validateProject(raw);
    if (validation.success) {
      return { success: true, data: validation.data, migrated: false };
    }
    return { success: false, errors: validation.errors };
  }

  /**
   * Auto-migrates legacy playground configurations or pre-schema objects into v1.0.0 Project.
   */
  static migrateLegacy(legacy: Record<string, unknown>): MigrationResult {
    const defaultProj = createDefaultProject(
      (legacy.title as string) || "Migrated Legacy Project"
    );

    // If legacy has character position
    if (Array.isArray(legacy.characterPosition) && legacy.characterPosition.length === 3) {
      const char = defaultProj.episodes[0].scenes[0].characters[0];
      if (char) {
        char.initialPosition = legacy.characterPosition as [number, number, number];
      }
    }

    // If legacy has custom camera settings
    if (typeof legacy.cameraRadius === "number") {
      const scene = defaultProj.episodes[0].scenes[0];
      if (scene.shots[0]) {
        scene.shots[0].cameraPreset = "medium";
      }
    }

    return {
      migrated: true,
      project: defaultProj,
      warnings: ["Migrated legacy playground state to Schema v1.0.0"],
    };
  }

  /**
   * Browser utility to trigger a file download for the project.
   */
  static exportToFile(project: Project, filename?: string): void {
    if (typeof window === "undefined") return;
    const json = this.serialize(project, true);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${project.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.cinematic.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export function serializeProject(project: Project, pretty = true): string {
  return ProjectSerializer.serialize(project, pretty);
}

export function deserializeProject(jsonString: string): Project {
  const result = ProjectSerializer.deserialize(jsonString);
  if (!result.success) {
    throw new Error(result.errors.join("; "));
  }
  return result.data;
}
