# Backyard Blasters — Phase Plan

Live: https://dhrumilbhai12.github.io/backyard-blasters/  (updated after every phase)
Source: /workspace/work/backyard-blasters/  ·  Previews: preview/  ·  Credits: CREDITS.md

## P1 — Core playable  ✅ DONE (2026-11-06)
- Title screen (logo, idling hero, Play/Continue button)
- Hero with round glasses as a **cutout rig** (head, blink-head, torso, gun arm, 2 legs, sliced from one AI sprite so parts match exactly)
  - idle breathing + random blink, shooting (arm recoil, gun kick, aim toward target/tap point, muzzle flash, ejected shell casings), walk cycle between sub-stages (leg swing, body bob, scrolling background), victory jump + gun raise on clear
- Auto-fire at nearest target + tap / hold to aim and fire extra player shots (cyan rounds, faster while held)
- Crates, flower pots, gnomes with HP bars, hit flash, squash on hit, gnome waddle; break into real sprite pieces + debris with gravity/bounce
- Coins burst out, bounce, spin, arc to the coin counter
- Damage numbers + CRIT popups (10% crit, x3)
- Stage X-Y bar with 5 sub-stage dots, 8 targets per sub-stage, HP/reward scaling
- Attack / Speed / Coins upgrades (level, value, price, scaling cost), keyboard 1/2/3 on desktop
- localStorage save (every 3 s + on hide), first-session tutorial hints
- Landscape: rotate-phone overlay in portrait, fullscreen button (+ landscape lock on Android), DPR-capped canvas for low-end phones

## P2 — Detailed art pass
- AI sprites: barrels, wind-up toy robots, more props; coin/gem/star icons; UI icon set (or Kenney CC0 if it matches)
- Backgrounds for Backyard / Kitchen counter / Toy room with 2–3 parallax layers each
- Buddy helper sprite; logo artwork

## P3 — Juice
- Screen shake, hit-stop on big hits/crits, richer particles (Phaser particles or custom pool)
- Procedural SFX (ZzFX/jsfxr, MIT) + light WebAudio music loop, mute toggle
- Hero hurt reaction (when obstacles push/attack), robot walk cycles (cutout or 2–4 frames)

## P4 — Weapons merge
- Weapons button → popup 4x2 merge grid; buy random blaster; drag/tap two same-level to merge; 10+ levels with distinct art/colour; auto-equip best (swaps the rig's gun arm art)

## P5 — Power shot, bosses, 3 maps
- Charged POWER SHOT button with cooldown (explosive AoE)
- Boss each map on sub-stage 5 (gnome king, kitchen appliance, giant toy robot) with boss HP bar + timer
- Map progression Backyard → Kitchen → Toy room, loop with scaling

## P6 — Meta
- Rebirth → Golden Stars → permanent boosts shop
- Offline earnings popup on return
- 2x speed toggle + pause menu

## P7 — Polish & performance
- Full tutorial flow, settings, number formatting checks, object pooling, low-quality mode, asset compression (<6 MB), test on low-end Android, final zip

Rule kept from the brief: **no level-up card choice system**.
