import React from 'react';
import { RefreshCw, RotateCcw, ShieldAlert } from 'lucide-react';
import { LuxoLogo } from './LuxoLogo';
import {
  isDynamicImportFailure,
  planSafeChunkReloadUrl,
} from '../utils/moduleLoader';

interface ErrorBoundaryState {
  hasError: boolean;
  errorText: string;
  isModuleFetchError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorText: '',
      isModuleFetchError: false,
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const raw = error instanceof Error ? error.message : String(error || '');
    return {
      hasError: true,
      errorText: raw.slice(0, 240),
      isModuleFetchError: isDynamicImportFailure(error),
    };
  }

  componentDidCatch(error: unknown): void {
    if (isDynamicImportFailure(error) && typeof window !== 'undefined') {
      let storage: Storage | null = null;
      try {
        storage = window.sessionStorage;
      } catch {
        storage = null;
      }
      const reloadUrl = planSafeChunkReloadUrl(storage, window.location.href);
      if (reloadUrl) {
        window.location.replace(reloadUrl);
      }
    }
  }

  private handleSafeReloadPreserveData = () => {
    this.setState({
      hasError: false,
      errorText: '',
      isModuleFetchError: false,
    });
    if (typeof window !== 'undefined') {
      const parsed = new URL(window.location.href);
      parsed.searchParams.set('_r', String(Date.now()));
      window.location.replace(parsed.toString());
    }
  };

  private handleResetAndReload = () => {
    try {
      localStorage.removeItem('luxo_chats');
      localStorage.removeItem('luxo_user');
    } catch {
      // ignore storage errors
    }
    window.location.href = `${window.location.origin}/?autostart=1`;
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-neutral-50 dark:bg-[#121215] text-neutral-900 dark:text-neutral-100">
        <div className="max-w-md w-full bg-white dark:bg-[#1c1c21] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-7 shadow-xl space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto">
            <LuxoLogo className="w-6 h-6 text-white" size={24} />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <span>
                {this.state.isModuleFetchError
                  ? 'Modül Bağlantısı Yenileniyor'
                  : 'Çalışma Alanı Kurtarma Modu'}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {this.state.isModuleFetchError
                ? 'Yeni Sürüm Paketleri Algılandı'
                : 'Luxo AI Stüdyosu Kurtarma Modu'}
            </h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {this.state.isModuleFetchError
                ? 'Sunucu güncellemesi sırasında bir sayfa bileşeni yenilendi. Sohbetleriniz ve profil verileriniz korunarak sayfayı tazeleyebilirsiniz.'
                : 'Beklenmeyen bir arayüz durumu algılandı. Verilerinizi koruyarak sayfayı yenileyebilir veya temiz bir oturum başlatabilirsiniz.'}
            </p>
          </div>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={this.handleSafeReloadPreserveData}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Verileri Koru ve Sayfayı Yenile</span>
            </button>
            <button
              type="button"
              onClick={this.handleResetAndReload}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yerel Önbelleği Sıfırla ve Başlat</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
