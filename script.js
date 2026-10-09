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

// ===== Génération =====
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Place un chat par rangée, sans colonne répétée ni contact
function randomPlacement(n) {
  const cols = [];
  const used = new Array(n).fill(false);
  function go(r) {
    if (r === n) return true;
    for (const c of shuffle([...Array(n).keys()])) {
      if (used[c]) continue;
      if (r > 0 && Math.abs(c - cols[r - 1]) <= 1) continue;
      used[c] = true; cols[r] = c;
      if (go(r + 1)) return true;
      used[c] = false;
    }
    return false;
  }
  go(0);
  return cols;
}

// Fait grandir n zones à partir des chats
function randomRegions(n, cols) {
  const reg = new Array(n * n).fill(-1);
  for (let r = 0; r < n; r++) reg[r * n + cols[r]] = r;
  let left = n * n - n;
  while (left > 0) {
    const candidates = [];
    for (let i = 0; i < n * n; i++) {
      if (reg[i] !== -1) continue;
      const r = Math.floor(i / n), c = i % n;
      const neighbors = [];
      if (r > 0 && reg[i - n] !== -1) neighbors.push(reg[i - n]);
      if (r < n - 1 && reg[i + n] !== -1) neighbors.push(reg[i + n]);
      if (c > 0 && reg[i - 1] !== -1) neighbors.push(reg[i - 1]);
      if (c < n - 1 && reg[i + 1] !== -1) neighbors.push(reg[i + 1]);
      if (neighbors.length) candidates.push([i, neighbors]);
    }
    const [cell, nb] = candidates[Math.floor(rng() * candidates.length)];
    reg[cell] = nb[Math.floor(rng() * nb.length)];
    left--;
  }
  return reg;
}

// Compte les solutions (s'arrête à `limit`).
// À chaque étape, on choisit la rangée, colonne ou zone qui a le moins de cases libres.
function countSolutions(n, reg, limit = 2, sols = null, maxNodes = Infinity) {
  const total = n * n;
  const blocked = new Int16Array(total);
  const rowDone = new Array(n).fill(false);
  const colDone = new Array(n).fill(false);
  const regDone = new Array(n).fill(false);
  const regCells = Array.from({ length: n }, () => []);
  for (let i = 0; i < total; i++) regCells[reg[i]].push(i);
  const placed = new Array(n).fill(-1); // colonne du chat de chaque rangée
  let count = 0;
  let nodes = 0;
  let aborted = false; // vrai si on a dépassé le budget de travail

  function cover(i, delta) {
    const r = Math.floor(i / n), c = i % n;
    for (let k = 0; k < n; k++) { blocked[r * n + k] += delta; blocked[k * n + c] += delta; }
    for (const j of regCells[reg[i]]) blocked[j] += delta;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < n && cc >= 0 && cc < n) blocked[rr * n + cc] += delta;
      }
    }
  }

  function go(done) {
    if (count >= limit || aborted) return;
    if (++nodes > maxNodes) { aborted = true; return; }
    if (done === n) {
      count++;
      if (sols) sols.push(placed.slice());
      return;
    }
    let best = null;
    const consider = (cells) => {
      if (best !== null && best.length <= 1) return false;
      const free = [];
      for (const i of cells) if (blocked[i] === 0) free.push(i);
      if (free.length === 0) return true; // impasse
      if (best === null || free.length < best.length) best = free;
      return false;
    };
    for (let r = 0; r < n; r++) {
      if (rowDone[r]) continue;
      const cells = [];
      for (let c = 0; c < n; c++) cells.push(r * n + c);
      if (consider(cells)) return;
    }
    for (let c = 0; c < n; c++) {
      if (colDone[c]) continue;
      const cells = [];
      for (let r = 0; r < n; r++) cells.push(r * n + c);
      if (consider(cells)) return;
    }
    for (let g = 0; g < n; g++) {
      if (regDone[g]) continue;
      if (consider(regCells[g])) return;
    }
    for (const i of best) {
      const r = Math.floor(i / n), c = i % n;
      rowDone[r] = colDone[c] = regDone[reg[i]] = true;
      placed[r] = c;
      cover(i, 1);
      go(done + 1);
      cover(i, -1);
      placed[r] = -1;
      rowDone[r] = colDone[c] = regDone[reg[i]] = false;
      if (count >= limit || aborted) return;
    }
  }
  go(0);
  return aborted ? -1 : count; // -1 = « trop long, je ne sais pas »
}

