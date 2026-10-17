// ===== Langues (français / anglais) =====
// Les textes fixes de la page portent un attribut data-i18n="clé" (le français est lu dans la page
// elle-même). Les textes créés par le programme passent par t('clé', ...).

const LANG_KEY = 'ronron-doku-lang';

const I18N = { fr: {}, en: {} };

// --- Textes fixes de la page (anglais ; le français vient du HTML) ---
Object.assign(I18N.en, {
  tagline: 'Logic game with cats · grids from 5 × 5 up to 15 × 15',
  new_game: 'New game',
  undo_top: '↩ Undo',
  hint_top: '💡 Hint',
  reset: 'Restart',
  rules_btn: '📖 Rules',
  settings_btn: '⚙️ Settings',
  rules_h: 'Rules',
  rules_p1: 'Place <b>one cat</b> in every row, every column and every colour zone. Two cats must never touch, even diagonally.',
  rules_p2: 'Click a cell: ✖ (excluded), then the cat, then empty.',
  rules_p3: 'The ✖ are placed automatically around each cat.',
  rules_p4: 'With a mouse, you can also drag across several cells to place ✖.',
  close: 'Close',
  settings_h: 'Settings',
  opt_counter: 'Show the cat counter',
  opt_vanish: 'Hide excluded cells (instead of ✖)',
  opt_palette: 'Colour palette:',
  pal_douce: 'Soft',
  pal_vive: 'Vivid',
  pal_mixte: 'Mixed (vivid and pastel)',
  pal_pastel: 'Pastel',
  color_edit: '🎨 Choose the colours one by one',
  color_help: 'Click a colour to change it. One colour per zone of the current grid.',
  color_reset: 'Reset the palette',
  copy_link: '📋 Copy the link',
  code_ph: 'Code, e.g. 7-48213',
  code_go: 'Play this code',
  credit: 'Cat image courtesy of: <a href="https://www.magnific.com/fr/vecteurs-libre/caricature-chat-mignon-noir_48121656.htm" target="_blank" rel="noopener">brgfx on Magnific</a>',
  loading: 'Creating the grid…<br>Large grids take a few seconds.',
  undo_title: 'Undo one move',
  undo_word: 'Undo',
  hint_title: 'Ask for a hint',
  hint_word: 'Hint',
  about_h: 'About Ronron-doku',
  about_p1: 'Ronron-doku is a free logic game that you play right in your browser, on a computer or a phone, with no sign-up and no ads.',
  about_p2: '<b>The goal:</b> place one cat in every row, every column and every colour zone, so that no two cats touch, even diagonally. Every grid has exactly one solution.',
  about_li1: 'Grids from 5 × 5 up to 15 × 15.',
  about_li2: 'The ✖ are placed automatically around the cats, and you can also make the excluded cells disappear.',
  about_li3: 'A “Hint” button that explains the reasoning step by step.',
  about_li4: 'An “Undo” button to take back as many moves as you like.',
  about_li5: 'A game code: with the same code, you get the same grid on any device.',
  about_li6: 'Several colour palettes, and you can pick the colour of each zone.',
  about_li7: 'Your game in progress is saved automatically.',
  apply: 'Apply',
});

