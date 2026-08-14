(() => {
  'use strict';

  // =====================================================================
  //  CLAWD RUN — пиксельный раннер.
  //  Маскот бежит вправо, перепрыгивает багов и собирает подсказки-звёзды.
  //  Пробел / клик — прыжок, второе нажатие в воздухе — двойной прыжок.
  //  Чистый HTML/CSS/JS, без сборки: открыл файл — и играет.
  // =====================================================================

  // ---------------------------------------------------------------------
  //  __DATA__ — палитра, спрайты, константы (без DOM)
  // ---------------------------------------------------------------------

  const PAL = {
    B: '#3ecf9e', // тело маскота
    D: '#1f7a5c', // контур
    W: '#f2f1f8', // белок / крылья
    P: '#171a2b', // зрачок / тёмный
    M: '#171a2b', // рот
    L: '#0f5c45', // лапы
    A: '#ff87a5', // акцент (звёзды)
    K: '#141a2a', // тёмные детали
  };

  // центрирует строку точками до ширины w — чтобы не считать колонки руками
  const pad = (s, w) => {
    const d = w - s.length;
    const l = Math.floor(d / 2);
    return '.'.repeat(l) + s + '.'.repeat(d - l);
  };

  // --- тело маскота (16×16); лапы добавляются строками ниже ---
  const BODY = [
    '................',
    '................',
    '....DDDDDDDD....',
    '...DBBBBBBBBD...',
    '..DBBBBBBBBBBD..',
    '..DBBWBBBBWBBD..',
    '..DBBWPBBWPBBD..',
    '..DBBBBBBBBBBD..',
    '..DBBBBBBBBBBD..',
    '..DBBMMMMMMBBD..',
    '..DBBBBBBBBBBD..',
    '..DBBBBBBBBBBD..',
    '..DBBBBBBBBBBD..',
    '...DBBBBBBBBD...',
    '....DDDDDDDD....',
    '................',
  ];

  // три кадра ног: два беговых шага + поджатые в прыжке
  const LEGS = {
    a: [
      '..LL........R...',
      '..L.........R...',
      '..L..........R..',
      '.LL..........RR.',
      '................',
    ],
    b: [
      '...R........LL..',
      '...R.........L..',
      '..R..........L..',
      '.RR..........LL.',
      '................',
    ],
    jump: [
      '................',
      '................',
      '...LL......RR...',
      '...LL......RR...',
      '....L......R....',
    ],
  };

  const frame = (legs) => BODY.concat(legs);
  const PLAYER = { a: frame(LEGS.a), b: frame(LEGS.b), jump: frame(LEGS.jump) };
  const PLAYER_H = BODY.length + LEGS.a.length; // 21
  const DEAD = BODY.map((r) => r.replace(/[WP]/g, 'B')).concat(LEGS.jump); // глаза закрыты

  // --- баги-препятствия: мелкий ползун и большой шипастый ---
  const BUG_SMALL = [
    pad('DD', 16),
    pad('DDDD', 16),
    pad('DBBBD', 16),
    pad('DBBBBBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBWBBWBBD', 16),
    pad('DBBWPBWPBBD', 16), // злые глаза
    pad('DBBBBBBBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBBDDBBBD', 16),
    pad('DDDDDDDD', 16),
    pad('LL....RR', 16),
    pad('LL....RR', 16),
  ];

  const BUG_BIG = [
    pad('DD', 16),
    pad('D.DD', 16),
    pad('DDDD', 16),
    pad('DBBBBD', 16),
    pad('DBBBBBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBWBBWBBD', 16),
    pad('DBBWPBWPBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBBBBBBBD', 16),
    pad('DBBBDDBBBD', 16),
    pad('DDDDDDDD', 16),
    pad('LL....RR', 16),
    pad('LL....RR', 16),
  ];

  // --- летающий баг, два кадра машущих крыльев ---
  const FLY_UP = [
    pad('D..D', 16),
    pad('.WWDD..DDWW.', 16),
    pad('.WWDBBBBDWW.', 16),
    pad('..DBBBBBBD..', 16),
    pad('..DBBWBBBD..', 16),
    pad('..DBBBBBBD..', 16),
    pad('..DBBBBBBD..', 16),
    pad('..DBBBBBBD..', 16),
    pad('...DBBBD...', 16),
    pad('....DDDD...', 16),
    pad('...D..D....', 16),
  ];
  const FLY_DOWN = [
    pad('D..D', 16),
    pad('...DD..DD...', 16),
    pad('.WWDBBBBDWW.', 16),
    pad('.WWBBBBBBWW.', 16),
    pad('..DBBWBBBD..', 16),
    pad('..DBBBBBBD..', 16),
    pad('..DBBBBBBD..', 16),
    pad('..DBBBBBBD..', 16),
    pad('...DBBBD...', 16),
    pad('....DDDD...', 16),
    pad('...D..D....', 16),
  ];

  // --- звезда-подсказка ---
  const STAR = [
    '............',
    '....A..A....',
    '.....AA.....',
    '....AAAA....',
    '.....AA.....',
    '....A..A....',
    '............',
  ];

  // --- луна на фоне ---
  const MOON = {
    grid: [
      '..MM..',
      '.MMMM.',
      'MMMMMM',
      'MMMMMM',
      '.MMMM.',
      '..MM..',
    ],
    pal: { M: '#cfcbe8' },
  };

  // геометрия уровня (в пикселях канваса)
  const W = 960;
  const H = 540;
  const GROUND_Y = 440;
  const SCALE = 4;
  const G = 0.62; // гравитация
  const V0 = 13.5; // сила прыжка
  const V1 = 11.5; // сила двойного прыжка
  const PL = { x: 180, w: 64, h: PLAYER_H * SCALE, insetL: 12, insetT: 10, insetB: 20 };

  //  __/DATA__

  // ---------------------------------------------------------------------
  //  состояние игры
  // ---------------------------------------------------------------------

  const S = {
    mode: 'ready', // ready | run | dead | over
    t: 0,          // время с начала забега (в кадрах @60fps)
    dist: 0,       // пройденная дистанция, px
    speed: 0,      // текущая скорость мира, px/кадр
    feetY: GROUND_Y,
    vy: 0,
    jumps: 0,
    onGround: true,
    squash: 0,     // таймер сплющивания при приземлении
    runT: 0,
    runFrame: 0,
    scroll: 0,     // смещение параллакса
    obs: [],       // препятствия
    stars: [],     // подсказки-звёзды
    parts: [],     // частицы (пыль, искры)
    nextSpawn: 0,  // кадры до следующего препятствия
    score: 0,
    tips: 0,
    deadT: 0,
    shake: 0,      // тряска экрана при столкновении
    sound: localStorage.getItem('clawdrun.sound') !== '0',
  };

  let best = Number(localStorage.getItem('clawdrun.best') || 0);

  // ---------------------------------------------------------------------
  //  канвас и элементы
  // ---------------------------------------------------------------------

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const startEl = document.getElementById('start');
  const overEl = document.getElementById('gameover');
  const finalScore = document.getElementById('finalScore');
  const finalTips = document.getElementById('finalTips');
  const overBest = document.getElementById('overBest');
  const startBest = document.getElementById('startBest');
  const soundBtn = document.getElementById('soundBtn');

  // ---------------------------------------------------------------------
  //  отрисовка спрайтов
  // ---------------------------------------------------------------------

  function drawSprite(grid, x, y, scale, pal = PAL) {
    for (let yy = 0; yy < grid.length; yy++) {
      const row = grid[yy];
      for (let xx = 0; xx < row.length; xx++) {
        const c = pal[row[xx]];
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(Math.round(x + xx * scale), Math.round(y + yy * scale), Math.ceil(scale), Math.ceil(scale));
        }
      }
    }
  }

  // крестики-глаза на месте глаз маскота (для сцены проигрыша)
  function drawXCross(cx, cy, s) {
    ctx.fillStyle = PAL.P;
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(cx + i * s - 1, cy + i * s - 1, 3, 3);
      ctx.fillRect(cx - i * s - 1, cy + i * s - 1, 3, 3);
    }
  }

  // ---------------------------------------------------------------------
  //  звук (WebAudio, лениво создаётся с первого звука)
  // ---------------------------------------------------------------------

  let AC = null;
  function audio() {
    if (!AC) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) AC = new Ctx();
    }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }

  function tone(o) {
    if (!S.sound) return;
    const ac = audio();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    const t0 = ac.currentTime + (o.delay || 0);
    osc.type = o.type || 'triangle';
    osc.frequency.setValueAtTime(o.f0, t0);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t0 + o.t);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.14, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.t);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + o.t + 0.05);
  }

  const sfx = {
    jump: () => tone({ f0: 300, f1: 560, t: 0.12 }),
    double: () => tone({ f0: 420, f1: 820, t: 0.14 }),
    collect: () => {
      tone({ f0: 660, t: 0.07, gain: 0.12 });
      tone({ f0: 990, t: 0.1, delay: 0.07, gain: 0.12 });
    },
    death: () => tone({ f0: 320, f1: 60, t: 0.45, type: 'sawtooth', gain: 0.16 }),
    start: () => tone({ f0: 440, f1: 660, t: 0.1, gain: 0.1 }),
  };

  // ---------------------------------------------------------------------
  //  вспомогательные
  // ---------------------------------------------------------------------

  const overlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function playerBox() {
    return {
      x: PL.x - PL.w / 2 + PL.insetL,
      y: S.feetY - PL.h + PL.insetT,
      w: PL.w - PL.insetL * 2,
      h: PL.h - PL.insetT - PL.insetB,
    };
  }

  function obsBox(o) {
    const inset = o.type === 'fly' ? 5 : 6;
    return { x: o.x + inset, y: o.y + inset, w: o.w - inset * 2, h: o.h - inset * 2 };
  }

  function starBox(s) {
    return { x: s.x - 16, y: s.y - 10, w: 32, h: 20 };
  }

  function dust(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      S.parts.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: -Math.random() * 5 - 1,
        life: 16 + Math.random() * 14,
        color,
      });
    }
  }

  // ---------------------------------------------------------------------
  //  управление
  // ---------------------------------------------------------------------

  function jump() {
    if (S.onGround) {
      S.vy = -V0;
      S.onGround = false;
      S.jumps = 1;
      dust(PL.x, S.feetY, 4, '#0f5c45');
      sfx.jump();
    } else if (S.jumps === 1) {
      S.vy = -V1;
      S.jumps = 2;
      dust(PL.x, S.feetY, 6, '#e8e3f5');
      sfx.double();
    }
  }

  function action() {
    if (S.mode === 'ready' || S.mode === 'over') startGame();
    else if (S.mode === 'run') jump();
  }

  function reset() {
    S.mode = 'ready';
    S.t = 0;
    S.dist = 0;
    S.speed = 0;
    S.feetY = GROUND_Y;
    S.vy = 0;
    S.jumps = 0;
    S.onGround = true;
    S.squash = 0;
    S.runT = 0;
    S.runFrame = 0;
    S.scroll = 0;
    S.obs = [];
    S.stars = [];
    S.parts = [];
    S.nextSpawn = 100;
    S.score = 0;
    S.tips = 0;
    S.deadT = 0;
    S.shake = 0;
  }

  function startGame() {
    reset();
    S.mode = 'run';
    startEl.classList.add('hide');
    overEl.classList.add('hide');
    startBest.textContent = best ? `рекорд: ${best}` : '';
    sfx.start();
  }

  function die() {
    if (S.mode !== 'run') return;
    S.mode = 'dead';
    S.deadT = 0;
    S.vy = -9;
    S.shake = 7;
    dust(PL.x, S.feetY, 10, '#8a82a8');
    sfx.death();
    if (S.score > best) {
      best = S.score;
      localStorage.setItem('clawdrun.best', best);
    }
  }

  function showOver() {
    finalScore.textContent = S.score;
    finalTips.textContent = S.tips;
    overBest.textContent = best ? `рекорд: ${best}` : 'рекорда пока нет';
    overEl.classList.remove('hide');
  }

  // ---------------------------------------------------------------------
  //  спавн
  // ---------------------------------------------------------------------

  function spawnObstacle() {
    let type = 'small';
    const r = Math.random();
    if (S.t > 1800) type = r < 0.45 ? 'small' : r < 0.75 ? 'big' : 'fly';
    else if (S.t > 900) type = r < 0.65 ? 'small' : 'big';

    const h = type === 'small' ? BUG_SMALL.length * SCALE : type === 'big' ? BUG_BIG.length * SCALE : FLY_UP.length * SCALE;
    const o = {
      type,
      x: W + 40,
      y: type === 'fly' ? GROUND_Y - 56 : GROUND_Y - h,
      w: 64,
      h,
    };
    S.obs.push(o);

    // звезда над препятствием — награда за прыжок через него
    if (Math.random() < 0.5) {
      S.stars.push({ x: o.x + 32, y: o.y - 46, got: false });
    }
    // изредка низкая звезда впереди, по земле
    if (Math.random() < 0.3) {
      S.stars.push({ x: o.x + 150 + Math.random() * 140, y: GROUND_Y - 58, got: false });
    }

    // интервал до следующего (сжимается со скоростью)
    S.nextSpawn = Math.max(42, 96 - S.speed * 4.5 + Math.random() * 40);
  }

  // ---------------------------------------------------------------------
  //  игровой цикл
  // ---------------------------------------------------------------------

  function update(dt) {
    S.t += dt;

    if (S.mode === 'run') {
      // скорость растёт с дистанцией
      S.speed = Math.min(11.5, 4.5 + S.dist * 0.00045);
      S.dist += S.speed * dt;
      S.scroll += S.speed * dt;
      S.score = Math.floor(S.dist / 8) + S.tips * 50;

      // физика прыжка
      if (!S.onGround) {
        S.vy += G * dt;
        S.feetY += S.vy * dt;
        if (S.feetY >= GROUND_Y) {
          S.feetY = GROUND_Y;
          S.onGround = true;
          S.jumps = 0;
          S.squash = 5;
          S.vy = 0;
          dust(PL.x, S.feetY, 4, '#0f5c45');
        }
      }
      if (S.squash > 0) S.squash -= dt;

      // анимация ног — тем быстрее, чем выше скорость
      S.runT += dt;
      const step = Math.max(4, 11 - S.speed * 0.5);
      S.runFrame = Math.floor(S.runT / step) % 2;

      // спавн препятствий
      S.nextSpawn -= dt;
      if (S.nextSpawn <= 0) spawnObstacle();

      // движение мира
      for (const o of S.obs) o.x -= S.speed * dt;
      S.obs = S.obs.filter((o) => o.x > -80);
      for (const s of S.stars) s.x -= S.speed * dt;
      S.stars = S.stars.filter((s) => s.x > -40);

      // частицы
      updateParts(dt);

      // сбор звёзд
      const pbox = playerBox();
      for (const s of S.stars) {
        if (!s.got && overlap(pbox, starBox(s))) {
          s.got = true;
          S.tips += 1;
          dust(s.x, s.y, 8, PAL.A);
          sfx.collect();
        }
      }
      S.stars = S.stars.filter((s) => !s.got);

      // столкновения с багами
      for (const o of S.obs) {
        if (overlap(pbox, obsBox(o))) {
          die();
          break;
        }
      }
    } else if (S.mode === 'dead') {
      // маскот подпрыгивает и падает; баги замирают
      S.deadT += dt;
      S.vy += G * dt;
      S.feetY += S.vy * dt;
      if (S.feetY >= GROUND_Y) {
        S.feetY = GROUND_Y;
        S.vy = 0;
      }
      updateParts(dt);
      if (S.deadT > 55) {
        S.mode = 'over';
        showOver();
      }
    }

    if (S.shake > 0) S.shake -= dt;
  }

  function updateParts(dt) {
    for (const p of S.parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.18 * dt;
      p.life -= dt;
    }
    S.parts = S.parts.filter((p) => p.life > 0);
  }

  // ---------------------------------------------------------------------
  //  отрисовка
  // ---------------------------------------------------------------------

  // параллакс-город и звёзды генерируются один раз
  const CITY = [];
  for (let i = 0; i < 24; i++) {
    CITY.push({
      x: i * 90,
      w: 36 + Math.random() * 40,
      h: 40 + Math.random() * 90,
    });
  }
  const SKY = [];
  for (let i = 0; i < 60; i++) {
    SKY.push({ x: Math.random() * W, y: Math.random() * 300, s: Math.random() < 0.5 ? 2 : 3 });
  }

  function draw() {
    ctx.save();
    if (S.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
    }

    // небо
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#120d24');
    grad.addColorStop(1, '#241a40');
    ctx.fillStyle = grad;
    ctx.fillRect(-10, -10, W + 20, GROUND_Y + 10);

    // звёзды мерцают
    for (let i = 0; i < SKY.length; i++) {
      const st = SKY[i];
      const a = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(S.t * 0.05 + i * 1.7));
      ctx.fillStyle = `rgba(242, 241, 248, ${a.toFixed(2)})`;
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }

    // луна
    drawSprite(MOON.grid, 822, 40, 6, MOON.pal);

    // город-параллакс (0.25 скорости)
    const cs = S.scroll * 0.25;
    const base = Math.floor(cs / 90);
    const off = cs % 90;
    for (let i = 0; i < 14; i++) {
      const b = CITY[((base + i) % CITY.length + CITY.length) % CITY.length];
      const bx = i * 90 - off;
      const by = GROUND_Y - b.h;
      ctx.fillStyle = '#1a1330';
      ctx.fillRect(bx, by, b.w, b.h);
      // пара окон
      ctx.fillStyle = '#2b2150';
      for (let wy = by + 10; wy < GROUND_Y - 10; wy += 16) {
        for (let wx = bx + 6; wx < bx + b.w - 6; wx += 12) {
          if ((wx + wy) % 47 < 12) ctx.fillRect(wx, wy, 4, 5);
        }
      }
    }

    // земля
    ctx.fillStyle = '#120e20';
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = '#2fbf8f';
    ctx.fillRect(0, GROUND_Y, W, 4);
    // бегущие штрихи на земле — ощущение скорости
    ctx.fillStyle = '#2a2142';
    const dashOff = S.scroll % 52;
    for (let x = -dashOff; x < W; x += 52) ctx.fillRect(x, GROUND_Y + 12, 16, 3);

    // препятствия
    for (const o of S.obs) {
      const grid = o.type === 'fly'
        ? (Math.floor(S.t / 8) % 2 ? FLY_DOWN : FLY_UP)
        : (o.type === 'big' ? BUG_BIG : BUG_SMALL);
      drawSprite(grid, o.x, o.y, SCALE);
    }

    // звёзды-подсказки
    for (const s of S.stars) {
      const pulse = 3.4 + Math.sin(S.t * 0.15 + s.x * 0.01) * 0.8;
      drawSprite(STAR, s.x - 12 * pulse / 2, s.y - 7 * pulse / 2, pulse);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(s.x - 1, s.y - 9, 2, 2);
    }

    // частицы
    for (const p of S.parts) {
      ctx.globalAlpha = Math.max(0, p.life / 20);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    // маскот
    drawPlayer();

    // счёт
    if (S.mode !== 'ready') drawHUD();

    ctx.restore();
  }

  function drawPlayer() {
    const dead = S.mode === 'dead';
    const grid = dead ? DEAD : !S.onGround ? PLAYER.jump : (S.runFrame ? PLAYER.b : PLAYER.a);

    const px = PL.x - PL.w / 2;
    const py = S.feetY - PL.h;

    // сплющивание при приземлении
    let sy = 1;
    if (S.squash > 0) sy = 1 - 0.15 * (S.squash / 5);

    ctx.save();
    ctx.translate(PL.x, S.feetY);
    ctx.scale(1, sy);
    ctx.translate(-PL.x, -S.feetY);
    drawSprite(grid, px, py, SCALE);
    if (dead) {
      // крестики-глаза на месте глаз
      drawXCross(PL.x - 10, S.feetY - 62, 4);
      drawXCross(PL.x + 6, S.feetY - 62, 4);
    }
    ctx.restore();
  }

  function drawHUD() {
    ctx.fillStyle = 'rgba(13, 10, 26, 0.55)';
    ctx.fillRect(0, 0, 210, 34);

    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8e3f5';
    ctx.fillText(String(S.score).padStart(6, '0'), 12, 18);

    drawSprite(STAR, 152, 10, 1);
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = PAL.A;
    ctx.fillText(`×${S.tips}`, 170, 18);
  }

  // ---------------------------------------------------------------------
  //  события
  // ---------------------------------------------------------------------

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    action();
  });

  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'к') {
      startGame();
    }
  });

  // отпустили прыжок раньше времени — прыжок становится ниже
  addEventListener('keyup', (e) => {
    if ((e.key === ' ' || e.key === 'ArrowUp') && !S.onGround && S.vy < 0) {
      S.vy *= 0.5;
    }
  });

  document.getElementById('startBtn').addEventListener('click', action);
  document.getElementById('againBtn').addEventListener('click', action);

  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    S.sound = !S.sound;
    soundBtn.textContent = S.sound ? '🔊' : '🔇';
    localStorage.setItem('clawdrun.sound', S.sound ? '1' : '0');
  });

  // ---------------------------------------------------------------------
  //  старт
  // ---------------------------------------------------------------------

  reset();
  soundBtn.textContent = S.sound ? '🔊' : '🔇';
  startBest.textContent = best ? `рекорд: ${best}` : '';

  let last = performance.now();
  function loop(now) {
    // время нормализуется к 60 fps, чтобы игра была одинаковой на любом мониторе
    const dt = Math.min((now - last) / (1000 / 60), 2.5);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
