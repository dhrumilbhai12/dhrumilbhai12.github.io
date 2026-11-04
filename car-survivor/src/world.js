import * as THREE from '../lib/three/three.module.js';
import { CONFIG } from './config.js';

const mat = (color, roughness=1) => new THREE.MeshStandardMaterial({color, roughness, flatShading:true});
const cube = new THREE.BoxGeometry(1,1,1);
function hash(x,z) { let n = (x*374761393 + z*668265263 + CONFIG.world.seed*1442695041)|0; n = Math.imul(n ^ n>>>13,1274126177); return ((n ^ n>>>16)>>>0)/4294967295; }
function rng(seed) { let s = seed|0; return () => { s = (Math.imul(s,1664525)+1013904223)|0; return (s>>>0)/4294967296; }; }

export class World {
  constructor(scene) {
    this.scene=scene; this.chunks=new Map(); this.colliders=[]; this.ground=new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.visuals.groundSize,CONFIG.visuals.groundSize),mat(CONFIG.visuals.grassColors[0]));
    this.ground.rotation.x=-Math.PI/2; this.ground.position.y=-.18; this.ground.receiveShadow=true; scene.add(this.ground);
    this.mats={grass:CONFIG.visuals.grassColors.map(c=>mat(c)),sand:mat(CONFIG.visuals.sandColor),road:mat(CONFIG.visuals.roadColor),line:mat(CONFIG.visuals.roadLine),building:[0xb8a27b,0x9d8d6b,0xc6ae7d,0x897a63].map(c=>mat(c)),roof:[0x765c4a,0x8f6045,0x5e665e].map(c=>mat(c)),rock:[0x8b8067,0xaaa184,0x726c58].map(c=>mat(c)),wood:mat(0x765638),green:[0x687c39,0x839644,0x536b39].map(c=>mat(c)),yellow:mat(0xd2b852)};
  }
  update(pos) {
    const size=CONFIG.world.chunkSize, cx=Math.floor(pos.x/size),cz=Math.floor(pos.z/size), radius=CONFIG.world.activeRadius, keep=new Set();
    for(let z=cz-radius;z<=cz+radius;z++) for(let x=cx-radius;x<=cx+radius;x++){const key=`${x},${z}`;keep.add(key);if(!this.chunks.has(key))this.chunks.set(key,this.buildChunk(x,z));}
    for(const [key,group] of this.chunks) if(!keep.has(key)){this.scene.remove(group);group.traverse(o=>{if(o.userData.collider){const i=this.colliders.indexOf(o.userData.collider);if(i>=0)this.colliders.splice(i,1);}if(o.geometry&&o.geometry!==cube)o.geometry.dispose();});this.chunks.delete(key);}
  }
  addBox(group,geo,material,x,y,z,sx,sy,sz,collide=false) {
    const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    if(collide){const c={x,z,r:Math.max(sx,sz)*.56};mesh.userData.collider=c;this.colliders.push(c);} return mesh;
  }
  buildChunk(cx,cz) {
    const size=CONFIG.world.chunkSize, centerX=cx*size+size/2,centerZ=cz*size+size/2, group=new THREE.Group(); group.position.set(0,0,0);
    const v=hash(cx,cz), rand=rng((cx*73856093^cz*19349663^CONFIG.world.seed)|0), town=v<CONFIG.world.townChance, farm=!town&&v<CONFIG.world.townChance+CONFIG.world.farmChance;
    const base=town?this.mats.grass[1]:farm?this.mats.grass[2]:v>.58?this.mats.sand:this.mats.grass[0];
    this.addBox(group,cube,base,centerX,-.3,centerZ,size,.5,size);
    const majorX=((cx%4)+4)%4===0, majorZ=((cz%4)+4)%4===0;
    if(majorX||majorZ){if(majorX)this.road(group,centerX,centerZ,size,CONFIG.world.roadWidth,true);if(majorZ)this.road(group,centerX,centerZ,size,CONFIG.world.roadWidth,false);}
    if(town){
      for(let i=0;i<6;i++){const x=centerX+(rand()-.5)*45,z=centerZ+(rand()-.5)*45;if(majorX&&Math.abs(x-centerX)<11||majorZ&&Math.abs(z-centerZ)<11)continue;
        const w=6+rand()*7,d=6+rand()*8,h=4+rand()*8;
        this.addBox(group,cube,this.mats.building[Math.floor(rand()*4)],x,h/2-.03,z,w,h,d,true);
        const roof=this.addBox(group,new THREE.ConeGeometry(.72,1,4),this.mats.roof[Math.floor(rand()*3)],x,h+.25,z,w*.72,1,d*.72);roof.rotation.y=Math.PI/4;
        // A few storefront awnings add color and scale.
        if(i%3===0)this.addBox(group,cube,this.mats.yellow,x,h*.45,z+d*.51,w*.45,.7,.4);
      }
    } else if(farm){
      const bx=centerX+(rand()-.5)*28,bz=centerZ+(rand()-.5)*28;
      this.addBox(group,cube,this.mats.wood,bx,2,bz,11,4,9,true);
      const roof=this.addBox(group,new THREE.ConeGeometry(.72,1,4),this.mats.roof[1],bx,4.2,bz,7,2,6);roof.rotation.y=Math.PI/4;
      // Sparse crop rows, interrupted by the road corridor.
      for(let row=0;row<5;row++)for(let col=0;col<6;col++){const x=centerX-25+col*9,z=centerZ-24+row*11;if(majorX&&Math.abs(x-centerX)<7||majorZ&&Math.abs(z-centerZ)<7)continue;this.addBox(group,cube,this.mats.green[Math.floor(rand()*3)],x,.35,z,1.4,.7,2.8);}
    }
    for(let i=0;i<CONFIG.world.propCount;i++){
      const x=centerX+(rand()-.5)*58,z=centerZ+(rand()-.5)*58;if((majorX&&Math.abs(x-centerX)<7)||(majorZ&&Math.abs(z-centerZ)<7))continue;
      if(town&&rand()<.55)continue;
      if(v>.58&&!town&&rand()<.55){const g=new THREE.Group();g.position.set(x,0,z);group.add(g);this.addBox(g,new THREE.ConeGeometry(.7,2.7,5),this.mats.green[Math.floor(rand()*3)],0,1.3,0,1,1,1);this.addBox(g,cube,this.mats.wood,0,.3,0,.32,.6,.32);}
      else {const r=.7+rand()*1.5;this.addBox(group,new THREE.DodecahedronGeometry(1,0),this.mats.rock[Math.floor(rand()*3)],x,r*.45,z,r,r*.8,r,true);}
    }
    // Occasional readable landmark silhouettes.
    if(hash(cx+113,cz-71)>.88){this.addBox(group,cube,this.mats.wood,centerX+22,5,centerZ-21,1.2,10,1.2);this.addBox(group,cube,this.mats.wood,centerX+22,8,centerZ-21,6,.7,1.4);}
    this.scene.add(group);return group;
  }
  road(group,x,z,size,width,horizontal) {
    const sx=horizontal?size:width,sz=horizontal?width:size;
    this.addBox(group,cube,this.mats.road,x,-.02,z,sx,.12,sz);
    if(horizontal){this.addBox(group,cube,this.mats.line,x,-.005,z,sx,.03,.14);}else{this.addBox(group,cube,this.mats.line,x,-.005,z,.14,.03,sz);}
  }
  collides(x,z,r) {for(const c of this.colliders){const dx=x-c.x,dz=z-c.z,limit=r+c.r;if(dx*dx+dz*dz<limit*limit)return true;}return false;}
  isRoad(x,z){const size=CONFIG.world.chunkSize,cx=Math.floor(x/size),cz=Math.floor(z/size);return (((cx%4)+4)%4===0&&Math.abs((x-(cx*size+size/2)))<CONFIG.world.roadWidth/2)||(((cz%4)+4)%4===0&&Math.abs((z-(cz*size+size/2)))<CONFIG.world.roadWidth/2);}
}
