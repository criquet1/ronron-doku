// ===== Indices (mode « tutoriel ») =====
// Le jeu rejoue la logique d'un joueur : à partir de tes chats, il cherche la plus simple
// astuce qui t'apprend quelque chose de nouveau, la montre et l'explique.
// Les ✖ que tu as posés toi-même ne sont pas utilisés (ils pourraient être faux).

const T = (...a) => t(...a); // t() est parfois masqué par une variable locale « t » (rangée / colonne)
const HINT_MAX_K = 4; // taille maximale des groupes d'astuces (k zones ↔ k rangées)

function subsetsOf(list, k) {
  const out = [];
  (function rec(start, cur) {
    if (cur.length === k) { out.push(cur.slice()); return; }
    for (let a = start; a < list.length; a++) { cur.push(list[a]); rec(a + 1, cur); cur.pop(); }
  })(0, []);
  return out;
}
const popcount = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };

function lineWord(kind, plural) {
  return t(kind === 'r' ? (plural ? 'h_rows' : 'h_row') : (plural ? 'h_cols' : 'h_col'));
}

// Retourne un indice : { kind, text, zoneCells, lineCells, elim, target }
//   kind : 'place' (poser un chat) | 'elim' (poser des ✖) | 'remove' (retirer un chat) | 'done'
function computeHint() {
  const n = N;
  if (solutionCols.length !== n) solutionCols = findSolution(n, regions);
  const rowOf = (i) => Math.floor(i / n), colOf = (i) => i % n;
  const mk = (o) => Object.assign({ zoneCells: new Set(), lineCells: new Set(), elim: new Set(), target: null }, o);

  // 0. Un chat mal placé ?
  const cats = [];
  for (let i = 0; i < n * n; i++) if (marks[i] === 2) cats.push(i);
  for (const i of cats) {
    if (solutionCols[rowOf(i)] !== colOf(i)) {
      return mk({ kind: 'remove', target: i,
        text: T('h_remove') });
    }
  }
  if (cats.length === n) return mk({ kind: 'done', text: T('h_done') });

  // État logique de départ : seulement les chats posés
  const cand = new Array(n * n).fill(true);
  const placed = new Set();
  const gone = (i, j) => {
    const r = rowOf(i), c = colOf(i), rj = rowOf(j), cj = colOf(j);
    return rj === r || cj === c || regions[j] === regions[i] || (Math.abs(rj - r) <= 1 && Math.abs(cj - c) <= 1);
  };
  const place = (i) => {
    for (let j = 0; j < n * n; j++) if (j !== i && gone(i, j)) cand[j] = false;
    placed.add(i);
  };
  cats.forEach(place);

  const shown = autoBlocked();
  for (let i = 0; i < n * n; i++) if (marks[i] === 1) shown.add(i);

  const regCells = [...Array(n)].map(() => []);
  regions.forEach((g, i) => regCells[g].push(i));
  const lineCells = (t, x) => {
    const a = [];
    for (let k = 0; k < n; k++) a.push(t === 'r' ? x * n + k : k * n + x);
    return a;
  };
  const lineOf = (t, i) => (t === 'r' ? rowOf(i) : colOf(i));

  // Cherche la prochaine astuce applicable (ne change pas l'état)
  function nextStep() {
    const doneReg = new Set([...placed].map(i => regions[i]));
    const doneRow = new Set([...placed].map(rowOf));
    const doneCol = new Set([...placed].map(colOf));
    const freeRegs = [...Array(n).keys()].filter(g => !doneReg.has(g));
    const freeLines = {
      r: [...Array(n).keys()].filter(x => !doneRow.has(x)),
      c: [...Array(n).keys()].filter(x => !doneCol.has(x)),
    };

    // 1. une seule case libre dans une zone, une rangée ou une colonne
    for (const g of freeRegs) {
      const a = regCells[g].filter(i => cand[i]);
      if (a.length === 1) return mk({ kind: 'place', target: a[0], zoneCells: new Set(regCells[g]),
        text: T('h_single_zone') });
    }
    for (const t of ['r', 'c']) {
      for (const x of freeLines[t]) {
        const a = lineCells(t, x).filter(i => cand[i]);
        if (a.length === 1) return mk({ kind: 'place', target: a[0], lineCells: new Set(lineCells(t, x)),
          text: T('h_single_line', lineWord(t)) });
      }
    }

    // 2. groupes : k zones ↔ k rangées (ou colonnes)
    const regMask = {}; // g -> masque des rangées / colonnes où la zone a encore des cases libres
    for (const t of ['r', 'c']) {
      regMask[t] = {};
      for (const g of freeRegs) {
        let m = 0;
        for (const i of regCells[g]) if (cand[i]) m |= 1 << lineOf(t, i);
        regMask[t][g] = m;
      }
    }
    for (let k = 1; k <= HINT_MAX_K; k++) {
      for (const t of ['r', 'c']) {
        const L = freeLines[t];
        if (k >= L.length) continue;
        for (const sub of subsetsOf(L, k)) {
          let M = 0; for (const x of sub) M |= 1 << x;
          const inLines = new Set(sub.flatMap(x => lineCells(t, x)));
          const word = lineWord(t, k > 1);
          // A : k zones entièrement dans ces k lignes
          const regsIn = freeRegs.filter(g => regMask[t][g] !== 0 && (regMask[t][g] & ~M) === 0);
          if (regsIn.length === k) {
            const rs = new Set(regsIn);
            const elim = [...inLines].filter(i => cand[i] && !rs.has(regions[i]));
            if (elim.length) return mk({ kind: 'elim', elim: new Set(elim), lineCells: inLines,
              zoneCells: new Set(regsIn.flatMap(g => regCells[g])),
              text: k === 1 ? T('h_a1', lineWord(t)) : T('h_ak', k, word) });
          }
          // B : ces k lignes n'ont de cases libres que dans k zones
          let R = new Set();
          for (const i of inLines) if (cand[i]) R.add(regions[i]);
          if (R.size === k) {
            const elim = [...R].flatMap(g => regCells[g]).filter(i => cand[i] && !inLines.has(i));
            if (elim.length) return mk({ kind: 'elim', elim: new Set(elim), lineCells: inLines,
              zoneCells: new Set([...R].flatMap(g => regCells[g])),
              text: k === 1 ? T('h_b1', lineWord(t)) : T('h_bk', k, word) });
          }
        }
      }
    }

    // 3. « Et si je mettais un chat ici ? » : une zone / rangée / colonne n'aurait plus de place
    const groups = [];
    for (const g of freeRegs) groups.push({ kind: 'z', cells: regCells[g], g });
    for (const t of ['r', 'c']) for (const x of freeLines[t]) groups.push({ kind: t, cells: lineCells(t, x), x });
    for (let i = 0; i < n * n; i++) {
      if (!cand[i]) continue;
      for (const grp of groups) {
        if (grp.kind === 'z' ? regions[i] === grp.g : (grp.kind === 'r' ? rowOf(i) === grp.x : colOf(i) === grp.x)) continue;
        if (!grp.cells.some(j => cand[j] && !gone(i, j))) {
          const what = grp.kind === 'z' ? T('h_what_zone') : T('h_what_line', lineWord(grp.kind));
          return mk({ kind: 'elim', elim: new Set([i]), target: i,
            zoneCells: grp.kind === 'z' ? new Set(grp.cells) : new Set(),
            lineCells: grp.kind === 'z' ? new Set() : new Set(grp.cells),
            text: T('h_lookahead', what) });
        }
      }
    }
    return null;
  }

  for (let guard = 0; guard < 400; guard++) {
    const st = nextStep();
    if (!st) break;
    if (st.kind === 'place') return st;
    const fresh = [...st.elim].filter(i => !shown.has(i));
    if (fresh.length) { st.elim = new Set(fresh); return st; }
    for (const i of st.elim) cand[i] = false; // déjà connu du joueur : on continue
  }

  // Aucune astuce simple : on propose de placer un chat (au hasard, choisi quand la joueuse accepte)
  return mk({ kind: 'place', random: true,
    text: T('h_random') });
}

