# AI Text-to-Scene Planner Guide

## Overview
The AI Scene Planner translates natural-language story prompts (e.g., *"The robot puts on Iron Man thrusters and hovers high in the air"*) into structured, validated `AiScenePlan` JSON without generating any executable code or video.

---

## Architecture

```
User Prompt
    │
    ▼
[Prompt Builder] ─── Reads Catalog (Characters, Anchors, Actions, Camera Presets)
    │
    ▼
[AI Provider Adapter] (Mock Builtin / OpenAI / OpenRouter HTTP)
    │
    ▼
Raw JSON Output
    │
    ▼
[Plan Validator & Semantic Repair] ─── Validates against Zod schema & catalog IDs
    │
    ▼
Validation Report (Warnings, Repaired IDs, Structured Plan)
    │
    ▼
[Plan Compiler] ─── Compiles into Timeline Tracks, Clips, and Shots
    │
    ▼
Editor Store & Babylon Viewport
```

---

## Supported Providers
- **`MockAiProvider` (`src/ai/providerInterface.ts`)**: Built-in zero-dependency offline provider. Uses context-aware heuristics for flight, tree climbing, waterfall shower, and greeting stories.
- **`HttpAiProvider`**: Standard OpenAI / OpenRouter HTTP adapter with model selection (`gpt-4o`, `claude-3-5-sonnet`, etc.).

---

## Strict Catalog Constraints
To avoid hallucinations:
1. Unknown environment IDs fall back to `"env_jungle_waterfall"`.
2. Unknown character asset IDs fall back to `"char_faceless_robot"`.
3. Unknown action IDs fall back to `"idle"`.
4. Unknown camera presets fall back to `"medium"`.
5. Non-existent anchor targets are stripped with explicit warnings displayed in the drawer UI.
