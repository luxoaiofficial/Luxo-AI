import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  Code,
  Copy,
  Download,
  FileCode2,
  GitBranch,
  GitCompareArrows,
  Laptop,
  Mic,
  MicOff,
  Monitor,
  Play,
  RefreshCw,
  RotateCcw,
  Scale,
  Send,
  Smartphone,
  Tablet,
  Terminal,
  Trash2,
  Users,
  Sparkles,
  X,
} from 'lucide-react';
import { CodeSnapshot, LuxoModelId } from '../types/luxo';
import { computeSideBySideDiff } from '../utils/codeDiffEngine';
import {
  CollabParticipant,
  CollabSharedCode,
  CollabSurface,
} from '../utils/collabState';
import { LUXO_MODELS } from '../utils/luxoLogic';
import { LuxoLogo } from './LuxoLogo';
import { SocialShareButton } from './SocialShareBar';

interface ArgonCodeStudioProps {
  onBack: () => void;
  initialCode?: string;
  initialLang?: string;
  onSendCodeToChat: (prompt: string) => void;
  sharedCode?: CollabSharedCode;
  participants?: CollabParticipant[];
  isCollabConnected?: boolean;
  onUpdateSharedCode?: (delta: {
    mode?: 'web' | 'js-console';
    html?: string;
    css?: string;
    js?: string;
  }) => void;
  onUpdatePresence?: (partial: {
    activeSurface?: CollabSurface;
    activeTab?: 'html' | 'css' | 'js';
    isTyping?: boolean;
  }) => void;
  onOpenCollabPanel?: () => void;
}

interface OpenSourceTemplate {
  id: string;
  title: string;
  mode: 'web' | 'js-console';
  html: string;
  css: string;
  js: string;
}

const MIT_LICENSE_TEXT = `MIT License (Açık Kaynak Lisansı)

Copyright (c) 2026 Luxo AI — Argon Open-Source Code Studio Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.`;

