// Fabrique les pages /en/, /ar/ et /it/ à partir de index.html (la page française, qui sert de modèle)
// et des traductions de i18n.js. À relancer chaque fois qu'on change un texte :   node tools/build_langs.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

// Lit les traductions de i18n.js
const ctx = { document: { querySelectorAll: () => [], documentElement: { lang: 'fr' }, getElementById: () => null, currentScript: null },
  localStorage: { getItem: () => null, setItem() {} }, navigator: { language: 'fr' }, location: { protocol: 'https:', search: '', replace() {} } };
vm.createContext(ctx);
vm.runInContext(read('i18n.js') + ';globalThis.I18N = I18N;', ctx);
const I18N = ctx.I18N;

const SITE = 'https://ronrondoku.ca/';
const META = {
  en: { dir: 'ltr', locale: 'en_US',
    title: 'Ronron-doku – free cat logic puzzle game',
    desc: 'Ronron-doku: a free logic game you play in your browser. Place one cat in every row, column and colour zone, with no two cats touching. Grids from 5 × 5 to 15 × 15, step-by-step explained hints, shareable game codes.',
    ogdesc: 'One cat per row, per column and per colour zone, with no two cats touching. Grids from 5 × 5 to 15 × 15, step-by-step explained hints, shareable game codes.' },
  ar: { dir: 'rtl', locale: 'ar_AR',
    title: 'Ronron-doku – لعبة منطق مجانية مع القطط',
    desc: 'Ronron-doku: لعبة منطق مجانية تُلعب في المتصفح. ضع قطة واحدة في كل صف وعمود ومنطقة ملوّنة، دون أن تتلامس أي قطتين. شبكات من 5 × 5 إلى 15 × 15، وتلميحات مشروحة خطوة بخطوة، ورموز ألعاب قابلة للمشاركة.',
    ogdesc: 'قطة واحدة في كل صف وعمود ومنطقة ملوّنة، دون أن تتلامس أي قطتين. شبكات من 5 × 5 إلى 15 × 15، وتلميحات مشروحة خطوة بخطوة، ورموز ألعاب قابلة للمشاركة.' },
  it: { dir: 'ltr', locale: 'it_IT',
    title: 'Ronron-doku – gioco di logica gratuito con i gatti',
    desc: 'Ronron-doku: gioco di logica gratuito da giocare nel browser. Metti un gatto in ogni riga, colonna e zona colorata, senza che due gatti si tocchino. Griglie da 5 × 5 a 15 × 15, indizi spiegati passo dopo passo, codici partita da condividere.',
    ogdesc: 'Un gatto per riga, per colonna e per zona colorata, senza che due gatti si tocchino. Griglie da 5 × 5 a 15 × 15, indizi spiegati passo dopo passo, codici partita da condividere.' },
};
const esc = (x) => x.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const template = read('index.html');

for (const [lang, m] of Object.entries(META)) {
  const dict = I18N[lang];
  let h = template;
  const must = (re, rep) => { if (!re.test(h)) throw new Error('introuvable : ' + re); h = h.replace(re, rep); };

  must(/<html lang="fr">/, `<html lang="${lang}"${m.dir === 'rtl' ? ' dir="rtl"' : ''}>`);
  must(/<title>[^<]*<\/title>/, `<title>${m.title}</title>`);
  must(/(<meta name="description" content=")[^"]*(")/, `$1${esc(m.desc)}$2`);
  must(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(m.title)}$2`);
  must(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(m.ogdesc)}$2`);
  must(/(<meta property="og:url" content=")[^"]*(")/, `$1${SITE}${lang}/$2`);
  must(/(<meta property="og:locale" content=")[^"]*(")/, `$1${m.locale}$2`);
  must(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}${lang}/$2`);

  // Textes fixes de la page
  let n = 0;
  h = h.replace(/<(\w+)\b([^>]*\bdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g, (all, tag, attrs, key) => {
    if (dict[key] === undefined) throw new Error('traduction manquante (' + lang + ') : ' + key);
    n++;
    return `<${tag}${attrs}>${dict[key]}</${tag}>`;
  });
  h = h.replace(/<\w+\b[^>]*\bdata-i18n-title="([^"]+)"[^>]*>/g, (tagText, key) => {
    if (dict[key] === undefined) throw new Error('traduction manquante (' + lang + ') : ' + key);
    return tagText.replace(/ title="[^"]*"/, ` title="${esc(dict[key])}"`);
  });
  h = h.replace(/<\w+\b[^>]*\bdata-i18n-ph="([^"]+)"[^>]*>/g, (tagText, key) => {
    if (dict[key] === undefined) throw new Error('traduction manquante (' + lang + ') : ' + key);
    return tagText.replace(/ placeholder="[^"]*"/, ` placeholder="${esc(dict[key])}"`);
  });

  // Les fichiers du jeu sont un dossier plus haut
  h = h.replace(/(href|src)="(style\.css|cat\.png|i18n\.js|gen\.js|script\.js|hints\.js)"/g, '$1="../$2"');

  fs.mkdirSync(path.join(root, lang), { recursive: true });
  fs.writeFileSync(path.join(root, lang, 'index.html'), h);
  console.log(lang + '/index.html : ' + n + ' textes');
}

// Plan du site (avec les liens entre langues)
const langs = ['', 'en/', 'ar/', 'it/'];
const alts = langs.map((p, i) => `    <xhtml:link rel="alternate" hreflang="${['fr', 'en', 'ar', 'it'][i]}" href="${SITE}${p}"/>`).join('\n') +
  `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}"/>`;
const urls = langs.map((p) => `  <url>\n    <loc>${SITE}${p}</loc>\n${alts}\n  </url>`).join('\n');
fs.writeFileSync(path.join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`);
console.log('sitemap.xml mis à jour');
