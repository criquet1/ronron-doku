// ===== Réglages =====
const PALETTES = {
  douce: ['#e2b848', '#e6a5c0', '#c2688b', '#9378d0', '#7fb6d8',
          '#8fcf9a', '#e89b6b', '#6fc1b8', '#b5b5b5', '#d96b5f',
          '#4f8fc0', '#a9c75a', '#7a5c9e', '#c9a27e', '#5aa58b'],
  vive:  ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
          '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabed4',
          '#008080', '#dcbeff', '#9a6324', '#fffac8', '#aaffc3'],
  mixte: ['#e6194b', '#aaffc3', '#4363d8', '#fffac8', '#f58231',
          '#dcbeff', '#3cb44b', '#fabed4', '#46f0f0', '#ffd3b6',
          '#a64dd1', '#bae1ff', '#ffe119', '#d4a5a5', '#bcf60c'],
  pastel: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff',
           '#e0bbe4', '#d4a5a5', '#a8e6cf', '#ffd3b6', '#c7ceea',
           '#f8c8dc', '#b5ead7', '#fdfd96', '#cfcfc4', '#aec6cf']
};
const CAT_IMAGE = 'cat.png';
const MARK = '✖';

// ===== État du jeu =====
let N = 7;
let regions = [];   // numéro de zone de chaque case
let marks = [];     // 0 = vide, 1 = ✖, 2 = chat
let solutionCols = []; // colonne du chat de chaque rangée
let won = false;
let history = [];   // anciens états, pour le bouton Reculer

// ===== Couleurs des zones =====
let regionSlot = []; // numéro de couleur (dans la palette) de chaque zone

function activePalette() {
  return settings.custom || PALETTES[settings.palette] || PALETTES.douce;
}

