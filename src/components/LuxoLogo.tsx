import React, { useState } from 'react';
import { Check, Code, Copy } from 'lucide-react';
import { cleanAssistantResponse, parseMarkdownBlocks } from '../utils/luxoLogic';

export const LuxoLogo: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-16 h-16 text-black dark:text-white',
  size = 64,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Luxo AI Logo"
  >
    <path
      d="M12 2a10 10 0 0 1 8.66 5l-2.6 1.5A7 7 0 0 0 12 5V2z"
      fill="currentColor"
      stroke="none"
    />
    <path
      d="M20.66 7a10 10 0 0 1 0 10l-2.6-1.5A7 7 0 0 0 19 12h-3v-0z"
      fill="currentColor"
      stroke="none"
    />
    <path
      d="M20.66 17A10 10 0 0 1 12 22v-3a7 7 0 0 0 6.06-3.5l2.6 1.5z"
      fill="currentColor"
      stroke="none"
    />
    <path
      d="M12 22a10 10 0 0 1-8.66-5l2.6-1.5A7 7 0 0 0 12 19v3z"
      fill="currentColor"
      stroke="none"
    />
    <path
      d="M3.34 17a10 10 0 0 1 0-10l2.6 1.5A7 7 0 0 0 5 12h3v0z"
      fill="currentColor"
      stroke="none"
    />
    <path
      d="M3.34 7A10 10 0 0 1 12 2v3A7 7 0 0 0 5.94 8.5L3.34 7z"
      fill="currentColor"
      stroke="none"
    />
    <path
      d="M21.2 9.8a5.5 5.5 0 0 0-.48-4.66 5.6 5.6 0 0 0-4.88-2.77 5.54 5.54 0 0 0-1.85.32 5.5 5.5 0 0 0-3.99-1.69 5.6 5.6 0 0 0-5.32 3.82 5.5 5.5 0 0 0-3.52 2.53 5.6 5.6 0 0 0 .54 5.98 5.5 5.5 0 0 0-.48 4.66 5.6 5.6 0 0 0 4.88 2.77c.64 0 1.26-.11 1.85-.32a5.5 5.5 0 0 0 3.99 1.69 5.6 5.6 0 0 0 5.32-3.82 5.5 5.5 0 0 0 3.52-2.53 5.6 5.6 0 0 0-.54-5.98z"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
    />
    <circle
      cx="12"
      cy="12"
      r="3.2"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
    />
  </svg>
);

export const ModelBrandAvatar: React.FC<{
  name: string;
  logoUrl?: string;
  accentColor?: string;
  sizeClass?: string;
  imgClass?: string;
}> = ({
  name,
  logoUrl,
  accentColor = '#2563eb',
  sizeClass = 'w-6 h-6 rounded-lg',
  imgClass = 'w-full h-full object-contain',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (logoUrl && !imgFailed) {
    return (
      <span
        className={`${sizeClass} inline-flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-700/80 shrink-0 shadow-xs`}
      >
        <img
          src={logoUrl}
          alt={`${name} logosu`}
          onError={() => setImgFailed(true)}
          className={imgClass}
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} inline-flex items-center justify-center text-white shrink-0 shadow-xs`}
      style={{ backgroundColor: accentColor }}
    >
      <LuxoLogo className="w-3/5 h-3/5 text-white" size={16} />
    </span>
  );
};

function fallbackCopyText(text: string) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch {
    // ignore
  }
}

export function renderInlineMarkdownNodes(text: string): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-neutral-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 font-mono text-[13px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const MarkdownContent: React.FC<{
  content: string;
}> = ({ content }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (code: string, idx: number) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(() => fallbackCopyText(code));
      } else {
        fallbackCopyText(code);
      }
    } catch {
      fallbackCopyText(code);
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const safeContent = cleanAssistantResponse(content, true);
  const blocks = parseMarkdownBlocks(safeContent);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-neutral-900 dark:text-neutral-100">
      {blocks.map((block, idx) => {
        if (block.type === 'code' && block.code !== undefined) {
          const lang = block.lang || 'code';
          const code = block.code;
          return (
            <div
              key={idx}
              className="my-3 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-[#141417] text-[#e4e4e7] font-mono text-xs shadow-sm"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-[#1f1f24] border-b border-neutral-800 text-neutral-400 select-none">
                <div className="flex items-center gap-1.5 font-sans font-semibold text-[11px] tracking-wide">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(code, idx)}
                  className="flex items-center gap-1 text-[11px] font-sans text-neutral-300 hover:text-white transition cursor-pointer whitespace-nowrap shrink-0"
                  aria-label="Kodu Kopyala"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kodu Kopyala</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 overflow-x-auto leading-relaxed">
                <pre className="whitespace-pre font-mono text-neutral-200">
                  {code.trimEnd()}
                </pre>
              </div>
            </div>
          );
        }

        const lines = (block.text || '').split('\n');
        const rendered: React.ReactNode[] = [];
        let paragraphBuffer: string[] = [];
        let listBuffer: string[] = [];
        let orderedBuffer: string[] = [];

        const flushParagraph = () => {
          if (paragraphBuffer.length > 0) {
            const joined = paragraphBuffer.join(' ');
            rendered.push(
              <p key={`p-${rendered.length}`} className="text-sm leading-relaxed">
                {renderInlineMarkdownNodes(joined)}
              </p>
            );
            paragraphBuffer = [];
          }
        };

        const flushLists = () => {
          if (listBuffer.length > 0) {
            rendered.push(
              <ul
                key={`ul-${rendered.length}`}
                className="list-disc pl-5 space-y-1 text-sm leading-relaxed"
              >
                {listBuffer.map((item, li) => (
                  <li key={li}>{renderInlineMarkdownNodes(item)}</li>
                ))}
              </ul>
            );
            listBuffer = [];
          }
          if (orderedBuffer.length > 0) {
            rendered.push(
              <ol
                key={`ol-${rendered.length}`}
                className="list-decimal pl-5 space-y-1 text-sm leading-relaxed"
              >
                {orderedBuffer.map((item, oi) => (
                  <li key={oi}>{renderInlineMarkdownNodes(item)}</li>
                ))}
              </ol>
            );
            orderedBuffer = [];
          }
        };

        lines.forEach((line) => {
          const trimmed = line.trim();
          const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
          const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);

          if (bulletMatch) {
            flushParagraph();
            if (orderedBuffer.length > 0) flushLists();
            listBuffer.push(bulletMatch[1]);
          } else if (orderedMatch) {
            flushParagraph();
            if (listBuffer.length > 0) flushLists();
            orderedBuffer.push(orderedMatch[1]);
          } else if (trimmed === '') {
            flushParagraph();
            flushLists();
          } else {
            flushLists();
            paragraphBuffer.push(trimmed);
          }
        });
        flushLists();
        flushParagraph();

        return (
          <div key={idx} className="space-y-2">
            {rendered}
          </div>
        );
      })}
    </div>
  );
};
