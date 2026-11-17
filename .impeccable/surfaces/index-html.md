---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface: UPTIME game (index.html)

Scope: whole game (title/log, map, HUD, dialogs, results). Visitor mode: Experience, with Operate precision for metrics.
Audience/job: students, interview-preppers and working devs; drag parts, wire them, watch the system survive or break.
Constraints: single self-contained HTML, Vietnamese copy, pointer + touch, fonts must carry Vietnamese diacritics.
User answers: first chose pixel PCB, then redirected: "đổi lại làm giống Dragon Quest". Must not look like a SaaS web app.

## Direction contract
FORM: seed:9dc9e61b80f600c0 roll superseded by user pin (Dragon Quest JRPG). PCB build archived at archive/index-pcb.html.
THESIS: (superseded) see below.
OWN-WORLD: Black windows with rounded white borders and a black outer ring; white VT323 text with 1px faux-bold; gold for emphasis and money (G); HP text turns yellow then orange-red as it drops; overworld grass tile map with dirt roads as edges; blinking white cursor arrow on commands; star sprites for ranks.
STORY: Title screen with an Adventure Log of chapters; story arrives in the bottom message window, typed out, with the blinking down-arrow.
FIRST VIEWPORT: Gold UPTIME logo, prologue window, adventure log with ??? for locked chapters.
SIGNATURE: Requests travel as pixels along the roads; overloaded nodes flash red like a hit party member and show HP 0 / ĐÃ GỤC.
RISK: Single pixel face at small sizes; keep numbers >= 19px and use colour only alongside text.

## Direction contract (v3, user pin: Stardew-like life sim in Hà Nội city colours)
THESIS: A dev's day: prep in the office, then an on-call night where the player must physically run to failing machines. Refuses dashboard UIs.
OWN-WORLD: Top-down pixel office (encaustic gạch bông floor, ochre plaster, teal shutters, street with tangled power cables at the windows) and a concrete server room; Stardew-grammar paper panels framed in ochre; VT323.
STORY: Calendar of days; NPCs Linh and Bảo at their desks; Bảo's desk empty with a note on day 5.
FIRST VIEWPORT: Dusk Hà Nội street of tube houses and cables behind the logo and calendar.
SIGNATURE: Machines smoke when down; the player runs over and presses E; time of day darkens the room.
RISK: Requires walking, so mobile relies on tap-to-move; keep HUD compact on narrow screens.