function hexToRgb(h) {
  return [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
}

function colorDist(a, b) {
  const x = hexToRgb(a), y = hexToRgb(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

// Donne à chaque zone une couleur de la palette, en évitant que deux zones
// voisines aient des couleurs proches.
function assignSlots(n, reg, palette) {
  const adj = Array.from({ length: n }, () => new Set());
  for (let i = 0; i < n * n; i++) {
    const r = Math.floor(i / n), c = i % n;
    if (c < n - 1 && reg[i] !== reg[i + 1]) { adj[reg[i]].add(reg[i + 1]); adj[reg[i + 1]].add(reg[i]); }
    if (r < n - 1 && reg[i] !== reg[i + n]) { adj[reg[i]].add(reg[i + n]); adj[reg[i + n]].add(reg[i]); }
  }
  const order = [...Array(n).keys()].sort((a, b) => adj[b].size - adj[a].size);
  const slot = new Array(n).fill(-1);
  const used = new Set();
  for (const r of order) {
    let best = -1, bestScore = -1;
    for (let s = 0; s < palette.length; s++) {
      if (used.has(s)) continue;
      let score = 1e9;
      for (const nb of adj[r]) {
        if (slot[nb] !== -1) score = Math.min(score, colorDist(palette[s], palette[slot[nb]]));
      }
      if (score > bestScore) { bestScore = score; best = s; }
    }
    slot[r] = best;
    used.add(best);
  }
  return slot;
}

function buildColorEditor() {
  const box = document.getElementById('color-grid');
  if (!box) return;
  box.innerHTML = '';
  const palette = activePalette();
  for (let r = 0; r < regionSlot.length; r++) {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = palette[regionSlot[r]];
    input.title = 'Zone ' + (r + 1);
    input.addEventListener('input', () => {
      if (!settings.custom) settings.custom = activePalette().slice();
      settings.custom[regionSlot[r]] = input.value;
      saveSettings();
      render();
    });
    box.appendChild(input);
  }
}

function refreshColors() {
  if (regions.length) regionSlot = assignSlots(N, regions, activePalette());
  buildColorEditor();
  if (regions.length) render();
}

// ===== Vérification =====
function findConflicts() {
  const bad = new Set();
  const cats = [];
  for (let i = 0; i < N * N; i++) if (marks[i] === 2) cats.push(i);
  for (let a = 0; a < cats.length; a++) {
    for (let b = a + 1; b < cats.length; b++) {
      const i = cats[a], j = cats[b];
      const ri = Math.floor(i / N), ci = i % N;
      const rj = Math.floor(j / N), cj = j % N;
      if (ri === rj || ci === cj || regions[i] === regions[j] ||
          (Math.abs(ri - rj) <= 1 && Math.abs(ci - cj) <= 1)) {
        bad.add(i); bad.add(j);
      }
    }
  }
  return { bad, count: cats.length };
}

// Cases exclues automatiquement par les chats posés
function autoBlocked() {
  const blocked = new Set();
  for (let i = 0; i < N * N; i++) {
    if (marks[i] !== 2) continue;
    const r = Math.floor(i / N), c = i % N;
    for (let j = 0; j < N * N; j++) {
      const rj = Math.floor(j / N), cj = j % N;
      if (rj === r || cj === c || regions[j] === regions[i] ||
          (Math.abs(rj - r) <= 1 && Math.abs(cj - c) <= 1)) {
        blocked.add(j);
      }
    }
  }
  return blocked;
}

// ===== Indice en cours (voir hints.js) =====
let hint = null;
function clearHint() {
  if (!hint) return;
  hint = null;
  document.body.classList.remove('hinting');
  const box = document.getElementById('hint-box');
  if (box) box.hidden = true;
}

// ===== Affichage =====
function render() {
  const board = document.getElementById('board');
  board.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
  board.style.gap = N > 10 ? '3px' : '6px';
  board.style.setProperty('--fs', N > 10 ? 'clamp(11px, 3vw, 22px)' : 'clamp(18px, 6vw, 34px)');
  board.style.maxWidth = N > 10 ? '700px' : '560px';
  const { bad, count } = findConflicts();
  const blocked = autoBlocked();
  const pal = activePalette();

  // Les cases ne sont créées qu'une fois par taille de grille, puis simplement mises à jour
  // (sinon le téléphone perd le doigt posé sur la case et peut zoomer).
  if (board.children.length !== N * N) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < N * N; i++) {
      const cell = document.createElement('div');
      cell.dataset.i = i;
      frag.appendChild(cell);
    }
    board.replaceChildren(frag);
  }

  for (let i = 0; i < N * N; i++) {
    const cell = board.children[i];
    cell.style.background = pal[regionSlot[regions[i]]];
    let kind = 'none';
    if (marks[i] === 2) kind = 'cat';
    else if (marks[i] === 1 || blocked.has(i)) kind = 'x';
    cell.className = 'cell' + (bad.has(i) ? ' conflict' : '') + (kind === 'x' ? ' x' : '');
    if (hint) {
      if (hint.zoneCells.has(i)) cell.classList.add('hint-zone');
      if (hint.lineCells.has(i)) cell.classList.add('hint-line');
      if (hint.elim.has(i)) cell.classList.add('hint-elim');
      if (hint.target === i) cell.classList.add('hint-target');
    }
    if (cell._kind !== kind) {
      cell._kind = kind;
      cell.textContent = '';
      if (kind === 'cat') {
        const img = document.createElement('img');
        img.src = CAT_IMAGE;
        img.alt = 'chat';
        img.className = 'cat-img';
        img.draggable = false;
        cell.appendChild(img);
      } else if (kind === 'x') {
        cell.textContent = MARK;
      }
    }
  }

  won = (count === N && bad.size === 0);
  const msg = document.getElementById('message');
  msg.textContent = won ? '😻 Réussi ! Tous les chats sont bien placés. Miaou !' : '';
  msg.classList.toggle('win', won);
  if (!won) msg.classList.remove('dismissed');
  document.getElementById('counter').textContent = `Chats : ${count} / ${N}` +
    (bad.size > 0 ? '  ⚠️ ça se touche' : '');
  document.getElementById('game-code').textContent = gameCode ? 'Code de la partie : ' + gameCode : '';
  saveGame();
}

// ===== Actions =====
let lastBlankToX = null; // case qui vient de passer de vide à ✖ (par un clic)

function saveState() {
  clearHint();
  history.push(marks.slice());
  if (history.length > 500) history.shift();
  lastBlankToX = null; // toute autre action remet ça à zéro
}

function undo() {
  clearHint();
  if (history.length === 0) return;
  marks = history.pop();
  lastBlankToX = null;
  render();
}

function clickCell(i) {
  clearHint();
  if (won) return;
  if (marks[i] === 1 && lastBlankToX === i) {
    // 2e clic de suite sur la même case : on ne garde pas le ✖ intermédiaire,
    // donc « Reculer » ramène directement la case vide
    marks[i] = 2;
    lastBlankToX = null;
    render();
    return;
  }
  saveState();
  const showsX = marks[i] === 1 || (marks[i] === 0 && autoBlocked().has(i));
  if (marks[i] === 2) marks[i] = 0;      // chat -> vide
  else if (showsX) marks[i] = 2;         // ✖ -> chat
  else { marks[i] = 1; lastBlankToX = i; } // vide -> ✖
  render();
}

// ===== Sauvegarde de la partie en cours =====
const GAME_KEY = 'ronron-doku-partie-v1';

function saveGame() {
  if (!regions.length) return;
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify({
      N, regions, marks, regionSlot, gameCode,
      history: history.slice(-100)   // les 100 derniers pas pour « Reculer »
    }));
  } catch (e) { /* pas grave si le navigateur refuse */ }
}

