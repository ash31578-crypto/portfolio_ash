/* =====================================================================
   PERSONNALISATION
   ===================================================================== */
// 1) Vidéos YouTube : colle l’identifiant (la fin du lien youtube.com/watch?v=IDENTIFIANT ; pour un Short : youtube.com/shorts/IDENTIFIANT)
const VIDEOS = {
  p1: "", p2: "",                 // Salle I : piste 1 et piste 2
  s3a: "", s3b: "", s3c: "",      // Salle II : les 3 animations
  s4: "",                         // Salle III : photomontage complet
  bg5: "",                        // Salle IV : vidéo muette derrière l’écran
  v5a: "", v5b: ""                // Salle IV : les deux cartes
};
// 2) Titres des deux pistes du disque (salle I)
const PISTES = ["Piste 1 — Titre du projet 1", "Piste 2 — Titre du projet 2"];
// 3) Musique d’ambiance par lieu [hall, salle I, II, III, IV, sortie] : false = silence
const AMBIANCE = [true, false, true, true, false, true];
// 4) Tes fichiers audio ("" = ambiance synthétique douce), ex. "audio/salle2.mp3"
const MUSIQUES = ["", "", "", "", "", ""];
/* ===================================================================== */

const $ = s => document.querySelector(s);
const scenes = [...document.querySelectorAll(".scene")];
const ROMAINS = ["", "I", "II", "III", "IV", ""];
const TITRES = ["", "Motion musical", "Affiche animée", "Photomontage", "Publicité", ""];
let cur = 0, busy = false, muted = false, torn = false, ac = null, amb = null, audio = null;

/* ---------- Son ---------- */
const ACCORDS = [[196, 247, 294], [220, 277, 330], [261, 330, 392], [174, 220, 261], [233, 294, 349], [196, 247, 294]];
function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)() } catch (e) {} } if (ac && ac.state === "suspended") ac.resume(); return ac }
function noise(d, g, f) {
  const c = ctx(); if (!c || muted) return;
  const b = c.createBuffer(1, c.sampleRate * d, c.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
  const s = c.createBufferSource(); s.buffer = b;
  const fl = c.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = f;
  const gn = c.createGain(); gn.gain.value = g; s.connect(fl).connect(gn).connect(c.destination); s.start();
}
function note(fr, d = 1, v = .12) {
  const c = ctx(); if (!c || muted) return;
  [1, 2.01, 3.5].forEach((m, i) => {
    const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = fr * m;
    g.gain.setValueAtTime(v / (i + 1), c.currentTime); g.gain.exponentialRampToValueAtTime(.0005, c.currentTime + d);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + d);
  });
}
let lastHover = null;
document.addEventListener("click", e => { if (e.target.closest("button,a,.cdw")) note(784, .18, .07) });
document.addEventListener("pointerover", e => {
  const b = e.target.closest("button"); if (b && b !== lastHover && e.pointerType !== "touch") note(1318, .1, .03); lastHover = b;
});
function fadeOutAmbience() {
  if (amb && ac) { const a = amb; a.g.gain.linearRampToValueAtTime(0, ac.currentTime + 1.2); setTimeout(() => a.os.forEach(o => o.stop()), 1500); amb = null }
  if (audio) { const a = audio; let v = a.volume; const t = setInterval(() => { v -= .1; if (v <= 0) { a.pause(); clearInterval(t) } else a.volume = v }, 100); audio = null }
}
function startAmbience(i) {
  fadeOutAmbience();
  if (!AMBIANCE[i]) return;
  if (MUSIQUES[i]) { audio = new Audio(MUSIQUES[i]); audio.loop = true; audio.volume = muted ? 0 : .5; audio.play().catch(() => {}); return }
  const c = ctx(); if (!c) return;
  const g = c.createGain(), f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700;
  g.gain.value = 0; g.gain.linearRampToValueAtTime(muted ? 0 : .05, c.currentTime + 2);
  const os = ACCORDS[i].map((fr, k) => { const o = c.createOscillator(); o.type = k ? "triangle" : "sine"; o.frequency.value = fr / 2; o.detune.value = k * 4; o.connect(f); o.start(); return o });
  f.connect(g).connect(c.destination); amb = { os, g };
}
function setVolume(on) { if (amb && ac) amb.g.gain.value = on ? .05 : 0; if (audio) audio.volume = on ? .5 : 0 }
$("#mute").onclick = e => { muted = !muted; e.target.textContent = "Son : " + (muted ? "coupé" : "activé"); e.target.setAttribute("aria-pressed", muted); setVolume(!muted); if (!muted) ctx() };
const duck = on => setVolume(!on && !muted);

