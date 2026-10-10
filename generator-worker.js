// Calcul des grilles en coulisses (voir script.js)
importScripts('gen.js');
onmessage = (e) => {
  const { id, n, seed } = e.data;
  const r = generate(n, seed);
  postMessage({ id, n, seed, cols: r.cols, reg: r.reg });
};