// Retrouve la solution (unique) d'une grille déjà générée
function findSolution(n, reg) {
  const sols = [];
  countSolutions(n, reg, 1, sols);
  return sols.length ? sols[0] : [];
}

function restoreGame() {
  try {
    const d = JSON.parse(localStorage.getItem(GAME_KEY));
    if (!d || !Number.isInteger(d.N) || d.N < 4 || d.N > 15) return false;
    const total = d.N * d.N;
    const okArray = (a, len) => Array.isArray(a) && a.length === len;
    if (!okArray(d.regions, total) || !okArray(d.marks, total)) return false;
    if (!d.regions.every(r => Number.isInteger(r) && r >= 0 && r < d.N)) return false;
    if (!d.marks.every(m => m === 0 || m === 1 || m === 2)) return false;
    N = d.N;
    const savedCode = parseCode(d.gameCode);
    gameCode = savedCode && savedCode.size === d.N ? d.gameCode : '';
    regions = d.regions;
    solutionCols = findSolution(N, regions);
    marks = d.marks;
    history = Array.isArray(d.history) ? d.history.filter(h => okArray(h, total)) : [];
    lastBlankToX = null;
    const palette = activePalette();
    const slotsOk = okArray(d.regionSlot, d.N) &&
      d.regionSlot.every(x => Number.isInteger(x) && x >= 0 && x < palette.length);
    regionSlot = slotsOk ? d.regionSlot : assignSlots(N, regions, palette);
    const sizeSelect = document.getElementById('size');
    if ([...sizeSelect.options].some(o => parseInt(o.value) === N)) sizeSelect.value = String(N);
    buildColorEditor();
    render();
    return true;
  } catch (e) {
    return false;
  }
}

// ===== Code de partie =====
const SIZES = [5, 6, 7, 8, 9, 10, 12, 15];
let gameCode = ''; // ex. « 7-48213 » = grille 7 × 7, graine 48213

function makeCode(size, seed) { return size + '-' + seed; }

