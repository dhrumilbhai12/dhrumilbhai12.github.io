import { CONFIG } from './config.js';

const defaults = () => ({ coins: 0, bestTime: 0, bestDay: 1, seed: CONFIG.world.seed });
export function loadSave() {
  try {
    const raw = localStorage.getItem(CONFIG.save.key);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults();
    return { ...defaults(), coins: finite(parsed.coins), bestTime: finite(parsed.bestTime), bestDay: Math.max(1, finite(parsed.bestDay)), seed: Number.isInteger(parsed.seed) ? parsed.seed : CONFIG.world.seed };
  } catch { return defaults(); }
}
function finite(value) { return Number.isFinite(value) && value >= 0 ? value : 0; }
export function save(data) {
  try { localStorage.setItem(CONFIG.save.key, JSON.stringify(data)); } catch { /* Storage can be disabled or full. */ }
}
