import React, { useState } from 'react';
import {
  CircleAlert,
  Columns2,
  Key,
  LoaderCircle,
  Mail,
  ShieldCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import { LUXO_MODEL_IDS } from '../utils/luxoLogic';
import { LuxoLogo } from './LuxoLogo';

interface WelcomeViewProps {
  onGoogleSignIn: () => Promise<void>;
  onOpenAuthModal?: () => void;
  onOpenUpgradeModal: () => void;
  onSkipToGuest: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onGoogleSignIn,
  onOpenAuthModal,
  onOpenUpgradeModal,
  onSkipToGuest,
}) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [legalSheet, setLegalSheet] = useState<
    'terms' | 'privacy' | 'safety' | null
  >(null);

  const modelCount = LUXO_MODEL_IDS.length;

  return (
    <div className="min-h-full w-full flex flex-col justify-center px-6 py-8 sm:px-10 bg-white dark:bg-[#18181b] text-[#111827] dark:text-[#f9fafb] transition-colors select-none overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Editorial & Capability Column */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <LuxoLogo
                className="w-7 h-7 text-white dark:text-neutral-900"
                size={28}
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Luxo AI
            </span>
          </div>

          <div className="space-y-3">
            <h1
              className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight leading-[1.15] text-neutral-900 dark:text-white max-w-xl"
              style={{ textWrap: 'balance' }}
            >
              {modelCount} yapay zeka modeli, tek sade çalışma alanı.
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-xl">
              Google Gemini, OpenAI ChatGPT & o-Serisi, Anthropic Claude, DeepSeek, Grok, Meta Llama, Mistral, Qwen, Runway, Kling ve Perplexity dahil tüm yapay zekalardan kısa, net ve doğrudan yanıtlar alın; iki modeli yan yana karşılaştırın veya 4K video üretin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {modelCount} Seçilebilir Yapay Zeka
            </span>
            <span aria-hidden="true">·</span>
            <span>Kısa ve Öz Yanıt Mimarisi</span>
            <span aria-hidden="true">·</span>
            <span>Nano Banana 4K & Google Veo</span>
            <span aria-hidden="true">·</span>
            <span>10 Nöral Ses</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-1">
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#202123] space-y-1.5">
              <Columns2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div className="text-xs font-bold text-neutral-900 dark:text-white">
                Yan Yana Karşılaştırma
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                İki farklı yapay zeka modelini aynı soruda eşzamanlı yarıştırın ve sentezleyin.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#202123] space-y-1.5">
              <Video className="w-4 h-4 text-amber-500" />
              <div className="text-xs font-bold text-neutral-900 dark:text-white">
                4K 60fps Görsel & Video
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                Nano Banana 2.1 Ultra ve Google Veo ile yüksek sadakatli görsel ve sesli MP4 üretin.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#202123] space-y-1.5">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-xs font-bold text-neutral-900 dark:text-white">
                Canlı Ortak Çalışma
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                Oda bağlantısıyla ekibinizle aynı anda sohbet ve ortak belge düzenleyin.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sign-In & Instant Launch Column */}
        <div className="lg:col-span-5 w-full">
          <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#202123] space-y-5">
            <div className="space-y-1.5 text-left">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Hemen Başlayın
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Bulut senkronizasyonu için Google hesabınızla giriş yapın veya doğrudan misafir modunda deneyin.
              </p>
            </div>

            {errorMessage && (
              <div className="w-full p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 text-left">
                <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
              </div>
            )}

            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={async () => {
                  setErrorMessage(null);
                  setLoadingGoogle(true);
                  try {
                    await onGoogleSignIn();
                  } catch (err: unknown) {
                    const raw = err instanceof Error ? err.message : '';
                    if (raw.includes('popup-closed-by-user')) {
                      setErrorMessage(
                        'Google giriş penceresi kapatıldı. Tekrar deneyebilirsiniz.'
                      );
                    } else {
                      setErrorMessage(
                        'Google kimlik doğrulaması tamamlanamadı. Lütfen açılır pencere iznini kontrol edin veya Misafir Modu ile devam edin.'
                      );
                    }
                  } finally {
                    setLoadingGoogle(false);
                  }
                }}
                disabled={loadingGoogle}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-semibold rounded-full text-sm sm:text-base transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {loadingGoogle ? (
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>
                  {loadingGoogle
                    ? 'Firebase Google Doğrulanıyor...'
                    : 'Google ile devam et'}
                </span>
              </button>

              {onOpenAuthModal && (
                <button
                  type="button"
                  data-testid="welcome-email-auth-btn"
                  onClick={onOpenAuthModal}
                  disabled={loadingGoogle}
                  className="w-full py-3 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold rounded-full text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>E-posta ile Giriş / Kayıt Ol</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onSkipToGuest();
                  onOpenUpgradeModal();
                }}
                disabled={loadingGoogle}
                className="w-full py-3 px-4 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white font-medium rounded-full text-sm border border-neutral-300 dark:border-neutral-700 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Key className="w-4 h-4 text-amber-500" />
                <span>Geliştirici / VIP Şifresi ile Başla</span>
              </button>

              <button
                type="button"
                onClick={onSkipToGuest}
                disabled={loadingGoogle}
                className="w-full py-2.5 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Atla (Misafir Modu)
              </button>
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed pt-1 text-left">
              Luxo AI{' '}
              <button
                type="button"
                onClick={() => setLegalSheet('safety')}
                className="underline decoration-dotted hover:text-neutral-800 dark:hover:text-white cursor-pointer"
              >
                hata yapabilir
              </button>
              , bu yüzden önemli bilgileri kontrol edin. Devam ederek{' '}
              <button
                type="button"
                onClick={() => setLegalSheet('terms')}
                className="underline font-medium text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white cursor-pointer"
              >
                Şartlarımızı
              </button>{' '}
              ve{' '}
              <button
                type="button"
                onClick={() => setLegalSheet('privacy')}
                className="underline font-medium text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white cursor-pointer"
              >
                Gizlilik Politikamızı
              </button>{' '}
              kabul etmiş sayılırsınız.
            </p>
          </div>
        </div>
      </div>

      {legalSheet && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setLegalSheet(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-left"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#202123] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {legalSheet === 'terms'
                    ? 'Luxo AI Kullanım Şartları'
                    : legalSheet === 'privacy'
                    ? 'Gizlilik ve Sıfır E-posta Görünürlüğü'
                    : 'Yapay Zeka Doğruluk Bilgilendirmesi'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalSheet(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-2.5 leading-relaxed">
              {legalSheet === 'privacy' ? (
                <>
                  <p>
                    <strong>Sıfır E-posta Teşhiri:</strong> Luxo AI gizlilik mimarisi gereği kişisel e-posta adresiniz arayüzde, yerel önbellekte veya veritabanı belgelerinde hiçbir zaman açık olarak gösterilmez veya saklanmaz.
                  </p>
                  <p>
                    <strong>Firebase Güvenliği:</strong> Google ile oturum açtığınızda sohbet ve tercih verileriniz yalnızca doğrulanmış kullanıcı kimliğiniz (UID) altında izole edilir.
                  </p>
                </>
              ) : legalSheet === 'terms' ? (
                <>
                  <p>
                    Luxo AI; çoklu yapay zeka sohbeti, yan yana model karşılaştırması, 4K görsel/video üretimi ve canlı ortak çalışma araçlarını üretkenlik amacıyla sunar.
                  </p>
                  <p>
                    Ürettiğiniz tüm içerikler ve projeler size aittir; dilediğiniz zaman dışa aktarabilir veya silebilirsiniz.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Yapay zeka modelleri yüksek doğruluk için tasarlanmış olsa da kritik teknik, hukuki veya finansal kararlar öncesinde çıktıların doğrulanması önerilir.
                  </p>
                  <p>
                    Güncel kaynak kontrolü için sohbet ekranındaki <strong>Web Araştırması</strong> ve <strong>Yan Yana Karşılaştır</strong> modlarını etkinleştirebilirsiniz.
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setLegalSheet(null)}
              className="w-full py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold cursor-pointer"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
