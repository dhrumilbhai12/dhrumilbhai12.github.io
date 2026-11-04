import * as THREE from '../lib/three/three.module.js';
import { CONFIG } from './config.js';

export class Zombies {
  constructor(scene, max=CONFIG.zombies.desktopCap) {
    this.scene=scene;this.max=max;this.items=[];this.spawnClock=0;this.contactClock=0;this.kills=0;this.dummy=new THREE.Object3D();this.pops=[];
    const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.94,flatShading:true});
    const parts=[
      ['torso',new THREE.CapsuleGeometry(.36,.62,2,5),mat(0x536846),.86],['head',new THREE.IcosahedronGeometry(.29,1),mat(0x8cae60),1.48],
      ['arm',new THREE.BoxGeometry(.19,.67,.22),mat(0x789453),.91],['leg',new THREE.BoxGeometry(.24,.64,.27),mat(0x3c4540),.31]
    ];
    this.parts=parts.map(([name,geo,material])=>{const mesh=new THREE.InstancedMesh(geo,material,max);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;});
    this.popGeo=new THREE.IcosahedronGeometry(.42,0);this.popMat=mat(0xc2ba73);this.popMesh=new THREE.InstancedMesh(this.popGeo,this.popMat,24);scene.add(this.popMesh);
  }
  spawn(car){if(this.items.length>=this.max)return;const a=Math.random()*Math.PI*2,r=CONFIG.zombies.spawnRadiusMin+Math.random()*(CONFIG.zombies.spawnRadiusMax-CONFIG.zombies.spawnRadiusMin);this.items.push({x:car.position.x+Math.cos(a)*r,z:car.position.z+Math.sin(a)*r,hp:CONFIG.zombies.health,attack:0,phase:Math.random()*6,alive:true});}
  update(dt,car,world,time,coins,weapons,onKill,retreat=false){
    this.spawnClock+=dt;const interval=Math.max(.42,CONFIG.zombies.spawnInterval-time/CONFIG.run.spawnRampSeconds*.48);
    while(this.spawnClock>=interval){this.spawnClock-=interval;if(!retreat&&time>=CONFIG.zombies.startDelay)this.spawn(car);}
    let contact=false,visible=0;
    for(let i=0;i<this.items.length;i++){
      const z=this.items[i];if(!z.alive)continue;const dx=car.position.x-z.x,dz=car.position.z-z.z,d=Math.hypot(dx,dz)||1;if(d>CONFIG.zombies.despawnRadius){z.alive=false;continue;}
      if(retreat){z.x-=dx/d*CONFIG.zombies.speed*2*dt;z.z-=dz/d*CONFIG.zombies.speed*2*dt;}
      else if(d>CONFIG.zombies.touchDistance){z.x+=dx/d*CONFIG.zombies.speed*dt;z.z+=dz/d*CONFIG.zombies.speed*dt;}
      else {contact=true;z.attack-=dt;if(z.attack<=0){z.attack=CONFIG.car.contactInterval;car.damage(CONFIG.zombies.damage*CONFIG.car.contactInterval);}}
      if(!retreat&&d<CONFIG.car.radius+.55&&Math.abs(car.speed)>2.2){z.hp-=CONFIG.car.ramDamage*Math.min(1.5,Math.abs(car.speed)/CONFIG.car.maxSpeed)*dt*5;if(z.hp<=0)this.kill(z,coins,onKill);}
      if(!z.alive)continue;
      const bob=Math.sin(time*7+z.phase)*.055, yaw=Math.atan2(-dx,-dz), swing=Math.sin(time*8+z.phase)*.28;
      const put=(mesh,x,y,zz,sx,sy,sz,rot=yaw)=>{this.dummy.position.set(x,y,zz);this.dummy.rotation.set(0,rot,0);this.dummy.scale.set(sx,sy,sz);this.dummy.updateMatrix();mesh.setMatrixAt(visible,this.dummy.matrix);};
      put(this.parts[0],z.x,.86+bob,z.z,1,1,1);put(this.parts[1],z.x,1.48+bob,z.z,1,1,1);
      put(this.parts[2],z.x-.42,.88+bob,z.z,.8,1,1,yaw+swing);put(this.parts[2],z.x+.42,.88+bob,z.z,.8,1,1,yaw-swing);
      put(this.parts[3],z.x-.16,.32+bob,z.z,.9,1,1,yaw-swing);put(this.parts[3],z.x+.16,.32+bob,z.z,.9,1,1,yaw+swing);visible++;
    }
    this.contactClock=contact?this.contactClock+dt:Math.max(0,this.contactClock-dt*2);if(contact&&!retreat&&this.contactClock>1.2){this.contactClock=0;car.damage(CONFIG.zombies.damage*.6);}
    for(const mesh of this.parts){mesh.count=visible;mesh.instanceMatrix.needsUpdate=true;}
    let pn=0;for(const p of this.pops){p.t+=dt;if(p.t<.32){this.dummy.position.set(p.x,p.t*3,p.z);this.dummy.scale.setScalar(1+p.t*2);this.dummy.rotation.set(p.t*8,p.t*5,p.t*3);this.dummy.updateMatrix();this.popMesh.setMatrixAt(pn++,this.dummy.matrix);}}
    this.pops=this.pops.filter(p=>p.t<.32);this.popMesh.count=pn;this.popMesh.instanceMatrix.needsUpdate=true;
    this.items=this.items.filter(z=>z.alive);if(!retreat)weapons?.fireAtNearest(this.items,car,dt,(z)=>this.kill(z,coins,onKill));
  }
  kill(z,coins,onKill){if(!z.alive)return;z.alive=false;this.kills++;coins.drop(z.x,z.z,CONFIG.zombies.coinDrop);if(this.pops.length<24)this.pops.push({x:z.x,z:z.z,t:0});onKill?.();}
}