// ----- Affichage de l'indice -----
const hintBox = document.getElementById('hint-box');
const hintText = document.getElementById('hint-text');
const hintApply = document.getElementById('hint-apply');

function showHint() {
  if (generating) return;
  if (won) { hint = { kind: 'done', zoneCells: new Set(), lineCells: new Set(), elim: new Set(), target: null }; hintText.textContent = T('h_won'); }
  else {
    hint = computeHint();
    // Si on a déjà des chats et qu'aucun n'est mal placé, on le confirme d'abord
    const nCats = marks.filter(m => m === 2).length;
    const ok = (hint.kind === 'place' || hint.kind === 'elim') && nCats > 0
      ? (nCats === 1 ? T('h_ok1') : T('h_okn', nCats)) : '';
    hintText.textContent = ok + hint.text;
  }
  const labels = { place: T('h_btn_place'), elim: T('h_btn_elim'), remove: T('h_btn_remove') };
  hintApply.hidden = !labels[hint.kind];
  hintApply.textContent = hint.random ? T('h_btn_random') : (labels[hint.kind] || '');
  hintBox.hidden = false;
  document.body.classList.add('hinting');
  const nothingToShow = hint.target === null && !hint.zoneCells.size && !hint.lineCells.size && !hint.elim.size;
  document.body.classList.toggle('hint-plain', nothingToShow);
  render();
  const first = hint.target !== null ? hint.target : [...hint.elim][0];
  const el = first !== undefined ? document.getElementById('board').children[first] : null;
  if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function closeHint() { clearHint(); render(); }

function applyHint() {
  if (!hint) return;
  const h = hint;
  saveState(); // efface aussi l'indice
  if (h.kind === 'place' && h.random) {
    // un chat au hasard parmi les rangées qui n'en ont pas encore (toujours à la bonne place)
    const free = [];
    for (let r = 0; r < N; r++) {
      const i = r * N + solutionCols[r];
      if (marks[i] !== 2) free.push(i);
    }
    if (free.length) marks[free[Math.floor(Math.random() * free.length)]] = 2;
  } else if (h.kind === 'place') marks[h.target] = 2;
  else if (h.kind === 'remove') marks[h.target] = 0;
  else if (h.kind === 'elim') h.elim.forEach(i => { if (marks[i] === 0) marks[i] = 1; });
  render();
}

document.getElementById('hint-btn').addEventListener('click', showHint);
document.getElementById('hint-top').addEventListener('click', showHint);
document.getElementById('hint-apply').addEventListener('click', applyHint);
document.getElementById('hint-close').addEventListener('click', closeHint);