// --- Textes créés par le programme (français et anglais) ---
// Une valeur peut être une fonction quand le texte contient des valeurs variables.
Object.assign(I18N.fr, {
  win: 'Réussi ! Tous les chats sont bien placés. Miaou !',
  win_tip: 'Touche pour une nouvelle partie',
  counter: (n, total) => `Chats : ${n} / ${total}`,
  touching: '  ⚠️ ça se touche',
  game_code: 'Code de la partie : ',
  img_alt: 'chat',
  link_copied: '✓ Lien copié',
  copy_failed: 'Copie automatique impossible : copie le lien ci-dessus.',
  bad_code: (sizes) => `Code invalide. Exemple : 7-48213 (les tailles possibles : ${sizes})`,
  // indices
  h_row: 'rangée', h_rows: 'rangées', h_col: 'colonne', h_cols: 'colonnes',
  h_remove: 'Ce chat est mal placé : il ne mène pas à la solution. Tu peux le retirer (ou utiliser « Reculer »).',
  h_done: 'Tous les chats sont déjà placés. Bravo ! 😻',
  h_won: 'Tu as déjà gagné ! 😻',
  h_single_zone: "Dans la zone en couleur, il ne reste qu'une seule case libre. Le chat doit donc aller sur cette case.",
  h_single_line: (l) => `Dans la ${l} encadrée, il ne reste qu'une seule case libre. Le chat doit donc y aller.`,
  h_a1: (l) => `La zone en couleur est entièrement dans la ${l} encadrée. Son chat sera donc forcément dans cette ${l} : toutes les autres cases de la ${l} sont impossibles (✖).`,
  h_ak: (k, ls) => `Les ${k} zones en couleur sont entièrement dans les ${k} ${ls} encadrées. Leurs ${k} chats occuperont donc ces ${ls} : les cases des autres zones dans ces ${ls} sont impossibles (✖).`,
  h_b1: (l) => `Dans la ${l} encadrée, toutes les cases libres sont dans la même zone (en couleur). Le chat de cette ${l} est donc dans cette zone : les autres cases de la zone, ailleurs, sont impossibles (✖).`,
  h_bk: (k, ls) => `Dans les ${k} ${ls} encadrées, les cases libres appartiennent à seulement ${k} zones (en couleur). Ces zones auront donc leurs chats dans ces ${ls} : leurs autres cases, ailleurs, sont impossibles (✖).`,
  h_what_zone: 'la zone en couleur',
  h_what_line: (l) => `la ${l} encadrée`,
  h_lookahead: (what) => `Si on mettait un chat sur la case marquée, ${what} n'aurait plus aucune case libre. Cette case est donc impossible (✖).`,
  h_random: "Je ne vois pas d'astuce simple ici. Si tu veux, je peux placer un chat pour toi, à un endroit au hasard.",
  h_ok1: '✔ Ton chat est bien placé. ',
  h_okn: (n) => `✔ Tes ${n} chats sont bien placés. `,
  h_btn_place: 'Placer le chat',
  h_btn_elim: 'Placer les ✖',
  h_btn_remove: 'Retirer ce chat',
  h_btn_random: 'Placer un chat',
});
Object.assign(I18N.en, {
  win: 'Success! All the cats are correctly placed. Meow!',
  win_tip: 'Tap for a new game',
  counter: (n, total) => `Cats: ${n} / ${total}`,
  touching: '  ⚠️ cats are touching',
  game_code: 'Game code: ',
  img_alt: 'cat',
  link_copied: '✓ Link copied',
  copy_failed: 'Automatic copy failed: copy the link above.',
  bad_code: (sizes) => `Invalid code. Example: 7-48213 (possible sizes: ${sizes})`,
  h_row: 'row', h_rows: 'rows', h_col: 'column', h_cols: 'columns',
  h_remove: "This cat is misplaced: it doesn't lead to the solution. You can remove it (or use “Undo”).",
  h_done: 'All the cats are already placed. Well done! 😻',
  h_won: "You've already won! 😻",
  h_single_zone: 'In the coloured zone, only one free cell is left. The cat must therefore go on that cell.',
  h_single_line: (l) => `In the framed ${l}, only one free cell is left. The cat must therefore go there.`,
  h_a1: (l) => `The coloured zone lies entirely within the framed ${l}. Its cat will therefore be in this ${l}: all the other cells of the ${l} are impossible (✖).`,
  h_ak: (k, ls) => `The ${k} coloured zones lie entirely within the ${k} framed ${ls}. Their ${k} cats will therefore occupy these ${ls}: the cells of the other zones in these ${ls} are impossible (✖).`,
  h_b1: (l) => `In the framed ${l}, all the free cells are in the same coloured zone. The cat of this ${l} is therefore in that zone: the other cells of the zone, elsewhere, are impossible (✖).`,
  h_bk: (k, ls) => `In the ${k} framed ${ls}, the free cells belong to only ${k} coloured zones. These zones will therefore have their cats in these ${ls}: their other cells, elsewhere, are impossible (✖).`,
  h_what_zone: 'the coloured zone',
  h_what_line: (l) => `the framed ${l}`,
  h_lookahead: (what) => `If we put a cat on the marked cell, ${what} would have no free cell left. This cell is therefore impossible (✖).`,
  h_random: "I don't see a simple trick here. If you like, I can place a cat for you, somewhere at random.",
  h_ok1: '✔ Your cat is correctly placed. ',
  h_okn: (n) => `✔ Your ${n} cats are correctly placed. `,
  h_btn_place: 'Place the cat',
  h_btn_elim: 'Place the ✖',
  h_btn_remove: 'Remove this cat',
  h_btn_random: 'Place a cat',
});