/* ---------- Vidéos YouTube (chargées au clic) ---------- */
function ytSrc(id, bg) {
  return "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&modestbranding=1" + (bg ? "&autoplay=1&mute=1&controls=0&loop=1&playlist=" + id : "&autoplay=1");
}
function initSlot(el) {
  const id = VIDEOS[el.dataset.v] || "";
  if (el.classList.contains("vslot-bg")) { if (id) el.innerHTML = '<iframe src="' + ytSrc(id, true) + '" allow="autoplay" title="Vidéo d’ambiance"></iframe>'; return }
  el.innerHTML = '<button class="play" aria-label="Lire la vidéo"><span>▶</span><small>' + (id ? "Lire la vidéo" : "Ajoute l’ID dans VIDEOS (script.js)") + "</small></button>";
  el.querySelector(".play").onclick = () => { if (!id) return; el.innerHTML = '<iframe src="' + ytSrc(id) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Vidéo"></iframe>'; duck(true) };
}
document.querySelectorAll(".vslot").forEach(initSlot);
initSlot($("#bgvid"));

/* ---------- Navigation : on traverse les portes ---------- */
function plaque(n) { $("#plaque").innerHTML = ROMAINS[n] ? "Salle<b>" + ROMAINS[n] + "</b>" + TITRES[n] : n === 5 ? "Sortie" : "Hall d’accueil" }
function go(n) {
  if (busy || n === cur || n < 0 || n >= scenes.length) return; busy = true;
  const p = scenes[cur], s = scenes[n];
  p.className = "scene active out"; s.className = "scene active in";
  cur = n; $("#home").hidden = true; startAmbience(n); setTimeout(() => note(ACCORDS[n][2], 1.6), 600); plaque(n);
  if (n === 5) setTimeout(() => scenes[5].classList.add("dropping"), 1500);
  setTimeout(() => { p.className = "scene"; s.className = "scene active" + (n === 5 ? " dropping" : ""); busy = false; $("#home").hidden = cur === 0 }, 1550);
}
document.querySelectorAll(".arrow").forEach(d => d.onclick = () => go(cur + +d.dataset.go));
$("#home").onclick = () => go(0);
addEventListener("keydown", e => {
  const d = scenes[cur].querySelector(".arrow." + (e.key === "ArrowRight" ? "next" : e.key === "ArrowLeft" ? "back" : "x"));
  if (d && !d.classList.contains("locked")) d.click();
});
plaque(0);

/* ---------- Hall : le ticket ---------- */
$("#ticket").onclick = () => {
  if (torn) return; torn = true; ctx(); noise(.5, .5, 2400); startAmbience(0);
  $("#ticket").classList.add("torn");
  setTimeout(() => { $("#plan").classList.add("on"); $("#d1").classList.remove("locked") }, 900);
};

/* ---------- Salle I : le disque mural donne les pistes ---------- */
const cdw = $("#cdw"); let ang = 0, a0 = 0, st0 = 0, moved = false, drag = false, lastTick = 0;
const pAng = e => { const r = cdw.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180 / Math.PI };
function track(i) {
  document.querySelectorAll("#s2 .proj").forEach(p => p.classList.toggle("on", p.id === "p" + (i + 1) || p.id === "t" + (i + 1)));
  $("#idle").style.display = "none"; $("#cd").classList.add("playing");
  $("#c2").innerHTML = '<b class="serif">' + PISTES[i] + "</b>Le disque tourne : la piste en haut est lancée."; noise(.35, .18, 5000);
}
cdw.addEventListener("pointerdown", e => { drag = true; moved = false; a0 = ang; st0 = pAng(e); cdw.style.transition = "none"; cdw.setPointerCapture(e.pointerId) });
cdw.addEventListener("pointermove", e => {
  if (!drag) return; let d = pAng(e) - st0; if (d > 180) d -= 360; if (d < -180) d += 360;
  if (Math.abs(d) > 4) moved = true; ang = a0 + d; cdw.style.transform = "rotate(" + ang + "deg)";
  if (Math.abs(ang - lastTick) > 25) { lastTick = ang; note(600 + Math.abs(ang % 180), .08, .05) }
});
function lacher() {
  if (!drag) return; drag = false; cdw.style.transition = "";
  ang = moved ? Math.round(ang / 180) * 180 : a0 + 180; cdw.style.transform = "rotate(" + ang + "deg)";
  track(((Math.round(ang / 180) % 2) + 2) % 2);
}
cdw.addEventListener("pointerup", lacher); cdw.addEventListener("pointercancel", lacher);
cdw.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); a0 = ang; moved = false; drag = true; lacher() } });

