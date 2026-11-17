# DESIGN — UPTIME (Stardew-style life sim, Hà Nội street palette)

Top-down pixel world: the VéXịn office on a Cầu Giấy tube-house floor plus its server room. Earlier worlds archived in archive/.

## Palette (city materials)
| Token | Value | Use |
|---|---|---|
| ochre / ochre-dk / ochre-sh | #d9a441 / #a8772a / #8a5a1e | Plaster walls, UI frame border |
| paper / paper-dk | #f1e3c2 / #e2cfa4 | UI panel fill (Stardew-style frames) |
| ink / ink-mid | #3b2a1a / #6e5233 | UI text |
| teal / teal-dk | #3f7f6a / #2b5a4b | Shutters, encaustic tile motif, player hoodie |
| brick / brick-ink | #b5523b / #9a3f2b | Tile motif, cache machine; brick-ink for emphasis text |
| tile base/line | #cfc6b4 / #b9b09d | Gạch bông office floor |
| concrete / seam | #7b7f84 / #6c7075 | Server room floor |
| cable | #16161a | Overhead network cables (tangled street wires) |
| lamp | #ffb547 | Night windows, signs, selected cable |
| post yellow | #e0b030 | Queue machine (post-office cabinet) |
| status good/warn/bad | #6fd04a / #ffb21e / #ff4a3a (world), #3f8f3a / #c98a12 / #a83224 (on paper) |

## Type
VT323 (self-hosted latin, latin-ext, vietnamese), faux-bold via 1px text-shadow on panels.

## Components
- `.frame`: paper fill, ochre double border, 6px drop shadow. `.btn`: ochre plaster button with inset bevel; `.go` green.
- Hotbar: 8 slots (hand, server, LB, cache, replica, queue, cable, pliers), keys 1–8.
- Clock box top-right (day, time, budget in "tr"), monitor/quest box top-left, energy bar bottom-right.
- Dialog: text panel + portrait panel using the in-world 12×17 character sprite.
- Machines 2×2 tiles, each a distinct object; labels in screen space with load %.

## Motion & time
Clock runs 08:00→18:50 in prep, 19:00→23:00 during the shift; multiply tint for dusk/night, windows show the street changing. Pulses travel along sagging cables; downed machines smoke.
