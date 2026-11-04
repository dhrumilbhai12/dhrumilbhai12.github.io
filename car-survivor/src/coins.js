import * as THREE from '../lib/three/three.module.js';
import { CONFIG } from './config.js';

export class Coins {
  constructor(scene){this.scene=scene;this.max=CONFIG.coins.capacity;this.items=Array.from({length:this.max},()=>({active:false,x:0,z:0,value:0,phase:0}));this.mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.48,.48,.18,10),new THREE.MeshStandardMaterial({color:0xffc32f,metalness:.35,roughness:.38,flatShading:true,emissive:0x4c2600}),this.max);this.mesh.castShadow=true;scene.add(this.mesh);this.dummy=new THREE.Object3D();this.collected=0;}
  drop(x,z,value=1){const c=this.items.find(item=>!item.active);if(!c)return;Object.assign(c,{active:true,x,z,value,phase:Math.random()*6});}
  update(dt,car,time,onCollect){let count=0;for(const c of this.items){if(!c.active)continue;const dx=car.position.x-c.x,dz=car.position.z-c.z,d=Math.hypot(dx,dz);
      if(d<CONFIG.coins.magnetRadius){const pull=(1-d/CONFIG.coins.magnetRadius)*8+2;c.x+=dx/(d||1)*pull*dt;c.z+=dz/(d||1)*pull*dt;}
      if(d<CONFIG.coins.pickupRadius){onCollect(c.value);this.collected+=c.value;c.active=false;}
    }
    for(const c of this.items){if(!c.active)continue;this.dummy.position.set(c.x,CONFIG.coins.floatHeight+Math.sin(time*3+c.phase)*.13,c.z);this.dummy.rotation.set(Math.PI/2,0,time*1.8+c.phase);this.dummy.updateMatrix();this.mesh.setMatrixAt(count++,this.dummy.matrix);}
    this.mesh.count=count;this.mesh.instanceMatrix.needsUpdate=true;
  }
}
