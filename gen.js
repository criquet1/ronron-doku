// Fabrication des grilles (aucun accès à la page : utilisable aussi par le calcul en coulisses)
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
