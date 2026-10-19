/* =====================================================================
   PERSONNALISATION — musiques par salle (accueil, salles I à IV, sortie)
   Mets le chemin d’un fichier audio, ex. "audio/salle1.mp3". Laisse "" pour
   garder l’ambiance synthétique douce.
   ===================================================================== */
const MUSIQUES = ["", "", "", "", "", ""];

const $ = s => document.querySelector(s);
const scenes = [...document.querySelectorAll(".scene")];
const ROMAINS = ["", "I", "II", "III", "IV", ""];
const TITRES = ["", "Motion musical", "Affiche animée", "Photomontage", "Publicité", ""];
let cur = 0, busy = false, muted = false, torn = false, ac = null, amb = null, audio = null;

/* ---------- Son : nappes douces + notes de marimba (tout synthétisé) ---------- */
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
function note(fr, d = 1) { // petite note de cloche douce
  const c = ctx(); if (!c || muted) return;
  [1, 2.01, 3.5].forEach((m, i) => {
    const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = fr * m;
    g.gain.setValueAtTime(.12 / (i + 1), c.currentTime); g.gain.exponentialRampToValueAtTime(.0005, c.currentTime + d);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + d);
  });
}
const blip = fr => note(fr, .5);
function fadeOutAmbience() {
  const c = ac; if (amb && c) { const a = amb; a.g.gain.linearRampToValueAtTime(0, c.currentTime + 1.2); setTimeout(() => a.os.forEach(o => o.stop()), 1500); amb = null }
  if (audio) { const a = audio; let v = a.volume; const t = setInterval(() => { v -= .1; if (v <= 0) { a.pause(); clearInterval(t) } else a.volume = v }, 100); audio = null }
}
function startAmbience(i) {
  fadeOutAmbience();
  if (MUSIQUES[i]) { audio = new Audio(MUSIQUES[i]); audio.loop = true; audio.volume = muted ? 0 : .5; audio.play().catch(() => {}); return }
  const c = ctx(); if (!c) return;
  const g = c.createGain(), f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700;
  g.gain.value = 0; g.gain.linearRampToValueAtTime(muted ? 0 : .05, c.currentTime + 2);
  const os = ACCORDS[i].map((fr, k) => { const o = c.createOscillator(); o.type = k ? "triangle" : "sine"; o.frequency.value = fr / 2; o.detune.value = k * 4; o.connect(f); o.start(); return o });
  f.connect(g).connect(c.destination); amb = { os, g };
}
function setVolume(on) { if (amb && ac) amb.g.gain.value = on ? .05 : 0; if (audio) audio.volume = on ? .5 : 0 }
$("#mute").onclick = e => { muted = !muted; e.target.textContent = "Son : " + (muted ? "coupé" : "activé"); e.target.setAttribute("aria-pressed", muted); setVolume(!muted); if (!muted) ctx() };
function duck(on) { setVolume(!on && !muted) } // coupe l’ambiance pendant une vidéo YouTube

/* ---------- Vidéos YouTube (légères : la vidéo ne charge qu’au clic) ---------- */
function ytSrc(id, bg) {
  return "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&modestbranding=1" +
    (bg ? "&autoplay=1&mute=1&controls=0&loop=1&playlist=" + id : "&autoplay=1");
}
function initSlot(el) {
  const id = el.dataset.yt;
  if (el.classList.contains("vslot-bg")) { if (id) el.innerHTML = '<iframe src="' + ytSrc(id, true) + '" allow="autoplay" title="Vidéo d’ambiance"></iframe>'; return }
  el.innerHTML = '<button class="play" aria-label="Lire la vidéo"><span>▶</span><small>' + (id ? "Lire la vidéo" : "Ajoute l’ID YouTube dans index.html") + "</small></button>";
  el.querySelector(".play").onclick = () => {
    if (!el.dataset.yt) return;
    el.innerHTML = '<iframe src="' + ytSrc(el.dataset.yt) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Vidéo"></iframe>'; duck(true);
  };
}
document.querySelectorAll(".vslot").forEach(initSlot);
initSlot($("#bgvid"));