/* ---------- Salle II : le curseur (print → digital) ---------- */
$("#tl").oninput = e => { $("#trio").dataset.step = e.target.value; note(330 + e.target.value * 110, .5) };

/* ---------- Salle III : les éléments quittent la page ---------- */
const ph = $("#photo"); let first = true;
function unlock() { // l’animation reste débloquée, les éléments bleus restent dans le décor
  ph.classList.add("hot");
  if (first) { first = false; noise(.8, .22, 3500); note(440, 1.2); const id = VIDEOS.s4;
    if (id) $(".pic").insertAdjacentHTML("beforeend", '<iframe class="pv" src="' + ytSrc(id, true) + '" allow="autoplay" title="Animation"></iframe>') }
}
ph.addEventListener("pointerenter", unlock); ph.addEventListener("focus", unlock);
ph.addEventListener("pointermove", e => {
  const r = ph.getBoundingClientRect();
  ph.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5) * 60 + "px");
  ph.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5) * 60 + "px");
});

/* ---------- Salle IV : écran, deux cartes, fenêtre ---------- */
const st = $("#stage5");
st.addEventListener("click", e => { if (!e.target.closest(".choice")) st.classList.toggle("on") });
document.querySelectorAll(".choice").forEach(b => b.onclick = () => {
  if (b.classList.contains("back")) { document.querySelectorAll(".choice").forEach(x => { x.classList.toggle("back"); x.classList.toggle("front") }); noise(.2, .2, 1800); return }
  $("#mtitre").textContent = b.dataset.titre; $("#mbrief").textContent = b.dataset.brief; $("#mrole").textContent = b.dataset.role;
  $("#moutils").textContent = b.dataset.outils; $("#mduree").textContent = b.dataset.duree;
  const v = $("#mvid"); v.dataset.v = b.dataset.v; initSlot(v); $("#modal").classList.add("on"); $("#mx").focus();
});
$("#mx").onclick = () => { $("#modal").classList.remove("on"); $("#mvid").innerHTML = ""; duck(false) };

/* ---------- Sortie : la carte ---------- */
$("#drop").onclick = () => { noise(.4, .25, 900); $("#card").classList.add("on"); $("#bye").textContent = "La carte est à vous." };
$("#flip").onclick = () => { $("#flip").classList.toggle("back"); noise(.25, .2, 1800) };
$("#cx").onclick = () => $("#card").classList.remove("on");
(function qr() {
  const c = $("#qr").getContext("2d"); let s = 7; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const f = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13), xm = x % 14, ym = y % 14;
    const fin = f && (xm % 6 === 0 || ym % 6 === 0 || (xm > 1 && xm < 5 && ym > 1 && ym < 5));
    c.fillStyle = (f ? fin : r() > .5) ? "#2a2218" : "#f7f2e6"; c.fillRect(x, y, 1, 1);
  }
})();
