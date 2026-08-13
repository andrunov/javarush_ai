'use strict';

// =====================================================================
//  CLAWD YOLO — генератор пиксельного маскота Claude Code
//  Чистый HTML/CSS/JS, без сборки: открыл файл — и всё работает.
// =====================================================================

// ---------------------------------------------------------------------
//  __DATA__  — чистые данные и функции без DOM (используются и чекером)
// ---------------------------------------------------------------------

const SPRITE = {
  W: 24,
  H: 24,
  browRow: 7,     // строка бровей
  eyeRows: [8, 9],   // строки глаз
  mouthRows: [12, 13], // строки рта
  // базовое тело: «капля»-монстрик. . — прозрачный, O — контур,
  // B — тело, H — блик (вычисляется из цвета тела).
  // Строки собраны из сегментов, чтобы гарантированно были по 24 символа.
  rows: (() => {
    const fill = (n, ch) => ch.repeat(n);
    const r = [
      fill(24, '.'),
      fill(24, '.'),
      fill(24, '.'),
      fill(2, '.') + fill(20, 'O') + fill(2, '.'),
      fill(2, '.') + 'O' + fill(18, 'B') + 'O' + fill(2, '.'),
      fill(2, '.') + 'O' + 'BBHH' + fill(10, 'B') + 'HHBB' + 'O' + fill(2, '.'),
    ];
    for (let i = 0; i < 15; i++) r.push(fill(1, '.') + 'O' + fill(20, 'B') + 'O' + fill(1, '.'));
    r.push(fill(2, '.') + 'O' + fill(18, 'B') + 'O' + fill(2, '.'));
    r.push(fill(2, '.') + 'O' + fill(18, 'B') + 'O' + fill(2, '.'));
    r.push(fill(3, '.') + fill(18, 'O') + fill(3, '.'));
    return r;
  })(),
};

// палитра: 5 цветов, доступных для кисти. H/S выводятся из B автоматически.
const PALETTE = {
  B: { label: 'Тело',   color: '#2fbf8f' },
  O: { label: 'Контур', color: '#0f5c45' },
  W: { label: 'Белый',  color: '#f4f3fa' },
  D: { label: 'Тёмный', color: '#141a2a' },
  A: { label: 'Акцент', color: '#ff87a5' },
};

const hexToRgb = (h) => {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const rgbToHex = (r, g, b) =>
  '#' + [r, g, b]
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
    .join('');
const lighten = (hex, amt) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
};
const darken = (hex, amt) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
};

// цвет по символу; H и S — производные от «Тела»
function hexFor(c) {
  if (c === 'H') return lighten(PALETTE.B.color, 0.22);
  if (c === 'S') return darken(PALETTE.B.color, 0.18);
  return PALETTE[c] ? PALETTE[c].color : null;
}

// --- шаблоны глаз. Каждая пара — [верхняя строка, нижняя строка],
// 20 символов: колонки 3–5 и 14–16 — сами глаза, между ними тело. ---
const eye = (t, b) => ['BBB' + t + 'BBBBBBBB' + t + 'BBB', 'BBB' + b + 'BBBBBBBB' + b + 'BBB'];
const OPEN   = eye('WWW', 'WDW');   // открытые: белок + зрачок по центру
const CLOSED = eye('BBB', 'DDD');   // закрытые: линия
const HAPPY  = eye('BBB', 'BDB');   // мягкие дуги-«улыбки»
const SQUINT = eye('BDB', 'DDB');   // прищур (сонливость/раздумья)
const XEYES  = eye('DBD', 'BDB');   // крестики (неловкость)
const STAR   = eye('WDW', 'DDD');   // искры-звёзды (восторг)
const SHADES = eye('DDD', 'DWD');   // очки + блик
const WINK   = ['BBB' + 'WWW' + 'BBBBBBBB' + 'BBB' + 'BBB',
                'BBB' + 'DWD' + 'BBBBBBBB' + 'DDD' + 'BBB']; // левый открыт, правый зажмурен

