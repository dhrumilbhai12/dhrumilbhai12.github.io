import * as THREE from '../lib/three/three.module.js';
import { CONFIG } from './config.js';

export class Weapons {
  constructor(scene){this.scene=scene;this.cooldown=0;this.max=100;this.bullets=Array.from({length:this.max},()=>({active:false,x:0,z:0,vx:0,vz:0,life:0,target:null,onHit:null}));this.geometry=new THREE.BufferGeometry();this.positions=new Float32Array(this.max*6);this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3));this.material=new THREE.LineBasicMaterial({color:0xffdf80,transparent:true,opacity:.95});this.lines=new THREE.LineSegments(this.geometry,this.material);scene.add(this.lines);}
  fireAtNearest(zombies,car,dt,onHit){this.cooldown=Math.max(0,this.cooldown-dt);let target=null,best=CONFIG.zombies.fireRange;
    for(const z of zombies){if(!z.alive)continue;const d=Math.hypot(z.x-car.position.x,z.z-car.position.z);if(d<best){best=d;target=z;}}
    if(target&&this.cooldown<=0){const b=this.bullets.find(item=>!item.active);if(b){this.cooldown=CONFIG.zombies.fireRate;car.flash?.();const ox=car.position.x+Math.sin(car.heading)*1.25,oz=car.position.z-Math.cos(car.heading)*1.25,dx=target.x-ox,dz=target.z-oz,d=Math.hypot(dx,dz)||1;Object.assign(b,{active:true,x:ox,z:oz,vx:dx/d*CONFIG.zombies.bulletSpeed,vz:dz/d*CONFIG.zombies.bulletSpeed,life:1.3,target,onHit});}}
    let n=0;for(const b of this.bullets){if(!b.active)continue;const oldX=b.x,oldZ=b.z;b.x+=b.vx*dt;b.z+=b.vz*dt;b.life-=dt;
      if(b.target.alive&&Math.hypot(b.target.x-b.x,b.target.z-b.z)<.72){b.target.hp-=CONFIG.zombies.bulletDamage;if(b.target.hp<=0)b.onHit(b.target);b.active=false;continue;}
      if(b.life<=0){b.active=false;continue;}const p=n++*6;this.positions[p]=oldX;this.positions[p+1]=.75;this.positions[p+2]=oldZ;this.positions[p+3]=b.x;this.positions[p+4]=.75;this.positions[p+5]=b.z;
    }
    this.geometry.setDrawRange(0,n*2);this.geometry.attributes.position.needsUpdate=true;this.geometry.computeBoundingSphere();
  }
}
