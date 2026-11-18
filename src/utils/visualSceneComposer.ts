import type { VisualAspectRatio } from '../types/luxo.ts';

export type PromptSubjectKind =
  | 'cat'
  | 'dog'
  | 'bird'
  | 'horse'
  | 'car'
  | 'aircraft'
  | 'ship'
  | 'astronaut'
  | 'robot'
  | 'person'
  | 'castle'
  | 'bridge'
  | 'mountain'
  | 'forest'
  | 'flower'
  | 'coffee'
  | 'dragon'
  | 'city';

export type PromptEnvironmentKind =
  | 'bosphorus'
  | 'ocean'
  | 'space'
  | 'forest'
  | 'mountain'
  | 'desert'
  | 'cafe'
  | 'laboratory'
  | 'cybercity'
  | 'sunset_city';

export interface ParsedVisualScene {
  subject: PromptSubjectKind;
  secondarySubject?: PromptSubjectKind;
  environment: PromptEnvironmentKind;
  timeOfDay: 'golden_hour' | 'night' | 'day' | 'neon_night';
  weather: 'clear' | 'rain' | 'snow' | 'mist';
  primaryColor: string;
  secondaryColor: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  groundColor: string;
  subjectColor: string;
  subjectAccent: string;
  cleanTitle: string;
}


function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function detectExplicitColor(lower: string): string | null {
  if (/(kırmızı|al\s|kızıl|red|crimson|bordo)/u.test(lower)) return '#ef4444';
  if (/(turuncu|kehribar|orange|amber)/u.test(lower)) return '#f97316';
  if (/(altın|sarısı|sarı|gold|yellow)/u.test(lower)) return '#eab308';
  if (/(yeşil|zümrüt|green|emerald)/u.test(lower)) return '#10b981';
  if (/(mavi|turkuaz|camgöbeği|lacivert|blue|cyan|azure)/u.test(lower)) return '#0ea5e9';
  if (/(mor|eflatun|menekşe|purple|violet|magenta|pembe|pink)/u.test(lower)) return '#a855f7';
  if (/(beyaz|gümüş|kar\s|white|silver)/u.test(lower)) return '#f1f5f9';
  if (/(siyah|kara\s|mat siyah|black|obsidian)/u.test(lower)) return '#1e293b';
  if (/(kahverengi|tarçın|bakır|brown|bronze)/u.test(lower)) return '#b45309';
  return null;
}