// --- шаблоны рта, строки по 20 символов ---
const MOUTH = {
  smile:   ['BBBBBB' + 'DD' + 'BBBB' + 'DD' + 'BBBBBB',
            'BBBBBBBB' + 'DDDD' + 'BBBBBBBB'],
  neutral: ['BBBBBBBBB' + 'DD' + 'BBBBBBBBB',
            'BBBBBBBBBBBBBBBBBBBB'],
  grin:    ['BBBB' + 'DDDD' + 'BBBB' + 'DDDD' + 'BBBB',
            'BBBB' + 'WWWW' + 'BBBB' + 'WWWW' + 'BBBB'],
  open:    ['BBBBBBB' + 'DDDDDD' + 'BBBBBBB',
            'BBBBBBB' + 'DDDDDD' + 'BBBBBBB'],
  wail:    ['BBBBB' + 'DDDDDDDDDD' + 'BBBBB',
            'BBBBB' + 'DDDDDDDDDD' + 'BBBBB'],
  frown:   ['BBBBBBBBB' + 'DD' + 'BBBBBBBBB',
            'BBBBBB' + 'DD' + 'BBBB' + 'DD' + 'BBBBBB'],
  grit:    ['BBBB' + 'DDDDDDDDDDDD' + 'BBBB',
            'BBBB' + 'WWWWWWWWWWWW' + 'BBBB'],
  smirk:   ['BBBBBBB' + 'DD' + 'BBBBBBBBBBB',
            'BBBBBBBBBBBBBBBBBBBB'],
};

// маленькая «z» в 3×3 (для снов)
const z = (x, y) => [
  [x, y, 'D'], [x + 1, y, 'D'], [x + 2, y, 'D'],
  [x + 1, y + 1, 'D'],
  [x, y + 2, 'D'], [x + 1, y + 2, 'D'], [x + 2, y + 2, 'D'],
];

