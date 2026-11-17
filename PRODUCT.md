# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Three groups at once: IT students meeting system design for the first time, junior/mid devs practicing for system-design interviews, and working devs who already know the concepts and play for fun and challenge. It must be easy to enter for a newcomer and still demanding for someone with real ops experience.

## Product Purpose
UPTIME is a browser game where the player drags infrastructure components (load balancer, app server, cache, database, read replica, queue) onto a board, wires them, and watches simulated traffic hit the system. Success: the player discovers *why* each component exists by watching their own design break, then fixing it. A personal project made for fun, with the hope of real players.

## Positioning
The system genuinely simulates: Poisson traffic, Zipf-distributed keys (so caches really work), bounded queues per node, writes costing the DB 3x a read. Failures emerge from the model, not from scripted rules. A story campaign (startup VéXịn, CEO chị Linh, mentor anh Bảo) teaches one concept per chapter, ending with incident response when the mentor has left.

## Capabilities and Constraints
- Single self-contained HTML file, frontend only, no backend; progress saved in localStorage.
- 5 story chapters plus a Sandbox; stars scored on error rate, p99 latency and cost.
- Vietnamese is the UI language.
- Must work with mouse and touch (pointer events) on desktop and mobile widths.

## Brand Commitments
- Name: UPTIME. Fictional startup VéXịn, characters chị Linh, anh Bảo.
- User-pinned direction: should look like a game, pixel-art game style is welcome; must look less "AI-generated".

## Evidence on Hand
No real players, testimonials, or metrics yet. Do not fabricate any.

## Product Principles
- The player learns by breaking things, not by reading definitions.
- The simulation is the truth; visuals exist to make its state legible at a glance.
- Story stays short and human; it frames, never blocks play.
