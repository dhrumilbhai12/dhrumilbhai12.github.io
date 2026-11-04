import * as THREE from '../lib/three/three.module.js';
import { CONFIG } from './config.js';
import { World } from './world.js';
import { Car } from './car.js';
import { Zombies } from './zombies.js';
import { Weapons } from './weapons.js';
import { Coins } from './coins.js';
import { HUD } from './hud.js';
import { Input } from './input.js';
import { loadSave, save } from './save.js';

const root=document.querySelector('#game'),overlay=document.querySelector('#overlay'),title=document.querySelector('#overlay-title'),copy=document.querySelector('#overlay-copy'),summary=document.querySelector('#summary'),resume=document.querySelector('#resume'),restart=document.querySelector('#restart');
const isMobile=matchMedia('(pointer:coarse)').matches||innerWidth<760;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,isMobile?CONFIG.render.mobilePixelRatio:CONFIG.render.desktopPixelRatio));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;root.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x91d4eb);scene.fog=new THREE.Fog(0x91d4eb,90,205);
const camera=new THREE.PerspectiveCamera(CONFIG.camera.fov,innerWidth/innerHeight,CONFIG.camera.near,CONFIG.camera.far);
scene.add(new THREE.HemisphereLight(0xe4f7ff,0x71804e,2.0));
const sun=new THREE.DirectionalLight(0xfff0c7,3.0);sun.castShadow=true;sun.shadow.mapSize.set(CONFIG.render.shadowMap,CONFIG.render.shadowMap);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;scene.add(sun);sun.position.set(-32,60,28);
const saved=loadSave();CONFIG.world.seed=saved.seed;
const world=new World(scene),car=new Car(scene),input=new Input(),hud=new HUD(),coins=new Coins(scene),weapons=new Weapons(scene),zombies=new Zombies(scene,isMobile?CONFIG.zombies.mobileCap:CONFIG.zombies.desktopCap);
let bank=saved.coins,runCoins=0,time=0,day=1,dayClock=0,retreat=0,comboKills=0,lastKill=-100,paused=false,dead=false,quality=2,saveClock=0,lastDamage=0;
const qualityButton=document.querySelector('#quality');
function updateQuality(){qualityButton.textContent=CONFIG.render.quality[quality];renderer.shadowMap.enabled=quality>0;sun.castShadow=quality>0;renderer.setPixelRatio(Math.min(devicePixelRatio,isMobile?CONFIG.render.mobilePixelRatio:CONFIG.render.desktopPixelRatio)*(quality===0?.75:quality===1?.9:1));}
updateQuality();
function setPaused(value){if(dead)return;paused=value;overlay.classList.toggle('hidden',!paused);title.textContent='PAUSED';copy.textContent='Take a breath. The infected are still out there.';summary.textContent='';resume.textContent='CONTINUE';restart.classList.add('hidden');}
document.querySelector('#pause').addEventListener('click',()=>setPaused(!paused));resume.addEventListener('click',()=>{if(dead){newRun();return;}setPaused(false);});
qualityButton.addEventListener('click',()=>{quality=(quality+1)%CONFIG.render.quality.length;updateQuality();});
addEventListener('keydown',e=>{if(e.code==='Escape'&&!dead)setPaused(!paused);});
function saveProgress(){save({coins:bank,bestTime:Math.max(saved.bestTime,time),bestDay:Math.max(saved.bestDay,day),seed:CONFIG.world.seed});}
function newRun(){location.reload();}
restart.addEventListener('click',newRun);
function die(){if(dead)return;dead=true;paused=true;saveProgress();overlay.classList.remove('hidden');title.textContent='RUN OVER';copy.textContent='Your run ends here. The road keeps going.';summary.textContent=`${formatTime(time)} survived · Day ${day} · ${zombies.kills} infected cleared · +${runCoins} coins`;resume.textContent='PLAY AGAIN';restart.classList.remove('hidden');}
function formatTime(seconds){return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
function onKill(){const now=time;if(now-lastKill<CONFIG.combo.window)comboKills++;else comboKills=1;lastKill=now;}
function multiplier(){if(time-lastKill>CONFIG.combo.window)return 1;return CONFIG.combo.multipliers[Math.min(CONFIG.combo.multipliers.length-1,comboKills>=4?3:comboKills>=3?2:comboKills>=2?1:0)];}
function onCollect(value){const got=value*multiplier();bank+=got;runCoins+=got;}
let prev=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-prev)/1000);prev=now;hud.tick(dt);
  if(!paused&&!dead){time+=dt;dayClock+=dt;
    if(retreat>0){retreat-=dt;if(retreat<=0)hud.message(`DAY ${day} BEGINS`);}
    if(dayClock>=CONFIG.run.secondsPerDay){dayClock-=CONFIG.run.secondsPerDay;day++;retreat=CONFIG.run.retreatSeconds;bank+=CONFIG.run.dayBonus;runCoins+=CONFIG.run.dayBonus;hud.message(`DAY ${day-1} SURVIVED · +${CONFIG.run.dayBonus} COINS`);}
    world.update(car.position);car.update(dt,input,world);
    zombies.update(dt,car,world,time,coins,weapons,onKill,retreat>0);
    coins.update(dt,car,time,onCollect);
    if(car.health<100&&time-lastDamage>0){/* reserve health changes are reflected directly below */}
    if(car.health<=0)die();
    if(Math.abs(car.health-(frame.prevHealth??car.health))>.01){lastDamage=time;comboKills=0;}frame.prevHealth=car.health;
    hud.update({coins:bank,time,day,health:car.health,multiplier:comboKills>=2&&time-lastKill<=CONFIG.combo.window?multiplier():1,retreat:retreat>0});
    saveClock+=dt;if(saveClock>15){saveClock=0;saveProgress();}
  }
  const target=new THREE.Vector3(car.position.x,0,car.position.z),ahead=new THREE.Vector3(Math.sin(car.heading)*CONFIG.camera.lookAhead,0,-Math.cos(car.heading)*CONFIG.camera.lookAhead);
const desired=new THREE.Vector3(car.position.x+Math.sin(car.heading)*3,CONFIG.camera.height,car.position.z+Math.cos(car.heading)*CONFIG.camera.distance);
  camera.position.lerp(desired,1-Math.exp(-CONFIG.camera.follow*dt));camera.lookAt(target.add(ahead));
  sun.position.set(car.position.x-32,60,car.position.z+28);sun.target.position.copy(car.position);sun.target.updateMatrixWorld();
  sun.color.set(retreat>0?0xffbd72:0xfff0c7);
  renderer.render(scene,camera);
}
world.update(car.position);requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