// 20 настроений: глаза + рот + брови (необязательно) + пиксели-аксессуары.
// pixels — абсолютные координаты сетки [x, y, символ].
const MOODS = {
  smile:   { emoji: '😁', label: 'радость',      eyes: OPEN,   mouth: MOUTH.grin,
             pixels: [[8, 11, 'A'], [15, 11, 'A']] },
  happy:   { emoji: '😊', label: 'улыбка',       eyes: HAPPY,  mouth: MOUTH.smile,
             pixels: [[8, 11, 'A'], [15, 11, 'A']] },
  tongue:  { emoji: '😛', label: 'язык',         eyes: OPEN,   mouth: MOUTH.open,
             pixels: [[9, 14, 'A'], [10, 14, 'A'], [11, 14, 'A'], [12, 14, 'A'],
                      [9, 15, 'A'], [10, 15, 'A'], [11, 15, 'A'], [12, 15, 'A']] },
  wink:    { emoji: '😜', label: 'подмигивание', eyes: WINK,   mouth: MOUTH.smile,
             pixels: [[9, 14, 'A'], [10, 14, 'A'], [11, 14, 'A'],
                      [9, 15, 'A'], [10, 15, 'A'], [11, 15, 'A'],
                      [8, 11, 'A'], [15, 11, 'A']] },
  cool:    { emoji: '😎', label: 'крутость',     eyes: SHADES, mouth: MOUTH.smirk,
             pixels: [[10, 8, 'D'], [11, 8, 'D']] },
  sleepy:  { emoji: '😪', label: 'сонливость',   eyes: SQUINT, mouth: MOUTH.smile,
             brow: 'BBB' + 'DDD' + 'BBBBBBBB' + 'DDD' + 'BBB',
             pixels: [...z(16, 0)] },
  sleep:   { emoji: '😴', label: 'сон',          eyes: CLOSED, mouth: MOUTH.smile,
             pixels: [...z(14, 0), ...z(18, 0)] },
  cry:     { emoji: '😢', label: 'грусть',       eyes: CLOSED, mouth: MOUTH.frown,
             brow: 'BBBBB' + 'DD' + 'BBBBBB' + 'DD' + 'BBBBB',
             pixels: [[17, 10, 'A'], [17, 11, 'A'], [16, 12, 'A']] },
  sob:     { emoji: '😭', label: 'рыдания',      eyes: OPEN,   mouth: MOUTH.wail,
             brow: 'BBBBB' + 'DD' + 'BBBBBB' + 'DD' + 'BBBBB',
             pixels: [[6, 10, 'A'], [6, 11, 'A'], [5, 12, 'A'],
                      [17, 10, 'A'], [17, 11, 'A'], [18, 12, 'A'],
                      [9, 13, 'D']] },
  shock:   { emoji: '😲', label: 'шок',          eyes: OPEN,   mouth: MOUTH.open, pixels: [] },
  omg:     { emoji: '😳', label: 'смущение',     eyes: OPEN,   mouth: MOUTH.open,
             pixels: [[8, 11, 'A'], [15, 11, 'A'], [8, 12, 'A'], [15, 12, 'A']] },
  think:   { emoji: '🤔', label: 'раздумья',     eyes: SQUINT, mouth: MOUTH.neutral,
             pixels: [[4, 6, 'D'], [5, 6, 'D'], [6, 13, 'D'], [7, 13, 'D'], [6, 14, 'D']] },
  angry:   { emoji: '😡', label: 'злость',       eyes: OPEN,   mouth: MOUTH.frown,
             pixels: [[4, 6, 'D'], [5, 6, 'D'], [6, 7, 'D'],
                      [19, 6, 'D'], [18, 6, 'D'], [17, 7, 'D'],
                      [10, 1, 'D'], [11, 1, 'D'], [10, 2, 'D']] },
  mad:     { emoji: '😠', label: 'раздражение',  eyes: OPEN,   mouth: MOUTH.frown,
             pixels: [[4, 6, 'D'], [5, 6, 'D'], [6, 7, 'D'],
                      [19, 6, 'D'], [18, 6, 'D'], [17, 7, 'D'],
                      [18, 4, 'A'], [18, 5, 'A']] },
  neutral: { emoji: '😐', label: 'спокойствие',  eyes: OPEN,   mouth: MOUTH.neutral, pixels: [] },
  awkward: { emoji: '😬', label: 'неловкость',   eyes: XEYES,  mouth: MOUTH.grit,
             pixels: [[18, 4, 'A'], [18, 5, 'A']] },
  angel:   { emoji: '😇', label: 'невинность',   eyes: HAPPY,  mouth: MOUTH.smile,
             pixels: [[9, 1, 'A'], [10, 0, 'A'], [11, 0, 'A'], [12, 0, 'A'], [13, 1, 'A']] },
  devil:   { emoji: '😈', label: 'озорство',     eyes: OPEN,   mouth: MOUTH.grin,
             pixels: [[4, 2, 'D'], [5, 1, 'D'], [5, 2, 'D'],
                      [19, 2, 'D'], [18, 1, 'D'], [18, 2, 'D']] },
  yawn:    { emoji: '🥱', label: 'зевота',       eyes: CLOSED, mouth: MOUTH.wail,
             pixels: [[17, 10, 'A'], [17, 11, 'A'], [18, 12, 'A']] },
  star:    { emoji: '🤩', label: 'восторг',      eyes: STAR,   mouth: MOUTH.grin,
             pixels: [[2, 6, 'A'], [3, 6, 'A'], [21, 6, 'A'], [20, 6, 'A'],
                      [2, 15, 'A'], [21, 15, 'A']] },
};

// собирает сетку маскота для настроения (строки лица 20 символов —
// вставляются в середину строк тела между контурами)
function buildGrid(name) {
  const g = SPRITE.rows.map((r) => r.split(''));
  const m = MOODS[name];
  const faceRow = (row) => '.O' + row + 'O.';
  if (m.brow) g[SPRITE.browRow] = faceRow(m.brow).split('');
  m.eyes.forEach((row, i) => { g[SPRITE.eyeRows[i]] = faceRow(row).split(''); });
  m.mouth.forEach((row, i) => { g[SPRITE.mouthRows[i]] = faceRow(row).split(''); });
  for (const [x, y, c] of (m.pixels || [])) g[y][x] = c;
  return g;
}

// --- генераторы кода для экспорта (чистые функции, без DOM) ---

function exportPixelsFrom(img) {
  const out = [];
  for (let y = 0; y < SPRITE.H; y++) {
    for (let x = 0; x < SPRITE.W; x++) {
      const c = img[y][x];
      if (c !== '.' && hexFor(c)) out.push({ x, y, c });
    }
  }
  return out;
}

