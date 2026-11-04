import * as THREE from '../lib/three/three.module.js';
import { CONFIG } from './config.js';

const standard=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness,flatShading:true});
export class Car {
  constructor(scene) {
    this.group=new THREE.Group();scene.add(this.group);this.position=this.group.position;this.heading=0;this.speed=0;this.health=CONFIG.car.maxHealth;this.touchTimer=0;
    const orange=standard(0xb9522f), dark=standard(0x30383a), glass=standard(0x7fa2a2,.35), trim=standard(0xc5a36e), tire=standard(0x25292a);
    const box=(parent,geo,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
    box(this.group,new THREE.BoxGeometry(2.35,.8,4.25),orange,0,.9,0,1,1,1);
    box(this.group,new THREE.BoxGeometry(2.05,.72,2.25),orange,0,1.55,-.18,1,1,1);
    box(this.group,new THREE.BoxGeometry(1.83,.48,1.48),glass,0,1.58,-.22,1,1,1);
    box(this.group,new THREE.BoxGeometry(2.42,.22,2.4),dark,0,1.15,0,1,1,1);
    // Overlapping armor panels make the silhouette read as a reinforced wasteland sedan.
    for(const z of [-1.35,0,1.25])for(const x of [-1.18,1.18]){const plate=box(this.group,new THREE.BoxGeometry(.12,.48,.88),trim,x,1.05,z,1,1,1);plate.rotation.z=x<0?-.08:.08;}
    box(this.group,new THREE.BoxGeometry(2.5,.3,1.05),trim,0,1.03,1.72,1,1,1);
    box(this.group,new THREE.BoxGeometry(2.5,.3,.7),dark,0,.78,-2.18,1,1,1);
    for(const x of [-1.23,1.23])for(const z of [-1.35,1.35]){const wheel=box(this.group,new THREE.CylinderGeometry(.53,.53,.38,10),tire,x,.56,z,1,1,1);wheel.rotation.z=Math.PI/2;box(this.group,new THREE.CylinderGeometry(.24,.24,.4,8),trim,x,.56,z,1,1,1).rotation.z=Math.PI/2;}
    box(this.group,new THREE.BoxGeometry(.75,.24,.8),dark,0,2.03,-.05,1,1,1);
    const barrel=box(this.group,new THREE.CylinderGeometry(.1,.13,.95,8),dark,0,2.2,-.7,1,1,1);barrel.rotation.x=Math.PI/2;
    for(const x of [-.72,.72]){const spike=box(this.group,new THREE.ConeGeometry(.15,.62,5),trim,x,1.48,1.03,1,1,1);spike.rotation.x=Math.PI/2;}
    const flash=new THREE.Mesh(new THREE.SphereGeometry(.22,7,5),new THREE.MeshBasicMaterial({color:0xffc44d}));flash.position.set(0,2.2,-1.25);flash.visible=false;this.group.add(flash);this.muzzleFlash=flash;this.flashTimer=0;
    for(const x of [-.82,.82]){const lamp=box(this.group,new THREE.BoxGeometry(.38,.2,.08),standard(0xffe39a,.35),x,1.02,2.16,1,1,1);}
  }
  update(dt,input,world) {
    const v=input.getVector(), moving=Math.hypot(v.x,v.y)>.08;
    if(moving){const target=Math.atan2(v.x,v.y);let diff=((target-this.heading+Math.PI*3)%(Math.PI*2))-Math.PI;this.heading+=THREE.MathUtils.clamp(diff,-CONFIG.car.turnRate*dt,CONFIG.car.turnRate*dt);this.speed=Math.min(CONFIG.car.maxSpeed,this.speed+CONFIG.car.acceleration*dt*Math.max(.25,Math.hypot(v.x,v.y)));}
    else this.speed*=Math.max(0,1-CONFIG.car.drag*dt);
    const boost=world.isRoad(this.position.x,this.position.z)?CONFIG.world.roadSpeed:CONFIG.world.offRoadSpeed;
    const dx=Math.sin(this.heading)*this.speed*boost*dt,dz=-Math.cos(this.heading)*this.speed*boost*dt;
    if(!world.collides(this.position.x+dx,this.position.z,CONFIG.car.radius))this.position.x+=dx;else this.speed*=.35;
    if(!world.collides(this.position.x,this.position.z+dz,CONFIG.car.radius))this.position.z+=dz;else this.speed*=.35;
    this.group.rotation.y=-this.heading;this.group.position.y=.06+Math.sin(performance.now()*.004)*Math.min(.035,Math.abs(this.speed)*.0015);
    this.flashTimer=Math.max(0,this.flashTimer-dt);this.muzzleFlash.visible=this.flashTimer>0;
  }
  flash(){this.flashTimer=.07;}
  damage(amount){this.health=Math.max(0,this.health-amount);return this.health===0;}
}
