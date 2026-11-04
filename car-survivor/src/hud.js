export class HUD {
  constructor(){this.coins=document.querySelector('#coins');this.timer=document.querySelector('#timer');this.day=document.querySelector('#day');this.health=document.querySelector('#health');this.healthShell=this.health.parentElement;this.combo=document.querySelector('#combo');this.toast=document.querySelector('#toast');this.toastTimer=0;}
  update({coins,time,day,health,multiplier,retreat}){this.coins.textContent=Math.floor(coins).toLocaleString();const minutes=Math.floor(time/60),seconds=Math.floor(time%60);this.timer.textContent=`${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;this.day.textContent=retreat?`DAY ${day} · INFECTED RETREAT`:`DAY ${day} · SURVIVE THE DAY`;const hp=Math.max(0,health);this.health.style.width=`${hp}%`;this.healthShell.classList.toggle('low',hp<35);this.combo.textContent=multiplier>1?`COMBO ×${multiplier}`:'';}
  message(text){this.toast.textContent=text;this.toast.classList.add('show');this.toastTimer=2.3;}
  tick(dt){if(this.toastTimer>0&&(this.toastTimer-=dt)<=0)this.toast.classList.remove('show');}
}