const shadowsFrom = (pixels) =>
  pixels.map((p) => `${p.x}px ${p.y}px 0 0 ${hexFor(p.c)}`).join(',\n  ');

function htmlSnippetFor(img, size, name) {
  const px = exportPixelsFrom(img);
  return `<div class="clawd" aria-label="CLAWD · ${name}" style="width:24px;height:24px;background:transparent;image-rendering:pixelated;transform:scale(${(size / 24).toFixed(1)});transform-origin:top left;box-shadow:\n  ${shadowsFrom(px)}\n"></div>`;
}

function cssSnippetFor(img, size, name) {
  const px = exportPixelsFrom(img);
  return `/* CLAWD YOLO · ${name} */\n.clawd {\n  width: 24px;\n  height: 24px;\n  background: transparent;\n  image-rendering: pixelated;\n  transform: scale(${(size / 24).toFixed(1)});\n  transform-origin: top left;\n  box-shadow:\n    ${shadowsFrom(px)}\n}`;
}

function svgStringFor(img, size, name) {
  const px = exportPixelsFrom(img);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" shape-rendering="crispEdges">\n${px
    .map((p) => `  <rect x="${p.x}" y="${p.y}" width="1" height="1" fill="${hexFor(p.c)}"/>`)
    .join('\n')}\n</svg>`;
}

//  __/DATA__

// ---------------------------------------------------------------------
//  интерфейс
// ---------------------------------------------------------------------

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const moodGrid = document.getElementById('moodGrid');
const moodNameEl = document.getElementById('moodName');
const paletteBox = document.getElementById('paletteBox');
const sizeBox = document.getElementById('sizeBox');
const exportBox = document.getElementById('exportBox');
const brushBadge = document.getElementById('brushBadge');
const btnErase = document.getElementById('btnErase');
const btnUndo = document.getElementById('btnUndo');
const btnReset = document.getElementById('btnReset');

const state = {
  mood: 'smile',
  size: 240,
  brush: 'B',        // символ цвета кисти; '.' — ластик
  lastBrush: 'B',    // для возврата после ластика
  base: buildGrid('smile'),
  edits: [],         // ручные правки [{x, y, c}]
  history: [],       // штрихи для undo
};

// текущая картинка = база настроения + ручные правки
function currentImage() {
  const img = state.base.map((r) => r.slice());
  for (const e of state.edits) img[e.y][e.x] = e.c;
  return img;
}

function drawGrid(grid) {
  ctx.clearRect(0, 0, SPRITE.W, SPRITE.H);
  for (let y = 0; y < SPRITE.H; y++) {
    for (let x = 0; x < SPRITE.W; x++) {
      const col = hexFor(grid[y][x]);
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function render() {
  drawGrid(currentImage());
  updateBadge();
}

// ---------- 1 · настроение ----------

function setMood(name) {
  state.mood = name;
  state.base = buildGrid(name);
  state.history = [];
  render();
  document.querySelectorAll('.emoji-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mood === name);
  });
  const m = MOODS[name];
  moodNameEl.textContent = `${m.emoji} ${m.label}`;
}

function buildMoodUI() {
  for (const [key, m] of Object.entries(MOODS)) {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.dataset.mood = key;
    btn.title = m.label;
    btn.innerHTML = `<span class="face">${m.emoji}</span><span class="label">${m.label}</span>`;
    btn.addEventListener('click', () => setMood(key));
    moodGrid.appendChild(btn);
  }
}

// ---------- 2 · палитра ----------

function updateBadge() {
  if (state.brush === '.') {
    brushBadge.textContent = '🧽 ластик';
    brushBadge.classList.add('eraser');
    canvas.classList.add('eraser');
  } else {
    const p = PALETTE[state.brush];
    brushBadge.textContent = `${p.label} • ${p.color}`;
    brushBadge.classList.remove('eraser');
    canvas.classList.remove('eraser');
  }
  document.querySelectorAll('.pal-swatch').forEach((s) => {
    s.classList.toggle('brush', s.dataset.c === state.brush);
  });
  btnErase.classList.toggle('active', state.brush === '.');
}

function buildPaletteUI() {
  for (const [key, p] of Object.entries(PALETTE)) {
    const row = document.createElement('div');
    row.className = 'pal-row';

    const swatch = document.createElement('button');
    swatch.className = 'pal-swatch';
    swatch.dataset.c = key;
    swatch.innerHTML = `<span class="dot"></span><span class="name">${p.label}</span>`;
    swatch.querySelector('.dot').style.background = p.color;
    swatch.title = `Кисть: ${p.label}`;
    swatch.addEventListener('click', () => { state.brush = key; updateBadge(); });

    const tune = document.createElement('input');
    tune.type = 'color';
    tune.value = p.color;
    tune.className = 'pal-tune';
    tune.title = `Настроить цвет «${p.label}»`;
    tune.addEventListener('input', () => {
      p.color = tune.value;
      swatch.querySelector('.dot').style.background = p.color;
      render();
    });

    row.append(swatch, tune);
    paletteBox.appendChild(row);
  }
}

// ---------- 3 · размер ----------

const SIZES = [120, 160, 240, 320, 480];

function setSize(n) {
  state.size = n;
  canvas.style.width = n + 'px';
  canvas.style.height = n + 'px';
  document.querySelectorAll('.size-btn').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.size) === n);
  });
}

function buildSizeUI() {
  for (const n of SIZES) {
    const btn = document.createElement('button');
    btn.className = 'size-btn';
    btn.dataset.size = n;
    btn.textContent = n;
    btn.title = `${n}×${n} px`;
    btn.addEventListener('click', () => setSize(n));
    sizeBox.appendChild(btn);
  }
}

// ---------- 4 · дорисовка ----------

function cellFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  const x = Math.floor(((e.clientX - r.left) / r.width) * SPRITE.W);
  const y = Math.floor(((e.clientY - r.top) / r.height) * SPRITE.H);
  return { x: Math.max(0, Math.min(SPRITE.W - 1, x)), y: Math.max(0, Math.min(SPRITE.H - 1, y)) };
}

function paintCell(x, y, c) {
  const img = currentImage();
  const old = img[y][x];
  const idx = state.edits.findIndex((e) => e.x === x && e.y === y);
  if (c === '.') {
    // ластик: убрать ручную правку, если она была
    if (idx !== -1) state.edits.splice(idx, 1);
  } else if (state.base[y][x] === c) {
    // рисуем цвет базы — правка не нужна
    if (idx !== -1) state.edits.splice(idx, 1);
  } else if (idx !== -1) {
    // правка на клетке уже есть — просто меняем цвет (без дублей)
    state.edits[idx].c = c;
  } else {
    state.edits.push({ x, y, c });
  }
  return old; // для undo
}

let painting = false;
let stroke = [];

function startStroke(e) {
  e.preventDefault();
  if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  painting = true;
  stroke = [];
  paintFromEvent(e);
}

function paintFromEvent(e) {
  if (!painting) return;
  const c = (e.shiftKey || e.button === 2) ? '.' : state.brush;
  const { x, y } = cellFromEvent(e);
  const old = paintCell(x, y, c);
  if (old !== (currentImage()[y][x])) stroke.push({ x, y, old });
  render();
}

function endStroke() {
  if (painting) {
    painting = false;
    if (stroke.length) state.history.push(stroke);
    stroke = [];
  }
}

function undo() {
  const s = state.history.pop();
  if (!s) return;
  for (const { x, y, old } of s) {
    if (old === state.base[y][x]) {
      const idx = state.edits.findIndex((e) => e.x === x && e.y === y);
      if (idx !== -1) state.edits.splice(idx, 1);
    } else {
      state.edits.push({ x, y, c: old });
    }
  }
  render();
}

function resetEdits() {
  state.edits = [];
  state.history = [];
  render();
}

// ---------- 5 · экспорт ----------

// рисует спрайт на канвасе размера dest×dest, начиная с угла (ox, oy)
function drawSpriteTo(c, dest, ox, oy) {
  const scale = dest / SPRITE.W;
  c.imageSmoothingEnabled = false;
  const img = currentImage();
  for (let y = 0; y < SPRITE.H; y++) {
    for (let x = 0; x < SPRITE.W; x++) {
      const col = hexFor(img[y][x]);
      if (col) {
        c.fillStyle = col;
        c.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    }
  }
}

function canvasOf(size) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  return cv;
}

function renderPNG(size) {
  const cv = canvasOf(size);
  const c = cv.getContext('2d');
  c.clearRect(0, 0, size, size);
  drawSpriteTo(c, size, 0, 0);
  return cv;
}

function renderAvatar() {
  const size = 512;
  const cv = canvasOf(size);
  const c = cv.getContext('2d');
  c.clearRect(0, 0, size, size);
  // подложка-«карточка» со скруглёнными углами
  c.fillStyle = darken(PALETTE.B.color, 0.62);
  const roundedRect = (x, y, w, h, r) => {
    if (c.roundRect) {
      c.beginPath();
      c.roundRect(x, y, w, h, r);
    } else { // полифилл для старых браузеров
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
  };
  roundedRect(28, 28, size - 56, size - 56, 64);
  c.fill();
  const s = 340;
  const off = (size - s) / 2;
  drawSpriteTo(c, s, off, off);
  return cv;
}

function renderSticker() {
  const size = 512;
  const cv = canvasOf(size);
  const c = cv.getContext('2d');
  c.clearRect(0, 0, size, size);
  const s = 440;
  const off = (size - s) / 2;
  drawSpriteTo(c, s, off, off);
  return cv;
}

function download(canvasOrBlob, filename) {
  const isCanvas = canvasOrBlob.tagName === 'CANVAS';
  const done = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  if (isCanvas) canvasOrBlob.toBlob(done, 'image/png');
  else done(canvasOrBlob);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
    return ok;
  }
}

let toastTimer;
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1700);
}

const EXPORTS = [
  { key: 'html', label: 'Copy HTML' },
  { key: 'css', label: 'Copy CSS' },
  { key: 'svg', label: 'Copy SVG' },
  { key: 'png', label: 'PNG-файл', primary: true },
  { key: 'svgfile', label: 'SVG-файл' },
  { key: 'avatar', label: 'Аватар' },
  { key: 'sticker', label: 'Стикер' },
];

function handleExport(key) {
  const slug = state.mood;
  const img = currentImage();
  const name = `${MOODS[state.mood].emoji} ${MOODS[state.mood].label}`;
  switch (key) {
    case 'html':
      copyText(htmlSnippetFor(img, state.size, name)).then((ok) => toast(ok ? 'HTML скопирован' : 'Не удалось скопировать'));
      break;
    case 'css':
      copyText(cssSnippetFor(img, state.size, name)).then((ok) => toast(ok ? 'CSS скопирован' : 'Не удалось скопировать'));
      break;
    case 'svg':
      copyText(svgStringFor(img, state.size, name)).then((ok) => toast(ok ? 'SVG скопирован' : 'Не удалось скопировать'));
      break;
    case 'png':
      download(renderPNG(state.size), `clawd-${slug}.png`);
      toast('PNG сохранён');
      break;
    case 'svgfile':
      download(new Blob([svgStringFor(img, state.size, name)], { type: 'image/svg+xml' }), `clawd-${slug}.svg`);
      toast('SVG сохранён');
      break;
    case 'avatar':
      download(renderAvatar(), `clawd-${slug}-avatar.png`);
      toast('Аватар сохранён');
      break;
    case 'sticker':
      download(renderSticker(), `clawd-${slug}-sticker.png`);
      toast('Стикер сохранён');
      break;
  }
}

function buildExportUI() {
  for (const e of EXPORTS) {
    const btn = document.createElement('button');
    btn.className = 'exp-btn' + (e.primary ? ' primary' : '');
    btn.textContent = e.label;
    btn.addEventListener('click', () => handleExport(e.key));
    exportBox.appendChild(btn);
  }
}

// ---------- события ----------

canvas.addEventListener('pointerdown', startStroke);
canvas.addEventListener('pointermove', paintFromEvent);
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

btnErase.addEventListener('click', () => {
  if (state.brush === '.') {
    state.brush = state.lastBrush;
  } else {
    state.lastBrush = state.brush;
    state.brush = '.';
  }
  updateBadge();
});
btnUndo.addEventListener('click', undo);
btnReset.addEventListener('click', resetEdits);

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undo();
  }
});

// ---------- старт ----------

buildMoodUI();
buildPaletteUI();
buildSizeUI();
buildExportUI();
setMood('smile');
setSize(240);
updateBadge();
render();
