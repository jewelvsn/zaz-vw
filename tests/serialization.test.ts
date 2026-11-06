import { describe, it, expect } from "vitest";
import { ProjectSerializer } from "../src/persistence/serializer";
import { createDefaultProject } from "../src/domain/project";

describe("Project Serializer & Persistence", () => {
  it("performs lossless round-trip serialization and deserialization", () => {
    const original = createDefaultProject("Lossless Roundtrip Test");
    const json = ProjectSerializer.serialize(original);

    expect(typeof json).toBe("string");
    expect(json).toContain("Lossless Roundtrip Test");

    const result = ProjectSerializer.deserialize(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(original.id);
      expect(result.data.title).toBe(original.title);
      expect(result.data.episodes.length).toBe(original.episodes.length);
      expect(result.data.assets.length).toBe(original.assets.length);
      expect(result.migrated).toBe(false);
    }
  });

  it("handles malformed JSON strings gracefully with clear error messages", () => {
    const malformed = "{ this is not valid json }";
    const result = ProjectSerializer.deserialize(malformed);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Invalid JSON syntax");
    }
  });

  it("auto-migrates legacy unstructured JSON without schemaVersion", () => {
    const legacy = JSON.stringify({
      title: "Old Playground Session",
      characterPosition: [1.5, 0, 2.0],
      cameraRadius: 10,
    });

    const result = ProjectSerializer.deserialize(legacy);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.migrated).toBe(true);
      expect(result.data.schemaVersion).toBe("1.0.0");
      expect(result.data.title).toBe("Old Playground Session");
      const char = result.data.episodes[0].scenes[0].characters[0];
      expect(char.initialPosition).toEqual([1.5, 0, 2.0]);
    }
  });
});
