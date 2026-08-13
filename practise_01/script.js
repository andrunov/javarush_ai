(() => {
  'use strict';

  const SIZE = 16;

  // пиксельный спрайт: монстрик-капля
  // B — тело, D — контур, W — белок глаз, P — зрачок/рот
  const PALETTE = {
    B: '#3ecf9e',
    D: '#1f7a5c',
    W: '#f2f1f8',
    P: '#171a2b',
    M: '#171a2b',
  };

  const OPEN = [
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
  const CLOSED = OPEN.map((row) => row.replace(/[WP]/g, 'B'));

  // 150 подсказок, собранных из официальной документации Claude Code
  const TIPS = [
    // --- слэш-команды ---
    '/help показывает справку и доступные команды',
    '/init создаёт руководство CLAUDE.md для проекта',
    '/config открывает настройки темы, модели и стиля вывода',
    '/model переключает модель и сохраняет её по умолчанию',
    '/permissions управляет правилами allow, ask и deny',
    '/clear начинает новую беседу с пустым контекстом',
    '/compact освобождает контекст, суммируя беседу',
    '/code-review проверяет текущий дифф; /review — его алиас',
    '/memory редактирует CLAUDE.md и управляет авто-памятью',
    '/agents напоминает: создавайте сабагентов через Claude или .claude/agents/',
    '/add-dir добавляет рабочую директорию для доступа к файлам',
    '/doctor диагностирует проблемы установки и чинит их',
    '/login входит в аккаунт Anthropic',
    '/logout выходит из аккаунта Anthropic',
    '/mcp управляет MCP-серверами и OAuth-аутентификацией',
    '/install-github-app устанавливает Claude GitHub App для репозитория',
    '/pr-comments удалён в v2.1.91; о комментариях PR спрашивайте Claude',
    '/resume переключает на другую беседу из активной сессии',
    '/terminal-setup прописывает Shift+Enter и другие биндинги в терминал',
    '/context показывает использование контекста цветной сеткой',
    '/autocompact задаёт порог автокомпактирования контекста',
    '/branch создаёт ветку беседы, оригинал сохраняется',
    '/btw задаёт побочный вопрос без записи в историю',
    '/bug отправляет отчёт об ошибке или беседу',
    '/cd перемещает сессию в новую рабочую директорию',
    '/copy копирует последний ответ ассистента в буфер обмена',
    '/export выгружает текущую беседу в текстовый файл',
    '/fast включает или выключает быстрый режим',
    '/fork копирует беседу в новую фоновую сессию',
    '/goal ставит цель — Claude работает, пока она не выполнена',
    // --- шорткаты и интерактивный режим ---
    'Shift+Tab циклически переключает режимы разрешений: default, acceptEdits, plan.',
    'Режим default в индикаторе помечен как «Manual».',
    'На Windows Alt+M переключает режимы, если не включён VT input.',
    'Esc прерывает текущий ответ, сохраняя уже сделанную работу.',
    'При открытом диалоге Esc закрывает диалог, а не прерывает Claude.',
    'Двойное Esc очищает ввод и сохраняет черновик в историю.',
    'Ctrl+C прерывает выполняющуюся операцию или очищает ввод.',
    'Если ничего не выполняется, первый Ctrl+C очищает, второй — выходит.',
    'Ctrl+C в обратном поиске истории отменяет и восстанавливает ввод.',
    'Ctrl+D показывает подтверждение, второе нажатие выходит из сессии.',
    'При тексте в поле Ctrl+D удаляет символ после курсора.',
    '/exit выходит из CLI, /quit — его псевдоним.',
    'В фоновой сессии /exit отсоединяет её, сессия продолжает работать.',
    'Enter отправляет сообщение, Shift+Enter вставляет перевод строки.',
    'Ctrl+J добавляет перенос строки без отправки в любом терминале.',
    'Символ обратного слэша с Enter вставляет перевод строки.',
    'Shift+Enter работает без настройки в Windows Terminal, iTerm2, Kitty и др.',
    'Стрелки влево/вправо переключают вкладки в диалогах и меню.',
    'Стрелки вверх/вниз двигают курсор по строкам или листают историю.',
    'На первой/последней строке ввода стрелки открывают историю команд.',
    '/ в начале ввода показывает список команд и навыков.',
    'Введите / и буквы, чтобы отфильтровать список команд.',
    'Меню / включает команды, навыки, плагины и MCP-серверы.',
    'Прямая вставка кода и логов работает как многострочный ввод.',
    'Вставка более 800 символов сворачивается в плейсхолдер «[Pasted text #N]».',
    'Статус-лайн — настраиваемая строка внизу интерфейса Claude Code.',
    'Статус-лайн получает JSON-данные сессии и выполняет любой скрипт.',
    'Кастомный статус-лайн скрывает подсказки футера, включая «esc to interrupt».',
    'Shell-режим «!» показывает прогресс и вывод в реальном времени.',
    'Ctrl+T переключает чек-лист задач в статус-зоне с индикаторами прогресса.',
    // --- права, разрешения и безопасность ---
    'Режим default (Manual) запрашивает разрешение при первом использовании каждого инструмента.',
    'Shift+Tab циклически переключает default → acceptEdits → plan в сессии.',
    'acceptEdits одобряет правки файлов и команды mkdir, touch, mv, cp, sed.',
    'В plan-режиме Claude не редактирует исходный код, только исследует.',
    'В auto-режиме классификатор проверяет действия до их выполнения.',
    'bypassPermissions отключает запросы разрешений и проверки безопасности.',
    'bypassPermissions предназначен только для изолированных сред: контейнеров и VM.',
    'Записи в защищённые пути (.git, .claude) не авто-одобряются, кроме bypassPermissions.',
    'Claude останавливается и просит одобрения перед правкой, bash или сетевым запросом.',
    'Bash-команды требуют одобрения, кроме встроенного набора read-only команд.',
    'Read-only команды (ls, cat, echo, grep, find) выполняются без запроса во всех режимах.',
    'На bash-запросе Ctrl+E показывает объяснение команды и уровень риска.',
    'Правила оцениваются по порядку: deny, затем ask, затем allow.',
    'deny-правило блокирует вызов, даже если совпадает более узкое allow-правило.',
    'Голое deny-правило с именем инструмента убирает его из контекста Claude.',
    'deny-правило с любого уровня нельзя переопределить allow-правилом.',
    'Allow-правила позволяют использовать инструмент без ручного одобрения.',
    'Bash(npm run build) — точная команда, Bash(npm *) — любой префикс.',
    "«Yes, don't ask again» для bash сохраняет правило в .claude/settings.local.json.",
    'Одобренная правка файла действует только до конца сессии.',
    'Проектные allow-правила применяются после принятия диалога доверия рабочей области.',
    'Песочница даёт ОС-уровневую изоляцию файловой системы и сети для Bash.',
    'Песочница применяется только к командам Bash и их дочерним процессам.',
    'По умолчанию в песочнице запись — только в рабочую директорию и временную папку.',
    'Песочница работает на macOS, Linux и WSL2; нативный Windows не поддерживается.',
    'CLAUDE.md — контекст, а не конфигурация; блокировки — через PreToolUse hook.',
    'Правила применяет Claude Code, а не модель; CLAUDE.md их не меняет.',
    '/permissions показывает все правила и settings.json, из которого они взяты.',
    'Для отзыва доступа используйте /permissions, правила, режимы или PreToolUse hook.',
    'Deny-правило предотвращает использование указанного инструмента.',
    // --- настройки и конфигурация ---
    'Пользовательские настройки в ~/.claude/settings.json применяются ко всем проектам.',
    'Проектные настройки в .claude/settings.json можно коммитить в репозиторий.',
    '.claude/settings.local.json хранит личные настройки, не попадающие в git.',
    'Приоритет настроек: managed, затем локальные, проектные, пользовательские.',
    'Команда /config с key=value меняет опцию напрямую, без интерфейса.',
    'Хук PreToolUse срабатывает до вызова инструмента и может его заблокировать.',
    'Код выхода 2 в PreToolUse блокирует вызов инструмента.',
    'Хук PostToolUse выполняется после успешного вызова инструмента.',
    'Хук Stop срабатывает при завершении ответа; код 2 не даёт остановиться.',
    'Хук SessionStart срабатывает при начале или возобновлении сессии.',
    'Переменная в оболочке действует для терминала, в settings.json — при каждом запуске.',
    'Одна переменная в оболочке и env settings.json: применяется значение из settings.',
    'ANTHROPIC_MODEL переопределяет настройку model.',
    'ANTHROPIC_API_KEY используется вместо входа по подписке.',
    'On/off-переменные: любое непустое значение включает, пустое — выключает.',
    'Команда /theme выбирает тему; вариант auto следует за фоном терминала.',
    'Свои темы — JSON в ~/.claude/themes/, имя файла — slug темы.',
    'Поиск содержимого уважает .gitignore по умолчанию.',
    'Чтение сгенерированного кода блокируется Read-правилами в permissions.deny.',
    'CLAUDE.md загружается в контекст в начале каждой сессии.',
    'CLAUDE.md ищется в рабочем каталоге и всех родительских.',
    'CLAUDE.md подкаталогов загружается по требованию при чтении файлов там.',
    'Флаг -p/--print печатает ответ без интерактивного режима.',
    '--output-format задаёт формат: text, json или stream-json.',
    '--allowedTools разрешает инструменты без запроса разрешения.',
    'Подсказку промпта принимают Tab или стрелка вправо.',
    '/doctor (псевдоним /checkup) диагностирует установку и конфигурацию.',
    'claude doctor печатает read-only диагностику без запуска сессии.',
    '--add-dir добавляет рабочие каталоги для чтения и правки файлов.',
    'Дополнительные каталоги дают файловый доступ, а не конфигурацию.',
    // --- git, MCP, навыки, субагенты, планы ---
    '/code-review проверяет diff в терминале без GitHub App',
    '/review — алиас для /code-review',
    '/code-review --fix применяет замечания к рабочему дереву',
    'Просто попросите «create a pr for my changes» — Claude создаст PR',
    'claude --from-pr 1234 находит сессию, связанную с вашим PR',
    '--worktree создаёт изолированный git worktree на отдельной ветке',
    '/mcp показывает статус серверов и запускает OAuth-авторизацию',
    'MCP-серверы дают Claude доступ к инструментам, базам данных и API',
    'claude mcp add --transport http <имя> <url> подключает удалённый сервер',
    'Области MCP: local (приватно), project (.mcp.json), user (все проекты)',
    'Серверы из .mcp.json требуют одобрения перед подключением',
    'claude mcp serve запускает Claude Code как MCP-сервер',
    'Файл SKILL.md добавляет навык в инструменты Claude',
    'Личные навыки — ~/.claude/skills/, проектные — .claude/skills/',
    'Тело навыка загружается только при использовании, в отличие от CLAUDE.md',
    'disable-model-invocation: true запрещает автоматический запуск навыка',
    'Строка !команда выполняет shell-команду до загрузки навыка',
    'Субагенты — Markdown-файлы с YAML frontmatter в .claude/agents/',
    'Каждый субагент работает в собственном контекстном окне',
    'Claude делегирует задачу субагенту по его полю description',
    'claude --agent <имя> запускает сессию в роли субагента',
    'Plan mode: Claude исследует и предлагает план без правок файлов',
    'Shift+Tab переключает режимы, включая plan mode',
    'claude --permission-mode plan запускает сессию в plan mode',
    'Auto mode выполняет действия без рутинных запросов разрешений',
    'Классификатор проверяет действия до их выполнения в auto mode',
    'Слоистые CLAUDE.md: корень — общие правила, подкаталоги — свои',
    'claudeMdExcludes исключает CLAUDE.md ненужных пакетов',
    'Для поиска бага укажите команду воспроизведения и стек-трейс',
    'Claude генерирует тесты по образцу существующих тестов проекта',
  ];

  const canvas = document.getElementById('sprite');
  const ctx = canvas.getContext('2d');
  const mascot = document.getElementById('mascot');
  const counterEl = document.getElementById('counter');

  function draw(grid) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const color = PALETTE[grid[y][x]];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
  draw(OPEN);

  // --- движение ---
  const IDLE_MS = 3000;
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let targetX = x;
  let targetY = y;
  let lastMove = 0;
  let idle = false;
  let floatTarget = null;

  // --- «привлечение внимания»: долго нет кликов — маскот сам подлетает к курсору ---
  const ATTENTION_AFTER_MS = 20000; // столько без кликов — начинаем звать
  const ATTENTION_EVERY_MS = 15000; // и повторяем раз в столько
  const WOBBLE_MS = 2600;           // сколько длится покачивание у курсора
  let lastClick = performance.now(); // когда был последний клик
  let nextAttention = null;          // когда следующее покачивание (null — ещё не начиналось)
  let wobbleStart = 0;               // когда началось текущее покачивание (0 — нет)

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

  addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    lastMove = performance.now();
    idle = false;
    floatTarget = null;
  });

  function randomTarget() {
    const w = mascot.offsetWidth;
    const h = mascot.offsetHeight;
    floatTarget = {
      x: w / 2 + Math.random() * Math.max(0, innerWidth - w),
      y: h / 2 + Math.random() * Math.max(0, innerHeight - h),
    };
  }

  function frame(now) {
    // --- «привлечение внимания»: управляется кликами, а не движением мыши ---
    const wobbling = wobbleStart > 0;

    if (wobbling) {
      if (now - wobbleStart > WOBBLE_MS) {
        wobbleStart = 0; // покачивание закончилось — обычное поведение
        idle = false;
        floatTarget = null;
      }
    } else if (now - lastClick > ATTENTION_AFTER_MS) {
      if (nextAttention === null) nextAttention = now;
      if (now >= nextAttention) {
        wobbleStart = now; // подлетаем к курсору и качаемся
        idle = false;
        floatTarget = null;
        nextAttention = now + ATTENTION_EVERY_MS;
      }
    }

    if (!wobbling) {
      if (!idle && now - lastMove > IDLE_MS) {
        idle = true;
        randomTarget();
      }

      if (idle) {
        if (!floatTarget || Math.hypot(floatTarget.x - x, floatTarget.y - y) < 10) {
          randomTarget();
        } else {
          targetX = floatTarget.x;
          targetY = floatTarget.y;
        }
      }
    }

    if (wobbling) {
      // летим к курсору; долетели — быстро качаемся вправо-влево
      const dx = targetX - x;
      const dy = targetY - y;
      if (Math.hypot(dx, dy) > 24) {
        x += dx * 0.14;
        y += dy * 0.14;
      } else {
        const t = now - wobbleStart;
        x = targetX + Math.sin(t / 70) * 18;
        y = targetY + Math.cos(t / 120) * 6;
      }
    } else {
      // плавное «догоняние»; в свободном плавании — в 3 раза медленнее
      const k = idle ? 0.04 : 0.12;
      x += (targetX - x) * k;
      y += (targetY - y) * k;
    }

    const halfW = mascot.offsetWidth / 2;
    const halfH = mascot.offsetHeight / 2;
    x = clamp(x, halfW, innerWidth - halfW);
    y = clamp(y, halfH, innerHeight - halfH);

    mascot.style.transform = `translate(${x - halfW}px, ${y - halfH}px)`;
    mascot.classList.toggle('idle', idle);
    mascot.classList.toggle('attention', wobbling);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // --- моргание ---
  setInterval(() => {
    draw(CLOSED);
    setTimeout(() => draw(OPEN), 160);
  }, 4200);

  // --- подсказки по клику ---
  const BUBBLE_SHOW_MS = 7000; // каждый пузырь живёт свои 7 секунд

  let tipsCount = 0;
  let tipDeck = []; // индексы подсказок в случайном порядке

  // берёт индекс подсказки из перетасованной колоды;
  // когда колода кончилась — перемешивает индексы заново (без повторов подряд)
  function nextTipIndex() {
    if (tipDeck.length === 0) {
      tipDeck = TIPS.map((_, i) => i);
      for (let i = tipDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tipDeck[i], tipDeck[j]] = [tipDeck[j], tipDeck[i]];
      }
    }
    return tipDeck.pop();
  }

  // создаёт независимый пузырь в точке клика; он не зависит от последующих кликов
  function showBubble(text, cx, cy) {
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = text;
    document.body.appendChild(b);

    // позиция в точке клика
    const w = b.offsetWidth;
    const h = b.offsetHeight;
    const left = Math.min(Math.max(cx, w / 2 + 8), innerWidth - w / 2 - 8);
    b.style.left = `${left}px`;

    const topAbove = cy - h - 16;
    b.style.top = `${topAbove < 8 ? cy + 16 : topAbove}px`;
    b.classList.toggle('below', topAbove < 8);

    // плавное появление
    requestAnimationFrame(() => b.classList.add('show'));

    // через 7 секунд — плавное исчезание и удаление
    setTimeout(() => {
      b.classList.remove('show');
      setTimeout(() => b.remove(), 220);
    }, BUBBLE_SHOW_MS);
  }

  addEventListener('click', (e) => {
    // клик отменяет «привлечение внимания»
    lastClick = performance.now();
    nextAttention = null;
    wobbleStart = 0;
    idle = false;

    tipsCount += 1;
    counterEl.textContent = `Подсказки: ${tipsCount}`;

    showBubble(TIPS[nextTipIndex()], e.clientX, e.clientY);
  });
})();