// Est-ce que la zone `g` reste d'un seul morceau si on retire la case `skip` ?
function stillConnected(n, reg, g, skip) {
  let start = -1, total = 0;
  for (let i = 0; i < n * n; i++) {
    if (reg[i] === g && i !== skip) { total++; if (start === -1) start = i; }
  }
  if (total === 0) return false;
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length) {
    const i = stack.pop();
    const r = Math.floor(i / n), c = i % n;
    const nbs = [];
    if (r > 0) nbs.push(i - n);
    if (r < n - 1) nbs.push(i + n);
    if (c > 0) nbs.push(i - 1);
    if (c < n - 1) nbs.push(i + 1);
    for (const j of nbs) {
      if (j !== skip && reg[j] === g && !seen.has(j)) { seen.add(j); stack.push(j); }
    }
  }
  return seen.size === total;
}

// Déplace une case frontière vers une zone voisine (garde les zones d'un seul morceau)
function mutate(n, reg, cols) {
  for (let tries = 0; tries < 200; tries++) {
    const i = Math.floor(rng() * n * n);
    const r = Math.floor(i / n), c = i % n;
    if (cols[r] === c) continue; // jamais la case du chat de départ
    const nbs = [];
    if (r > 0) nbs.push(reg[i - n]);
    if (r < n - 1) nbs.push(reg[i + n]);
    if (c > 0) nbs.push(reg[i - 1]);
    if (c < n - 1) nbs.push(reg[i + 1]);
    const others = nbs.filter(g => g !== reg[i]);
    if (others.length === 0) continue;
    if (!stillConnected(n, reg, reg[i], i)) continue;
    const old = reg[i];
    reg[i] = others[Math.floor(rng() * others.length)];
    return [i, old];
  }
  return null;
}

// Rend la 2e solution `alt` impossible en déplaçant une case vers une zone
// qui contient déjà un autre chat de `alt`. Retourne true si réussi.
function breakAlt(n, reg, cols, alt) {
  const altCells = alt.map((c, r) => r * n + c);
  const order = shuffle(altCells.slice());
  for (const a of order) {
    const r = Math.floor(a / n), c = a % n;
    if (cols[r] === c) continue; // case du chat de départ : on n'y touche pas
    const nbs = [];
    if (r > 0) nbs.push(a - n);
    if (r < n - 1) nbs.push(a + n);
    if (c > 0) nbs.push(a - 1);
    if (c < n - 1) nbs.push(a + 1);
    for (const j of shuffle(nbs)) {
      const g2 = reg[j];
      if (g2 === reg[a]) continue;
      if (!altCells.some(b => b !== a && reg[b] === g2)) continue;
      if (!stillConnected(n, reg, reg[a], a)) continue;
      reg[a] = g2;
      return true;
    }
  }
  return false;
}