export function parseVisualPrompt(prompt: string, style: string = 'Sinematik'): ParsedVisualScene {
  const clean = (prompt || 'Sinematik sahne').trim();
  const lower = `${clean} ${style}`.toLocaleLowerCase('tr-TR');

  const subjectMatchers: Array<[PromptSubjectKind, RegExp]> = [
    ['dragon', /(ejderha|dragon)/u],
    ['cat', /(kedi|yavru kedi|tekir|van kedisi|cat|kitten|aslan|kaplan|panter)/u],
    ['dog', /(köpek|yavru köpek|kurt|golden|husky|dog|puppy|wolf)/u],
    ['horse', /\b(at|küheylan|unicorn|pegasus|horse|stallion)\b/u],
    ['bird', /(kuş|kartal|şahin|martı|anka|baykuş|kelebek|bird|eagle|falcon|seagull|owl)/u],
    ['car', /(araba|otomobil|spor araba|yarış arabası|togg|tesla|ferrari|porsche|motosiklet|kamyon|otobüs|tren|car|supercar|vehicle)/u],
    ['aircraft', /(uçak|jet|helikopter|dron|drone|iha|uzay gemisi|roket|mekik|airplane|fighter|spaceship|rocket)/u],
    ['ship', /(vapur|gemi|yat|tekne|denizaltı|yelkenli|ship|boat|yacht|ferry)/u],
    ['astronaut', /(astronot|kozmonot|uzay yürüyüşü|astronaut|cosmonaut)/u],
    ['robot', /(robot|android|siborg|meka|yapay zeka robot|cyborg|mech|humanoid)/u],
    ['coffee', /(kahve|fincan|latte|espresso|çay bardağı|pasta|yemek|pizza|coffee|tea|cup)/u],
    ['flower', /(çiçek|gül|lale|orkide|kiraz çiçeği|sakura|buket|flower|rose|tulip|lotus)/u],
    ['castle', /(kale|şato|saray|cami|ayasofya|kule|galata|tapınak|antik|castle|palace|tower|mosque|temple)/u],
    ['bridge', /(boğaz|köprü|istanbul boğazı|bosphorus|bridge)/u],
    ['person', /(insan|kadın|erkek|çocuk|kız|portre|savaşçı|samuray|şövalye|dedektif|gezgin|portrait|woman|man|samurai|knight)/u],
    ['forest', /(orman|ağaç|şelale|vadi|göl|nehir|doğa|bahçe|forest|waterfall|jungle| woods)/u],
    ['mountain', /(dağ|zirve|everest|alpler|volkan|yanardağ|kanyon|mountain|peak|volcano)/u],
  ];

  const matchedSubjects: PromptSubjectKind[] = [];
  for (const [kind, rx] of subjectMatchers) {
    if (rx.test(lower)) {
      matchedSubjects.push(kind);
    }
  }

  let subject: PromptSubjectKind = matchedSubjects[0] || 'city';
  const secondarySubject = matchedSubjects[1];

  // Environment inference
  let environment: PromptEnvironmentKind = 'sunset_city';
  if (/(boğaz|istanbul|köprü|vapur|kız kulesi|galata|bosphorus)/u.test(lower)) {
    environment = 'bosphorus';
    if (matchedSubjects.length === 0) subject = 'bridge';
  } else if (/(uzay|galaksi|gezegen|mars|ay yüzeyi|yörünge|nebula|kara delik|evren|space|galaxy|cosmos|planet)/u.test(lower)) {
    environment = 'space';
    if (matchedSubjects.length === 0) subject = 'astronaut';
  } else if (/(okyanus|deniz|sahil|plaj|dalga|su altı|mercan|ada|ocean|sea|beach|underwater)/u.test(lower)) {
    environment = 'ocean';
    if (matchedSubjects.length === 0) subject = 'ship';
  } else if (/(orman|şelale|doğa|ağaç|vadi|bahçe|kamp|forest|jungle|nature|park)/u.test(lower)) {
    environment = 'forest';
    if (matchedSubjects.length === 0) subject = 'forest';
  } else if (/(dağ|zirve|alpler|karlı|yamaç|mountain|alps)/u.test(lower)) {
    environment = 'mountain';
    if (matchedSubjects.length === 0) subject = 'mountain';
  } else if (/(çöl|kumul|sahra|piramit|kanyon|desert|dune)/u.test(lower)) {
    environment = 'desert';
  } else if (/(kafe|masa|oda|pencere|ev\s|mutfak|kütüphane|iç mekan|cafe|room|window|table|studio)/u.test(lower)) {
    environment = 'cafe';
  } else if (/(laboratuvar|veri merkezi|sunucu|fabrika|bilim|kuantum|lab|datacenter)/u.test(lower)) {
    environment = 'laboratory';
  } else if (/(siberpunk|cyberpunk|neon|fütüristik|2077|gelecek|otonom şehir|metropol)/u.test(lower)) {
    environment = 'cybercity';
  }

  // Time of day
  let timeOfDay: ParsedVisualScene['timeOfDay'] = 'golden_hour';
  if (/(siberpunk|cyberpunk|neon)/u.test(lower)) {
    timeOfDay = 'neon_night';
  } else if (/(gece|ay ışığı|yıldızlı|karanlık|gecesi|midnight|night)/u.test(lower)) {
    timeOfDay = 'night';
  } else if (/(gündüz|güneşli|sabah|öğle|parlak gün|sunny|daylight|morning)/u.test(lower)) {
    timeOfDay = 'day';
  }

  // Weather
  let weather: ParsedVisualScene['weather'] = 'clear';
  if (/(yağmur|yağmurlu|ıslak|fırtına|rain|storm)/u.test(lower)) {
    weather = 'rain';
  } else if (/(kar|karlı|tipi|kış|buz|snow|winter)/u.test(lower)) {
    weather = 'snow';
  } else if (/(sis|sisli|puslu|bulutlu|fog|mist)/u.test(lower)) {
    weather = 'mist';
  }

  // Palette based on timeOfDay & environment
  let skyTop = '#0c192c';
  let skyMid = '#1e3a8a';
  let skyBottom = '#ea580c';
  let groundColor = '#0f172a';
  let primaryColor = '#f59e0b';
  let secondaryColor = '#38bdf8';

  if (environment === 'space') {
    skyTop = '#02040a';
    skyMid = '#0f172a';
    skyBottom = '#312e81';
    groundColor = '#1e1b4b';
    primaryColor = '#818cf8';
    secondaryColor = '#f472b6';
  } else if (timeOfDay === 'neon_night') {
    skyTop = '#070414';
    skyMid = '#2e1065';
    skyBottom = '#701a75';
    groundColor = '#090616';
    primaryColor = '#06b6d4';
    secondaryColor = '#f43f5e';
  } else if (timeOfDay === 'night') {
    skyTop = '#040914';
    skyMid = '#0f172a';
    skyBottom = '#1e293b';
    groundColor = '#090d16';
    primaryColor = '#38bdf8';
    secondaryColor = '#fbbf24';
  } else if (timeOfDay === 'day') {
    skyTop = '#0284c7';
    skyMid = '#38bdf8';
    skyBottom = '#bae6fd';
    groundColor = environment === 'forest' ? '#14532d' : environment === 'desert' ? '#d97706' : '#1e293b';
    primaryColor = '#fde047';
    secondaryColor = '#0ea5e9';
  } else {
    // Golden hour
    skyTop = '#0f172a';
    skyMid = '#7c2d12';
    skyBottom = '#f59e0b';
    groundColor = environment === 'forest' ? '#064e3b' : environment === 'ocean' || environment === 'bosphorus' ? '#082f49' : '#111827';
    primaryColor = '#fbbf24';
    secondaryColor = '#38bdf8';
  }

  if (style === 'Mimari Çizim') {
    skyTop = '#071324';
    skyMid = '#0d213d';
    skyBottom = '#153159';
    groundColor = '#09192f';
    primaryColor = '#64ffda';
    secondaryColor = '#93c5fd';
  } else if (style === 'Minimalist Vektör') {
    skyTop = '#18181b';
    skyMid = '#27272a';
    skyBottom = '#3f3f46';
    groundColor = '#09090b';
  }

  const explicitColor = detectExplicitColor(lower);
  const defaultSubjectColors: Record<PromptSubjectKind, [string, string]> = {
    cat: ['#f97316', '#fde68a'],
    dog: ['#d97706', '#fef3c7'],
    bird: ['#38bdf8', '#f8fafc'],
    horse: ['#92400e', '#fde68a'],
    car: ['#ef4444', '#38bdf8'],
    aircraft: ['#e2e8f0', '#38bdf8'],
    ship: ['#f8fafc', '#f59e0b'],
    astronaut: ['#f8fafc', '#38bdf8'],
    robot: ['#cbd5e1', '#06b6d4'],
    person: ['#f59e0b', '#e2e8f0'],
    castle: ['#cbd5e1', '#fbbf24'],
    bridge: ['#f59e0b', '#38bdf8'],
    mountain: ['#64748b', '#f8fafc'],
    forest: ['#10b981', '#fbbf24'],
    flower: ['#f43f5e', '#10b981'],
    coffee: ['#f8fafc', '#b45309'],
    dragon: ['#dc2626', '#fbbf24'],
    city: ['#38bdf8', '#f59e0b'],
  };

  const [defMain, defAcc] = defaultSubjectColors[subject];
  const subjectColor = explicitColor || defMain;
  const subjectAccent = defAcc;

  return {
    subject,
    secondarySubject,
    environment,
    timeOfDay,
    weather,
    primaryColor,
    secondaryColor,
    skyTop,
    skyMid,
    skyBottom,
    groundColor,
    subjectColor,
    subjectAccent,
    cleanTitle: clean.slice(0, 56),
  };
}

