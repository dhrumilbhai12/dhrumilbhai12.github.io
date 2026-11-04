export const CONFIG = {
  world: { chunkSize: 64, activeRadius: 2, seed: 41827, roadWidth: 8, roadSpeed: 1.18, offRoadSpeed: 0.78, townChance: 0.28, farmChance: 0.3, obstacleRadius: 1.1, propCount: 13 },
  camera: { fov: 38, distance: 19, height: 19, lookAhead: 4, follow: 4.2, near: 0.1, far: 220 },
  render: { mobilePixelRatio: 1.5, desktopPixelRatio: 1.8, shadowMap: 1024, quality: ['LOW','MEDIUM','HIGH'] },
  car: { acceleration: 19, maxSpeed: 14, reverseSpeed: 5, drag: 2.8, turnRate: 2.5, grip: 0.87, radius: 1.45, maxHealth: 100, ramDamage: 24, ramSpeedScale: 1.2, contactDamage: 8, contactInterval: 0.75 },
  zombies: { mobileCap: 80, desktopCap: 150, despawnRadius: 92, startDelay: 0.8, spawnInterval: 1.1, spawnRadiusMin: 13, spawnRadiusMax: 21, speed: 2.1, health: 40, touchDistance: 2.05, damage: 9, coinDrop: 1, fireRange: 25, fireRate: 0.48, bulletSpeed: 34, bulletDamage: 45, tracerLife: 0.16 },
  coins: { capacity: 500, magnetRadius: 7.5, pickupRadius: 1.7, value: 1, floatHeight: 0.72 },
  combo: { window: 2, multipliers: [1,2,3,5] },
  run: { secondsPerDay: 900, retreatSeconds: 10, dayBonus: 30, spawnRampSeconds: 240, startHealth: 100 },
  input: { joystickRadius: 47 },
  save: { key: 'car-survivor-phase1-v1' },
  visuals: { groundSize: 220, grassColors: [0x86ad57,0x95b962,0xb2ad67], sandColor: 0xd9bb73, roadColor: 0x555b56, roadLine: 0xd8ca8e }
};