// --- العربية (arabe, écrit de droite à gauche) ---
Object.assign(I18N, { ar: {} });
Object.assign(I18N.ar, {
  tagline: 'لعبة منطق مع القطط · شبكات من \u20665\u00A0×\u00A05\u2069 إلى \u206615\u00A0×\u00A015\u2069',
  new_game: 'لعبة جديدة',
  undo_top: '↩ تراجع',
  hint_top: '💡 تلميح',
  reset: 'إعادة البدء',
  rules_btn: '📖 القواعد',
  settings_btn: '⚙️ الإعدادات',
  rules_h: 'قواعد اللعبة',
  rules_p1: 'ضع <b>قطة واحدة</b> في كل صف وكل عمود وكل منطقة ملوّنة. يجب ألّا تتلامس أي قطتين أبدًا، حتى بشكل قطري.',
  rules_p2: 'انقر على خانة: ✖ (مستبعدة)، ثم القطة، ثم فارغة.',
  rules_p3: 'تُوضَع علامات ✖ تلقائيًا حول كل قطة.',
  rules_p4: 'بالفأرة، يمكنك أيضًا السحب فوق عدة خانات لوضع علامات ✖.',
  close: 'إغلاق',
  settings_h: 'الإعدادات',
  opt_counter: 'إظهار عدّاد القطط',
  opt_vanish: 'إخفاء الخانات المستبعدة (بدل ✖)',
  opt_palette: 'لوحة الألوان:',
  pal_douce: 'هادئة',
  pal_vive: 'زاهية',
  pal_mixte: 'مختلطة (زاهية وباستيل)',
  pal_pastel: 'باستيل',
  color_edit: '🎨 اختيار الألوان واحدًا واحدًا',
  color_help: 'انقر على لون لتغييره. لون واحد لكل منطقة في الشبكة الحالية.',
  color_reset: 'استعادة اللوحة',
  copy_link: '📋 نسخ الرابط',
  code_ph: 'الرمز، مثال 7-48213',
  code_go: 'العب بهذا الرمز',
  credit: 'صورة القطة بإذن من: <a href="https://www.magnific.com/fr/vecteurs-libre/caricature-chat-mignon-noir_48121656.htm" target="_blank" rel="noopener">brgfx على Magnific</a>',
  loading: 'جارٍ إنشاء الشبكة…<br>الشبكات الكبيرة تستغرق بضع ثوانٍ.',
  undo_title: 'التراجع عن حركة',
  undo_word: 'تراجع',
  hint_title: 'اطلب تلميحًا',
  hint_word: 'تلميح',
  about_h: 'عن Ronron-doku',
  about_p1: 'Ronron-doku لعبة منطق مجانية تُلعب مباشرة في المتصفح، على الحاسوب أو الهاتف، بدون تسجيل وبدون إعلانات.',
  about_p2: '<b>الهدف:</b> ضع قطة واحدة في كل صف وكل عمود وكل منطقة ملوّنة، بحيث لا تتلامس أي قطتين، حتى بشكل قطري. لكل شبكة حل واحد فقط.',
  about_li1: 'شبكات من \u20665\u00A0×\u00A05\u2069 إلى \u206615\u00A0×\u00A015\u2069.',
  about_li2: 'تُوضَع علامات ✖ تلقائيًا حول القطط، ويمكن أيضًا إخفاء الخانات المستبعدة.',
  about_li3: 'زر «تلميح» يشرح التفكير خطوة بخطوة.',
  about_li4: 'زر «تراجع» للتراجع عن أي عدد من الحركات.',
  about_li5: 'رمز للّعبة: بنفس الرمز تحصل على الشبكة نفسها على أي جهاز.',
  about_li6: 'عدة لوحات ألوان، مع إمكانية اختيار لون كل منطقة.',
  about_li7: 'يتم حفظ لعبتك الجارية تلقائيًا.',
  apply: 'تطبيق',
  win: 'أحسنت! جميع القطط في أماكنها الصحيحة. مياو!',
  win_tip: 'المس لبدء لعبة جديدة',
  counter: (n, total) => `القطط: ⁦${n} / ${total}⁩`,
  touching: '  ⚠️ هناك قطط متلامسة',
  game_code: 'رمز اللعبة: ',
  img_alt: 'قطة',
  link_copied: '✓ تم نسخ الرابط',
  copy_failed: 'تعذّر النسخ التلقائي: انسخ الرابط أعلاه.',
  bad_code: (sizes) => `رمز غير صالح. مثال: 7-48213 (الأحجام الممكنة: ${sizes})`,
  h_row: 'صف', h_rows: 'صفوف', h_col: 'عمود', h_cols: 'أعمدة',
  h_remove: 'هذه القطة في مكان خاطئ: لا تؤدي إلى الحل. يمكنك إزالتها (أو استخدام «تراجع»).',
  h_done: 'جميع القطط موضوعة بالفعل. أحسنت! 😻',
  h_won: 'لقد فزت بالفعل! 😻',
  h_single_zone: 'في المنطقة الملوّنة لم تتبقَّ إلا خانة واحدة فارغة. لذا يجب أن تذهب القطة إلى هذه الخانة.',
  h_single_line: (l) => `في ال${l} المؤطّر لم تتبقَّ إلا خانة واحدة فارغة. لذا يجب أن تذهب القطة إليها.`,
  h_a1: (l) => `المنطقة الملوّنة تقع بالكامل داخل ال${l} المؤطّر. لذا ستكون قطتها حتمًا في هذا ال${l}: وجميع الخانات الأخرى في ال${l} مستحيلة (✖).`,
  h_ak: (k, ls) => `المناطق الملوّنة الـ ${k} تقع بالكامل داخل ال${ls} الـ ${k} المؤطّرة. لذا ستشغل قططها الـ ${k} هذه ال${ls}: وخانات المناطق الأخرى في هذه ال${ls} مستحيلة (✖).`,
  h_b1: (l) => `في ال${l} المؤطّر، جميع الخانات الفارغة تقع في المنطقة الملوّنة نفسها. لذا فإن قطة هذا ال${l} في تلك المنطقة: وخاناتها الأخرى، في أماكن أخرى، مستحيلة (✖).`,
  h_bk: (k, ls) => `في ال${ls} الـ ${k} المؤطّرة، تنتمي الخانات الفارغة إلى ${k} مناطق ملوّنة فقط. لذا ستكون قطط هذه المناطق في هذه ال${ls}: وخاناتها الأخرى، في أماكن أخرى، مستحيلة (✖).`,
  h_what_zone: 'المنطقة الملوّنة',
  h_what_line: (l) => `ال${l} المؤطّر`,
  h_lookahead: (what) => `لو وضعنا قطة على الخانة المعلَّمة، فلن تبقى في ${what} أي خانة فارغة. لذا فهذه الخانة مستحيلة (✖).`,
  h_random: 'لا أرى حيلة بسيطة هنا. إن أردت، يمكنني أن أضع لك قطة في مكان عشوائي.',
  h_ok1: '✔ قطتك في مكانها الصحيح. ',
  h_okn: (n) => `✔ قططك الـ ${n} في أماكنها الصحيحة. `,
  h_btn_place: 'ضع القطة',
  h_btn_elim: 'ضع علامات ✖',
  h_btn_remove: 'أزل هذه القطة',
  h_btn_random: 'ضع قطة',
});


