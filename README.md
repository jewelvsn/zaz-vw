# zaz-vw — Cinematic Cartoon Animation Studio

A professional, data-driven 3D cartoon animation studio and playground built with **Babylon.js 7.54**, **React 19**, and **TypeScript 7**.

Inspired by Plotagon, Unreal Sequencer, and Blender, `zaz-vw` enables creators to direct characters, construct multi-track cinematic timelines, trigger procedural locomotion stunts, and generate structured scene proposals using an integrated AI Text-to-Scene Planner.

---

## 🌟 Key Features

- **Multi-Track Sequencer Timeline**: Visual timeline with scrubbable playhead, camera shot tracks, character action lanes, and dialogue subtitle track.
- **13 Cinematic Camera Presets**: High wide establishing, medium, close-up, extreme close-up, over-the-shoulder, tracking side, 3rd-person follow, 360° dynamic orbit, low heroic angle, bird's-eye high angle, reveal sweep, dolly in, and dolly out.
- **Procedural Action Engine**: Bipedal human walking gait, athletic running, jumping with anticipation/squash, friendly wave, seated posture, tree climbing, waterfall shower with splash particles, and Iron Man flight mode (hovering, aerodynamic pitch, boot thrusters, arc reactor glow).
- **Articulated Anatomical Rigging**: 43-mesh articulated rig for `faceless_kids_robot.glb` using hip, knee, shoulder, and neck pivots without requiring heavy bone weighting.
- **Interactive Sanctuary Set**: Fully featured `jungle_waterfall_hq.glb` environment with 6 semantic interaction anchors (`clearing_center`, `waterfall_shower_spot`, `lagoon_plunge_pool`, `tree_climb_start`, `tree_climb_branch`, `moss_rock_bench`).
- **AI Text-to-Scene Story Planner**: Natural-language prompt compiler that parses plain text instructions into validated, catalog-grounded `AiScenePlan` JSON proposals without executing untrusted code or video.
- **Deterministic Rendering & Offline Export**: Frame-stepped offline rendering decoupling GPU framerate from export quality; adaptive quality presets (`draft`, `preview`, `cinematic`).
- **Strict Data Contracts**: Persistence in versioned JSON Schema Draft 2020-12 with backward-compatible auto-migration.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Tests
```bash
npm run test
```
Runs 32 unit and integration tests across 8 test suites.

### 4. TypeScript Typecheck
```bash
npm run typecheck
```

### 5. Production Build
```bash
npm run build
```

---

## ⌨️ Studio Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause Timeline |
| <kbd>←</kbd> / <kbd>→</kbd> | Step $\pm 1$ Frame (hold <kbd>Shift</kbd> for $\pm 10$ frames) |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo |
| Mouse Drag in Viewport | Orbit Camera around Target |

---

## 📁 Repository Structure

```
zaz-vw/
├── docs/                       # Architecture & API specifications
│   ├── architecture.md         # Module boundaries & decoupled lifecycle
│   ├── scene-schema.md         # JSON Schema Draft 2020-12 specification
│   ├── action-authoring.md     # Guide to authoring procedural actions
│   ├── camera-presets.md       # Camera presets & director manual
│   ├── ai-scene-planning.md    # AI prompt engineering & validator
│   ├── render-pipeline.md      # Deterministic offline rendering
│   └── migration-guide.md      # Schema migrations & backwards compatibility
├── public/                     # 3D assets (GLB models)
│   ├── faceless_kids_robot.glb # Articulated robot character model
│   └── jungle_waterfall_hq.glb # Jungle waterfall sanctuary set
├── src/
│   ├── actions/                # Action engine, registry, and kinematics
│   ├── ai/                     # AI provider interface, prompt builder, validator, compiler
│   ├── assets/                 # Typed asset registry & interaction anchors
│   ├── camera/                 # 13 camera presets & camera director
│   ├── domain/                 # Domain project models & factory
│   ├── persistence/            # Serializer & legacy migration
│   ├── render/                 # Deterministic frame stepper & video exporter
│   ├── runtime/                # Babylon engine, scene, character & environment bridges
│   ├── schema/                 # JSON schema, Zod validators, TypeScript types
│   ├── studio/                 # React 19 UI (Toolbar, Viewport, Timeline, Explorer, Inspector)
│   ├── main.tsx                # Application bootstrap
│   └── vite-env.d.ts           # Environment typings
├── tests/                      # Vitest test suites (32 tests)
├── index.html                  # HTML entry point
├── style.css                   # Dark theme design system
├── tsconfig.json               # Strict TypeScript configuration
└── vite.config.ts              # Vite configuration
```

---

## 📄 License

MIT License.
