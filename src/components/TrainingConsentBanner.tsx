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
      className="px-4 py-2.5 bg-indigo-50/90 dark:bg-[#1e1f26] border-b border-indigo-500/20 text-neutral-900 dark:text-neutral-100 shrink-0 z-30"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Brain className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs sm:text-[13px] font-bold text-neutral-900 dark:text-white">
                Sohbet Yapay Zekamızı Geliştirmek İçin kullanılsın mı?
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Kişisel veriler maskelenir ·</span>
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
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="consent-accept-btn"
            onClick={() => onSelectConsent('granted')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Evet, Kullanılsın</span>
          </button>
          <button
            type="button"
            data-testid="consent-decline-btn"
            onClick={() => onSelectConsent('denied')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            <span>Hayır, Kullanılmasın</span>
          </button>
        </div>
      </div>
    </section>
  );
};