// --- Italiano ---
Object.assign(I18N, { it: {} });
Object.assign(I18N.it, {
  tagline: 'Gioco di logica con i gatti · griglie da 5 × 5 fino a 15 × 15',
  new_game: 'Nuova partita',
  undo_top: '↩ Indietro',
  hint_top: '💡 Indizio',
  reset: 'Ricomincia',
  rules_btn: '📖 Regole',
  settings_btn: '⚙️ Impostazioni',
  rules_h: 'Regole del gioco',
  rules_p1: 'Metti <b>un gatto</b> in ogni riga, in ogni colonna e in ogni zona colorata. Due gatti non devono mai toccarsi, nemmeno in diagonale.',
  rules_p2: 'Tocca una casella: ✖ (esclusa), poi il gatto, poi vuota.',
  rules_p3: 'Le ✖ si posizionano da sole intorno a ogni gatto.',
  rules_p4: 'Con il mouse puoi anche trascinare su più caselle per mettere delle ✖.',
  close: 'Chiudi',
  settings_h: 'Impostazioni',
  opt_counter: 'Mostra il contatore dei gatti',
  opt_vanish: 'Nascondi le caselle escluse (invece della ✖)',
  opt_palette: 'Tavolozza di colori:',
  pal_douce: 'Morbida',
  pal_vive: 'Vivace',
  pal_mixte: 'Mista (vivace e pastello)',
  pal_pastel: 'Pastello',
  color_edit: '🎨 Scegli i colori uno per uno',
  color_help: 'Tocca un colore per cambiarlo. Un colore per ogni zona della griglia attuale.',
  color_reset: 'Ripristina la tavolozza',
  copy_link: '📋 Copia il link',
  code_ph: 'Codice, es. 7-48213',
  code_go: 'Gioca questo codice',
  credit: 'Immagine del gatto, per gentile concessione di: <a href="https://www.magnific.com/fr/vecteurs-libre/caricature-chat-mignon-noir_48121656.htm" target="_blank" rel="noopener">brgfx su Magnific</a>',
  loading: 'Creazione della griglia…<br>Le griglie grandi richiedono qualche secondo.',
  undo_title: 'Annulla una mossa',
  undo_word: 'Indietro',
  hint_title: 'Chiedi un indizio',
  hint_word: 'Indizio',
  about_h: 'Informazioni su Ronron-doku',
  about_p1: 'Ronron-doku è un gioco di logica gratuito che si gioca direttamente nel browser, su computer o su telefono, senza registrazione e senza pubblicità.',
  about_p2: "<b>L'obiettivo:</b> mettere un gatto in ogni riga, in ogni colonna e in ogni zona colorata, senza che due gatti si tocchino, nemmeno in diagonale. Ogni griglia ha una sola soluzione.",
  about_li1: 'Griglie da 5 × 5 fino a 15 × 15.',
  about_li2: 'Le ✖ si posizionano automaticamente intorno ai gatti, e si possono anche far sparire le caselle escluse.',
  about_li3: 'Un pulsante «Indizio» che spiega il ragionamento passo dopo passo.',
  about_li4: 'Un pulsante «Indietro» per annullare quante mosse vuoi.',
  about_li5: 'Un codice partita: con lo stesso codice ritrovi la stessa griglia su qualsiasi dispositivo.',
  about_li6: 'Diverse tavolozze di colori, con la scelta del colore di ogni zona.',
  about_li7: 'La tua partita in corso viene salvata automaticamente.',
  apply: 'Applica',
  win: 'Bravo! Tutti i gatti sono al posto giusto. Miao!',
  win_tip: 'Tocca per una nuova partita',
  counter: (n, total) => `Gatti: ${n} / ${total}`,
  touching: '  ⚠️ si toccano',
  game_code: 'Codice della partita: ',
  img_alt: 'gatto',
  link_copied: '✓ Link copiato',
  copy_failed: 'Copia automatica non riuscita: copia il link qui sopra.',
  bad_code: (sizes) => `Codice non valido. Esempio: 7-48213 (dimensioni possibili: ${sizes})`,
  h_row: 'riga', h_rows: 'righe', h_col: 'colonna', h_cols: 'colonne',
  h_remove: 'Questo gatto è nel posto sbagliato: non porta alla soluzione. Puoi toglierlo (o usare «Indietro»).',
  h_done: 'Tutti i gatti sono già posizionati. Bravo! 😻',
  h_won: 'Hai già vinto! 😻',
  h_single_zone: 'Nella zona colorata è rimasta una sola casella libera. Il gatto deve quindi andare su quella casella.',
  h_single_line: (l) => `Nella ${l} incorniciata è rimasta una sola casella libera. Il gatto deve quindi andare lì.`,
  h_a1: (l) => `La zona colorata si trova interamente nella ${l} incorniciata. Il suo gatto sarà quindi di sicuro in questa ${l}: tutte le altre caselle della ${l} sono impossibili (✖).`,
  h_ak: (k, ls) => `Le ${k} zone colorate si trovano interamente nelle ${k} ${ls} incorniciate. I loro ${k} gatti occuperanno quindi queste ${ls}: le caselle delle altre zone in queste ${ls} sono impossibili (✖).`,
  h_b1: (l) => `Nella ${l} incorniciata, tutte le caselle libere sono nella stessa zona (colorata). Il gatto di questa ${l} è quindi in quella zona: le altre caselle della zona, altrove, sono impossibili (✖).`,
  h_bk: (k, ls) => `Nelle ${k} ${ls} incorniciate, le caselle libere appartengono a sole ${k} zone (colorate). Queste zone avranno quindi i loro gatti in queste ${ls}: le loro altre caselle, altrove, sono impossibili (✖).`,
  h_what_zone: 'la zona colorata',
  h_what_line: (l) => `la ${l} incorniciata`,
  h_lookahead: (what) => `Se mettessimo un gatto sulla casella segnata, ${what} non avrebbe più nessuna casella libera. Questa casella è quindi impossibile (✖).`,
  h_random: 'Non vedo un trucco semplice qui. Se vuoi, posso mettere un gatto per te, in un punto a caso.',
  h_ok1: '✔ Il tuo gatto è al posto giusto. ',
  h_okn: (n) => `✔ I tuoi ${n} gatti sono al posto giusto. `,
  h_btn_place: 'Metti il gatto',
  h_btn_elim: 'Metti le ✖',
  h_btn_remove: 'Togli questo gatto',
  h_btn_random: 'Metti un gatto',
});