// Générateur de hasard « à graine » : la même graine donne toujours la même suite de nombres,
// donc la même grille, sur n'importe quel appareil.
let rng = Math.random;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fabrique la grille du code (taille n, graine seed). Aucun chronomètre ici :
// le résultat ne dépend que de la graine.
function generate(n, seed) {
  rng = mulberry32(seed);
  const maxSteps = n >= 12 ? 150 : 400;     // essais de correction avant de repartir de zéro
  const maxNodes = n >= 12 ? 2500 : 20000;  // travail maximal du calculateur par essai
  for (let restart = 0; restart < 300; restart++) {
    const cols = randomPlacement(n);
    const reg = randomRegions(n, cols);
    for (let step = 0; step < maxSteps; step++) {
      const sols = [];
      if (countSolutions(n, reg, 2, sols, maxNodes) === -1) break; // trop coûteux : on repart de zéro
      const alt = sols.find(sol => sol.some((c, r) => c !== cols[r]));
      if (!alt) { rng = Math.random; return { cols, reg }; } // solution unique !
      if (!breakAlt(n, reg, cols, alt)) {
        if (!mutate(n, reg, cols)) break;
      }
    }
  }
  const cols = randomPlacement(n);
  const out = { cols, reg: randomRegions(n, cols) };
  rng = Math.random;
  return out;
}

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

// ===== Affichage =====
function render() {
  const board = document.getElementById('board');
  board.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
  board.style.gap = N > 10 ? '3px' : '6px';
  board.style.setProperty('--fs', N > 10 ? 'clamp(11px, 3vw, 22px)' : 'clamp(18px, 6vw, 34px)');
  board.style.maxWidth = N > 10 ? '700px' : '560px';
  const frag = document.createDocumentFragment();
  const { bad, count } = findConflicts();
  const blocked = autoBlocked();

  for (let i = 0; i < N * N; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.background = activePalette()[regionSlot[regions[i]]];
    const r = Math.floor(i / N), c = i % N;
    if (bad.has(i)) cell.classList.add('conflict');
    if (marks[i] === 2) {
      const img = document.createElement('img');
      img.src = CAT_IMAGE;
      img.alt = 'chat';
      img.className = 'cat-img';
      img.draggable = false;
      cell.appendChild(img);
    }
    else if (marks[i] === 1 || blocked.has(i)) { cell.textContent = MARK; cell.classList.add('x'); }
    cell.dataset.i = i;
    frag.appendChild(cell);
  }
  board.replaceChildren(frag);

  won = (count === N && bad.size === 0);
  const msg = document.getElementById('message');
  msg.textContent = won ? '😻 Réussi ! Tous les chats sont bien placés. Miaou !' : '';
  msg.classList.toggle('win', won);
  document.getElementById('counter').textContent = `Chats : ${count} / ${N}` +
    (bad.size > 0 ? '  ⚠️ ça se touche' : '');
  document.getElementById('game-code').textContent = gameCode ? 'Code de la partie : ' + gameCode : '';
  saveGame();
}

// ===== Actions =====
let lastBlankToX = null; // case qui vient de passer de vide à ✖ (par un clic)

function saveState() {
  history.push(marks.slice());
  if (history.length > 500) history.shift();
  lastBlankToX = null; // toute autre action remet ça à zéro
}

function undo() {
  if (history.length === 0) return;
  marks = history.pop();
  lastBlankToX = null;
  render();
}

function clickCell(i) {
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

function newGame(codeText) {
  if (generating) return;
  const parsed = typeof codeText === 'string' ? parseCode(codeText) : null;
  const sizeSelect = document.getElementById('size');
  const size = parsed ? parsed.size : parseInt(sizeSelect.value);
  const seed = parsed ? parsed.seed : Math.floor(Math.random() * 900000) + 100000;
  if (parsed) sizeSelect.value = String(size);
  generating = true;
  const loading = document.getElementById('loading');
  const board = document.getElementById('board');
  loading.hidden = false;
  board.style.display = 'none';
  // petit délai pour laisser le navigateur afficher le message avant le calcul
  setTimeout(() => {
    N = size;
    const { cols, reg } = generate(N, seed);
    solutionCols = cols;
    regions = reg;
    gameCode = makeCode(size, seed);
    updateUrl();
    regionSlot = assignSlots(N, regions, activePalette());
    buildColorEditor();
    marks = new Array(N * N).fill(0);
    history = [];
    lastBlankToX = null;
    board.style.display = '';
    loading.hidden = true;
    generating = false;
    render();
  }, 50);
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
})();
