import { jsPDF } from 'jspdf';
import type { ChatThread } from '../types/luxo';
import { cleanAssistantResponse, LUXO_MODELS, sanitizeLuxoBrand } from './luxoLogic';

export interface PdfBlock {
  kind: 'paragraph' | 'code';
  text: string;
  language?: string;
}

export interface PdfTurnEntry {
  index: number;
  speaker: string;
  role: 'user' | 'assistant' | 'system';
  timestampLabel: string;
  blocks: PdfBlock[];
}

export interface ChatPdfDocumentModel {
  filename: string;
  title: string;
  modelName: string;
  exportedAtLabel: string;
  messageCount: number;
  turns: PdfTurnEntry[];
}

export function buildSafePdfFilename(rawTitle: string): string {
  const clean = sanitizeLuxoBrand(rawTitle || 'luxo_sohbet');
  const slug = clean
    .replace(/ğ/gi, (c) => (c === 'Ğ' ? 'G' : 'g'))
    .replace(/ü/gi, (c) => (c === 'Ü' ? 'U' : 'u'))
    .replace(/ş/gi, (c) => (c === 'Ş' ? 'S' : 's'))
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ö/gi, (c) => (c === 'Ö' ? 'O' : 'o'))
    .replace(/ç/gi, (c) => (c === 'Ç' ? 'C' : 'c'))
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 42);
  return `${slug || 'luxo_sohbet'}.pdf`;
}

export function splitMarkdownForPdf(rawText: string): PdfBlock[] {
  const normalized = cleanAssistantResponse(sanitizeLuxoBrand(rawText || ''), true)
    .replace(/\r\n/g, '\n')
    .trim();
  if (!normalized) return [];

  const blocks: PdfBlock[] = [];
  const fenceRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(normalized)) !== null) {
    if (match.index > lastIdx) {
      const prose = normalized.slice(lastIdx, match.index).trim();
      if (prose) {
        for (const para of prose.split(/\n{2,}/)) {
          const cleanPara = para.replace(/\*\*([^*]+)\*\*/g, '$1').trim();
          if (cleanPara) blocks.push({ kind: 'paragraph', text: cleanPara });
        }
      }
    }
    blocks.push({
      kind: 'code',
      language: (match[1] || 'text').toUpperCase(),
      text: match[2].replace(/\s+$/, ''),
    });
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < normalized.length) {
    const tail = normalized.slice(lastIdx).trim();
    if (tail) {
      for (const para of tail.split(/\n{2,}/)) {
        const cleanPara = para.replace(/\*\*([^*]+)\*\*/g, '$1').trim();
        if (cleanPara) blocks.push({ kind: 'paragraph', text: cleanPara });
      }
    }
  }

  return blocks;
}

export function buildChatPdfDocumentModel(
  chat: ChatThread,
  activeModelName?: string
): ChatPdfDocumentModel {
  const modelName =
    activeModelName ||
    LUXO_MODELS[chat.modelId]?.name ||
    'Luxo AI';
  const title = sanitizeLuxoBrand(chat.title || 'Luxo AI Sohbet Raporu');
  const turns: PdfTurnEntry[] = (chat.messages || []).map((msg, idx) => {
    const msgModel = msg.modelId ? LUXO_MODELS[msg.modelId]?.name : undefined;
    const speaker =
      msg.role === 'user'
        ? 'Kullanıcı'
        : msgModel || modelName;
    const timestampLabel = msg.timestamp
      ? new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    return {
      index: idx + 1,
      speaker,
      role: msg.role,
      timestampLabel,
      blocks: splitMarkdownForPdf(msg.content),
    };
  });

  return {
    filename: buildSafePdfFilename(title),
    title,
    modelName,
    exportedAtLabel: new Date().toLocaleString('tr-TR'),
    messageCount: turns.length,
    turns,
  };
}