const OPEN_SOURCE_TEMPLATES: OpenSourceTemplate[] = [
  {
    id: 'fin-dashboard',
    title: 'Canlı Telemetri Kartı',
    mode: 'web',
    html: `<div class="card">
  <div class="header">
    <div>
      <div class="badge">AÇIK KAYNAK · MIT</div>
      <div class="title">Luxo-Argon Çıkarım Kümesi</div>
      <div class="sub">Gerçek Zamanlı Verim & Bellek Telemetrisi</div>
    </div>
    <button id="refreshBtn">Veriyi Yenile</button>
  </div>
  <div id="val" class="metric">14,820 tok/sn</div>
  <div id="bars" class="bars"></div>
</div>`,
    css: `body {
  margin: 0;
  padding: 24px;
  font-family: system-ui, -apple-system, sans-serif;
  background: #090d16;
  color: #f8fafc;
}
.card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 18px;
  padding: 20px;
  max-width: 520px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}
.badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  color: #34d399;
  background: rgba(16, 185, 129, 0.14);
  padding: 3px 8px;
  border-radius: 99px;
  margin-bottom: 6px;
}
.title { font-size: 16px; font-weight: 700; }
.sub { font-size: 12px; color: #94a3b8; }
.metric {
  font-family: monospace;
  font-size: 28px;
  font-weight: 800;
  color: #10b981;
  margin: 8px 0;
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 110px;
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid #1f2937;
}
.bar {
  flex: 1;
  background: linear-gradient(180deg, #38bdf8, #2563eb);
  border-radius: 6px 6px 0 0;
  transition: height 0.25s ease;
}
button {
  background: #10b981;
  color: #052e16;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
}`,
    js: `function randomize() {
  const container = document.getElementById('bars');
  container.innerHTML = '';
  let total = 0;
  for (let i = 0; i < 12; i++) {
    const h = 25 + Math.floor(Math.random() * 80);
    total += h * 18;
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = h + 'px';
    container.appendChild(bar);
  }
  const formatted = total.toLocaleString('tr-TR') + ' tok/sn';
  document.getElementById('val').textContent = formatted;
  console.log('Telemetri güncellendi ->', formatted);
}

document.getElementById('refreshBtn').addEventListener('click', randomize);
randomize();`,
  },
  {
    id: 'particle-canvas',
    title: 'Sinir Ağı Simülasyonu',
    mode: 'web',
    html: `<div class="hud">Luxo-Argon Sinir Ağı · MIT Açık Kaynak</div>
<canvas id="c"></canvas>`,
    css: `body {
  margin: 0;
  background: #070b14;
  color: #fff;
  font-family: system-ui, sans-serif;
  overflow: hidden;
}
canvas { display: block; width: 100vw; height: 100vh; }
.hud {
  position: fixed;
  top: 14px;
  left: 16px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 12px;
}`,
    js: `const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const nodes = Array.from({ length: 26 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  vx: (Math.random() - 0.5) * 1.4,
  vy: (Math.random() - 0.5) * 1.4,
}));

function step() {
  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    a.x += a.vx;
    a.y += a.vy;
    if (a.x < 0 || a.x > canvas.width) a.vx *= -1;
    if (a.y < 0 || a.y > canvas.height) a.vy *= -1;
    ctx.beginPath();
    ctx.arc(a.x, a.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 130) {
        ctx.strokeStyle = 'rgba(59, 130, 246, ' + (1 - d / 130) * 0.5 + ')';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(step);
}
console.log('Sinir ağı simülasyonu başlatıldı (26 düğüm).');
step();`,
  },
  {
    id: 'kanban-board',
    title: 'Açık Kaynak Görev Panosu',
    mode: 'web',
    html: `<div class="board">
  <h3>Argon Çevik Görev Panosu</h3>
  <form id="taskForm" class="row">
    <input id="taskInput" placeholder="Yeni açık kaynak görev ekle..." required />
    <button type="submit">Ekle</button>
  </form>
  <ul id="list"></ul>
</div>`,
    css: `body { margin: 0; padding: 22px; background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }
.board { max-width: 480px; margin: 0 auto; background: #1e293b; padding: 18px; border-radius: 16px; border: 1px solid #334155; }
h3 { margin: 0 0 12px; font-size: 16px; }
.row { display: flex; gap: 8px; margin-bottom: 14px; }
input { flex: 1; padding: 9px 12px; border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: #fff; font-size: 13px; }
button { padding: 9px 14px; border-radius: 10px; border: none; background: #3b82f6; color: #fff; font-weight: 700; cursor: pointer; }
ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
li { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 10px; background: #0f172a; font-size: 13px; }
.done { text-decoration: line-through; color: #64748b; }`,
    js: `const items = [
  { text: 'MIT lisans dosyasını doğrula', done: true },
  { text: 'REST API önbellek katmanını test et', done: false },
];

function render() {
  const ul = document.getElementById('list');
  ul.innerHTML = '';
  items.forEach((it, idx) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    if (it.done) span.className = 'done';
    span.textContent = it.text;
    li.appendChild(span);
    const btn = document.createElement('button');
    btn.textContent = it.done ? 'Geri Al' : 'Tamamla';
    btn.style.background = it.done ? '#475569' : '#10b981';
    btn.onclick = () => {
      it.done = !it.done;
      console.log('Görev durumu değişti:', it.text, it.done);
      render();
    };
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

document.getElementById('taskForm').onsubmit = (e) => {
  e.preventDefault();
  const inp = document.getElementById('taskInput');
  if (!inp.value.trim()) return;
  items.unshift({ text: inp.value.trim(), done: false });
  console.log('Yeni görev eklendi:', inp.value.trim());
  inp.value = '';
  render();
};

render();`,
  },
  {
    id: 'pomodoro-focus',
    title: 'Odak & Pomodoro Sayacı',
    mode: 'web',
    html: `<div class="timer-box">
  <div class="label">LUXO ARGON ODAK SAYACI</div>
  <div id="clock" class="clock">25:00</div>
  <div class="actions">
    <button id="toggleBtn">Başlat</button>
    <button id="resetBtn" class="secondary">Sıfırla</button>
  </div>
</div>`,
    css: `body { margin: 0; height: 100vh; display: grid; place-items: center; background: #09090b; color: #fafafa; font-family: system-ui, sans-serif; }
.timer-box { text-align: center; padding: 28px 36px; border-radius: 24px; background: #18181b; border: 1px solid #27272a; }
.label { font-size: 11px; letter-spacing: 0.12em; color: #a1a1aa; font-weight: 700; }
.clock { font-size: 54px; font-weight: 800; font-family: monospace; margin: 14px 0 20px; color: #34d399; }
.actions { display: flex; gap: 10px; justify-content: center; }
button { padding: 10px 20px; border-radius: 99px; border: none; background: #10b981; color: #052e16; font-weight: 700; cursor: pointer; }
button.secondary { background: #27272a; color: #e4e4e7; }`,
    js: `let seconds = 25 * 60;
let timer = null;

function updateDisplay() {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  document.getElementById('clock').textContent = m + ':' + s;
}

document.getElementById('toggleBtn').onclick = (e) => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    e.target.textContent = 'Devam Et';
    console.log('Sayaç duraklatıldı.');
  } else {
    timer = setInterval(() => {
      if (seconds > 0) seconds--;
      updateDisplay();
    }, 1000);
    e.target.textContent = 'Duraklat';
    console.log('Odak sayacı başlatıldı.');
  }
};

document.getElementById('resetBtn').onclick = () => {
  clearInterval(timer);
  timer = null;
  seconds = 25 * 60;
  document.getElementById('toggleBtn').textContent = 'Başlat';
  updateDisplay();
  console.log('Sayaç sıfırlandı.');
};`,
  },
  {
    id: 'algo-bench',
    title: 'Algoritma & LRU Önbellek (JS)',
    mode: 'js-console',
    html: '',
    css: '',
    js: `// Luxo-Argon Açık Kaynak (MIT) LRU Önbellek & Benchmark Motoru
class OpenSourceLRUCache {
  constructor(capacity = 3) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return null;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
}

const cache = new OpenSourceLRUCache(3);
cache.put('model_flash', { gecikmeMs: 14 });
cache.put('model_argon', { gecikmeMs: 21 });
cache.put('model_ultra', { gecikmeMs: 38 });
cache.get('model_flash'); // flash en güncel konuma taşınır
cache.put('model_dev', { gecikmeMs: 19 }); // argon düşer

console.log('Aktif LRU Anahtarları:', Array.from(cache.map.keys()));
console.log('model_flash Değeri:', JSON.stringify(cache.get('model_flash')));`,
  },
];

