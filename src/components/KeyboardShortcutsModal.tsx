import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Search, X } from 'lucide-react';
import { filterKeyboardShortcutGroups } from '../utils/keyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }
    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 60);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const groups = useMemo(() => filterKeyboardShortcutGroups(query), [query]);
  const totalCount = useMemo(
    () => groups.reduce((acc, g) => acc + g.items.length, 0),
    [groups]
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-modal-title"
      data-testid="keyboard-shortcuts-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[88dvh]">
        <header className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Keyboard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="keyboard-shortcuts-modal-title"
                className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight truncate"
              >
                Klavye Kısayolları
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Toplam {totalCount} hızlı komut · Pencereyi kapatmak için Esc
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="keyboard-shortcuts-close-btn"
            onClick={onClose}
            aria-label="Klavye kısayollarını kapat"
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141519] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              data-testid="shortcuts-modal-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kısayol veya tuş ara (ör. PDF, Ctrl, Panel, Tema)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#1c1d22] border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Aramayı temizle"
                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {groups.map((group) => (
            <section key={group.category} className="space-y-2.5">
              <div className="px-1">
                <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  {group.category}
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {group.subtitle}
                </p>
              </div>

              <div className="bg-neutral-50/80 dark:bg-[#1f2026] rounded-2xl border border-neutral-200/70 dark:border-neutral-800 divide-y divide-neutral-200/60 dark:divide-neutral-800">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    data-testid={item.id}
                    className="px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((keyLabel, kIdx) => (
                        <React.Fragment key={`${item.id}-${kIdx}`}>
                          {kIdx > 0 && (
                            <span className="text-[10px] text-neutral-400 font-semibold">
                              +
                            </span>
                          )}
                          <kbd className="inline-flex items-center justify-center min-w-[26px] h-7 px-2 rounded-lg bg-white dark:bg-[#121316] border border-neutral-300/90 dark:border-neutral-700 shadow-[0_1px_0_rgba(0,0,0,0.08)] font-mono text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                            {keyLabel}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {groups.length === 0 && (
            <div className="py-10 text-center text-xs text-neutral-500 dark:text-neutral-400">
              &ldquo;{query}&rdquo; ile eşleşen bir klavye kısayolu bulunamadı.
            </div>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#141519] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            İpucu: Uygulamanın herhangi bir yerindeyken{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono text-[10px] font-semibold">
              Ctrl / ⌘
            </kbd>{' '}
            +{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono text-[10px] font-semibold">
              /
            </kbd>{' '}
            tuşlayabilirsiniz.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Tamam
          </button>
        </footer>
      </div>
    </div>
  );
};
