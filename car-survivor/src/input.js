import { CONFIG } from './config.js';

export class Input {
  constructor() {
    this.keys = new Set(); this.axis = { x: 0, y: 0 }; this.touching = false;
    this.joystick = document.querySelector('#joystick'); this.knob = document.querySelector('.joy-knob');
    addEventListener('keydown', e => { this.keys.add(e.code); if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault(); });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    this.joystick.addEventListener('pointerdown', e => { this.touching = true; this.joystick.setPointerCapture(e.pointerId); this.move(e); });
    this.joystick.addEventListener('pointermove', e => { if (this.touching) this.move(e); });
    for (const name of ['pointerup','pointercancel','lostpointercapture']) this.joystick.addEventListener(name, () => { this.touching = false; this.axis = {x:0,y:0}; this.knob.style.transform = 'translate(-50%,-50%)'; });
  }
  move(e) {
    const rect = this.joystick.getBoundingClientRect(), radius = CONFIG.input.joystickRadius;
    const dx = e.clientX - (rect.left + rect.width/2), dy = e.clientY - (rect.top + rect.height/2);
    const len = Math.hypot(dx,dy), scale = len > radius ? radius/len : 1;
    this.axis = {x:dx*scale/radius, y:-dy*scale/radius};
    this.knob.style.transform = `translate(calc(-50% + ${dx*scale}px),calc(-50% + ${dy*scale}px))`;
  }
  getVector() {
    if (this.touching) return this.axis;
    let x = 0, y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x--;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x++;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y++;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y--;
    const len = Math.hypot(x,y); return len > 0 ? {x:x/len,y:y/len} : {x:0,y:0};
  }
}