const LANGS = ['fr', 'en', 'ar', 'it'];

// Dossier où se trouvent les fichiers du jeu (les pages /en/, /ar/, /it/ sont un niveau plus bas).
const ASSET_BASE = (document.currentScript && document.currentScript.src)
  ? document.currentScript.src.replace(/[^/]*$/, '') : '';

// Chaque langue a sa propre page : la langue est celle que la page déclare (<html lang="…">).
// La page française (à la racine) renvoie vers la langue choisie plus tôt par la joueuse, s'il y en a une.
function pageLang() {
  const l = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  return LANGS.includes(l) ? l : 'fr';
}

// Adresse (relative) de la page d'une langue, en gardant le code de partie de l'adresse.
function langUrl(l) {
  const sub = pageLang() !== 'fr';              // on est dans /en/, /ar/ ou /it/
  let u = l === 'fr' ? (sub ? '../' : './') : (sub ? '../' + l + '/' : l + '/');
  if (location.protocol === 'file:') u += 'index.html';   // pour tester sur l'ordinateur
  return u + (location.search || '');
}

function detectLang() {
  const here = pageLang();
  if (here !== 'fr') return here;
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && saved !== 'fr' && LANGS.includes(saved)) {
      location.replace(langUrl(saved));
    }
  } catch (e) {}
  return 'fr';
}