/* ---------- Navigation linéaire (avant / arrière) ---------- */
function ui(n) { // couleurs de la barre selon la salle
  const cs = getComputedStyle(scenes[n]), r = document.documentElement.style;
  r.setProperty("--ui-fg", n === 1 || n === 3 || n === 4 ? cs.getPropertyValue("--fg") : "#2a2218");
  r.setProperty("--ui-bg", cs.getPropertyValue("--bg"));
  if (n === 2) r.setProperty("--ui-fg", "#20302c");
  if (n === 5 || n === 0) r.setProperty("--ui-bg", "#efe6d3");
}
function go(n) {
  if (busy || n === cur || n < 0 || n >= scenes.length) return; busy = true;
  const p = scenes[cur], s = scenes[n]; s.classList.add("active", "in"); cur = n;
  $("#next").hidden = $("#back").hidden = true; startAmbience(n); note(ACCORDS[n][2], 1.6); ui(n); plaque(n);
  if (n === 5) setTimeout(() => scenes[5].classList.add("dropping"), 900);
  setTimeout(() => { p.classList.remove("active"); s.classList.remove("in"); busy = false; barre() }, 1150);
}
function plaque(n) { $("#plaque").innerHTML = ROMAINS[n] ? "Salle<b>" + ROMAINS[n] + "</b>" + TITRES[n] : n === 5 ? "Sortie" : "Accueil" }
function barre() {
  const nx = $("#next"), bk = $("#back");
  bk.hidden = cur === 0;
  nx.hidden = cur >= 5 || (cur === 0 && !torn);
  nx.textContent = cur === 0 ? "Entrer dans la salle I →" : cur === 4 ? "Vers la sortie →" : "Salle suivante →";
}
$("#next").onclick = () => go(cur + 1);
$("#back").onclick = () => go(cur - 1);
addEventListener("keydown", e => { if (e.key === "ArrowRight" && !$("#next").hidden) go(cur + 1); if (e.key === "ArrowLeft" && !$("#back").hidden) go(cur - 1) });
plaque(0); ui(0);

/* ---------- Accueil : ticket ---------- */
$("#ticket").onclick = () => {
  if (torn) return; torn = true; ctx(); noise(.5, .5, 2400); startAmbience(0);
  $("#ticket").classList.add("torn"); setTimeout(() => { $("#plan").classList.add("on"); barre() }, 900);
};

/* ---------- Salle I : pistes ---------- */
document.querySelectorAll("#tracks button").forEach(b => b.onclick = () => {
  document.querySelectorAll("#tracks button").forEach(x => x.classList.remove("on")); b.classList.add("on");
  document.querySelectorAll(".proj").forEach(p => p.classList.toggle("on", p.id === b.dataset.p));
  note(523, .6); setTimeout(() => note(659, .6), 90);
});

/* ---------- Salle II : 3 étapes ---------- */
$("#tl").oninput = e => { $("#trio").dataset.step = e.target.value; note(330 + e.target.value * 110, .5) };

/* ---------- Salle III : les éléments sortent de la page ---------- */
const ph = $("#photo"); let first = true;
ph.addEventListener("pointerenter", () => { ph.classList.add("hot"); if (first) { first = false; noise(.8, .22, 3500); note(440, 1.2) } });
ph.addEventListener("pointermove", e => {
  const r = ph.getBoundingClientRect();
  ph.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5) * 40 + "px");
  ph.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5) * 40 + "px");
});
ph.addEventListener("pointerleave", () => ph.classList.remove("hot"));
ph.addEventListener("focus", () => ph.classList.add("hot")); ph.addEventListener("blur", () => ph.classList.remove("hot"));

/* ---------- Salle IV : vidéo derrière → choix → fenêtre ---------- */
const st = $("#stage5");
st.addEventListener("click", e => { if (!e.target.closest(".choice")) st.classList.toggle("on") }); // tactile
document.querySelectorAll(".choice").forEach(b => b.onclick = () => {
  note(494, .6);
  $("#mtitre").textContent = b.dataset.titre; $("#mbrief").textContent = b.dataset.brief; $("#mrole").textContent = b.dataset.role;
  $("#moutils").textContent = b.dataset.outils; $("#mduree").textContent = b.dataset.duree;
  const v = $("#mvid"); v.dataset.yt = b.dataset.yt; initSlot(v);
  $("#modal").classList.add("on"); $("#mx").focus();
});
$("#mx").onclick = () => { $("#modal").classList.remove("on"); $("#mvid").innerHTML = ""; duck(false) };

/* ---------- Sortie : la carte ---------- */
$("#drop").onclick = () => { noise(.4, .25, 900); $("#card").classList.add("on"); $("#nav").style.display = "none" };
$("#flip").onclick = () => { $("#flip").classList.toggle("back"); noise(.25, .2, 1800) };
$("#cx").onclick = () => { $("#card").classList.remove("on"); $("#nav").style.display = "" };
(function qr() {
  const c = $("#qr").getContext("2d"); let s = 7; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const f = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13), xm = x % 14, ym = y % 14;
    const fin = f && (xm % 6 === 0 || ym % 6 === 0 || (xm > 1 && xm < 5 && ym > 1 && ym < 5));
    c.fillStyle = (f ? fin : r() > .5) ? "#2a2218" : "#f6efdd"; c.fillRect(x, y, 1, 1);
  }
})();