export function renderBackdropSvgLayer(
  scene: ParsedVisualScene,
  width: number,
  height: number
): string {
  const seed = hashSeed(`${scene.cleanTitle}-${width}x${height}`);
  const horizonY = Math.round(height * 0.64);
  const sunX = Math.round(width * (0.32 + ((seed % 36) / 100)));
  const sunY = Math.round(
    scene.timeOfDay === 'day' ? height * 0.24 : height * 0.42
  );
  const sunR = Math.round(Math.min(width, height) * 0.14);

  const stars =
    scene.timeOfDay === 'night' ||
    scene.timeOfDay === 'neon_night' ||
    scene.environment === 'space'
      ? Array.from({ length: 48 }, (_, i) => {
          const sx = ((seed + i * 173) % Math.max(40, width - 24)) + 12;
          const sy = ((seed + i * 97) % Math.max(30, Math.floor(horizonY * 0.9))) + 8;
          const sr = i % 5 === 0 ? 2.2 : 1.2;
          const op = (0.3 + (i % 5) * 0.14).toFixed(2);
          return `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="#ffffff" fill-opacity="${op}" />`;
        }).join('')
      : '';

  const clouds =
    scene.environment !== 'space'
      ? Array.from({ length: 4 }, (_, i) => {
          const cx = Math.round(width * (0.18 + i * 0.23));
          const cy = Math.round(height * (0.18 + (i % 2) * 0.08));
          const cw = Math.round(width * 0.22);
          const ch = Math.round(height * 0.045);
          return `<ellipse cx="${cx}" cy="${cy}" rx="${cw}" ry="${ch}" fill="#ffffff" fill-opacity="${
            scene.timeOfDay === 'day' ? '0.28' : '0.09'
          }" />`;
        }).join('')
      : '';

  const weatherFx =
    scene.weather === 'rain'
      ? Array.from({ length: 38 }, (_, i) => {
          const rx = ((i * 89 + seed) % width);
          const ry = ((i * 67 + seed) % height);
          return `<line x1="${rx}" y1="${ry}" x2="${rx - 10}" y2="${ry + 34}" stroke="#bae6fd" stroke-opacity="0.35" stroke-width="1.4" />`;
        }).join('')
      : scene.weather === 'snow'
      ? Array.from({ length: 36 }, (_, i) => {
          const sx = ((i * 83 + seed) % width);
          const sy = ((i * 59 + seed) % height);
          return `<circle cx="${sx}" cy="${sy}" r="${2 + (i % 3)}" fill="#ffffff" fill-opacity="0.72" />`;
        }).join('')
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${scene.skyTop}" />
        <stop offset="56%" stop-color="${scene.skyMid}" />
        <stop offset="100%" stop-color="${scene.skyBottom}" />
      </linearGradient>
      <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${scene.primaryColor}" stop-opacity="0.92" />
        <stop offset="42%" stop-color="${scene.primaryColor}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${scene.primaryColor}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#skyGrad)" />
    ${stars}
    <circle cx="${sunX}" cy="${sunY}" r="${sunR * 2.5}" fill="url(#orbGlow)" />
    <circle cx="${sunX}" cy="${sunY}" r="${sunR * 0.72}" fill="${
      scene.timeOfDay === 'night' ? '#f8fafc' : scene.primaryColor
    }" fill-opacity="0.88" />
    ${clouds}
    <path d="M 0 ${horizonY} Q ${Math.round(width * 0.26)} ${horizonY - Math.round(height * 0.11)} ${Math.round(width * 0.54)} ${horizonY - Math.round(height * 0.02)} T ${width} ${horizonY - Math.round(height * 0.06)} L ${width} ${height} L 0 ${height} Z" fill="${scene.groundColor}" fill-opacity="0.72" />
    ${weatherFx}
  </svg>`;
}

export function renderMidgroundSvgLayer(
  scene: ParsedVisualScene,
  width: number,
  height: number
): string {
  const horizonY = Math.round(height * 0.64);

  if (scene.environment === 'bosphorus') {
    const p1 = Math.round(width * 0.25);
    const p2 = Math.round(width * 0.75);
    const topY = Math.round(height * 0.25);
    const deckY = Math.round(height * 0.49);
    const cables = Array.from({ length: 17 }, (_, i) => {
      const t = (i + 1) / 18;
      const x = Math.round(p1 + (p2 - p1) * t);
      const sag = Math.sin(t * Math.PI);
      const cy = Math.round(topY + 14 + sag * (deckY - topY - 22));
      return `<line x1="${x}" y1="${cy}" x2="${x}" y2="${deckY}" stroke="${scene.primaryColor}" stroke-width="1.8" stroke-opacity="0.78" />`;
    }).join('');
    const ripples = Array.from({ length: 20 }, (_, i) => {
      const ry = horizonY + 10 + i * Math.max(8, Math.round((height - horizonY) / 22));
      const rw = Math.round(width * (0.16 + ((i * 7) % 25) / 100));
      const rx = Math.round(width * 0.5 - rw / 2 + Math.sin(i * 1.4) * (width * 0.16));
      return `<rect x="${rx}" y="${ry}" width="${rw}" height="3" rx="1.5" fill="${
        i % 2 === 0 ? scene.primaryColor : scene.secondaryColor
      }" fill-opacity="0.45" />`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <path d="M 0 ${horizonY} L ${Math.round(width * 0.18)} ${horizonY - 46} L ${Math.round(width * 0.38)} ${horizonY - 18} L ${Math.round(width * 0.65)} ${horizonY - 52} L ${width} ${horizonY - 12} L ${width} ${horizonY + 8} L 0 ${horizonY + 8} Z" fill="#0f172a" fill-opacity="0.85" />
      <rect y="${horizonY}" width="${width}" height="${height - horizonY}" fill="#061529" fill-opacity="0.92" />
      <rect x="${p1 - 9}" y="${topY}" width="18" height="${horizonY - topY + 12}" fill="#1e293b" stroke="${scene.primaryColor}" stroke-width="2" />
      <rect x="${p2 - 9}" y="${topY}" width="18" height="${horizonY - topY + 12}" fill="#1e293b" stroke="${scene.primaryColor}" stroke-width="2" />
      <path d="M 0 ${deckY - 8} Q ${Math.round(p1 * 0.5)} ${deckY - 10} ${p1} ${topY + 8} Q ${Math.round((p1 + p2) / 2)} ${deckY + 26} ${p2} ${topY + 8} Q ${Math.round((p2 + width) / 2)} ${deckY - 10} ${width} ${deckY - 8}" fill="none" stroke="${scene.primaryColor}" stroke-width="3.5" />
      ${cables}
      <rect x="0" y="${deckY}" width="${width}" height="7" fill="${scene.secondaryColor}" fill-opacity="0.9" />
      ${ripples}
    </svg>`;
  }

  if (scene.environment === 'ocean') {
    const waves = Array.from({ length: 8 }, (_, i) => {
      const y = Math.round(height * 0.56 + i * ((height * 0.44) / 8));
      const amp = 10 + i * 4;
      return `<path d="M 0 ${y} Q ${Math.round(width * 0.25)} ${y - amp} ${Math.round(width * 0.5)} ${y} T ${width} ${y} L ${width} ${height} L 0 ${height} Z" fill="${
        i % 2 === 0 ? '#072f49' : '#0c4a6e'
      }" fill-opacity="0.78" stroke="${scene.secondaryColor}" stroke-width="2" stroke-opacity="0.65" />`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${waves}</svg>`;
  }

  if (scene.environment === 'space') {
    const px = Math.round(width * 0.72);
    const py = Math.round(height * 0.34);
    const pr = Math.round(Math.min(width, height) * 0.16);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <ellipse cx="${px}" cy="${py}" rx="${pr * 2.1}" ry="${Math.round(pr * 0.48)}" transform="rotate(-18 ${px} ${py})" fill="none" stroke="${scene.primaryColor}" stroke-width="8" stroke-opacity="0.52" />
      <circle cx="${px}" cy="${py}" r="${pr}" fill="#1e1b4b" stroke="${scene.secondaryColor}" stroke-width="2.5" />
      <path d="M 0 ${Math.round(height * 0.78)} Q ${Math.round(width * 0.45)} ${Math.round(height * 0.68)} ${width} ${Math.round(height * 0.8)} L ${width} ${height} L 0 ${height} Z" fill="#1e293b" stroke="#475569" stroke-width="2" />
    </svg>`;
  }

  if (scene.environment === 'forest' || scene.environment === 'mountain') {
    const peaks = `<polygon points="0,${horizonY} ${Math.round(width * 0.22)},${Math.round(height * 0.3)} ${Math.round(width * 0.44)},${horizonY}" fill="#1e293b" />
      <polygon points="${Math.round(width * 0.18)},${Math.round(height * 0.36)} ${Math.round(width * 0.22)},${Math.round(height * 0.3)} ${Math.round(width * 0.26)},${Math.round(height * 0.36)}" fill="#f8fafc" fill-opacity="0.85" />
      <polygon points="${Math.round(width * 0.34)},${horizonY} ${Math.round(width * 0.62)},${Math.round(height * 0.24)} ${Math.round(width * 0.88)},${horizonY}" fill="#0f172a" />
      <polygon points="${Math.round(width * 0.56)},${Math.round(height * 0.33)} ${Math.round(width * 0.62)},${Math.round(height * 0.24)} ${Math.round(width * 0.68)},${Math.round(height * 0.33)}" fill="#f8fafc" fill-opacity="0.9" />`;
    const trees = Array.from({ length: 14 }, (_, i) => {
      const tx = Math.round((i + 0.5) * (width / 14));
      const th = 44 + ((i * 29) % 52);
      const ty = horizonY + 12 - th;
      return `<g>
        <rect x="${tx - 3}" y="${horizonY - 4}" width="6" height="18" fill="#451a03" />
        <polygon points="${tx},${ty} ${tx - 20},${horizonY} ${tx + 20},${horizonY}" fill="${
        i % 2 === 0 ? '#065f46' : '#047857'
      }" />
      </g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${peaks}
      <rect y="${horizonY}" width="${width}" height="${height - horizonY}" fill="#052e16" />
      ${trees}
    </svg>`;
  }

  if (scene.environment === 'cafe') {
    const tableY = Math.round(height * 0.7);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect x="${Math.round(width * 0.1)}" y="${Math.round(height * 0.12)}" width="${Math.round(width * 0.8)}" height="${Math.round(height * 0.56)}" rx="16" fill="none" stroke="#475569" stroke-width="8" />
      <line x1="${Math.round(width * 0.5)}" y1="${Math.round(height * 0.12)}" x2="${Math.round(width * 0.5)}" y2="${Math.round(height * 0.68)}" stroke="#475569" stroke-width="6" />
      <rect y="${tableY}" width="${width}" height="${height - tableY}" fill="#451a03" />
      <rect y="${tableY}" width="${width}" height="10" fill="#78350f" />
    </svg>`;
  }

  // Default: Cybercity / Sunset City / Roadway
  const buildings = Array.from({ length: 18 }, (_, i) => {
    const bw = Math.max(22, Math.round(width / 21));
    const bx = Math.round(i * (width / 18) + 8);
    const bh = 80 + ((i * 73) % Math.max(90, Math.round(height * 0.34)));
    const by = horizonY - bh;
    const winRows = Math.min(8, Math.floor(bh / 22));
    const wins = Array.from({ length: winRows }, (__, r) => {
      return `<rect x="${bx + 6}" y="${by + 10 + r * 20}" width="${Math.max(8, bw - 12)}" height="5" fill="${
        (i + r) % 3 === 0 ? scene.secondaryColor : scene.primaryColor
      }" fill-opacity="0.65" />`;
    }).join('');
    return `<g><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#0f172a" stroke="${scene.primaryColor}" stroke-opacity="0.38" stroke-width="1.2" />${wins}</g>`;
  }).join('');

  const roadLines = Array.from({ length: 7 }, (_, i) => {
    const lx = Math.round(i * (width / 6));
    return `<rect x="${lx}" y="${Math.round(horizonY + (height - horizonY) * 0.48)}" width="${Math.round(width / 14)}" height="6" rx="3" fill="${scene.primaryColor}" fill-opacity="0.75" />`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${buildings}
    <rect y="${horizonY}" width="${width}" height="${height - horizonY}" fill="#0b0f19" />
    <line x1="0" y1="${horizonY}" x2="${width}" y2="${horizonY}" stroke="${scene.secondaryColor}" stroke-width="3" stroke-opacity="0.8" />
    ${roadLines}
  </svg>`;
}

export function renderHeroSubjectSvgContent(
  subject: PromptSubjectKind,
  mainColor: string,
  accentColor: string
): string {
  // Drawn inside a standardized 400x300 viewBox centered around (200, 165)
  switch (subject) {
    case 'cat':
      return `<g>
        <ellipse cx="200" cy="248" rx="95" ry="16" fill="#000000" fill-opacity="0.38" />
        <!-- Tail -->
        <path d="M 255 225 C 318 220, 330 155, 295 142 C 280 138, 276 156, 290 164 C 304 172, 294 205, 250 210 Z" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <!-- Body -->
        <ellipse cx="205" cy="202" rx="56" ry="46" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <ellipse cx="198" cy="208" rx="32" ry="30" fill="${accentColor}" fill-opacity="0.85" />
        <!-- Front Paws -->
        <ellipse cx="176" cy="242" rx="16" ry="10" fill="${accentColor}" stroke="#0f172a" stroke-width="2.5" />
        <ellipse cx="222" cy="242" rx="16" ry="10" fill="${accentColor}" stroke="#0f172a" stroke-width="2.5" />
        <!-- Ears -->
        <polygon points="154,126 144,74 186,104" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <polygon points="158,120 151,86 179,106" fill="#fda4af" />
        <polygon points="246,126 256,74 214,104" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <polygon points="242,120 249,86 221,106" fill="#fda4af" />
        <!-- Head -->
        <circle cx="200" cy="134" r="46" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <!-- Forehead Tabby Stripes -->
        <path d="M 190 96 L 194 112 M 200 93 L 200 112 M 210 96 L 206 112" stroke="#7c2d12" stroke-width="3.5" stroke-linecap="round" />
        <!-- Eyes -->
        <ellipse cx="181" cy="132" rx="10" ry="11" fill="#10b981" stroke="#0f172a" stroke-width="2" />
        <ellipse cx="181" cy="132" rx="4" ry="8" fill="#090d16" />
        <circle cx="178" cy="128" r="2.8" fill="#ffffff" />
        <ellipse cx="219" cy="132" rx="10" ry="11" fill="#10b981" stroke="#0f172a" stroke-width="2" />
        <ellipse cx="219" cy="132" rx="4" ry="8" fill="#090d16" />
        <circle cx="216" cy="128" r="2.8" fill="#ffffff" />
        <!-- Nose & Mouth -->
        <polygon points="195,146 205,146 200,153" fill="#fb7185" />
        <path d="M 200 153 Q 191 162 183 156 M 200 153 Q 209 162 217 156" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" />
        <!-- Whiskers -->
        <path d="M 162 145 L 124 138 M 162 151 L 122 152 M 238 145 L 276 138 M 238 151 L 278 152" stroke="#f8fafc" stroke-width="2" stroke-linecap="round" />
      </g>`;

    case 'dog':
      return `<g>
        <ellipse cx="200" cy="248" rx="98" ry="16" fill="#000000" fill-opacity="0.38" />
        <path d="M 255 198 Q 308 175 296 142" fill="none" stroke="${mainColor}" stroke-width="14" stroke-linecap="round" />
        <ellipse cx="206" cy="202" rx="60" ry="44" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <ellipse cx="192" cy="208" rx="34" ry="28" fill="${accentColor}" />
        <rect x="164" y="218" width="18" height="32" rx="8" fill="${mainColor}" stroke="#0f172a" stroke-width="2.5" />
        <rect x="224" y="218" width="18" height="32" rx="8" fill="${mainColor}" stroke="#0f172a" stroke-width="2.5" />
        <!-- Floppy Ears -->
        <ellipse cx="152" cy="134" rx="18" ry="34" transform="rotate(18 152 134)" fill="#78350f" stroke="#0f172a" stroke-width="2.5" />
        <ellipse cx="238" cy="134" rx="18" ry="34" transform="rotate(-18 238 134)" fill="#78350f" stroke="#0f172a" stroke-width="2.5" />
        <circle cx="195" cy="128" r="44" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <ellipse cx="195" cy="144" rx="24" ry="18" fill="${accentColor}" />
        <circle cx="178" cy="120" r="7" fill="#0f172a" />
        <circle cx="176" cy="118" r="2.5" fill="#ffffff" />
        <circle cx="212" cy="120" r="7" fill="#0f172a" />
        <circle cx="210" cy="118" r="2.5" fill="#ffffff" />
        <ellipse cx="195" cy="138" rx="9" ry="6.5" fill="#0f172a" />
        <path d="M 189 152 Q 195 164 201 152" fill="#fb7185" stroke="#0f172a" stroke-width="2" />
      </g>`;

    case 'car':
      return `<g>
        <ellipse cx="200" cy="236" rx="158" ry="18" fill="#000000" fill-opacity="0.52" />
        <!-- Aerodynamic Sports Car Body -->
        <path d="M 46 204 L 62 168 L 128 156 L 178 122 L 274 122 L 328 158 L 362 174 L 356 208 L 46 208 Z" fill="${mainColor}" stroke="#0f172a" stroke-width="3.5" stroke-linejoin="round" />
        <!-- Cabin Glass -->
        <polygon points="138,156 182,128 266,128 312,156" fill="#0f172a" stroke="${accentColor}" stroke-width="2" />
        <line x1="224" y1="128" x2="218" y2="156" stroke="${accentColor}" stroke-width="2.5" />
        <!-- Headlight & Taillight Glow -->
        <polygon points="340,168 360,175 356,186 336,182" fill="#fef08a" />
        <polygon points="358,176 398,164 398,198 356,186" fill="#fef08a" fill-opacity="0.28" />
        <rect x="46" y="172" width="14" height="10" rx="3" fill="#f43f5e" />
        <!-- Side Accent Line -->
        <path d="M 88 184 L 316 184" stroke="${accentColor}" stroke-width="3" stroke-linecap="round" />
        <!-- Wheels -->
        <circle cx="116" cy="208" r="28" fill="#090d16" stroke="#475569" stroke-width="5" />
        <circle cx="116" cy="208" r="14" fill="#cbd5e1" />
        <circle cx="294" cy="208" r="28" fill="#090d16" stroke="#475569" stroke-width="5" />
        <circle cx="294" cy="208" r="14" fill="#cbd5e1" />
      </g>`;

    case 'aircraft':
      return `<g>
        <!-- Thruster Trail -->
        <polygon points="18,160 112,148 112,172" fill="${accentColor}" fill-opacity="0.78" />
        <polygon points="48,160 112,153 112,167" fill="#fef08a" />
        <!-- Sleek Jet / Drone / Spacecraft -->
        <polygon points="108,148 258,136 364,160 258,184 108,172" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <polygon points="168,144 126,96 164,96 228,140" fill="${mainColor}" stroke="${accentColor}" stroke-width="2.5" />
        <polygon points="168,176 126,224 164,224 228,180" fill="${mainColor}" stroke="${accentColor}" stroke-width="2.5" />
        <ellipse cx="278" cy="156" rx="34" ry="11" fill="#0ea5e9" stroke="#ffffff" stroke-width="2" />
      </g>`;

    case 'ship':
      return `<g>
        <ellipse cx="200" cy="236" rx="148" ry="14" fill="#38bdf8" fill-opacity="0.32" />
        <rect x="112" y="138" width="166" height="44" rx="8" fill="#f8fafc" stroke="#0f172a" stroke-width="3" />
        <rect x="144" y="108" width="96" height="32" rx="6" fill="#e2e8f0" stroke="#0f172a" stroke-width="2.5" />
        <rect x="178" y="80" width="24" height="30" fill="${accentColor}" stroke="#0f172a" stroke-width="2.5" />
        ${Array.from({ length: 6 }, (_, i) => `<rect x="${126 + i * 24}" y="150" width="14" height="12" rx="2" fill="#fbbf24" />`).join('')}
        <polygon points="68,180 338,180 306,226 94,226" fill="#0f172a" stroke="${accentColor}" stroke-width="3" />
      </g>`;

    case 'astronaut':
      return `<g>
        <rect x="150" y="118" width="100" height="106" rx="20" fill="#cbd5e1" stroke="#0f172a" stroke-width="3" />
        <rect x="160" y="132" width="80" height="98" rx="24" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <rect x="176" y="156" width="48" height="30" rx="6" fill="#1e293b" stroke="${accentColor}" stroke-width="2" />
        <circle cx="190" cy="171" r="5" fill="#10b981" />
        <circle cx="210" cy="171" r="5" fill="#f43f5e" />
        <circle cx="200" cy="96" r="44" fill="${mainColor}" stroke="#0f172a" stroke-width="3.5" />
        <ellipse cx="200" cy="96" rx="34" ry="26" fill="#0f172a" stroke="#fbbf24" stroke-width="3" />
        <ellipse cx="188" cy="88" rx="12" ry="7" fill="#38bdf8" fill-opacity="0.55" />
        <rect x="128" y="142" width="28" height="62" rx="14" transform="rotate(18 142 173)" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <rect x="244" y="132" width="28" height="62" rx="14" transform="rotate(-28 258 163)" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
      </g>`;

    case 'robot':
      return `<g>
        <line x1="200" y1="44" x2="200" y2="70" stroke="${accentColor}" stroke-width="4" />
        <circle cx="200" cy="40" r="8" fill="${accentColor}" />
        <rect x="148" y="70" width="104" height="76" rx="22" fill="${mainColor}" stroke="#0f172a" stroke-width="3.5" />
        <rect x="162" y="88" width="76" height="36" rx="12" fill="#090d16" />
        <circle cx="182" cy="106" r="9" fill="${accentColor}" />
        <circle cx="218" cy="106" r="9" fill="${accentColor}" />
        <rect x="152" y="154" width="96" height="86" rx="20" fill="${mainColor}" stroke="#0f172a" stroke-width="3.5" />
        <circle cx="200" cy="196" r="18" fill="#090d16" stroke="${accentColor}" stroke-width="3" />
        <circle cx="200" cy="196" r="8" fill="${accentColor}" />
        <rect x="122" y="160" width="24" height="64" rx="12" fill="#94a3b8" stroke="#0f172a" stroke-width="3" />
        <rect x="254" y="160" width="24" height="64" rx="12" fill="#94a3b8" stroke="#0f172a" stroke-width="3" />
      </g>`;

    case 'bird':
      return `<g>
        <path d="M 200 156 Q 118 74 44 114 Q 114 148 176 168 Z" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <path d="M 200 156 Q 282 74 356 114 Q 286 148 224 168 Z" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <ellipse cx="200" cy="164" rx="36" ry="22" fill="${accentColor}" stroke="#0f172a" stroke-width="3" />
        <circle cx="232" cy="154" r="16" fill="${mainColor}" stroke="#0f172a" stroke-width="2.5" />
        <polygon points="246,150 268,156 246,162" fill="#f59e0b" />
        <circle cx="236" cy="151" r="3.5" fill="#090d16" />
      </g>`;

    case 'horse':
      return `<g>
        <ellipse cx="200" cy="248" rx="96" ry="14" fill="#000000" fill-opacity="0.38" />
        <path d="M 122 182 Q 82 196 92 232" fill="none" stroke="#451a03" stroke-width="12" stroke-linecap="round" />
        <ellipse cx="188" cy="184" rx="64" ry="34" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <path d="M 226 172 L 258 104 L 292 116 L 284 136 L 262 132 L 246 184 Z" fill="${mainColor}" stroke="#0f172a" stroke-width="3" stroke-linejoin="round" />
        <polygon points="256,104 264,84 272,108" fill="${mainColor}" stroke="#0f172a" stroke-width="2.5" />
        <rect x="142" y="206" width="12" height="44" rx="5" fill="${mainColor}" stroke="#0f172a" stroke-width="2.5" />
        <rect x="166" y="208" width="12" height="42" rx="5" fill="${mainColor}" stroke="#0f172a" stroke-width="2.5" />
        <rect x="216" y="206" width="12" height="44" rx="5" fill="${mainColor}" stroke="#0f172a" stroke-width="2.5" />
        <rect x="238" y="208" width="12" height="42" rx="5" fill="${mainColor}" stroke="#0f172a" stroke-width="2.5" />
        <circle cx="268" cy="116" r="3.5" fill="#0f172a" />
      </g>`;

    case 'dragon':
      return `<g>
        <path d="M 190 158 L 68 68 L 112 146 L 56 172 L 166 182 Z" fill="${mainColor}" fill-opacity="0.9" stroke="#0f172a" stroke-width="3" />
        <path d="M 210 158 L 332 68 L 288 146 L 344 172 L 234 182 Z" fill="${mainColor}" fill-opacity="0.9" stroke="#0f172a" stroke-width="3" />
        <ellipse cx="200" cy="182" rx="42" ry="34" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <path d="M 200 152 L 228 96 L 274 106 L 244 128 L 222 162 Z" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <polygon points="274,108 358,92 342,136" fill="${accentColor}" fill-opacity="0.82" />
      </g>`;

    case 'flower':
      return `<g>
        <path d="M 200 154 L 200 258" stroke="#10b981" stroke-width="10" stroke-linecap="round" />
        <ellipse cx="172" cy="212" rx="26" ry="12" transform="rotate(-28 172 212)" fill="#10b981" />
        <ellipse cx="228" cy="198" rx="26" ry="12" transform="rotate(28 228 198)" fill="#10b981" />
        ${Array.from({ length: 8 }, (_, i) => {
          const ang = i * 45;
          return `<ellipse cx="200" cy="96" rx="22" ry="42" transform="rotate(${ang} 200 132)" fill="${mainColor}" stroke="#ffffff" stroke-opacity="0.4" stroke-width="2" />`;
        }).join('')}
        <circle cx="200" cy="132" r="22" fill="#fbbf24" stroke="#b45309" stroke-width="3" />
      </g>`;

    case 'coffee':
      return `<g>
        <ellipse cx="200" cy="242" rx="92" ry="16" fill="#cbd5e1" stroke="#64748b" stroke-width="3" />
        <path d="M 252 162 C 292 162, 292 212, 248 212" fill="none" stroke="${mainColor}" stroke-width="12" stroke-linecap="round" />
        <path d="M 142 146 L 258 146 L 244 232 C 240 242, 160 242, 156 232 Z" fill="${mainColor}" stroke="#475569" stroke-width="3" />
        <ellipse cx="200" cy="146" rx="58" ry="14" fill="#78350f" stroke="${mainColor}" stroke-width="4" />
        <path d="M 178 122 Q 168 96 182 76 M 202 118 Q 192 88 208 68 M 224 122 Q 214 96 228 76" fill="none" stroke="#f8fafc" stroke-opacity="0.7" stroke-width="4" stroke-linecap="round" />
      </g>`;

    case 'castle':
      return `<g>
        <rect x="116" y="134" width="168" height="114" fill="${mainColor}" stroke="#0f172a" stroke-width="3" />
        <rect x="96" y="98" width="44" height="150" fill="#94a3b8" stroke="#0f172a" stroke-width="3" />
        <polygon points="90,98 118,54 146,98" fill="${accentColor}" stroke="#0f172a" stroke-width="3" />
        <rect x="260" y="98" width="44" height="150" fill="#94a3b8" stroke="#0f172a" stroke-width="3" />
        <polygon points="254,98 282,54 310,98" fill="${accentColor}" stroke="#0f172a" stroke-width="3" />
        <rect x="172" y="74" width="56" height="174" fill="#e2e8f0" stroke="#0f172a" stroke-width="3" />
        <polygon points="164,74 200,26 236,74" fill="${accentColor}" stroke="#0f172a" stroke-width="3" />
        <path d="M 178 248 L 178 196 Q 200 174 222 196 L 222 248 Z" fill="#451a03" />
      </g>`;

    case 'person':
      return `<g>
        <path d="M 134 256 C 138 186, 262 186, 266 256 Z" fill="#1e293b" stroke="${mainColor}" stroke-width="3" />
        <circle cx="200" cy="126" r="42" fill="#fed7aa" stroke="#0f172a" stroke-width="3" />
        <path d="M 156 122 C 156 72, 244 72, 244 122 C 232 98, 168 98, 156 122 Z" fill="#0f172a" />
        <circle cx="184" cy="126" r="4.5" fill="#0f172a" />
        <circle cx="216" cy="126" r="4.5" fill="#0f172a" />
        <path d="M 188 144 Q 200 154 212 144" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" />
      </g>`;

    case 'bridge':
    case 'mountain':
    case 'forest':
    case 'city':
    default:
      // Sleek illuminated drone / cruiser light silhouette for scenic shots
      return `<g>
        <ellipse cx="200" cy="158" rx="68" ry="14" fill="${mainColor}" fill-opacity="0.24" />
        <polygon points="142,158 214,144 268,158 214,172" fill="#f8fafc" stroke="${mainColor}" stroke-width="3" />
        <circle cx="268" cy="158" r="7" fill="${accentColor}" />
        <line x1="64" y1="158" x2="142" y2="158" stroke="${mainColor}" stroke-width="4" stroke-opacity="0.78" stroke-linecap="round" />
      </g>`;
  }
}

export function renderHeroSubjectSvgLayer(
  scene: ParsedVisualScene,
  width = 400,
  height = 300
): string {
  const inner = renderHeroSubjectSvgContent(
    scene.subject,
    scene.subjectColor,
    scene.subjectAccent
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 400 300">${inner}</svg>`;
}

export function getDimensionsForRatio(
  aspectRatio: VisualAspectRatio = '1:1'
): { w: number; h: number } {
  const dims: Record<VisualAspectRatio, [number, number]> = {
    '1:1': [800, 800],
    '16:9': [960, 540],
    '9:16': [540, 960],
    '3:4': [720, 960],
    '4:3': [960, 720],
    '4:1': [1200, 300],
    '1:4': [300, 1200],
    '8:1': [1280, 160],
    '1:8': [160, 1280],
  };
  const [w, h] = dims[aspectRatio] || [800, 800];
  return { w, h };
}

export function renderPromptAwareSvgArtwork(
  prompt: string,
  style: string = 'Sinematik',
  aspectRatio: VisualAspectRatio = '1:1'
): string {
  const { w: width, h: height } = getDimensionsForRatio(aspectRatio);
  const scene = parseVisualPrompt(prompt, style);

  const backdropRaw = renderBackdropSvgLayer(scene, width, height)
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');
  const midgroundRaw = renderMidgroundSvgLayer(scene, width, height)
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');

  const isScenicOnly =
    scene.subject === 'bridge' ||
    scene.subject === 'mountain' ||
    scene.subject === 'forest' ||
    scene.subject === 'city';

  const heroScale = Math.min(width / 520, height / 420) * (isScenicOnly ? 0.65 : 1.08);
  const heroTx = Math.round(width * 0.5 - 200 * heroScale);
  const heroTy = Math.round(
    height * (isScenicOnly ? 0.36 : 0.62) - 165 * heroScale
  );

  const heroGroup = `<g transform="translate(${heroTx}, ${heroTy}) scale(${heroScale.toFixed(3)})">
    ${renderHeroSubjectSvgContent(scene.subject, scene.subjectColor, scene.subjectAccent)}
  </g>`;

  const secondaryGroup = scene.secondarySubject
    ? `<g transform="translate(${Math.round(width * 0.22 - 120 * heroScale)}, ${Math.round(
        height * 0.64 - 140 * heroScale
      )}) scale(${(heroScale * 0.68).toFixed(3)})">
        ${renderHeroSubjectSvgContent(
          scene.secondarySubject,
          scene.secondaryColor,
          scene.primaryColor
        )}
      </g>`
    : '';

  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${backdropRaw}
    ${midgroundRaw}
    ${secondaryGroup}
    ${heroGroup}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
}