function wrapLineByMeasure(
  measureFn: (str: string) => number,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split('\n')) {
    if (!rawLine) {
      lines.push('');
      continue;
    }
    const words = rawLine.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measureFn(candidate) <= maxWidth) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
          current = '';
        }
        // Break overly long unspaced tokens cleanly
        if (measureFn(word) > maxWidth) {
          let chunk = '';
          for (const ch of word) {
            if (measureFn(chunk + ch) > maxWidth && chunk) {
              lines.push(chunk);
              chunk = ch;
            } else {
              chunk += ch;
            }
          }
          current = chunk;
        } else {
          current = word;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function renderStyledPdfPagesViaCanvas(model: ChatPdfDocumentModel): {
  blob: Blob;
  pageCount: number;
} | null {
  if (typeof document === 'undefined') return null;
  const probeCanvas = document.createElement('canvas');
  const probeCtx = probeCanvas.getContext('2d');
  if (!probeCtx) return null;

  // A4 logical dimensions @ 96 DPI scaled 2x for sharp typography
  const PAGE_W = 794;
  const PAGE_H = 1123;
  const SCALE = 2;
  const MARGIN_X = 48;
  const CONTENT_W = PAGE_W - MARGIN_X * 2;
  const FOOTER_Y = PAGE_H - 36;
  const MAX_CONTENT_Y = PAGE_H - 64;

  const pages: HTMLCanvasElement[] = [];

  const createPageCanvas = (): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    y: number;
  } => {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W * SCALE;
    canvas.height = PAGE_H * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    pages.push(canvas);
    return { canvas, ctx, y: 48 };
  };

  let current = createPageCanvas();

  const startNextPage = () => {
    current = createPageCanvas();
    // Subtle top running bar on subsequent pages
    current.ctx.fillStyle = '#f8fafc';
    current.ctx.fillRect(MARGIN_X, 26, CONTENT_W, 24);
    current.ctx.fillStyle = '#64748b';
    current.ctx.font = '600 10px "Plus Jakarta Sans", system-ui, sans-serif';
    current.ctx.fillText(
      `LUXO AI  ·  ${model.title.slice(0, 62)}`,
      MARGIN_X + 10,
      42
    );
    current.y = 68;
  };

  const ensureSpace = (neededHeight: number) => {
    if (current.y + neededHeight > MAX_CONTENT_Y) {
      startNextPage();
    }
  };

  // Page 1 Header Banner
  const ctx0 = current.ctx;
  ctx0.fillStyle = '#0f172a';
  ctx0.beginPath();
  ctx0.roundRect(MARGIN_X, current.y, CONTENT_W, 92, 14);
  ctx0.fill();

  ctx0.fillStyle = '#38bdf8';
  ctx0.font = '700 10px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx0.fillText('LUXO AI · SOHBET TRANSKRİPTİ VE ARŞİV RAPORU', MARGIN_X + 20, current.y + 24);

  ctx0.fillStyle = '#ffffff';
  ctx0.font = '700 17px "Plus Jakarta Sans", system-ui, sans-serif';
  const titleLines = wrapLineByMeasure(
    (s) => ctx0.measureText(s).width,
    model.title,
    CONTENT_W - 40
  ).slice(0, 2);
  titleLines.forEach((line, i) => {
    ctx0.fillText(line, MARGIN_X + 20, current.y + 47 + i * 20);
  });

  ctx0.fillStyle = '#94a3b8';
  ctx0.font = '500 10.5px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx0.fillText(
    `Model: ${model.modelName}   •   Tarih: ${model.exportedAtLabel}   •   Toplam Mesaj: ${model.messageCount}`,
    MARGIN_X + 20,
    current.y + 80
  );

  current.y += 114;

  for (const turn of model.turns) {
    ensureSpace(54);
    const isUser = turn.role === 'user';

    // Speaker Pill Header
    current.ctx.fillStyle = isUser ? '#eff6ff' : '#f8fafc';
    current.ctx.strokeStyle = isUser ? '#bfdbfe' : '#e2e8f0';
    current.ctx.lineWidth = 1;
    current.ctx.beginPath();
    current.ctx.roundRect(MARGIN_X, current.y, CONTENT_W, 28, 8);
    current.ctx.fill();
    current.ctx.stroke();

    // Accent bar
    current.ctx.fillStyle = isUser ? '#2563eb' : '#0f172a';
    current.ctx.fillRect(MARGIN_X + 10, current.y + 7, 4, 14);

    current.ctx.fillStyle = isUser ? '#1d4ed8' : '#0f172a';
    current.ctx.font = '700 11.5px "Plus Jakarta Sans", system-ui, sans-serif';
    current.ctx.fillText(
      `#${turn.index}  ${turn.speaker}`,
      MARGIN_X + 22,
      current.y + 18
    );

    if (turn.timestampLabel) {
      current.ctx.fillStyle = '#64748b';
      current.ctx.font = '500 10px "Plus Jakarta Sans", system-ui, sans-serif';
      const timeW = current.ctx.measureText(turn.timestampLabel).width;
      current.ctx.fillText(
        turn.timestampLabel,
        MARGIN_X + CONTENT_W - timeW - 12,
        current.y + 18
      );
    }

    current.y += 38;

    for (const block of turn.blocks) {
      if (block.kind === 'paragraph') {
        current.ctx.font = '400 11.5px "Plus Jakarta Sans", system-ui, sans-serif';
        const lines = wrapLineByMeasure(
          (s) => current.ctx.measureText(s).width,
          block.text,
          CONTENT_W - 14
        );
        for (const line of lines) {
          ensureSpace(19);
          current.ctx.font = '400 11.5px "Plus Jakarta Sans", system-ui, sans-serif';
          current.ctx.fillStyle = '#1e293b';
          current.ctx.fillText(line, MARGIN_X + 8, current.y);
          current.y += 17.5;
        }
        current.y += 6;
      } else {
        // Code block
        current.ctx.font = '400 10px "JetBrains Mono", ui-monospace, monospace';
        const codeLines = wrapLineByMeasure(
          (s) => current.ctx.measureText(s).width,
          block.text,
          CONTENT_W - 28
        );

        let cursor = 0;
        while (cursor < codeLines.length) {
          const availablePx = MAX_CONTENT_Y - current.y - 28;
          if (availablePx < 36) {
            startNextPage();
            continue;
          }
          const maxFit = Math.max(1, Math.floor(availablePx / 15));
          const slice = codeLines.slice(cursor, cursor + maxFit);
          const boxH = slice.length * 15 + 28;

          current.ctx.fillStyle = '#0f172a';
          current.ctx.beginPath();
          current.ctx.roundRect(MARGIN_X + 4, current.y, CONTENT_W - 8, boxH, 8);
          current.ctx.fill();

          current.ctx.fillStyle = '#94a3b8';
          current.ctx.font = '700 9px "JetBrains Mono", ui-monospace, monospace';
          current.ctx.fillText(
            cursor === 0 ? `${block.language || 'CODE'}` : `${block.language || 'CODE'} (devam)`,
            MARGIN_X + 16,
            current.y + 15
          );

          current.ctx.fillStyle = '#e2e8f0';
          current.ctx.font = '400 10px "JetBrains Mono", ui-monospace, monospace';
          slice.forEach((cl, idx) => {
            current.ctx.fillText(cl, MARGIN_X + 16, current.y + 31 + idx * 15);
          });

          current.y += boxH + 10;
          cursor += slice.length;
        }
      }
    }

    current.y += 12;
  }

  // Paint uniform page footers across all generated pages
  const totalPages = pages.length;
  pages.forEach((pg, idx) => {
    const pCtx = pg.getContext('2d')!;
    pCtx.strokeStyle = '#e2e8f0';
    pCtx.lineWidth = 1;
    pCtx.beginPath();
    pCtx.moveTo(MARGIN_X, FOOTER_Y - 12);
    pCtx.lineTo(PAGE_W - MARGIN_X, FOOTER_Y - 12);
    pCtx.stroke();

    pCtx.fillStyle = '#64748b';
    pCtx.font = '500 9.5px "Plus Jakarta Sans", system-ui, sans-serif';
    pCtx.fillText('Luxo AI · Güvenli Yerel PDF Dışa Aktarımı', MARGIN_X, FOOTER_Y + 4);
    const pageStr = `Sayfa ${idx + 1} / ${totalPages}`;
    const pW = pCtx.measureText(pageStr).width;
    pCtx.fillText(pageStr, PAGE_W - MARGIN_X - pW, FOOTER_Y + 4);
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pages.forEach((canvas, idx) => {
    if (idx > 0) pdf.addPage();
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  });

  return {
    blob: pdf.output('blob'),
    pageCount: totalPages,
  };
}

function renderVectorPdfFallback(model: ChatPdfDocumentModel): {
  blob: Blob;
  pageCount: number;
} {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });
  let y = 48;
  const pageH = pdf.internal.pageSize.getHeight();
  const maxW = pdf.internal.pageSize.getWidth() - 72;

  const ensureY = (step: number) => {
    if (y + step > pageH - 48) {
      pdf.addPage();
      y = 48;
    }
  };

  pdf.setFontSize(15);
  pdf.text(model.title, 36, y);
  y += 20;
  pdf.setFontSize(10);
  pdf.text(`Model: ${model.modelName} | Tarih: ${model.exportedAtLabel}`, 36, y);
  y += 22;

  for (const turn of model.turns) {
    ensureY(24);
    pdf.setFontSize(11);
    pdf.text(`#${turn.index} ${turn.speaker}`, 36, y);
    y += 15;
    pdf.setFontSize(9.5);
    for (const block of turn.blocks) {
      const wrapped = pdf.splitTextToSize(block.text, maxW) as string[];
      for (const line of wrapped) {
        ensureY(14);
        pdf.text(line, 40, y);
        y += 13;
      }
      y += 6;
    }
    y += 10;
  }

  return {
    blob: pdf.output('blob'),
    pageCount: pdf.getNumberOfPages(),
  };
}

export function generateChatPdfBlob(
  chat: ChatThread,
  activeModelName?: string
): {
  filename: string;
  blob: Blob;
  pageCount: number;
} {
  const model = buildChatPdfDocumentModel(chat, activeModelName);
  const canvasResult = renderStyledPdfPagesViaCanvas(model);
  const result = canvasResult || renderVectorPdfFallback(model);
  return {
    filename: model.filename,
    blob: result.blob,
    pageCount: result.pageCount,
  };
}

export function exportChatToPdf(
  chat: ChatThread,
  activeModelName?: string
): { filename: string; pageCount: number } {
  const { filename, blob, pageCount } = generateChatPdfBlob(
    chat,
    activeModelName
  );
  if (typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  return { filename, pageCount };
}