function buildCombinedHtml(
  htmlPart: string,
  cssPart: string,
  jsPart: string,
  includeBridge = true
): string {
  const bridgeScript = includeBridge
    ? `<script>
(function() {
  const send = (level, args) => {
    try {
      const text = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      window.parent.postMessage({ source: 'luxo-argon-sandbox', level, text }, '*');
    } catch (_) {}
  };
  const origLog = console.log;
  const origWarn = console.warn;
  const origErr = console.error;
  console.log = function() { send('INFO', arguments); origLog.apply(console, arguments); };
  console.warn = function() { send('UYARI', arguments); origWarn.apply(console, arguments); };
  console.error = function() { send('HATA', arguments); origErr.apply(console, arguments); };
  window.addEventListener('error', function(e) {
    send('HATA', [e.message]);
  });
})();
</script>`
    : '';

  if (htmlPart.trim().toLowerCase().startsWith('<!doctype') || htmlPart.trim().toLowerCase().startsWith('<html')) {
    if (!cssPart.trim() && !jsPart.trim()) {
      return includeBridge
        ? htmlPart.replace('<head>', `<head>${bridgeScript}`)
        : htmlPart;
    }
  }

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
${bridgeScript}
<style>
${cssPart}
</style>
</head>
<body>
${htmlPart}
<script>
${jsPart}
</script>
</body>
</html>`;
}

export const ArgonCodeStudio: React.FC<ArgonCodeStudioProps> = ({
  onBack,
  initialCode,
  initialLang,
  onSendCodeToChat,
  sharedCode,
  participants = [],
  isCollabConnected = false,
  onUpdateSharedCode,
  onUpdatePresence,
  onOpenCollabPanel,
}) => {
  const initialIsJsOnly =
    initialCode &&
    (initialLang === 'javascript' ||
      initialLang === 'typescript' ||
      initialLang === 'js') &&
    !initialCode.trim().startsWith('<');

  const [studioMode, setStudioMode] = useState<'web' | 'js-console'>(
    initialIsJsOnly
      ? 'js-console'
      : sharedCode && !initialCode
      ? sharedCode.mode
      : 'web'
  );
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');

  const [htmlCode, setHtmlCode] = useState<string>(
    initialCode && !initialIsJsOnly
      ? initialCode
      : sharedCode && !initialCode
      ? sharedCode.html
      : OPEN_SOURCE_TEMPLATES[0].html
  );
  const [cssCode, setCssCode] = useState<string>(
    initialCode && !initialIsJsOnly
      ? ''
      : sharedCode && !initialCode
      ? sharedCode.css
      : OPEN_SOURCE_TEMPLATES[0].css
  );
  const [jsCode, setJsCode] = useState<string>(
    initialIsJsOnly
      ? initialCode || ''
      : initialCode
      ? ''
      : sharedCode && !initialCode
      ? sharedCode.js
      : OPEN_SOURCE_TEMPLATES[0].js
  );

  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  );
  const [autoRun, setAutoRun] = useState(true);
  const [showOpenSourceModal, setShowOpenSourceModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [codeModelId, setCodeModelId] =
    useState<LuxoModelId>('gemini-4-argon');
  const [isGenerating, setIsGenerating] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[INFO] Açık Kaynak Argon Kod Stüdyosu (MIT) · Canlı Ortak Kod & Gemini 4 Argon hazır.',
  ]);
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [licenseCopied, setLicenseCopied] = useState(false);

  // Voice-to-Code Microphone state
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [refineExistingCode, setRefineExistingCode] = useState(true);
  const recognitionRef = useRef<{ stop?: () => void } | null>(null);

  // Version Snapshots & Side-by-Side Diff Viewer state
  const [snapshots, setSnapshots] = useState<CodeSnapshot[]>(() => {
    const now = Date.now();
    const startHtml =
      initialCode && !initialIsJsOnly
        ? initialCode
        : sharedCode && !initialCode
        ? sharedCode.html
        : OPEN_SOURCE_TEMPLATES[0].html;
    const startCss =
      initialCode && !initialIsJsOnly
        ? ''
        : sharedCode && !initialCode
        ? sharedCode.css
        : OPEN_SOURCE_TEMPLATES[0].css;
    const startJs =
      initialIsJsOnly
        ? initialCode || ''
        : initialCode
        ? ''
        : sharedCode && !initialCode
        ? sharedCode.js
        : OPEN_SOURCE_TEMPLATES[0].js;

    return [
      {
        id: 'snap-v1-init',
        label: 'v1 · Başlangıç Sürümü',
        mode: initialIsJsOnly ? 'js-console' : 'web',
        html: startHtml,
        css: startCss,
        js: startJs,
        createdAt: now - 120_000,
        source: 'template',
      },
      {
        id: 'snap-v0-minimal',
        label: 'v0 · Yalın Referans Taslak',
        mode: initialIsJsOnly ? 'js-console' : 'web',
        html: OPEN_SOURCE_TEMPLATES[0].html.replace(
          'Canlı Telemetri',
          'Temel Telemetri'
        ),
        css: OPEN_SOURCE_TEMPLATES[0].css,
        js: OPEN_SOURCE_TEMPLATES[0].js,
        createdAt: now - 300_000,
        source: 'template',
      },
    ];
  });
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [diffLeftId, setDiffLeftId] = useState<string>('snap-v1-init');
  const [diffRightId, setDiffRightId] = useState<string>('__current__');
  const [diffTargetFile, setDiffTargetFile] = useState<'html' | 'css' | 'js'>(
    initialIsJsOnly ? 'js' : 'html'
  );

  const lastAppliedVersionRef = useRef<number>(sharedCode?.version || 0);
  const isRemoteUpdateRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onUpdatePresence?.({ activeSurface: 'code', activeTab });
  }, [activeTab, onUpdatePresence]);

  useEffect(() => {
    if (!sharedCode) return;
    if (sharedCode.version <= lastAppliedVersionRef.current) return;
    lastAppliedVersionRef.current = sharedCode.version;
    isRemoteUpdateRef.current = true;
    setStudioMode(sharedCode.mode);
    setHtmlCode(sharedCode.html);
    setCssCode(sharedCode.css);
    setJsCode(sharedCode.js);
    isRemoteUpdateRef.current = false;
  }, [sharedCode]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      recognitionRef.current?.stop?.();
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'luxo-argon-sandbox') {
        const stamp = new Date().toLocaleTimeString('tr-TR');
        setConsoleLogs((prev) => [
          ...prev.slice(-30),
          `[${stamp}] [${event.data.level}] ${event.data.text}`,
        ]);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const combinedPreviewDoc = useMemo(
    () => buildCombinedHtml(htmlCode, cssCode, jsCode, true),
    [htmlCode, cssCode, jsCode]
  );

  const activeEditorValue =
    studioMode === 'js-console'
      ? jsCode
      : activeTab === 'html'
      ? htmlCode
      : activeTab === 'css'
      ? cssCode
      : jsCode;

  const emitCodeDelta = (delta: {
    mode?: 'web' | 'js-console';
    html?: string;
    css?: string;
    js?: string;
  }) => {
    if (isRemoteUpdateRef.current) return;
    onUpdateSharedCode?.(delta);
    onUpdatePresence?.({ activeSurface: 'code', activeTab, isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onUpdatePresence?.({ activeSurface: 'code', activeTab, isTyping: false });
    }, 1100);
  };

  const setActiveEditorValue = (val: string) => {
    if (studioMode === 'js-console') {
      setJsCode(val);
      emitCodeDelta({ mode: 'js-console', js: val });
    } else if (activeTab === 'html') {
      setHtmlCode(val);
      emitCodeDelta({ html: val });
    } else if (activeTab === 'css') {
      setCssCode(val);
      emitCodeDelta({ css: val });
    } else {
      setJsCode(val);
      emitCodeDelta({ js: val });
    }
  };

  const handleRunCode = () => {
    if (studioMode === 'web') {
      setPreviewKey((k) => k + 1);
      setConsoleLogs((prev) => [
        ...prev.slice(-30),
        `[${new Date().toLocaleTimeString('tr-TR')}] [INFO] Canlı açık kaynak önizleme derlendi.`,
      ]);
      return;
    }

    const captured: string[] = [];
    const customConsole = {
      log: (...args: unknown[]) =>
        captured.push(
          '[INFO] ' +
            args
              .map((a) =>
                typeof a === 'object' ? JSON.stringify(a) : String(a)
              )
              .join(' ')
        ),
      error: (...args: unknown[]) =>
        captured.push('[HATA] ' + args.map(String).join(' ')),
      warn: (...args: unknown[]) =>
        captured.push('[UYARI] ' + args.map(String).join(' ')),
    };

    try {
      const cleanJs = jsCode
        .replace(/export\s+interface\s+[\s\S]*?\}/g, '')
        .replace(/export\s+/g, '')
        .replace(/\b(public|private|protected)\s+/g, '');
      const runner = new Function('console', cleanJs);
      runner(customConsole);
      setConsoleLogs(
        captured.length > 0
          ? captured
          : ['[INFO] Kod başarıyla çalıştırıldı (Çıktı üretilmedi).']
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setConsoleLogs([`[HATA] Çalışma Zamanı Hatası: ${msg}`]);
    }
  };

  const handleFormatCode = () => {
    const cleaned = activeEditorValue
      .split('\n')
      .map((line) => line.replace(/\s+$/g, ''))
      .join('\n')
      .trim();
    setActiveEditorValue(cleaned + '\n');
    setConsoleLogs((prev) => [
      ...prev.slice(-30),
      `[${new Date().toLocaleTimeString('tr-TR')}] [INFO] Aktif sekme kodu biçimlendirildi.`,
    ]);
  };

  const saveSnapshot = (
    label: string,
    source: CodeSnapshot['source'],
    override?: { mode: 'web' | 'js-console'; html: string; css: string; js: string }
  ) => {
    const snap: CodeSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      mode: override?.mode ?? studioMode,
      html: override?.html ?? htmlCode,
      css: override?.css ?? cssCode,
      js: override?.js ?? jsCode,
      createdAt: Date.now(),
      source,
    };
    setSnapshots((prev) => [snap, ...prev].slice(0, 12));
    return snap;
  };

  const handleSaveManualSnapshot = () => {
    const idx = snapshots.length + 1;
    const snap = saveSnapshot(`v${idx} · Kaydedilen Anlık Sürüm`, 'manual');
    setDiffLeftId(snap.id);
    setDiffRightId('__current__');
    setConsoleLogs((prev) => [
      ...prev.slice(-30),
      `[${new Date().toLocaleTimeString('tr-TR')}] [INFO] "${snap.label}" kaydedildi (Yan Yana Diff hazır).`,
    ]);
  };

  const handleToggleVoiceToCode = async () => {
    if (isListeningVoice) {
      recognitionRef.current?.stop?.();
      setIsListeningVoice(false);
      setVoiceFeedback('Ses kaydı durduruldu.');
      return;
    }

    setVoiceFeedback(null);
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      setVoiceFeedback(
        'Mikrofon izni reddedildi veya cihazda mikrofon bulunamadı.'
      );
      return;
    }

    const SpeechRec =
      (
        window as unknown as {
          SpeechRecognition?: unknown;
          webkitSpeechRecognition?: unknown;
        }
      ).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceFeedback(
        'Mikrofon izni hazır; tarayıcı konuşma-metin motoru desteklenmiyor. Talimatınızı yazabilirsiniz.'
      );
      return;
    }

    try {
      const rec = new (SpeechRec as new () => {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        onstart: () => void;
        onresult: (e: {
          results: { [key: number]: { transcript: string }; length: number }[];
        }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      })();
      rec.lang = 'tr-TR';
      rec.interimResults = true;
      rec.continuous = false;
      recognitionRef.current = rec;

      const basePrompt = aiPrompt.trim();
      rec.onstart = () => {
        setIsListeningVoice(true);
        setVoiceFeedback('Dinleniyor... Kodu nasıl düzenleyeceğinizi söyleyin.');
      };
      rec.onresult = (ev) => {
        let spoken = '';
        for (let i = 0; i < ev.results.length; i++) {
          spoken += ev.results[i][0]?.transcript || '';
        }
        const combined = basePrompt
          ? `${basePrompt} ${spoken.trim()}`
          : spoken.trim();
        setAiPrompt(combined);
      };
      rec.onend = () => {
        setIsListeningVoice(false);
        setVoiceFeedback('Sesli komut metne aktarıldı; Üret/Uygula ile koda işleyebilirsiniz.');
      };
      rec.onerror = () => {
        setIsListeningVoice(false);
        setVoiceFeedback('Ses net algılanamadı; lütfen tekrar deneyin veya yazın.');
      };
      rec.start();
    } catch {
      setIsListeningVoice(false);
      setVoiceFeedback('Sesli komut başlatılamadı.');
    }
  };

  const handleAiGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    const promptText = aiPrompt.trim();
    setAiPrompt('');
    setVoiceFeedback(null);

    const beforeSnapshot = saveSnapshot(
      `v${snapshots.length + 1} · AI Öncesi`,
      'manual'
    );

    try {
      const contextInstruction = refineExistingCode
        ? `Açık kaynaklı (MIT) Argon Kod Stüdyosundaki MEVCUT kodu aşağıdaki talimata göre düzenle, refactor et veya geliştir. Yalnızca güncellenmiş tam çalışabilir kodu tek bir \`\`\`${
            studioMode === 'web' ? 'html' : 'javascript'
          }\`\`\` bloğu içinde döndür.\n\nTalimat: ${promptText}\n\nMevcut ${
            studioMode === 'web' ? 'HTML' : 'JS'
          } Kodu:\n\`\`\`${studioMode === 'web' ? 'html' : 'javascript'}\n${
            studioMode === 'web' ? htmlCode : jsCode
          }\n\`\`\``
        : `Açık kaynaklı (MIT) Argon Kod Stüdyosu için şu özelliği içeren tek dosya çalışabilir HTML/CSS/JS kodu üret: ${promptText}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: contextInstruction }],
          modelId: codeModelId,
          synthesisMode: 'uzman-mimari',
          stream: false,
        }),
      });
      const data = await res.json();
      const match = /```(?:html|javascript|typescript|js)?\n([\s\S]*?)```/.exec(
        data.text || ''
      );
      const engineName = LUXO_MODELS[codeModelId]?.name || codeModelId;
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted.startsWith('<')) {
          setStudioMode('web');
          setActiveTab('html');
          setHtmlCode(extracted);
          emitCodeDelta({ mode: 'web', html: extracted, css: cssCode, js: jsCode });
          saveSnapshot(`v${snapshots.length + 2} · ${engineName}`, 'ai-generated', {
            mode: 'web',
            html: extracted,
            css: cssCode,
            js: jsCode,
          });
        } else {
          setStudioMode('js-console');
          setJsCode(extracted);
          emitCodeDelta({ mode: 'js-console', js: extracted });
          saveSnapshot(`v${snapshots.length + 2} · ${engineName}`, 'ai-generated', {
            mode: 'js-console',
            html: htmlCode,
            css: cssCode,
            js: extracted,
          });
        }
        setDiffLeftId(beforeSnapshot.id);
        setDiffRightId('__current__');
        setPreviewKey((k) => k + 1);
        setConsoleLogs((prev) => [
          ...prev,
          `[INFO] ${engineName} "${promptText}" için kodu güncelledi.`,
        ]);
      } else {
        setConsoleLogs((prev) => [
          ...prev,
          `[INFO] ${engineName} önerisi hazırlandı.`,
        ]);
      }
    } catch {
      setConsoleLogs((prev) => [
        ...prev,
        `[UYARI] Bağlantı gecikmesi — mevcut açık kaynak şablon korundu.`,
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const resolveSnapshotField = (
    snapId: string,
    field: 'html' | 'css' | 'js'
  ): string => {
    if (snapId === '__current__') {
      if (studioMode === 'js-console') return jsCode;
      return field === 'html' ? htmlCode : field === 'css' ? cssCode : jsCode;
    }
    const found = snapshots.find((s) => s.id === snapId);
    if (!found) return '';
    return field === 'html' ? found.html : field === 'css' ? found.css : found.js;
  };

  const effectiveDiffField: 'html' | 'css' | 'js' =
    studioMode === 'js-console' ? 'js' : diffTargetFile;

  const diffResult = useMemo(() => {
    const leftSrc = resolveSnapshotField(diffLeftId, effectiveDiffField);
    const rightSrc = resolveSnapshotField(diffRightId, effectiveDiffField);
    return computeSideBySideDiff(leftSrc, rightSrc);
  }, [diffLeftId, diffRightId, effectiveDiffField, htmlCode, cssCode, jsCode, snapshots, studioMode]);

  const handleRestoreLeftSnapshot = () => {
    const target = snapshots.find((s) => s.id === diffLeftId);
    if (!target) return;
    setStudioMode(target.mode);
    setHtmlCode(target.html);
    setCssCode(target.css);
    setJsCode(target.js);
    emitCodeDelta({
      mode: target.mode,
      html: target.html,
      css: target.css,
      js: target.js,
    });
    setPreviewKey((k) => k + 1);
    setShowDiffViewer(false);
    setConsoleLogs((prev) => [
      ...prev.slice(-30),
      `[${new Date().toLocaleTimeString('tr-TR')}] [INFO] "${target.label}" sürümüne geri dönüldü.`,
    ]);
  };

  const exportFullSource =
    studioMode === 'web'
      ? `<!--\n${MIT_LICENSE_TEXT}\n-->\n` +
        buildCombinedHtml(htmlCode, cssCode, jsCode, false)
      : `/*\n${MIT_LICENSE_TEXT}\n*/\n\n${jsCode}`;

  const handleCopyCode = () => {
    try {
      navigator.clipboard?.writeText(exportFullSource);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadOpenSourceBundle = () => {
    const ext = studioMode === 'web' ? 'html' : 'js';
    const uri = `data:text/plain;charset=utf-8,${encodeURIComponent(
      exportFullSource
    )}`;
    const a = document.createElement('a');
    a.href = uri;
    a.download = `argon_acik_kaynak_mit.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadJsonRepoManifest = () => {
    const repoBundle = {
      name: 'luxo-argon-open-source-project',
      version: '3.0.0',
      license: 'MIT',
      files: {
        'index.html': htmlCode,
        'style.css': cssCode,
        'app.js': jsCode,
        'LICENSE.md': MIT_LICENSE_TEXT,
      },
    };
    const uri = `data:application/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(repoBundle, null, 2)
    )}`;
    const a = document.createElement('a');
    a.href = uri;
    a.download = 'argon_open_source_repo.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 select-none overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-[#18181b] border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer shrink-0"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <LuxoLogo className="w-4 h-4 text-white" size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight whitespace-nowrap">
                  Argon Kod Stüdyosu
                </h2>
                <button
                  type="button"
                  onClick={() => setShowOpenSourceModal(true)}
                  className="px-2 py-0.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                >
                  <GitBranch className="w-3 h-3" />
                  <span>Açık Kaynak · MIT</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {onOpenCollabPanel && (
            <button
              type="button"
              onClick={onOpenCollabPanel}
              aria-label="Canlı Ortak Kod"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCollabConnected
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Canlı Ortak Kod</span>
              <span className="font-mono text-[11px] tabular-nums">
                ({Math.max(1, participants.length)})
              </span>
            </button>
          )}
          <SocialShareButton
            payload={{
              title: 'Argon Açık Kaynak Kod Stüdyosu Projesi (MIT)',
              excerpt:
                studioMode === 'web'
                  ? `Canlı HTML/CSS/JS açık kaynak web uygulaması — ${htmlCode
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim()
                      .slice(0, 120)}`
                  : `Açık kaynak JavaScript algoritması — ${jsCode
                      .replace(/\s+/g, ' ')
                      .trim()
                      .slice(0, 120)}`,
              contentType: 'code',
              badge: 'ARGON AÇIK KAYNAK · MIT',
            }}
            label="Paylaş"
          />
          <button
            type="button"
            onClick={handleRunCode}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Çalıştır</span>
          </button>
          <button
            type="button"
            onClick={() =>
              onSendCodeToChat(
                `Aşağıdaki açık kaynak Argon Kod Stüdyosu projesini incele ve mimari olarak geliştir:\n\`\`\`${
                  studioMode === 'web' ? 'html' : 'javascript'
                }\n${exportFullSource}\n\`\`\``
              )
            }
            className="px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
          >
            Sohbete Aktar
          </button>
        </div>
      </header>

      <div className="flex items-center gap-1.5 px-4 py-2 bg-neutral-50 dark:bg-[#16161a] border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto shrink-0">
        <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mr-1 shrink-0">
          Açık Kaynak Şablonlar:
        </span>
        {OPEN_SOURCE_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => {
              setStudioMode(tpl.mode);
              setHtmlCode(tpl.html);
              setCssCode(tpl.css);
              setJsCode(tpl.js);
              setActiveTab(tpl.mode === 'js-console' ? 'js' : 'html');
              emitCodeDelta({
                mode: tpl.mode,
                html: tpl.html,
                css: tpl.css,
                js: tpl.js,
              });
              setPreviewKey((k) => k + 1);
              setConsoleLogs([
                `[${new Date().toLocaleTimeString('tr-TR')}] [INFO] "${
                  tpl.title
                }" açık kaynak şablonu yüklendi.`,
              ]);
            }}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            {tpl.title}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
        <div className="flex flex-col min-h-0 bg-[#141417] text-neutral-100">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#1c1c21] border-b border-neutral-800 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setStudioMode('web');
                    setActiveTab('html');
                  }}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                    studioMode === 'web'
                      ? 'bg-emerald-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Web (HTML/CSS/JS)
                </button>
                <button
                  type="button"
                  onClick={() => setStudioMode('js-console')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                    studioMode === 'js-console'
                      ? 'bg-emerald-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  JS Motoru
                </button>
              </div>

              {studioMode === 'web' && (
                <div className="flex items-center gap-1 ml-1">
                  {(
                    [
                      { id: 'html', label: 'index.html' },
                      { id: 'css', label: 'style.css' },
                      { id: 'js', label: 'app.js' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 py-1 rounded-md font-mono text-[11px] cursor-pointer transition ${
                        activeTab === tab.id
                          ? 'bg-neutral-700 text-emerald-300 font-bold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <button
                type="button"
                data-testid="argon-save-snapshot-btn"
                onClick={handleSaveManualSnapshot}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 cursor-pointer"
                title="Mevcut kodun anlık sürümünü kaydet"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Sürüm Kaydet</span>
              </button>
              <button
                type="button"
                data-testid="argon-toggle-diff-btn"
                onClick={() => setShowDiffViewer((v) => !v)}
                className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition ${
                  showDiffViewer
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
                title="İki kod sürümünü yan yana karşılaştır"
              >
                <GitCompareArrows className="w-3.5 h-3.5" />
                <span>{showDiffViewer ? 'Editöre Dön' : 'Yan Yana Diff'}</span>
              </button>
              <button
                type="button"
                onClick={handleFormatCode}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 cursor-pointer"
                title="Kodu Biçimlendir"
              >
                <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Biçimlendir</span>
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>MIT Kopyala</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadOpenSourceBundle}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                aria-label="Açık Kaynak Paketi İndir"
                title="MIT Lisanslı Dosyayı İndir"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showDiffViewer ? (
            <div
              data-testid="argon-diff-viewer"
              className="flex-1 flex flex-col min-h-0 bg-[#111216] text-neutral-100"
            >
              <div className="px-3 py-2 bg-[#1a1b21] border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={diffLeftId}
                    onChange={(e) => setDiffLeftId(e.target.value)}
                    aria-label="Sol Sürüm (Referans)"
                    className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 focus:outline-hidden cursor-pointer max-w-[170px]"
                  >
                    <option value="__current__">Mevcut Editör Kodu</option>
                    {snapshots.map((snap) => (
                      <option key={snap.id} value={snap.id}>
                        {snap.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-neutral-500 font-bold">vs</span>
                  <select
                    value={diffRightId}
                    onChange={(e) => setDiffRightId(e.target.value)}
                    aria-label="Sağ Sürüm (Karşılaştırılan)"
                    className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-emerald-300 focus:outline-hidden cursor-pointer max-w-[170px]"
                  >
                    <option value="__current__">Mevcut Editör Kodu</option>
                    {snapshots.map((snap) => (
                      <option key={snap.id} value={snap.id}>
                        {snap.label}
                      </option>
                    ))}
                  </select>

                  {studioMode === 'web' && (
                    <div className="flex items-center bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
                      {(['html', 'css', 'js'] as const).map((ext) => (
                        <button
                          key={ext}
                          type="button"
                          onClick={() => setDiffTargetFile(ext)}
                          className={`px-2 py-0.5 rounded-md uppercase font-bold cursor-pointer transition ${
                            effectiveDiffField === ext
                              ? 'bg-indigo-600 text-white'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          {ext}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="text-emerald-400">
                      +{diffResult.summary.addedCount} eklendi
                    </span>
                    <span className="text-amber-400">
                      ~{diffResult.summary.modifiedCount} değişti
                    </span>
                    <span className="text-rose-400">
                      -{diffResult.summary.removedCount} silindi
                    </span>
                  </div>
                  {diffLeftId !== '__current__' && (
                    <button
                      type="button"
                      data-testid="argon-restore-snapshot-btn"
                      onClick={handleRestoreLeftSnapshot}
                      className="px-2 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/35 border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Sol Sürümü Geri Yükle</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-5 divide-y divide-neutral-900">
                {diffResult.rows.map((row) => (
                  <div
                    key={row.rowIndex}
                    className="grid grid-cols-2 divide-x divide-neutral-800"
                  >
                    <div
                      className={`px-2.5 py-0.5 flex gap-2 whitespace-pre-wrap break-all ${
                        row.kind === 'removed'
                          ? 'bg-rose-950/45 text-rose-200'
                          : row.kind === 'modified'
                          ? 'bg-amber-950/35 text-amber-200'
                          : 'text-neutral-400'
                      }`}
                    >
                      <span className="w-7 text-right text-neutral-600 select-none shrink-0 tabular-nums">
                        {row.leftLineNumber ?? ''}
                      </span>
                      <span className="flex-1">{row.leftText || ' '}</span>
                    </div>
                    <div
                      className={`px-2.5 py-0.5 flex gap-2 whitespace-pre-wrap break-all ${
                        row.kind === 'added'
                          ? 'bg-emerald-950/45 text-emerald-200'
                          : row.kind === 'modified'
                          ? 'bg-amber-950/35 text-amber-100'
                          : 'text-neutral-300'
                      }`}
                    >
                      <span className="w-7 text-right text-neutral-600 select-none shrink-0 tabular-nums">
                        {row.rightLineNumber ?? ''}
                      </span>
                      <span className="flex-1">{row.rightText || ' '}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <textarea
              value={activeEditorValue}
              onChange={(e) => setActiveEditorValue(e.target.value)}
              spellCheck={false}
              aria-label="Kod Editörü"
              className="flex-1 w-full p-4 bg-[#141417] text-neutral-100 font-mono text-xs leading-relaxed focus:outline-hidden resize-none overflow-y-auto"
            />
          )}

          {voiceFeedback && (
            <div
              data-testid="argon-voice-feedback"
              className="px-3 py-1.5 bg-indigo-950/70 border-t border-indigo-800/50 text-[11px] text-indigo-200 flex items-center justify-between gap-2"
            >
              <span>{voiceFeedback}</span>
              <button
                type="button"
                onClick={() => setVoiceFeedback(null)}
                className="text-indigo-300 hover:text-white cursor-pointer"
                aria-label="Ses bildirimini kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={handleAiGenerateCode}
            className="p-3 bg-[#1c1c21] border-t border-neutral-800 flex flex-wrap sm:flex-nowrap items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 hidden sm:block" />
            <select
              value={codeModelId}
              onChange={(e) => setCodeModelId(e.target.value as LuxoModelId)}
              aria-label="Kod Üretim Motoru"
              className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-[11px] font-semibold text-emerald-300 focus:outline-hidden cursor-pointer shrink-0"
            >
              <option value="gemini-4-argon">Gemini 4 Argon</option>
              <option value="gemini-4-hydrogen">Gemini 4 Hydrogen</option>
              <option value="claude-4-sonnet">Claude 4 Sonnet</option>
              <option value="chatgpt-5-omni">ChatGPT-5o Omni</option>
              <option value="deepseek-r2">DeepSeek R2</option>
              <option value="qwen-3-max">Qwen 3 Max Coder</option>
              <option value="luxo-argon">Luxo-Argon</option>
            </select>
            <button
              type="button"
              onClick={() => setRefineExistingCode((v) => !v)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer shrink-0 transition ${
                refineExistingCode
                  ? 'bg-emerald-950/60 border-emerald-700/70 text-emerald-300'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400'
              }`}
              title="Aktif kodu sıfırdan yazmak yerine yerinde düzenle / refactor et"
            >
              {refineExistingCode ? 'Mevcut Kodu Düzenle' : 'Sıfırdan Üret'}
            </button>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Sesli veya yazılı komutla bileşen üret / refactor et..."
              className="flex-1 bg-transparent text-xs text-white placeholder:text-neutral-400 focus:outline-hidden min-w-[140px]"
            />
            <button
              type="button"
              data-testid="argon-voice-mic-btn"
              onClick={handleToggleVoiceToCode}
              className={`p-2 rounded-lg border transition cursor-pointer shrink-0 ${
                isListeningVoice
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
              }`}
              aria-label={isListeningVoice ? 'Sesli Komutu Durdur' : 'Mikrofon ile Kod Düzenle'}
              title="Mikrofon ile konuşarak kodu düzenle / refactor et"
            >
              {isListeningVoice ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-sky-400" />
              )}
            </button>
            <button
              type="submit"
              disabled={!aiPrompt.trim() || isGenerating}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-3 h-3" />
              <span>{isGenerating ? 'Üretiliyor...' : 'Üret'}</span>
            </button>
          </form>
        </div>

        <div className="flex flex-col min-h-0 bg-white dark:bg-[#18181b]">
          <div className="flex items-center justify-between gap-2 px-4 py-2 bg-neutral-100 dark:bg-[#202123] border-b border-neutral-200 dark:border-neutral-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {studioMode === 'web'
                  ? 'Canlı Sandbox Önizleme'
                  : 'Argon V8 Konsol Çıktısı'}
              </span>

              {studioMode === 'web' && (
                <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setViewportMode('desktop')}
                    className={`p-1 rounded cursor-pointer ${
                      viewportMode === 'desktop'
                        ? 'bg-emerald-600 text-white'
                        : 'text-neutral-500'
                    }`}
                    aria-label="Masaüstü Görünüm"
                    title="Masaüstü"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode('tablet')}
                    className={`p-1 rounded cursor-pointer ${
                      viewportMode === 'tablet'
                        ? 'bg-emerald-600 text-white'
                        : 'text-neutral-500'
                    }`}
                    aria-label="Tablet Görünüm"
                    title="Tablet"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode('mobile')}
                    className={`p-1 rounded cursor-pointer ${
                      viewportMode === 'mobile'
                        ? 'bg-emerald-600 text-white'
                        : 'text-neutral-500'
                    }`}
                    aria-label="Mobil Görünüm"
                    title="Mobil"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {studioMode === 'web' && (
                <button
                  type="button"
                  onClick={() => setAutoRun(!autoRun)}
                  className={`text-[11px] font-semibold cursor-pointer ${
                    autoRun ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'
                  }`}
                >
                  {autoRun ? 'Oto-Derleme: Açık' : 'Oto-Derleme: Kapalı'}
                </button>
              )}
              <button
                type="button"
                onClick={handleRunCode}
                className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yenile</span>
              </button>
            </div>
          </div>

          {studioMode === 'web' ? (
            <div className="flex-1 flex flex-col min-h-0 bg-[#0b0f19]">
              <div className="flex-1 flex items-center justify-center overflow-auto p-2">
                <iframe
                  key={autoRun ? `${previewKey}-${combinedPreviewDoc.length}` : previewKey}
                  title="Argon Canlı Önizleme"
                  srcDoc={combinedPreviewDoc}
                  sandbox="allow-scripts"
                  className={`h-full bg-[#090d16] border border-neutral-800 rounded-xl transition-all duration-200 ${
                    viewportMode === 'mobile'
                      ? 'w-[375px] max-w-full'
                      : viewportMode === 'tablet'
                      ? 'w-[768px] max-w-full'
                      : 'w-full'
                  }`}
                />
              </div>

              <div className="h-32 bg-[#0d1117] border-t border-neutral-800 p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto">
                <div className="flex items-center justify-between text-neutral-400 pb-1.5 mb-1.5 border-b border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Canlı Sandbox Konsolu ({consoleLogs.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConsoleLogs([])}
                    className="text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Temizle</span>
                  </button>
                </div>
                {consoleLogs.length === 0 ? (
                  <div className="text-neutral-500">Konsol temiz.</div>
                ) : (
                  consoleLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4 bg-[#0d1117] text-emerald-400 font-mono text-xs overflow-y-auto space-y-2">
              <div className="flex items-center justify-between text-neutral-400 pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>Argon Açık Kaynak V8 İzole Yürütücü</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConsoleLogs([])}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Temizle</span>
                </button>
              </div>
              {consoleLogs.map((log, idx) => (
                <pre key={idx} className="whitespace-pre-wrap leading-relaxed">
                  {log}
                </pre>
              ))}
            </div>
          )}
        </div>
      </div>

      {showOpenSourceModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOpenSourceModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#202123] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Argon Kod Stüdyosu · Açık Kaynak (MIT)
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Özgür, denetlenebilir ve sıfır kilitlenme (zero lock-in) mimarisi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOpenSourceModal(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                aria-label="MIT Lisans Penceresini Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-2 leading-relaxed">
              <p>
                <strong>Argon Kod Stüdyosu</strong> tamamen açık kaynak standartlarıyla geliştirilmiştir. Ürettiğiniz tüm <code>index.html</code>, <code>style.css</code> ve <code>app.js</code> kaynak dosyaları <strong>MIT Lisansı</strong> ile dışa aktarılır; ticari veya kişisel projelerinizde hiçbir kısıtlama olmadan kullanabilirsiniz.
              </p>
            </div>

            <pre className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-[#141417] text-[11px] font-mono text-neutral-700 dark:text-neutral-300 overflow-x-auto max-h-44 whitespace-pre-wrap border border-neutral-200 dark:border-neutral-800">
              {MIT_LICENSE_TEXT}
            </pre>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(MIT_LICENSE_TEXT);
                  setLicenseCopied(true);
                  setTimeout(() => setLicenseCopied(false), 1800);
                }}
                className="px-3.5 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {licenseCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Lisans Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Code className="w-3.5 h-3.5" />
                    <span>MIT Lisansını Kopyala</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadJsonRepoManifest}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Tüm Kaynak Paketi İndir (.json)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
