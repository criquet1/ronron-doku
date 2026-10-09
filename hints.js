// ===== Indices (mode « tutoriel ») =====
// Le jeu rejoue la logique d'un joueur : à partir de tes chats, il cherche la plus simple
// astuce qui t'apprend quelque chose de nouveau, la montre et l'explique.
// Les ✖ que tu as posés toi-même ne sont pas utilisés (ils pourraient être faux).

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

function lineWord(t, plural) {
  return t === 'r' ? (plural ? 'rangées' : 'rangée') : (plural ? 'colonnes' : 'colonne');
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
        text: "Ce chat est mal placé : il ne mène pas à la solution. Tu peux le retirer (ou utiliser « Reculer »)." });
    }
  }
  if (cats.length === n) return mk({ kind: 'done', text: 'Tous les chats sont déjà placés. Bravo ! 😻' });

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
        text: "Dans la zone entourée, il ne reste qu'une seule case libre. Le chat doit donc aller sur cette case." });
    }
    for (const t of ['r', 'c']) {
      for (const x of freeLines[t]) {
        const a = lineCells(t, x).filter(i => cand[i]);
        if (a.length === 1) return mk({ kind: 'place', target: a[0], lineCells: new Set(lineCells(t, x)),
          text: `Dans la ${lineWord(t)} surlignée, il ne reste qu'une seule case libre. Le chat doit donc y aller.` });
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
              text: k === 1
                ? `La zone entourée est entièrement dans la ${word} surlignée. Son chat sera donc forcément dans cette ${lineWord(t)} : toutes les autres cases de la ${lineWord(t)} sont impossibles (✖).`
                : `Les ${k} zones entourées sont entièrement dans les ${k} ${word} surlignées. Leurs ${k} chats occuperont donc ces ${word} : les cases des autres zones dans ces ${word} sont impossibles (✖).` });
          }
          // B : ces k lignes n'ont de cases libres que dans k zones
          let R = new Set();
          for (const i of inLines) if (cand[i]) R.add(regions[i]);
          if (R.size === k) {
            const elim = [...R].flatMap(g => regCells[g]).filter(i => cand[i] && !inLines.has(i));
            if (elim.length) return mk({ kind: 'elim', elim: new Set(elim), lineCells: inLines,
              zoneCells: new Set([...R].flatMap(g => regCells[g])),
              text: k === 1
                ? `Dans la ${word} surlignée, toutes les cases libres sont dans la même zone (entourée). Le chat de cette ${lineWord(t)} est donc dans cette zone : les autres cases de la zone, ailleurs, sont impossibles (✖).`
                : `Dans les ${k} ${word} surlignées, les cases libres appartiennent à seulement ${k} zones (entourées). Ces zones auront donc leurs chats dans ces ${word} : leurs autres cases, ailleurs, sont impossibles (✖).` });
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
          const what = grp.kind === 'z' ? 'la zone entourée' : `la ${lineWord(grp.kind)} surlignée`;
          return mk({ kind: 'elim', elim: new Set([i]), target: i,
            zoneCells: grp.kind === 'z' ? new Set(grp.cells) : new Set(),
            lineCells: grp.kind === 'z' ? new Set() : new Set(grp.cells),
            text: `Si on mettait un chat sur la case marquée, ${what} n'aurait plus aucune case libre. Cette case est donc impossible (✖).` });
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

  // Aucune astuce simple : on montre une case de la solution
  for (let r = 0; r < n; r++) {
    const i = r * n + solutionCols[r];
    if (marks[i] !== 2) return mk({ kind: 'place', target: i,
      text: "Je ne vois pas d'astuce simple ici. Voici une case où va un chat (je la connais, mais ça demande un raisonnement plus long)." });
  }
  return mk({ kind: 'done', text: 'Tous les chats sont déjà placés. Bravo ! 😻' });
}

// ----- Affichage de l'indice -----
const hintBox = document.getElementById('hint-box');
const hintText = document.getElementById('hint-text');
const hintApply = document.getElementById('hint-apply');

function showHint() {
  if (generating) return;
  if (won) { hint = { kind: 'done', zoneCells: new Set(), lineCells: new Set(), elim: new Set(), target: null }; hintText.textContent = 'Tu as déjà gagné ! 😻'; }
  else {
    hint = computeHint();
    // Si on a déjà des chats et qu'aucun n'est mal placé, on le confirme d'abord
    const nCats = marks.filter(m => m === 2).length;
    const ok = (hint.kind === 'place' || hint.kind === 'elim') && nCats > 0
      ? (nCats === 1 ? '✔ Ton chat est bien placé. ' : `✔ Tes ${nCats} chats sont bien placés. `) : '';
    hintText.textContent = ok + hint.text;
  }
  const labels = { place: 'Placer le chat', elim: 'Placer les ✖', remove: 'Retirer ce chat' };
  hintApply.hidden = !labels[hint.kind];
  hintApply.textContent = labels[hint.kind] || '';
  hintBox.hidden = false;
  document.body.classList.add('hinting');
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
  if (h.kind === 'place') marks[h.target] = 2;
  else if (h.kind === 'remove') marks[h.target] = 0;
  else if (h.kind === 'elim') h.elim.forEach(i => { if (marks[i] === 0) marks[i] = 1; });
  render();
}

document.getElementById('hint-btn').addEventListener('click', showHint);
document.getElementById('hint-apply').addEventListener('click', applyHint);
document.getElementById('hint-close').addEventListener('click', closeHint);
