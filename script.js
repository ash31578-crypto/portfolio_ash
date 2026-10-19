/* =====================================================================
   PERSONNALISATION
   ===================================================================== */
// 1) Tes vidéos YouTube : colle l’identifiant (la fin du lien youtube.com/watch?v=IDENTIFIANT)
//    Pour un Short : youtube.com/shorts/IDENTIFIANT. Laisse "" si la vidéo n’est pas prête.
const VIDEOS = {
  p1: "", p2: "",                 // Salle I : piste 1 et piste 2
  s3a: "", s3b: "", s3c: "",      // Salle II : les 3 projets (animations)
  s4: "",                         // Salle III : photomontage complet
  bg5: "",                        // Salle IV : vidéo d’ambiance derrière l’écran (muette, en boucle)
  v5a: "", v5b: ""                // Salle IV : les deux cartes
};
// 2) Musique d’ambiance : une case par lieu [accueil, salle I, II, III, IV, sortie]
//    false = pas de musique dans ce lieu (ici I et IV, qui ont déjà de la musique dans leurs vidéos)
const AMBIANCE = [true, false, true, true, false, true];
// 3) Tes propres fichiers audio, ex. "audio/salle2.mp3" ("" = ambiance synthétique douce)
const MUSIQUES = ["", "", "", "", "", ""];

/* ===================================================================== */
const $ = s => document.querySelector(s);
const scenes = [...document.querySelectorAll(".scene")];
const ROMAINS = ["", "I", "II", "III", "IV", ""];
const TITRES = ["", "Motion musical", "Affiche animée", "Photomontage", "Publicité", ""];
const TRANS = ["iris", "iris", "curtain", "glitch", "diag", "door"]; // transition d’arrivée de chaque lieu
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
/* petits sons d’interaction sur tous les boutons */
let lastHover = null;
document.addEventListener("click", e => { if (e.target.closest("button,a,.choice")) note(784, .18, .07) });
document.addEventListener("pointerover", e => {
  const b = e.target.closest("button,.choice"); if (b && b !== lastHover && e.pointerType !== "touch") note(1318, .1, .03); lastHover = b;
});
function fadeOutAmbience() {
  if (amb && ac) { const a = amb; a.g.gain.linearRampToValueAtTime(0, ac.currentTime + 1.2); setTimeout(() => a.os.forEach(o => o.stop()), 1500); amb = null }
  if (audio) { const a = audio; let v = a.volume; const t = setInterval(() => { v -= .1; if (v <= 0) { a.pause(); clearInterval(t) } else a.volume = v }, 100); audio = null }
}
function startAmbience(i) {
  fadeOutAmbience();
  if (!AMBIANCE[i]) return; // lieu silencieux
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

/* ---------- Vidéos YouTube (chargées seulement au clic) ---------- */
function ytSrc(id, bg) {
  return "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&modestbranding=1" +
    (bg ? "&autoplay=1&mute=1&controls=0&loop=1&playlist=" + id : "&autoplay=1");
}
function initSlot(el) {
  const id = VIDEOS[el.dataset.v] || "";
  if (el.classList.contains("vslot-bg")) { if (id) el.innerHTML = '<iframe src="' + ytSrc(id, true) + '" allow="autoplay" title="Vidéo d’ambiance"></iframe>'; return }
  el.innerHTML = '<button class="play" aria-label="Lire la vidéo"><span>▶</span><small>' + (id ? "Lire la vidéo" : "Ajoute l’ID dans VIDEOS (script.js)") + "</small></button>";
  el.querySelector(".play").onclick = () => {
    if (!id) return;
    el.innerHTML = '<iframe src="' + ytSrc(id) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Vidéo"></iframe>'; duck(true);
  };
}
document.querySelectorAll(".vslot").forEach(initSlot);
initSlot($("#bgvid"));

/* ---------- Navigation : avant, arrière, accueil ---------- */
function ui(n) {
  const cs = getComputedStyle(scenes[n]), r = document.documentElement.style;
  r.setProperty("--ui-fg", cs.getPropertyValue("--fg").trim() || "#fff");
  r.setProperty("--ui-bg", cs.getPropertyValue("--bg").trim() || "#000");
}
function plaque(n) { $("#plaque").innerHTML = ROMAINS[n] ? "Salle<b>" + ROMAINS[n] + "</b>" + TITRES[n] : n === 5 ? "Sortie" : "Accueil" }
function go(n) {
  if (busy || n === cur || n < 0 || n >= scenes.length) return; busy = true;
  const p = scenes[cur], s = scenes[n], t = "t-" + TRANS[n];
  s.classList.add("active", "in", t); cur = n;
  $("#next").hidden = $("#back").hidden = $("#home").hidden = true;
  startAmbience(n); note(ACCORDS[n][2], 1.6); ui(n); plaque(n);
  if (n === 5) setTimeout(() => scenes[5].classList.add("dropping"), 900);
  setTimeout(() => { p.classList.remove("active"); s.classList.remove("in", t); busy = false; barre() }, 1350);
}
function barre() {
  const nx = $("#next");
  $("#back").hidden = cur === 0; $("#home").hidden = cur === 0;
  nx.hidden = cur >= 5 || (cur === 0 && !torn);
  nx.textContent = cur === 0 ? "Entrer dans la salle I →" : cur === 4 ? "Vers la sortie →" : "Salle suivante →";
}
$("#next").onclick = () => go(cur + 1);
$("#back").onclick = () => go(cur - 1);
$("#home").onclick = () => go(0);
addEventListener("keydown", e => { if (e.key === "ArrowRight" && !$("#next").hidden) go(cur + 1); if (e.key === "ArrowLeft" && !$("#back").hidden) go(cur - 1) });
plaque(0); ui(0);

/* ---------- Accueil : ticket ---------- */
$("#ticket").onclick = () => {
  if (torn) return; torn = true; ctx(); noise(.5, .5, 2400); startAmbience(0);
  $("#ticket").classList.add("torn"); setTimeout(() => { $("#plan").classList.add("on"); barre() }, 900);
};

/* ---------- Salle I : pistes + disque qui s’emballe ---------- */
document.querySelectorAll("#tracks button").forEach(b => b.onclick = () => {
  document.querySelectorAll("#tracks button").forEach(x => x.classList.remove("on")); b.classList.add("on");
  document.querySelectorAll(".proj").forEach(p => p.classList.toggle("on", p.id === b.dataset.p));
  $("#disc").classList.add("playing"); noise(.35, .18, 5000); // petit « scratch » de disque
});

/* ---------- Salle II : 3 étapes ---------- */
$("#tl").oninput = e => { $("#trio").dataset.step = e.target.value; note(330 + e.target.value * 110, .5) };

/* ---------- Salle III : les éléments quittent la page ---------- */
const ph = $("#photo"); let first = true;
ph.addEventListener("pointerenter", () => { ph.classList.add("hot"); if (first) { first = false; noise(.8, .22, 3500); note(440, 1.2) } });
ph.addEventListener("pointermove", e => {
  const r = ph.getBoundingClientRect();
  ph.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5) * 60 + "px");
  ph.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5) * 60 + "px");
});
ph.addEventListener("pointerleave", () => ph.classList.remove("hot"));
ph.addEventListener("focus", () => ph.classList.add("hot")); ph.addEventListener("blur", () => ph.classList.remove("hot"));

