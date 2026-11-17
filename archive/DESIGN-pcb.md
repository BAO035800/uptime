# DESIGN — UPTIME (pixel PCB)

The game is a circuit board the player populates. Every surface belongs to that board.

## Materials
| Token | Value | Use |
|---|---|---|
| board | #174a35 (hi #1d5940, lo #0f3426, via #0c2a1e) | Ground everywhere; 24px via-dot grid |
| silk / silk-dim | #eef2e2 / #bfe0c8 | Silkscreen labels, designators (U1, U2…), outlines |
| cu / cu-hi | #a8692f / #ffd27a | Copper traces (edges); cu-hi = lit/active, logo accent |
| pad | #d4ad52 | Ports, vias, trace ends |
| chip / chip-hi / mark | #141613 / #2a2e28 / #c3c8bd | IC packages (nodes, chapter sockets, tray parts) and their laser marking |
| lcd / lcd-lo / ink / ink-mid / bezel | #b9c97c / #a5b56a / #1b2610 / #3b4720 / #0b0d0a | Character-LCD modules: dialog, HUD readouts, panels, reports |
| led ok / warn / bad / off | #56f06a / #ffb21e / #ff3b2f / #3c2a26 | All state. Thresholds: ok ≤ goal, warn ≤ 2× goal, bad above |
| pulse read / write / job | #ffe08a / #ff7a3d / #c8a2ff | Request pulses on traces |

## Type
- Handjet 700 (self-hosted, latin + latin-ext + vietnamese): silkscreen voice, uppercase, +0.06–0.08em tracking; logo, labels, chip marking, buttons.
- VT323 400 (self-hosted, same subsets): LCD voice for all readable text and numbers; never below 17px, body 20–25px.

## Geometry & components
- Square corners only (mounting holes are the one round shape). No soft shadows; depth = inset bevels on tactile switches.
- Node = chip 132×62 with pins top/bottom, pin-1 mark, SMD status LED, 10-segment LED bar for queue fill, gold output pad on the right.
- Edge = copper trace routed at 0°/45° (orthogonal fallback), 5px, square caps, pads at bends.
- Buttons = tactile switches (`.sw`); green cap = primary go, amber cap = running/stop.
- Icons and portraits are pixel sprites authored in code; no emoji or unicode glyph icons.

## Motion
One authored moment: pulses travelling along traces, plus LCD text typing in character by character (instant under reduced motion). Toasts step in with `steps()` timing.