// Accepte « 7-48213 », ou un lien complet contenant « ?partie=7-48213 »
function parseCode(text) {
  if (typeof text !== 'string') return null;
  const link = text.match(/partie=([^&\s#]+)/);
  const raw = decodeURIComponent(link ? link[1] : text).trim();
  const m = raw.match(/^(\d{1,2})\s*[-\u2013]\s*(\d{1,7})$/);
  if (!m) return null;
  const size = parseInt(m[1]), seed = parseInt(m[2]);
  if (!SIZES.includes(size) || seed < 1) return null;
  return { size, seed };
}

function updateUrl() {
  if (!gameCode) return;
  try { window.history.replaceState(null, '', '?partie=' + gameCode); } catch (e) {}
}

function shareLink() {
  return location.origin + location.pathname + '?partie=' + gameCode;
}

let generating = false;

// ===== Calcul en coulisses + réserve de grilles (12 × 12 et 15 × 15) =====
// Le calcul se fait dans un « employé de l'ombre » (Web Worker) pour que la page reste fluide.
// Si le navigateur le refuse (par ex. page ouverte depuis un dossier), on calcule comme avant.
const RESERVE_KEY = 'ronron-doku-reserve-v1';
const RESERVE_SIZES = [15, 12];
const RESERVE_TARGET = 3;

function makeGenWorker() {
  if (typeof Worker === 'undefined') return null;
  let w;
  try { w = new Worker('generator-worker.js'); } catch (e) { return null; }
  const o = { w, jobs: new Map(), nextId: 1, broken: false };
  w.onmessage = (e) => {
    const cb = o.jobs.get(e.data.id);
    if (cb) { o.jobs.delete(e.data.id); cb(e.data); }
  };
  w.onerror = () => {
    o.broken = true;
    const all = [...o.jobs.values()];
    o.jobs.clear();
    all.forEach(cb => cb(null));
  };
  return o;
}
function runInWorker(o, n, seed, cb) {
  const id = o.nextId++;
  o.jobs.set(id, cb);
  o.w.postMessage({ id, n, seed });
}

let userGen = null;   // pour la partie demandée par la joueuse
let bgGen = null;     // pour remplir la réserve

function generateAsync(n, seed, cb) {
  if (!userGen) userGen = makeGenWorker();
  const sync = () => setTimeout(() => {
    const r = generate(n, seed);
    cb({ cols: r.cols, reg: r.reg });
  }, 50);
  if (userGen && !userGen.broken) {
    runInWorker(userGen, n, seed, (res) => { if (res) cb(res); else sync(); });
  } else {
    sync();
  }
}

function loadReserve() {
  let data = {};
  try { data = JSON.parse(localStorage.getItem(RESERVE_KEY)) || {}; } catch (e) { data = {}; }
  const out = {};
  for (const size of RESERVE_SIZES) {
    const list = Array.isArray(data[size]) ? data[size] : [];
    out[size] = list.filter(g => g && Number.isInteger(g.seed) && g.seed >= 1 &&
      Array.isArray(g.cols) && g.cols.length === size &&
      Array.isArray(g.reg) && g.reg.length === size * size &&
      g.reg.every(r => Number.isInteger(r) && r >= 0 && r < size));
  }
  return out;
}
function saveReserve(r) {
  try { localStorage.setItem(RESERVE_KEY, JSON.stringify(r)); } catch (e) { /* pas grave */ }
}

function takeFromReserve(size) {
  if (!RESERVE_SIZES.includes(size)) return null;
  const r = loadReserve();
  const g = r[size].shift();
  if (!g) return null;
  saveReserve(r);
  return g;
}

let filling = false;
function fillReserve() {
  if (filling) return;
  if (!bgGen) bgGen = makeGenWorker();
  if (!bgGen || bgGen.broken) return;   // sans calcul en coulisses, pas de réserve
  const r = loadReserve();
  const size = RESERVE_SIZES.find(s => r[s].length < RESERVE_TARGET);
  if (!size) return;
  filling = true;
  const seed = Math.floor(Math.random() * 900000) + 100000;
  runInWorker(bgGen, size, seed, (res) => {
    filling = false;
    if (!res) return;
    const cur = loadReserve();
    if (cur[size].length < RESERVE_TARGET) {
      cur[size].push({ seed, cols: res.cols, reg: res.reg });
      saveReserve(cur);
    }
    setTimeout(fillReserve, 300);
  });
}
function scheduleFill(delay) {
  setTimeout(() => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(fillReserve, { timeout: 4000 });
    else fillReserve();
  }, delay);
}

function applyGame(size, seed, cols, reg) {
  N = size;
  solutionCols = cols;
  regions = reg;
  gameCode = makeCode(size, seed);
  updateUrl();
  regionSlot = assignSlots(N, regions, activePalette());
  buildColorEditor();
  marks = new Array(N * N).fill(0);
  history = [];
  lastBlankToX = null;
  const board = document.getElementById('board');
  board.style.display = '';
  document.getElementById('loading').hidden = true;
  generating = false;
  render();
}

function newGame(codeText) {
  if (generating) return;
  const parsed = typeof codeText === 'string' ? parseCode(codeText) : null;
  const sizeSelect = document.getElementById('size');
  const size = parsed ? parsed.size : parseInt(sizeSelect.value);
  if (parsed) sizeSelect.value = String(size);
  clearHint();

  // Grille au hasard : on prend d'abord dans la réserve (affichage immédiat)
  if (!parsed) {
    const g = takeFromReserve(size);
    if (g) {
      applyGame(size, g.seed, g.cols, g.reg);
      scheduleFill(1500);
      return;
    }
  }

  const seed = parsed ? parsed.seed : Math.floor(Math.random() * 900000) + 100000;
  generating = true;
  document.getElementById('loading').hidden = false;
  document.getElementById('board').style.display = 'none';
  generateAsync(size, seed, (res) => {
    applyGame(size, seed, res.cols, res.reg);
    scheduleFill(1500);
  });
}

function resetBoard() {
  saveState();
  marks = new Array(N * N).fill(0);
  render();
}

// ===== Glisser pour poser des ✖ =====
const boardEl = document.getElementById('board');
let pressed = null;     // case où on a appuyé
let dragging = false;   // est-ce qu'on glisse ?

function cellAt(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const cell = el && el.closest ? el.closest('.cell') : null;
  return cell ? parseInt(cell.dataset.i) : null;
}

function paintX(i) {
  if (i !== null && marks[i] === 0) { marks[i] = 1; render(); }
}

// Glisser pour poser des ✖ : à la souris seulement (au doigt, on fait défiler la page).
const canDrag = (e) => e.pointerType === 'mouse';

boardEl.addEventListener('pointerdown', (e) => {
  const i = cellAt(e);
  if (i === null) return;
  pressed = i;
  dragging = false;
  if (canDrag(e)) boardEl.setPointerCapture(e.pointerId);
});

boardEl.addEventListener('pointermove', (e) => {
  if (pressed === null || won || !canDrag(e)) return;
  const i = cellAt(e);
  if (i === null) return;
  if (!dragging && i !== pressed) {
    dragging = true;
    saveState();
    paintX(pressed);
  }
  if (dragging) paintX(i);
});

boardEl.addEventListener('pointerup', () => {
  if (pressed !== null && !dragging) clickCell(pressed);
  pressed = null;
  dragging = false;
});
boardEl.addEventListener('pointercancel', () => { pressed = null; dragging = false; });

// iPhone : un 2e toucher rapide sur la grille déclenche un zoom. On le bloque
// (le jeu utilise pointerup, qui est déjà passé à ce moment-là).
let lastTouchEnd = 0;
boardEl.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd < 500) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });
// Bloque aussi le pincement-zoom commencé par Safari sur la grille
boardEl.addEventListener('gesturestart', (e) => e.preventDefault());

