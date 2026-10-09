// ===== Réglages =====
const COLORS = ['#e2b848', '#e6a5c0', '#c2688b', '#9378d0', '#7fb6d8',
                '#8fcf9a', '#e89b6b', '#6fc1b8', '#b5b5b5', '#d96b5f',
                '#4f8fc0', '#a9c75a', '#7a5c9e', '#c9a27e', '#5aa58b'];
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
    const j = Math.floor(Math.random() * (i + 1));
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
    const [cell, nb] = candidates[Math.floor(Math.random() * candidates.length)];
    reg[cell] = nb[Math.floor(Math.random() * nb.length)];
    left--;
  }
  return reg;
}

// Compte les solutions (s'arrête à `limit`).
// À chaque étape, on choisit la rangée, colonne ou zone qui a le moins de cases libres.
function countSolutions(n, reg, limit = 2, sols = null) {
  const total = n * n;
  const blocked = new Int16Array(total);
  const rowDone = new Array(n).fill(false);
  const colDone = new Array(n).fill(false);
  const regDone = new Array(n).fill(false);
  const regCells = Array.from({ length: n }, () => []);
  for (let i = 0; i < total; i++) regCells[reg[i]].push(i);
  const placed = new Array(n).fill(-1); // colonne du chat de chaque rangée
  let count = 0;

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
    if (count >= limit) return;
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
      if (count >= limit) return;
    }
  }
  go(0);
  return count;
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
    const i = Math.floor(Math.random() * n * n);
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
    reg[i] = others[Math.floor(Math.random() * others.length)];
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

function generate(n) {
  for (let restart = 0; restart < 60; restart++) {
    const cols = randomPlacement(n);
    const reg = randomRegions(n, cols);
    const deadline = Date.now() + 1200; // abandonne un essai trop long
    for (let step = 0; step < 3000 && Date.now() < deadline; step++) {
      const sols = [];
      countSolutions(n, reg, 2, sols);
      const alt = sols.find(sol => sol.some((c, r) => c !== cols[r]));
      if (!alt) return { cols, reg }; // solution unique !
      if (!breakAlt(n, reg, cols, alt)) {
        if (!mutate(n, reg, cols)) break;
      }
    }
  }
  const cols = randomPlacement(n);
  return { cols, reg: randomRegions(n, cols) };
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
  board.innerHTML = '';
  const { bad, count } = findConflicts();
  const blocked = autoBlocked();

  for (let i = 0; i < N * N; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.background = COLORS[regions[i]];
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
    board.appendChild(cell);
  }

  won = (count === N && bad.size === 0);
  const msg = document.getElementById('message');
  msg.textContent = won ? '😻 Réussi ! Tous les chats sont bien placés. Miaou !' : '';
  msg.classList.toggle('win', won);
  document.getElementById('counter').textContent = `Chats : ${count} / ${N}` +
    (bad.size > 0 ? '   ⚠️ des chats se gênent' : '');
}

// ===== Actions =====
function saveState() {
  history.push(marks.slice());
  if (history.length > 500) history.shift();
}

function undo() {
  if (history.length === 0) return;
  marks = history.pop();
  render();
}

function clickCell(i) {
  if (won) return;
  saveState();
  const showsX = marks[i] === 1 || (marks[i] === 0 && autoBlocked().has(i));
  if (marks[i] === 2) marks[i] = 0;      // chat -> vide
  else if (showsX) marks[i] = 2;         // ✖ -> chat
  else marks[i] = 1;                     // vide -> ✖
  render();
}

let generating = false;

function newGame() {
  if (generating) return;
  generating = true;
  const loading = document.getElementById('loading');
  const board = document.getElementById('board');
  loading.hidden = false;
  board.style.display = 'none';
  // petit délai pour laisser le navigateur afficher le message avant le calcul
  setTimeout(() => {
    N = parseInt(document.getElementById('size').value);
    const { cols, reg } = generate(N);
    solutionCols = cols;
    regions = reg;
    marks = new Array(N * N).fill(0);
    history = [];
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

boardEl.addEventListener('pointerdown', (e) => {
  const i = cellAt(e);
  if (i === null) return;
  pressed = i;
  dragging = false;
  boardEl.setPointerCapture(e.pointerId);
});

boardEl.addEventListener('pointermove', (e) => {
  if (pressed === null || won) return;
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
const settings = { counter: true, vanish: false };

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

loadSettings();
applySettings();
document.getElementById('new-game').addEventListener('click', newGame);
document.getElementById('size').addEventListener('change', newGame);
document.getElementById('reset').addEventListener('click', resetBoard);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
});

newGame();
