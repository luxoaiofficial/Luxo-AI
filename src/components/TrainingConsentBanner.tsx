import React from 'react';
import { Brain, Check, ShieldCheck, X } from 'lucide-react';
import type { TrainingConsentStatus } from '../types/luxo';

interface TrainingConsentBannerProps {
  consentStatus: TrainingConsentStatus;
  onSelectConsent: (nextStatus: 'granted' | 'denied') => void;
  onOpenEvolutionHub: () => void;
}

export const TrainingConsentBanner: React.FC<TrainingConsentBannerProps> = ({
  consentStatus,
  onSelectConsent,
  onOpenEvolutionHub,
}) => {
  if (consentStatus !== 'unset') {
    return null;
  }

  return (
    <section
      role="region"
      aria-label="Sohbet Geliştirme İzni Bildirimi"
      data-testid="training-consent-banner"
      className="px-3 sm:px-4 py-1.5 bg-indigo-50/90 dark:bg-[#1e1f26] border-b border-indigo-500/20 text-neutral-900 dark:text-neutral-100 shrink-0 z-30"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex flex-wrap items-center gap-x-2">
            <span className="text-[11px] sm:text-xs font-semibold text-neutral-900 dark:text-white truncate">
              <span className="sm:hidden">Sohbet AI gelişimine katkı sağlasın mı?</span>
              <span className="hidden sm:inline">
                Sohbet Yapay Zekamızı Geliştirmek İçin kullanılsın mı?
              </span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Veriler maskelenir ·</span>
              <button
                type="button"
                onClick={onOpenEvolutionHub}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Otonom Gelişim
              </button>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="consent-accept-btn"
            onClick={() => onSelectConsent('granted')}
            className="px-2 sm:px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Check className="w-3 h-3" />
            <span className="sm:hidden">Evet</span>
            <span className="hidden sm:inline">Evet, Kullanılsın</span>
          </button>
          <button
            type="button"
            data-testid="consent-decline-btn"
            onClick={() => onSelectConsent('denied')}
            className="px-2 sm:px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <X className="w-3 h-3" />
            <span className="sm:hidden">Hayır</span>
            <span className="hidden sm:inline">Hayır, Kullanılmasın</span>
          </button>
        </div>
      </div>
    </section>
  );
};