/* ---------- Salle IV : vidéo derrière → deux cartes → fenêtre ---------- */
const st = $("#stage5");
st.addEventListener("click", e => { if (!e.target.closest(".choice")) st.classList.toggle("on") });
function ouvrir(b) {
  $("#mtitre").textContent = b.dataset.titre; $("#mbrief").textContent = b.dataset.brief; $("#mrole").textContent = b.dataset.role;
  $("#moutils").textContent = b.dataset.outils; $("#mduree").textContent = b.dataset.duree;
  const v = $("#mvid"); v.dataset.v = b.dataset.v; initSlot(v);
  $("#modal").classList.add("on"); $("#mx").focus();
}
document.querySelectorAll(".choice").forEach(b => b.onclick = () => {
  if (b.classList.contains("back")) { // la carte du fond passe devant
    document.querySelectorAll(".choice").forEach(x => { x.classList.toggle("back"); x.classList.toggle("front") }); noise(.2, .2, 1800);
  } else ouvrir(b);
});
$("#mx").onclick = () => { $("#modal").classList.remove("on"); $("#mvid").innerHTML = ""; duck(false) };

/* ---------- Sortie : la carte ---------- */
$("#drop").onclick = () => { noise(.4, .25, 900); $("#card").classList.add("on"); $("#nav").style.display = "none"; $("#bye").textContent = "Elle vous attend dans votre poche." };
$("#flip").onclick = () => { $("#flip").classList.toggle("back"); noise(.25, .2, 1800) };
$("#cx").onclick = () => { $("#card").classList.remove("on"); $("#nav").style.display = "" };
(function qr() {
  const c = $("#qr").getContext("2d"); let s = 7; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const f = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13), xm = x % 14, ym = y % 14;
    const fin = f && (xm % 6 === 0 || ym % 6 === 0 || (xm > 1 && xm < 5 && ym > 1 && ym < 5));
    c.fillStyle = (f ? fin : r() > .5) ? "#2a2218" : "#f7f2e6"; c.fillRect(x, y, 1, 1);
  }
})();
