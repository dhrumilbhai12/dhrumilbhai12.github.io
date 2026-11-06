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

## P2 — Art + main mechanics + balance  ✅ DONE (2026-11-06)
- **Balance rework** (save v2; Phase-1 saves migrated & clamped with a "Game updated - progress rebalanced" toast)
  - target HP = 14 x 1.174^round x 1.397^map; coin reward = 1.225^round (x type mult); boss HP = 33x a normal target, 35 s timer
  - Attack 5x1.12^L+L dmg, cost 340x1.165^L · Speed 2+0.12L shots/s (cap 10), cost 680x1.22^L · Coins x(1+0.3L^0.75), cost 1360x1.3^L (first 10 levels discounted)
  - Blaster buy 400x1.18^n, each merge level x1.35 dmg
  - Simulated optimal play: map 2 ~3 min, map 3 ~11 min, map 4 ~25 min, then ~15-25 min per map; 1M coins earned ~1.5 h, 1B earned ~4.5 h (real players slower). Phase 1 hit 100B in 40 min.
- 3 maps x 5 rounds (Backyard -> Kitchen -> Toy Room, loops as World 2, 3 ...), 10 targets per round
- Round 5 = boss (Gnome King / Blender Bot / Toy Mech X): big HP bar + timer, wind-up "!" telegraph, thrown acorns / fruit volleys / homing-line missiles that hurt the hero (hero HP bar, red flash + knock-back hurt reaction). Tap attacks to shoot them down. Fail -> farm round 4 with a FIGHT BOSS button (no progress lost). Boss win: coins x10 + gems.
- New art: barrel, wind-up robot (cutout legs walk cycle), 3 bosses, buddy drone (unlocks after first boss, auto-shoots), kitchen + toy room backgrounds; parallax = background + slow clouds/dust layer + fast foreground props per map
- Weapons merge (bottom-left): 4x2 grid, buy blaster (price rises), drag or tap two same-level to merge, 12 levels with distinct colours/shapes, best auto-equipped, hero's held gun recoloured per level
- POWER SHOT (bottom-right): 18 s charge ring, explosive AoE (20x dmg), screen shake + hit-stop, clears boss projectiles
- Shop (cart button top-right): 5 characters + 5 guns, coins or gems only (no real money). Characters: Zip Quickstep (+35% rate), Bruno Brickfist (+45% dmg), Luma Lucky (25% crit x3.5), Penny Goldpocket (+60% coins), Sir Kip Potshield (+20% all, +50% boss HP). Guns: Fizzbang Repeater, Thunderpop Cannon, Clover Zapper, Goldrush Popper, Comet Crusher. Owned/equipped saved in localStorage.
- Gems: boss wins (10 + 5/world) and rare drops (3.5% per kill)
- WebAudio SFX (original synth, no library) + mute button
- Debug preview URLs: ?dbg=kitchen | toy | boss | merge | shop | shopguns (not saved)

## P2b — Leftover art ideas
- AI UI icon set, logo artwork, true multi-layer painted parallax (currently 1 painted + 2 procedural layers)
- AI sprites: barrels, wind-up toy robots, more props; coin/gem/star icons; UI icon set (or Kenney CC0 if it matches)
- Backgrounds for Backyard / Kitchen counter / Toy room with 2–3 parallax layers each
- Buddy helper sprite; logo artwork

## P3 — Juice
- Screen shake, hit-stop on big hits/crits, richer particles (Phaser particles or custom pool)
- Procedural SFX (ZzFX/jsfxr, MIT) + light WebAudio music loop, mute toggle
- (hero hurt + robot walk done in P2) music loop

## P4 — Weapons merge (base done in P2; next: merge animation, blaster art sprites)
- Weapons button → popup 4x2 merge grid; buy random blaster; drag/tap two same-level to merge; 10+ levels with distinct art/colour; auto-equip best (swaps the rig's gun arm art)

## P5 — Power shot, bosses, 3 maps (base done in P2; next: more boss patterns, map-specific props)
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
