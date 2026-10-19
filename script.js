const $=s=>document.querySelector(s), scenes=[...document.querySelectorAll(".scene")];
let cur=0, busy=false, muted=false, ac=null, drone=null;

/* ---------- Son (synthétisé, sans fichier externe) ---------- */
function ctx(){ if(!ac){ try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){} } if(ac&&ac.state==="suspended")ac.resume(); return ac }
function noise(d,g,f){ const c=ctx(); if(!c||muted)return; const b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),a=b.getChannelData(0);
 for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length); const s=c.createBufferSource(); s.buffer=b;
 const fl=c.createBiquadFilter(); fl.type="bandpass"; fl.frequency.value=f; const gn=c.createGain(); gn.gain.value=g; s.connect(fl).connect(gn).connect(c.destination); s.start() }
function blip(fr,d=.12){ const c=ctx(); if(!c||muted)return; const o=c.createOscillator(),g=c.createGain(); o.frequency.value=fr; o.type="triangle";
 g.gain.setValueAtTime(.15,c.currentTime); g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime+d) }
const tones=[196,261,220,174,233,196];
function setDrone(i){ const c=ctx(); if(!c)return; if(drone){drone.g.gain.linearRampToValueAtTime(0,c.currentTime+1);const o=drone.o;setTimeout(()=>o.stop(),1200)}
 const o=c.createOscillator(),g=c.createGain(); o.type=i===3?"sawtooth":"sine"; o.frequency.value=tones[i]/2; g.gain.value=0;
 g.gain.linearRampToValueAtTime(muted?0:.03,c.currentTime+1.5); o.connect(g).connect(c.destination); o.start(); drone={o,g} }
$("#mute").onclick=e=>{ muted=!muted; e.target.textContent="Son : "+(muted?"coupé":"activé"); e.target.setAttribute("aria-pressed",muted); if(drone)drone.g.gain.value=muted?0:.03; if(!muted)ctx() };

/* ---------- Navigation linéaire ---------- */
const labels=["Accueil","1/4","2/4","3/4","4/4","Sortie"];
function go(n){ if(busy||n===cur||n>=scenes.length)return; busy=true;
 const p=scenes[cur], s=scenes[n]; s.classList.add("active","in"); cur=n;
 $("#loc").textContent=labels[n]; $("#next").hidden=true; setDrone(n);
 if(n===5)setTimeout(()=>scenes[5].classList.add("dropping"),900);
 setTimeout(()=>{ p.classList.remove("active"); s.classList.remove("in"); busy=false; showNext() },1150) }
function showNext(){ const b=$("#next"); if(cur===0&&!torn||cur>=5){b.hidden=true;return}
 b.textContent=cur===0?"Entrer dans la salle 1":cur===4?"Vers la sortie":"Salle suivante"; b.hidden=false }
$("#next").onclick=()=>go(cur+1);
addEventListener("keydown",e=>{ if(e.key==="ArrowRight"&&!$("#next").hidden)go(cur+1) });

/* ---------- Scène 1 : ticket ---------- */
let torn=false;
$("#ticket").onclick=()=>{ if(torn)return; torn=true; ctx(); noise(.5,.5,2400); setDrone(0);
 $("#ticket").classList.add("torn"); setTimeout(()=>{$("#plan").classList.add("on");showNext()},900) };

/* ---------- Scène 2 : pistes ---------- */
document.querySelectorAll("#tracks button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#tracks button").forEach(x=>x.classList.remove("on")); b.classList.add("on");
 blip(660); setTimeout(()=>blip(880),90); $("#player").classList.add("on"); $("#ptitle").textContent=b.dataset.t.split(" · ")[1]||"GREENGREEN" });

/* ---------- Scène 3 : timeline ---------- */
$("#tl").oninput=e=>{ const v=+e.target.value, p=$("#poster"), o=$("#orb");
 p.style.transform=`translateX(${(v-50)*.6}%) rotate(${v*.9-45}deg) scale(${1+v/160})`; p.style.borderRadius=v+"px";
 o.style.left=10+v*.7+"%"; o.style.top=60-Math.sin(v/16)*30+"%"; p.textContent=v<5?"Affiche":v<95?"En mouvement":"Mobile";
 if(v%8===0)blip(300+v*4,.05) };

/* ---------- Scène 4 : survol / parallaxe ---------- */
const ph=$("#photo");
function par(x,y){ ph.classList.add("hot"); ph.querySelectorAll("i").forEach(i=>{const d=+i.dataset.d;
 i.style.transform=`translate(${x*d}px,${y*d}px) rotate(${x*d*.6}deg)`}) }
let first=true;
ph.addEventListener("pointermove",e=>{ const r=ph.getBoundingClientRect(); if(first){first=false;noise(.7,.25,3500);blip(440,.4)}
 par((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5) });
ph.addEventListener("pointerleave",()=>ph.classList.remove("hot"));

/* ---------- Scène 5 : modale ---------- */
$("#thumb").onclick=()=>{ blip(520); $("#modal").classList.add("on"); $("#mx").focus() };
$("#mx").onclick=()=>{ blip(380); $("#modal").classList.remove("on") };

/* ---------- Scène 6 : carte ---------- */
$("#drop").onclick=()=>{ noise(.4,.3,900); $("#card").classList.add("on") };
$("#flip").onclick=e=>{ $("#flip").classList.toggle("back"); noise(.25,.25,1800) };
$("#cx").onclick=()=>{ $("#card").classList.remove("on") };
(function qr(){ const c=$("#qr").getContext("2d"); let s=7; const r=()=>(s=s*16807%2147483647)/2147483647;
 for(let y=0;y<21;y++)for(let x=0;x<21;x++){ const f=(x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);
  const fin=f&&(x%6===0||y%6===0||x%14===0||y%14===0||x%14===6||y%14===6||((x%14>1&&x%14<5)&&(y%14>1&&y%14<5)));
  c.fillStyle=(f?fin:r()>.5)?"#2a2218":"#f6efdd"; c.fillRect(x,y,1,1) } })();
$("#loc").textContent="Accueil";