document.getElementById('message').addEventListener('click', (e) => e.currentTarget.classList.add('dismissed'));
document.getElementById('undo').addEventListener('click', undo);
// ===== Paramètres =====
const settings = { counter: true, vanish: false, palette: 'douce', custom: null };

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('meowdoku-settings'));
    if (saved) Object.assign(settings, saved);
  } catch (e) { /* pas grave si ça ne marche pas */ }
}

function saveSettings() {
  try { localStorage.setItem('meowdoku-settings', JSON.stringify(settings)); } catch (e) {}
}

function applySettings() {
  document.getElementById('counter').style.display = settings.counter ? '' : 'none';
  document.body.classList.toggle('vanish', settings.vanish);
  document.getElementById('opt-counter').checked = settings.counter;
  document.getElementById('opt-vanish').checked = settings.vanish;
  document.getElementById('opt-palette').value = settings.palette;
}

const panel = document.getElementById('settings-panel');
const rulesPanel = document.getElementById('rules-panel');
document.getElementById('settings-btn').addEventListener('click', () => { panel.hidden = !panel.hidden; rulesPanel.hidden = true; });
document.getElementById('settings-close').addEventListener('click', () => { panel.hidden = true; });
document.getElementById('rules-btn').addEventListener('click', () => { rulesPanel.hidden = !rulesPanel.hidden; panel.hidden = true; });
document.getElementById('rules-close').addEventListener('click', () => { rulesPanel.hidden = true; });
document.getElementById('opt-counter').addEventListener('change', (e) => {
  settings.counter = e.target.checked; saveSettings(); applySettings();
});
document.getElementById('opt-vanish').addEventListener('change', (e) => {
  settings.vanish = e.target.checked; saveSettings(); applySettings();
});
document.getElementById('opt-palette').addEventListener('change', (e) => {
  settings.palette = e.target.value;
  settings.custom = null;
  saveSettings();
  refreshColors();
});
document.getElementById('color-edit-btn').addEventListener('click', () => {
  const editor = document.getElementById('color-editor');
  editor.hidden = !editor.hidden;
});
document.getElementById('color-reset').addEventListener('click', () => {
  settings.custom = null;
  saveSettings();
  refreshColors();
});

