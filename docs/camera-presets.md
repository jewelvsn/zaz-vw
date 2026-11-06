# Camera Presets & Cinematic Directing

## Overview
The studio provides 13 professional camera presets implemented in `src/camera/presets.ts` and managed dynamically by the `CameraDirector` in `src/camera/director.ts`.

---

## Preset Reference Table

| Preset ID | Display Name | Radius | Beta | FOV | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `establishing_wide` | Establishing Wide | 12.0m | 1.15 | 0.95 | High wide-angle overview of environment and subject |
| `medium` | Medium Shot | 4.2m | 1.35 | 0.80 | Classic waist-up conversational framing |
| `close_up` | Close-Up | 2.2m | 1.45 | 0.65 | Bust and head framing for facial expressions and dialogue |
| `extreme_close_up`| Extreme Close-Up| 1.4m | 1.50 | 0.50 | Tight framing on eyes, hands, or props |
| `over_shoulder` | Over-The-Shoulder | 2.8m | 1.35 | 0.75 | 3/4 perspective looking past actor's shoulder |
| `tracking_side` | Tracking Side | 5.5m | 1.40 | 0.80 | Lateral side-profile tracking movement |
| `follow` | 3rd-Person Follow | 4.8m | 1.35 | 0.85 | Behind-the-back camera tracking heading |
| `orbit` | Dynamic Orbit | 5.0m | 1.25 | 0.80 | 360-degree continuous turntable revolve |
| `low_angle` | Heroic Low Angle | 3.2m | 1.70 | 0.85 | Ground-level upward perspective emphasizing stature |
| `high_angle` | Bird's-Eye View | 8.0m | 0.60 | 0.90 | Elevated overhead vantage point looking down |
| `reveal` | Reveal Sweep | 6.0m | 1.65 | 0.85 | Sweeps up from foliage into subject focus |
| `dolly_in` | Dolly In | 8.5m -> 4.0m| 1.35 | 0.85 -> 0.70 | Smooth push in over duration |
| `dolly_out` | Dolly Out | 2.5m -> 7.5m| 1.35 | 0.70 -> 0.85 | Smooth pull back from subject |
| `static` | Fixed Static Angle | 6.5m | 1.30 | 0.80 | Locked tripod shot with zero camera drift |

---

## Manual Orbit Interaction
When the user clicks and drags inside the Babylon viewport, the `CameraDirector` smoothly yields control so users can inspect angles freely without fighting the director. Resuming playback smoothly snaps back to the active cinematic shot.