let LANG = detectLang();

function t(key, ...args) {
  const v = (I18N[LANG] && I18N[LANG][key] !== undefined) ? I18N[LANG][key] : I18N.fr[key];
  return typeof v === 'function' ? v(...args) : v;
}

// Lit le français directement dans la page (une seule fois), puis applique la langue choisie.
function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    if (I18N.fr[k] === undefined) I18N.fr[k] = el.innerHTML;
    if (I18N[LANG][k] !== undefined) el.innerHTML = I18N[LANG][k];
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const k = el.dataset.i18nTitle;
    if (I18N.fr[k] === undefined) I18N.fr[k] = el.title;
    el.title = t(k);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const k = el.dataset.i18nPh;
    if (I18N.fr[k] === undefined) I18N.fr[k] = el.placeholder;
    el.placeholder = t(k);
  });
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  document.title = LANG === 'fr' ? 'Ronron-doku – jeu de logique gratuit avec des chats'
    : LANG === 'ar' ? 'Ronron-doku – لعبة منطق مجانية مع القطط'
    : LANG === 'it' ? 'Ronron-doku – gioco di logica gratuito con i gatti'
    : 'Ronron-doku – free cat logic puzzle game';
  const sel = document.getElementById('lang');
  if (sel) sel.value = LANG;
}

function setLang(l) {
  if (!LANGS.includes(l)) return;
  try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
  if (l !== pageLang()) location.href = langUrl(l);
}

applyLang();