loadSettings();
applySettings();
document.getElementById('new-game').addEventListener('click', () => newGame());
document.getElementById('size').addEventListener('change', () => newGame());

const codeMsg = document.getElementById('code-msg');
const codeInput = document.getElementById('code-input');
document.getElementById('copy-link').addEventListener('click', async (e) => {
  if (!gameCode) return;
  const btn = e.currentTarget;
  try {
    await navigator.clipboard.writeText(shareLink());
    btn.textContent = '✓ Lien copié';
    setTimeout(() => { btn.textContent = '📋 Copier le lien'; }, 2000);
  } catch (err) {
    codeInput.value = shareLink(); // si la copie automatique est refusée, on l'affiche
    codeInput.select();
    codeMsg.textContent = 'Copie automatique impossible : copie le lien ci-dessus.';
  }
});
function playCode() {
  if (!parseCode(codeInput.value)) {
    codeMsg.textContent = 'Code invalide. Exemple : 7-48213 (les tailles possibles : ' + SIZES.join(', ') + ')';
    return;
  }
  codeMsg.textContent = '';
  newGame(codeInput.value);
  codeInput.value = '';
}
document.getElementById('code-go').addEventListener('click', playCode);
codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') playCode(); });
document.getElementById('reset').addEventListener('click', resetBoard);
document.addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
});

// Démarrage : un lien avec un code (?partie=7-48213) a priorité sur la partie sauvegardée,
// sauf si c'est la même grille (on reprend alors ta partie en cours).
(function start() {
  let urlCode = null;
  try { urlCode = new URLSearchParams(location.search).get('partie'); } catch (e) {}
  const wanted = urlCode ? parseCode(urlCode) : null;
  const restored = restoreGame();
  if (wanted) {
    if (!(restored && gameCode === makeCode(wanted.size, wanted.seed))) newGame(urlCode);
  } else if (!restored) {
    newGame();
  } else {
    updateUrl();
  }
  scheduleFill(3000);
})();
