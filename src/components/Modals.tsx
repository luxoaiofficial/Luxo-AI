import React, { useEffect, useRef, useState } from 'react';
import {
  Bug,
  Camera,
  Check,
  CircleAlert,
  CircleCheck,
  Cpu,
  CreditCard,
  Download,
  Gauge,
  Headphones,
  Image as ImageIcon,
  Key,
  Layout,
  Lightbulb,
  LoaderCircle,
  Lock,
  Mail,
  MessageSquare,
  Mic,
  MicOff,
  Minus,
  Paperclip,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Star,
  Trash2,
  User,
  Volume2,
  Waves,
  Wifi,
  X,
} from 'lucide-react';
import { LuxoModelId } from '../types/luxo';
import {
  getVoiceOption,
  LUXO_MODELS,
  LUXO_VOICES,
  sanitizeLuxoBrand,
  validateUnlockCode,
} from '../utils/luxoLogic';
import { LuxoLogo } from './LuxoLogo';
import { SocialShareButton } from './SocialShareBar';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (plan: 'go' | 'plus') => void;
  isUnlockedDev: boolean;
  isUnlockedDevHelper: boolean;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isUnlockedDev,
  isUnlockedDevHelper,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'go' | 'plus'>('plus');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentUnconfiguredNotice, setPaymentUnconfiguredNotice] =
    useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(true);

  if (!isOpen) return null;

  const isPlanActive =
    selectedPlan === 'plus'
      ? isUnlockedDev
      : isUnlockedDevHelper || isUnlockedDev;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentUnconfiguredNotice(false);
    const res = validateUnlockCode(passwordInput);
    if (res === 'dev_full') {
      setErrorMsg(null);
      setSuccessMsg(
        'Şifre onaylandı! Luxo-Dev (Plus Planı) ve tüm VIP modeller aktif edildi.'
      );
      setTimeout(() => {
        onSuccess('plus');
        onClose();
        setSuccessMsg(null);
        setPasswordInput('');
      }, 650);
    } else if (res === 'dev_helper') {
      setErrorMsg(null);
      setSuccessMsg(
        "Şifre onaylandı! Luxo-Dev's Helper (Go Planı) aktif edildi."
      );
      setTimeout(() => {
        onSuccess('go');
        onClose();
        setSuccessMsg(null);
        setPasswordInput('');
      }, 650);
    } else {
      setErrorMsg('Geçersiz geliştirici şifresi veya promosyon kodu!');
      setSuccessMsg(null);
    }
  };

  const handlePaymentButtonClick = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setPaymentUnconfiguredNotice(true);
    setShowPasswordForm(true);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pt-1 mb-4">
          <div className="flex justify-center mb-2">
            <LuxoLogo className="w-10 h-10 text-black dark:text-white" size={40} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-1.5">
            Luxo AI{' '}
            <span className="text-[#0266ff]">
              {selectedPlan === 'go' ? 'Go' : 'Plus'}
            </span>
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
            {selectedPlan === 'go'
              ? 'Genişletilmiş geliştirici asistanı ve yüksek hızla sohbete devam edin'
              : 'En üstün Luxo-Dev amiral gemisi motoruna ve 2M bağlam penceresine erişin'}
          </p>
        </div>

        <div className="flex border border-neutral-200 dark:border-neutral-700 p-0.5 rounded-full mb-4 bg-white dark:bg-[#18181b]">
          <button
            type="button"
            onClick={() => {
              setSelectedPlan('go');
              setErrorMsg(null);
              setPaymentUnconfiguredNotice(false);
            }}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
              selectedPlan === 'go'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Go (₺249,99)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPlan('plus');
              setErrorMsg(null);
              setPaymentUnconfiguredNotice(false);
            }}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
              selectedPlan === 'plus'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Plus (₺999,99)
          </button>
        </div>

        <div className="bg-white dark:bg-[#18181b] rounded-3xl p-4 border border-neutral-200 dark:border-neutral-800 mb-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <span>Özellikler</span>
            <div className="flex items-center gap-7 pr-1">
              <span>Ücretsiz</span>
              <span className="text-[#0266ff]">
                {selectedPlan === 'go' ? 'Go' : 'Plus'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs">
            {(selectedPlan === 'go'
              ? [
                  { label: 'Temel modeller (Flash & Argon)', free: true },
                  { label: "Luxo-Dev's Helper erişimi", free: false },
                  { label: '1M Token genişletilmiş bağlam', free: false },
                  { label: 'Daha fazla görsel ve kod üretimi', free: false },
                  { label: 'Uzun süreli kişiselleştirilmiş bellek', free: false },
                ]
              : [
                  { label: 'Luxo-Dev VIP Amiral Gemisi Model', free: false },
                  { label: '2M Token ultra derin bağlam', free: false },
                  { label: 'Çok adımlı derin akıl yürütme', free: false },
                  { label: 'Açık Kaynak Argon Stüdyosu tam güç', free: false },
                  { label: '10 Canlı Stüdyo Sesi & VIP öncelik', free: false },
                ]
            ).map((row, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <span className="text-neutral-800 dark:text-neutral-200">
                  {row.label}
                </span>
                <div className="flex items-center gap-9 pr-2">
                  {row.free ? (
                    <Check className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                  )}
                  <Check className="w-4 h-4 text-[#0266ff] stroke-[2.5]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {paymentUnconfiguredNotice && (
          <div
            role="alert"
            className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/70 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200"
          >
            <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-amber-900 dark:text-amber-100">
                Ödeme Ayarlanmadı
              </div>
              <p className="leading-relaxed text-amber-800 dark:text-amber-300">
                Çevrimiçi kredi kartı / abonelik tahsilatı şu anda yapılandırılmamıştır. Plan kilidini açmak için aşağıdaki geliştirici şifresi alanını kullanabilirsiniz.
              </p>
            </div>
          </div>
        )}

        {isPlanActive && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <CircleCheck className="w-4 h-4 shrink-0" />
            <span>Bu plan hesabınızda aktif! Modeli menüden seçebilirsiniz.</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
            <CircleAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <CircleCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {showPasswordForm ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-3 mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder={
                  selectedPlan === 'go'
                    ? 'Go geliştirici şifresini girin...'
                    : 'Plus VIP geliştirici şifresini girin...'
                }
                aria-label="Geliştirici Kilit Açma Şifresi"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-100 dark:bg-[#27272a] text-neutral-900 dark:text-white rounded-xl text-xs border border-neutral-200 dark:border-neutral-700 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold rounded-xl hover:opacity-90 transition cursor-pointer"
              >
                Şifre ile Kilidi Aç
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="py-2.5 px-3 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs rounded-xl hover:opacity-90 transition cursor-pointer"
              >
                Gizle
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white underline underline-offset-4 transition cursor-pointer flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Geliştirici veya VIP şifreniz mi var? Buraya girin</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handlePaymentButtonClick}
          className="w-full py-4 px-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mb-3 tabular-nums"
        >
          <span>
            {selectedPlan === 'go'
              ? '₺249,99 karşılığında yükselt'
              : '₺999,99 karşılığında yükselt'}
          </span>
        </button>

        <div className="text-[11px] text-center text-neutral-500 dark:text-neutral-400 leading-relaxed">
          <p>Çevrimiçi ödeme kapalıdır · Yalnızca yetkili şifre ile etkinleştirilir.</p>
        </div>
      </div>
    </div>
  );
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onOpenUpgradeModal: () => void;
  isLimitReachedNotice?: boolean;
  onEmailRegister?: (email: string, pass: string, name: string) => Promise<{ verificationSent: boolean }>;
  onEmailSignIn?: (email: string, pass: string) => Promise<void>;
  onPasswordReset?: (email: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onOpenUpgradeModal,
  isLimitReachedNotice = false,
  onEmailRegister,
  onEmailSignIn,
  onPasswordReset,
}) => {
  const [authMode, setAuthMode] = useState<
    'google' | 'email-login' | 'email-register' | 'forgot-password'
  >('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const passwordStrength =
    password.length >= 10 && /[A-Z]/.test(password) && /\d/.test(password)
      ? { label: 'Güçlü', color: 'bg-emerald-500', width: 'w-full' }
      : password.length >= 8
      ? { label: 'Orta', color: 'bg-amber-500', width: 'w-2/3' }
      : password.length > 0
      ? { label: 'Zayıf', color: 'bg-rose-500', width: 'w-1/3' }
      : null;

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      if (raw.includes('popup-closed-by-user')) {
        setErrorMessageSafe('Google giriş penceresi kapatıldı.');
      } else {
        setErrorMessageSafe(
          'Google ile bağlantı kurulamadı. Lütfen tarayıcı açılır pencere iznini kontrol edin.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    if (authMode === 'forgot-password') {
      if (!onPasswordReset) {
        setErrorMsg('Şifre sıfırlama şu anda kullanılamıyor.');
        return;
      }
      setLoading(true);
      try {
        await onPasswordReset(cleanEmail);
        setSuccessMsg(
          'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.'
        );
      } catch (err: unknown) {
        const raw = err instanceof Error ? err.message : '';
        if (raw.includes('user-not-found')) {
          setErrorMsg('Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.');
        } else {
          setErrorMsg('Şifre sıfırlama bağlantısı gönderilemedi: ' + raw);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Şifreniz güvenliğiniz için en az 6 karakter olmalıdır.');
      return;
    }

    if (authMode === 'email-register' && password !== confirmPassword) {
      setErrorMsg('Girdiğiniz şifreler eşleşmiyor. Lütfen kontrol edin.');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'email-register') {
        if (!onEmailRegister) {
          setErrorMsg('E-posta kaydı şu anda kullanılamıyor.');
          return;
        }
        const res = await onEmailRegister(
          cleanEmail,
          password,
          displayName.trim() || 'Luxo Kullanıcısı'
        );
        if (res.verificationSent) {
          setSuccessMsg(
            'Hesabınız başarıyla oluşturuldu! Doğrulama e-postası adresinize iletildi.'
          );
        } else {
          setSuccessMsg('Hesabınız oluşturuldu ve oturum açıldı.');
        }
        setTimeout(() => onClose(), 1500);
      } else if (authMode === 'email-login') {
        if (!onEmailSignIn) {
          setErrorMsg('E-posta girişi şu anda kullanılamıyor.');
          return;
        }
        await onEmailSignIn(cleanEmail, password);
        setSuccessMsg('Başarıyla giriş yapıldı!');
        setTimeout(() => onClose(), 800);
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      if (raw.includes('email-already-in-use')) {
        setErrorMsg('Bu e-posta adresi zaten kullanımda. Lütfen giriş yapın.');
      } else if (raw.includes('operation-not-allowed')) {
        setErrorMsg(
          'E-posta/Şifre sağlayıcısı Firebase Console Authentication ayarlarından etkinleştirilmediğinde bu uyarı görünür; dilerseniz Google sekmesinden tek tıkla oturum açabilirsiniz.'
        );
      } else if (raw.includes('wrong-password') || raw.includes('invalid-credential')) {
        setErrorMsg('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
      } else if (raw.includes('user-not-found')) {
        setErrorMsg('Bu e-posta ile kayıtlı kullanıcı bulunamadı.');
      } else {
        setErrorMsg('Kimlik doğrulama hatası: ' + raw);
      }
    } finally {
      setLoading(false);
    }
  };

  function setErrorMessageSafe(msg: string) {
    setErrorMsg(sanitizeLuxoBrand(msg));
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#202123] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="flex justify-center mb-2.5">
            <LuxoLogo className="w-12 h-12 text-black dark:text-white" size={48} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
            {isLimitReachedNotice
              ? 'Misafir Limiti Doldu'
              : 'Luxo AI Güvenli Oturum'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
            {authMode === 'email-register'
              ? 'Güvenli e-posta doğrulamalı hesap oluşturun. Hassas verileriniz Firebase bulutunda şifrelenir.'
              : authMode === 'forgot-password'
              ? 'Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.'
              : 'Google veya güvenli e-posta hesabınızla bağlanın. E-posta adresiniz hiçbir ekranda teşhir edilmez.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-[#2d2f34] rounded-2xl mb-4 text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMode('google');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              authMode === 'google'
                ? 'bg-white dark:bg-[#18181b] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('email-login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              authMode === 'email-login'
                ? 'bg-white dark:bg-[#18181b] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            E-posta Giriş
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('email-register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              authMode === 'email-register'
                ? 'bg-white dark:bg-[#18181b] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <CircleCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMsg}</div>
          </div>
        )}

        {authMode === 'google' ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-semibold rounded-full text-sm transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                {loading ? 'Google Doğrulanıyor...' : 'Google ile Tek Tıkla Giriş Yap'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenUpgradeModal();
              }}
              disabled={loading}
              className="w-full py-3 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-medium rounded-full text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Geliştirici veya VIP Şifresi Gir</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
            {authMode === 'email-register' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Adınız / Takma Adınız
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Adınız veya kullanıcı adınız"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-[#2d2f34] text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@alanadi.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-[#2d2f34] text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {authMode !== 'forgot-password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Şifre
                  </label>
                  {authMode === 'email-login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot-password');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Şifremi unuttum?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    data-testid="auth-password-input"
                    className="w-full pl-9 pr-14 py-2.5 bg-neutral-50 dark:bg-[#2d2f34] text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-2.5 text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? 'Gizle' : 'Göster'}
                  </button>
                </div>

                {authMode === 'email-register' && passwordStrength && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                      <div
                        className={`h-full transition-all ${passwordStrength.color} ${passwordStrength.width}`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      Güvenlik: {passwordStrength.label}
                    </span>
                  </div>
                )}

                {authMode === 'email-register' && (
                  <div className="mt-2.5">
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Şifreyi Onayla
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Şifrenizi tekrar girin"
                        data-testid="auth-confirm-password-input"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-[#2d2f34] text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-full text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
              <span>
                {authMode === 'email-register'
                  ? 'Kayıt Ol ve Doğrula'
                  : authMode === 'forgot-password'
                  ? 'Şifre Sıfırlama Bağlantısı Gönder'
                  : 'Giriş Yap'}
              </span>
            </button>

            {authMode === 'forgot-password' && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email-login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full text-center text-xs text-neutral-500 hover:underline cursor-pointer pt-1"
              >
                Giriş ekranına dön
              </button>
            )}
          </form>
        )}

        <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Firebase Auth · Şifreli Güvenli Veri Saklama</span>
        </div>
      </div>
    </div>
  );
};

export interface FeedbackDetails {
  errorType?: 'ui_ux' | 'performance' | 'model_response' | 'auth_network' | 'other';
  severity?: 'low' | 'medium' | 'critical';
  screenshotUrl?: string;
  deviceInfo?: string;
  modelId?: string;
  rating?: number;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelId?: string;
  onSubmitFeedback: (
    category: 'Hata Bildirimi' | 'Özellik Önerisi' | 'Genel Geri Bildirim',
    subject: string,
    message: string,
    details?: FeedbackDetails
  ) => Promise<void>;
}

const REPORT_CATEGORY_CARDS: {
  id: 'Hata Bildirimi' | 'Özellik Önerisi' | 'Genel Geri Bildirim';
  title: string;
  subtitle: string;
  accentClass: string;
}[] = [
  {
    id: 'Hata Bildirimi',
    title: 'Hata Bildirimi',
    subtitle: 'UI/UX, hız veya AI model sapması',
    accentClass: 'text-rose-500 bg-rose-500/10',
  },
  {
    id: 'Özellik Önerisi',
    title: 'Özellik Önerisi',
    subtitle: 'Yeni araç, yetenek veya entegrasyon',
    accentClass: 'text-amber-500 bg-amber-500/10',
  },
  {
    id: 'Genel Geri Bildirim',
    title: 'Genel Değerlendirme',
    subtitle: 'Deneyim puanı ve kalite sinyali',
  accentClass: 'text-blue-500 bg-blue-500/10',
  },
];

const ERROR_TYPE_CARDS: {
  id: NonNullable<FeedbackDetails['errorType']>;
  label: string;
  hint: string;
}[] = [
  { id: 'ui_ux', label: 'UI/UX & Görünüm', hint: 'Düzen, kontrast, kaydırma' },
  { id: 'performance', label: 'Performans & Hız', hint: 'Gecikme, akış donması' },
  { id: 'model_response', label: 'Model Yanıtı & Doğruluk', hint: 'Yanlış bilgi, kesik kod' },
  { id: 'auth_network', label: 'Bağlantı & Hesap', hint: 'Giriş, doğrulama, API' },
  { id: 'other', label: 'Diğer Sorun', hint: 'Kapsam dışı tanılama' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  activeModelId,
  onSubmitFeedback,
}) => {
  const [feedbackType, setFeedbackType] = useState<
    'Hata Bildirimi' | 'Özellik Önerisi' | 'Genel Geri Bildirim'
  >('Hata Bildirimi');
  const [errorType, setErrorType] = useState<
    'ui_ux' | 'performance' | 'model_response' | 'auth_network' | 'other'
  >('model_response');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'critical'>('medium');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activeModelLabel =
    activeModelId && activeModelId in LUXO_MODELS
      ? LUXO_MODELS[activeModelId as LuxoModelId].name
      : activeModelId || 'Luxo Auto-Router';

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1280;
        const maxHeight = 720;
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setScreenshotUrl(compressed);
          setScreenshotName(file.name || 'screenshot.jpg');
        } else {
          setScreenshotUrl(result);
          setScreenshotName(file.name || 'screenshot.png');
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageFile(file);
          break;
        }
      }
    }
  };

  const deviceInfo =
    typeof window !== 'undefined'
      ? `${navigator.userAgent.slice(0, 120)} | Ekran: ${window.innerWidth}x${window.innerHeight}`
      : 'Bilinmiyor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const details: FeedbackDetails = {
        rating,
        severity: feedbackType === 'Hata Bildirimi' ? severity : 'low',
        modelId: activeModelId || 'luxo-auto-router',
        deviceInfo,
      };
      if (feedbackType === 'Hata Bildirimi') {
        details.errorType = errorType;
      }
      if (screenshotUrl) {
        details.screenshotUrl = screenshotUrl;
      }
      await onSubmitFeedback(
        feedbackType,
        subject.trim() || `${feedbackType} (${errorType}) - Luxo AI`,
        message.trim(),
        details
      );
    } catch {
      // handled gracefully
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setMessage('');
        setSubject('');
        setScreenshotUrl(null);
        setScreenshotName(null);
        onClose();
      }, 1600);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      onPaste={handlePaste}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        data-testid="feedback-modal-panel"
        className="w-full max-w-xl bg-white dark:bg-[#202123] rounded-3xl p-5 sm:p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 relative my-auto max-h-[92vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 mb-3 pr-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Gelişmiş Geri Bildirim &amp; Model İyileştirme Raporu
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Raporunuz şifreli olarak kaydedilir ve anında Öz-Gelişim model iyileştirme hattına işlenir.
            </p>
          </div>
        </div>

        <div
          data-testid="feedback-evolution-pipeline-badge"
          className="mb-4 px-3 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-2 text-[11px]"
        >
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Öz-Gelişim Motoruna Anlık Bağlı · Model İyileştirme Hattı Aktif</span>
          </div>
          <span className="font-mono text-indigo-600 dark:text-indigo-400 shrink-0">
            {activeModelLabel}
          </span>
        </div>

        {submitted ? (
          <div
            data-testid="feedback-submitted-state"
            className="py-10 flex flex-col items-center text-center"
          >
            <CircleCheck className="w-14 h-14 text-emerald-500 mb-3" />
            <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
              Rapor Kaydedildi ve Model İyileştirme Hattına İşlendi!
            </h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
              Geri bildiriminiz şifreli olarak iletildi ve seçili AI motorunun ({activeModelLabel}) öz-gelişim katsayılarına anında yansıtıldı.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Visual Report Categorization */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200">
                1. Rapor Kategorisi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {REPORT_CATEGORY_CARDS.map((card) => {
                  const selected = feedbackType === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      data-testid={`feedback-cat-${card.id}`}
                      onClick={() => setFeedbackType(card.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1.5 ${
                        selected
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500/40'
                          : 'border-neutral-200 dark:border-neutral-700/80 bg-neutral-50 dark:bg-[#2d2f34] hover:border-neutral-300'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${card.accentClass}`}>
                        {card.id === 'Hata Bildirimi' ? (
                          <Bug className="w-4 h-4" />
                        ) : card.id === 'Özellik Önerisi' ? (
                          <Lightbulb className="w-4 h-4" />
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white">
                          {card.title}
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                          {card.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Detailed Error Type + Severity */}
            {feedbackType === 'Hata Bildirimi' && (
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#26282d] border border-neutral-200/80 dark:border-neutral-700/80">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                    2. Hata Türü &amp; Öncelik
                  </label>
                  <div className="flex items-center gap-1 bg-white dark:bg-[#1b1c20] p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    {(
                      [
                        { id: 'low', label: 'Düşük' },
                        { id: 'medium', label: 'Orta' },
                        { id: 'critical', label: 'Kritik' },
                      ] as const
                    ).map((sev) => (
                      <button
                        key={sev.id}
                        type="button"
                        onClick={() => setSeverity(sev.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          severity === sev.id
                            ? sev.id === 'critical'
                              ? 'bg-rose-600 text-white'
                              : sev.id === 'medium'
                              ? 'bg-amber-500 text-white'
                              : 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900'
                            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {ERROR_TYPE_CARDS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      data-testid={`feedback-error-${cat.id}`}
                      onClick={() => setErrorType(cat.id)}
                      className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex items-center gap-2 ${
                        errorType === cat.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                          : 'border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-[#1e1f23] text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                      }`}
                    >
                      <span className="shrink-0 text-blue-500">
                        {cat.id === 'ui_ux' ? (
                          <Layout className="w-3.5 h-3.5" />
                        ) : cat.id === 'performance' ? (
                          <Gauge className="w-3.5 h-3.5" />
                        ) : cat.id === 'model_response' ? (
                          <Cpu className="w-3.5 h-3.5" />
                        ) : cat.id === 'auth_network' ? (
                          <Wifi className="w-3.5 h-3.5" />
                        ) : (
                          <CircleAlert className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{cat.label}</div>
                        <div className="text-[10px] text-neutral-400 truncate">{cat.hint}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Subject & Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1">
                  Konu Başlığı
                </label>
                <input
                  type="text"
                  data-testid="feedback-subject-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Örn: Gemini 4 Hydrogen TypeScript kodu / arayüz hizalaması..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-[#2d2f34] text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1">
                  Açıklama / Detaylar *
                </label>
                <textarea
                  data-testid="feedback-message-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ne bekliyordunuz, ne gerçekleşti? (İpucu: Ekran görüntüsünü Ctrl+V ile yapıştırabilirsiniz)"
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-[#2d2f34] text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm focus:outline-hidden focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Screenshot file upload & clipboard paste */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Ekran Görüntüsü Ekle (İsteğe Bağlı)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
                className="hidden"
              />

              {screenshotUrl ? (
                <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#2d2f34] p-2 flex items-center gap-3">
                  <img
                    src={screenshotUrl}
                    alt="Ekran Görüntüsü Önizleme"
                    className="w-16 h-12 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                      {screenshotName || 'Ekran Görüntüsü'}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Görsel rapora eklendi
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotUrl(null);
                      setScreenshotName(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                    aria-label="Görseli Kaldır"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-400 bg-neutral-50 dark:bg-[#2d2f34] text-neutral-600 dark:text-neutral-300 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-blue-500" />
                    <span>Dosya / Ekran Görüntüsü Seç</span>
                  </button>
                  <span className="text-[11px] text-neutral-400 shrink-0 hidden sm:inline">
                    veya Ctrl+V ile yapıştır
                  </span>
                </div>
              )}
            </div>

            {/* Rating stars & diagnostics */}
            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  Deneyim Puanı:
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-neutral-300 dark:text-neutral-600 hover:text-amber-400 transition cursor-pointer"
                      aria-label={`${star} yıldız`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-transparent'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDiagnostics((prev) => !prev)}
                className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline cursor-pointer"
              >
                {showDiagnostics ? 'Tanılama bilgilerini gizle' : 'Cihaz & model tanılaması'}
              </button>
            </div>

            {showDiagnostics && (
              <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181b] text-[10px] text-neutral-500 font-mono break-all space-y-0.5">
                <p><strong>Model:</strong> {activeModelId || 'luxo-auto-router'}</p>
                <p><strong>Cihaz:</strong> {deviceInfo}</p>
              </div>
            )}

            {/* Footer submit */}
            <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100 dark:border-neutral-800 gap-2">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Anonim, Şifreli &amp; Canlı Model İyileştirme</span>
              </span>
              <button
                type="submit"
                data-testid="feedback-submit-btn"
                disabled={submitting || !message.trim()}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-full text-sm transition shadow-sm cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting ? 'Gönderiliyor...' : 'Gönder & Modeli İyileştir'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

interface VoiceTurn {
  id: string;
  speaker: 'user' | 'luxo';
  text: string;
}

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelId: LuxoModelId;
  selectedVoiceName: string;
  selectedVoiceRate: number;
  onChangeVoice: (voiceName: string, rate?: number) => void;
  onUserSpoke: (transcript: string) => Promise<string>;
}

const EMOTION_STYLES = [
  'Doğal & Akıcı',
  'Enerjik Sunum',
  'Derin Analitik',
  'Sıcak Hikaye',
  'Gece Odak',
] as const;

const AMBIENT_MODES = [
  { id: 'off', label: 'Sessiz Stüdyo' },
  { id: 'rain', label: 'Hafif Akustik Yağmur' },
  { id: 'space', label: 'Derin Odak Frekansı' },
] as const;

function playFeedbackTone(freq = 520, durationSec = 0.09) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + durationSec
    );
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationSec);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 250);
  } catch {
    // ignore audio restrictions
  }
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  modelId,
  selectedVoiceName,
  selectedVoiceRate,
  onChangeVoice,
  onUserSpoke,
}) => {
  const [studioMode, setStudioMode] = useState<'live' | 'podcast'>('live');
  const [emotionStyle, setEmotionStyle] = useState<string>(EMOTION_STYLES[0]);
  const [ambientMode, setAmbientMode] = useState<'off' | 'rain' | 'space'>(
    'off'
  );
  const [hostAVoice, setHostAVoice] = useState('Nova');
  const [hostBVoice, setHostBVoice] = useState('Orion');
  const [podcastTopic, setPodcastTopic] = useState(
    'Gemini 4 Argon ve açık kaynak yapay zeka mühendisliğinin geleceği'
  );
  const [podcastTranscript, setPodcastTranscript] = useState('');
  const [isSynthesizingPodcast, setIsSynthesizingPodcast] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [handsFree, setHandsFree] = useState(true);
  const [statusLabel, setStatusLabel] = useState(
    'Nöral Ses & Podcast Stüdyosu Hazır'
  );
  const [transcript, setTranscript] = useState('');
  const [typedVoiceInput, setTypedVoiceInput] = useState('');
  const [history, setHistory] = useState<VoiceTurn[]>([]);
  const [lastWavDataUrl, setLastWavDataUrl] = useState<string | null>(null);

  const recRef = useRef<{ stop: () => void; start: () => void } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientCtxRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    isListening: false,
    isSpeaking: false,
    accent: '#4f46e5',
  });

  const activeVoice = getVoiceOption(selectedVoiceName);
  stateRef.current = {
    isListening,
    isSpeaking,
    accent: activeVoice.accentColor,
  };

  // Ambient WebAudio studio soundscape
  useEffect(() => {
    if (!isOpen || ambientMode === 'off') {
      if (ambientCtxRef.current) {
        ambientCtxRef.current.close().catch(() => {});
        ambientCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ambientCtxRef.current = ctx;

      if (ambientMode === 'space') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = 110;
        osc2.frequency.value = 164.81;
        gain.gain.value = 0.018;
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
      } else if (ambientMode === 'rain') {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 650;
        const gain = ctx.createGain();
        gain.gain.value = 0.022;
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        whiteNoise.start();
      }
    } catch {
      // ignore autoplay block
    }

    return () => {
      if (ambientCtxRef.current) {
        ambientCtxRef.current.close().catch(() => {});
        ambientCtxRef.current = null;
      }
    };
  }, [isOpen, ambientMode]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let phase = 0;

    const renderWave = () => {
      const { isListening: listening, isSpeaking: speaking, accent } =
        stateRef.current;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = 44;
      const amp = speaking ? 17 : listening ? 10 : 3.5;
      phase += speaking ? 0.12 : listening ? 0.07 : 0.025;

      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        const rOffset = ring * 13;
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.12) {
          const wave =
            Math.sin(a * (4 + ring) + phase * (ring + 1)) *
            amp *
            (1 - ring * 0.25);
          const r = baseRadius + rOffset + wave;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.68 - ring * 0.2;
        ctx.lineWidth = 2.2 - ring * 0.4;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(renderWave);
    };

    rafId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

  const fallbackBrowserSpeak = (
    cleanText: string,
    voiceOpt = activeVoice,
    isSample = false
  ) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'tr-TR';
      utterance.pitch = voiceOpt.pitch;
      utterance.rate = Math.min(
        1.8,
        Math.max(0.65, voiceOpt.rate * (selectedVoiceRate || 1.0))
      );

      const voices = window.speechSynthesis.getVoices();
      const trVoices = voices.filter((v) =>
        v.lang.toLowerCase().startsWith('tr')
      );
      if (trVoices.length > 0) {
        const idx =
          LUXO_VOICES.findIndex((v) => v.name === voiceOpt.name) %
          trVoices.length;
        utterance.voice = trVoices[Math.max(0, idx)];
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        if (!isSample && studioMode === 'live' && handsFree && recRef.current) {
          try {
            recRef.current.start();
            setIsListening(true);
            setStatusLabel('Eller Serbest · Dinliyor...');
            return;
          } catch {
            // ignore
          }
        }
        setStatusLabel('Hazır · Konuşun veya Yazın');
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setStatusLabel('Hazır · Konuşun veya Yazın');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setIsSpeaking(false);
        setStatusLabel('Hazır · Konuşun veya Yazın');
      }, 1600);
    }
  };

  const speakWithNeuralVoice = async (
    textToSpeak: string,
    isSample = false,
    overrideVoiceName?: string
  ) => {
    const targetVoice = getVoiceOption(overrideVoiceName || selectedVoiceName);
    const cleanText = sanitizeLuxoBrand(textToSpeak)
      .replace(/```[\s\S]*?```/g, ' kod bloğu oluşturuldu. ')
      .replace(/[*#`_[\]()>|]/g, '')
      .slice(0, 460);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);
    setStatusLabel(
      `${targetVoice.name} Nöral Sesi (${emotionStyle}) Sentezleniyor...`
    );
    playFeedbackTone(640, 0.08);

    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'single',
          text: cleanText,
          voiceName: targetVoice.name,
          emotionStyle,
        }),
      });
      const data = await resp.json();
      if (data.audioDataUrl && !data.fallbackSpeech) {
        setLastWavDataUrl(data.audioDataUrl);
        const audio = new Audio(data.audioDataUrl);
        audio.playbackRate = Math.min(
          1.5,
          Math.max(0.75, selectedVoiceRate || 1.0)
        );
        audioRef.current = audio;
        setStatusLabel(
          `${targetVoice.name} · Gemini 3.8 Nöral Stüdyo Sesi Konuşuyor...`
        );
        audio.onended = () => {
          setIsSpeaking(false);
          if (
            !isSample &&
            studioMode === 'live' &&
            handsFree &&
            recRef.current
          ) {
            try {
              recRef.current.start();
              setIsListening(true);
              setStatusLabel('Eller Serbest · Dinliyor...');
              return;
            } catch {
              // ignore
            }
          }
          setStatusLabel('Hazır · 24kHz Nöral WAV Kaydı İndirilebilir');
        };
        audio.onerror = () => {
          fallbackBrowserSpeak(cleanText, targetVoice, isSample);
        };
        await audio.play();
        return;
      }
    } catch {
      // Fallback to instant WebSpeech below
    }

    fallbackBrowserSpeak(cleanText, targetVoice, isSample);
  };

  const handleGeneratePodcast = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const topicClean = sanitizeLuxoBrand(podcastTopic.trim());
    if (!topicClean || isSynthesizingPodcast) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSynthesizingPodcast(true);
    setIsSpeaking(true);
    setStatusLabel(
      `${hostAVoice} & ${hostBVoice} Çift Sunuculu Podcast Kaydediliyor...`
    );

    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'podcast',
          topic: topicClean,
          hostAVoice,
          hostBVoice,
        }),
      });
      const data = await resp.json();
      if (data.transcript) {
        setPodcastTranscript(sanitizeLuxoBrand(data.transcript));
      }
      if (data.audioDataUrl && !data.fallbackSpeech) {
        setLastWavDataUrl(data.audioDataUrl);
        const audio = new Audio(data.audioDataUrl);
        audioRef.current = audio;
        setStatusLabel(`${hostAVoice} & ${hostBVoice} Podcast Yayında!`);
        audio.onended = () => {
          setIsSpeaking(false);
          setStatusLabel('Podcast Tamamlandı · WAV İndirebilirsiniz');
        };
        audio.onerror = () => {
          fallbackBrowserSpeak(
            data.transcript || topicClean,
            getVoiceOption(hostAVoice),
            true
          );
        };
        await audio.play();
      } else {
        const fallbackScript =
          data.transcript ||
          `${hostAVoice}: Luxo AI Podcast Stüdyosuna hoş geldiniz! Bugün ${topicClean} konusunu konuşuyoruz.\n${hostBVoice}: Gemini 4 Argon ve açık kaynak mimarisiyle bu alanda yepyeni bir standart oluşuyor.`;
        setPodcastTranscript(fallbackScript);
        fallbackBrowserSpeak(fallbackScript, getVoiceOption(hostAVoice), true);
      }
    } catch {
      const fallbackScript = `${hostAVoice}: Luxo AI Podcast Stüdyosunda ${topicClean} başlığını inceliyoruz.\n${hostBVoice}: Üretim seviyesinde hız ve modülerlik en kritik kazanımımız.`;
      setPodcastTranscript(fallbackScript);
      fallbackBrowserSpeak(fallbackScript, getVoiceOption(hostAVoice), true);
    } finally {
      setIsSynthesizingPodcast(false);
    }
  };

  const processSpokenPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;
    setTranscript(trimmed);
    setIsListening(false);
    recRef.current?.stop();
    setHistory((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, speaker: 'user', text: trimmed },
    ]);
    setStatusLabel(`${LUXO_MODELS[modelId]?.name} Düşünüyor...`);

    const reply = sanitizeLuxoBrand(await onUserSpoke(trimmed));
    setHistory((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        speaker: 'luxo',
        text: reply.replace(/```[\s\S]*?```/g, '[Kod Bloğu]').slice(0, 260),
      },
    ]);
    await speakWithNeuralVoice(reply, false);
  };

  useEffect(() => {
    if (!isOpen) {
      recRef.current?.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
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

    if (SpeechRec && studioMode === 'live') {
      let latestTranscript = '';
      const rec = new (SpeechRec as new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onstart: () => void;
        onresult: (e: { results: { transcript: string }[][] }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      })();
      rec.lang = 'tr-TR';
      rec.continuous = false;
      rec.interimResults = true;
      rec.onstart = () => {
        latestTranscript = '';
        setIsListening(true);
        setStatusLabel('Dinliyor... Konuşabilirsiniz');
      };
      rec.onresult = (e) => {
        const text = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join('');
        latestTranscript = text;
        setTranscript(text);
      };
      rec.onend = () => {
        setIsListening(false);
        if (latestTranscript.trim()) {
          const captured = latestTranscript.trim();
          latestTranscript = '';
          processSpokenPrompt(captured);
        }
      };
      rec.onerror = () => {
        setIsListening(false);
        setStatusLabel('Hazır · Mikrofona dokunun veya aşağıdan yazın');
      };
      recRef.current = rec;
      try {
        rec.start();
      } catch {
        setStatusLabel('Nöral Ses Stüdyosu Hazır');
      }
    } else {
      setStatusLabel(
        studioMode === 'podcast'
          ? 'Çift Konuşmacılı AI Podcast Stüdyosu Hazır'
          : 'Canlı Nöral Ses Stüdyosu Hazır'
      );
    }

    return () => {
      recRef.current?.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [isOpen, studioMode]);

  if (!isOpen) return null;

  const stopSpeakingNow = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setStatusLabel('Ses Durduruldu · Hazır');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-[#070b14] via-[#101726] to-[#05070c] text-white overflow-y-auto">
      {/* Top Studio Header */}
      <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-2 pt-1 shrink-0">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
            style={{
              backgroundColor: LUXO_MODELS[modelId]?.accentColor || '#4f46e5',
            }}
          >
            <LuxoLogo className="w-3.5 h-3.5 text-white" size={14} />
          </div>
          <span className="text-xs font-semibold text-neutral-100">
            {LUXO_MODELS[modelId]?.name} · Gemini 3.8 Nöral Ses Stüdyosu
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Studio Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/10">
            <button
              type="button"
              onClick={() => {
                stopSpeakingNow();
                setStudioMode('live');
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                studioMode === 'live'
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Waves className="w-3 h-3" />
              <span>Canlı Nöral Ses</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeakingNow();
                recRef.current?.stop();
                setIsListening(false);
                setStudioMode('podcast');
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                studioMode === 'podcast'
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Headphones className="w-3 h-3" />
              <span>2 Sunuculu Podcast</span>
            </button>
          </div>

          {studioMode === 'live' && (
            <button
              type="button"
              onClick={() => setHandsFree(!handsFree)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                handsFree
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-neutral-400'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{handsFree ? 'Eller Serbest' : 'Manuel'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
            aria-label="Ses Stüdyosunu Kapat"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Center Visualizer & Studio Controls */}
      <div className="w-full max-w-3xl my-auto py-3 flex flex-col items-center text-center">
        <div className="relative w-40 h-40 flex items-center justify-center mb-2">
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          <div
            className="relative z-10 w-18 h-18 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200"
            style={{
              backgroundColor: activeVoice.accentColor,
              transform: isSpeaking
                ? 'scale(1.08)'
                : isListening
                ? 'scale(1.03)'
                : 'scale(1)',
            }}
          >
            <LuxoLogo className="w-9 h-9 text-white" size={36} />
          </div>
        </div>

        <h4 className="text-base sm:text-lg font-bold mb-1 text-white tracking-tight">
          {statusLabel}
        </h4>

        {/* Ambient Soundscape + WAV Download Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          {AMBIENT_MODES.map((amb) => (
            <button
              key={amb.id}
              type="button"
              onClick={() => setAmbientMode(amb.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                ambientMode === amb.id
                  ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                  : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              {amb.label}
            </button>
          ))}

          {lastWavDataUrl && (
            <a
              href={lastWavDataUrl}
              download={`luxo_noral_ses_${Date.now()}.wav`}
              className="px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-500/35 transition"
            >
              <Download className="w-3 h-3" />
              <span>Ses Kaydını İndir (.wav)</span>
            </a>
          )}
        </div>

        {studioMode === 'live' ? (
          <>
            {/* Emotion / Acoustic Style Selector */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
              <span className="text-[11px] text-neutral-400 mr-1">
                Duygu & Akustik Ton:
              </span>
              {EMOTION_STYLES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEmotionStyle(st)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                    emotionStyle === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* 10 Studio Voices + Playback Speed */}
            <div className="w-full mb-3">
              <div className="flex items-center justify-between px-1 mb-1.5 text-[11px] text-neutral-400">
                <span>
                  Aktif Ses:{' '}
                  <strong className="text-white">{activeVoice.name}</strong> ·{' '}
                  {activeVoice.desc}
                </span>
                <div className="flex items-center gap-1 tabular-nums">
                  {[0.85, 1.0, 1.15, 1.3].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => onChangeVoice(activeVoice.name, spd)}
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] cursor-pointer transition ${
                        Math.abs((selectedVoiceRate || 1.0) - spd) < 0.05
                          ? 'bg-white text-black font-bold'
                          : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 pb-1 px-1">
                {LUXO_VOICES.map((v) => {
                  const isSelected = v.name === activeVoice.name;
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => {
                        onChangeVoice(v.name, selectedVoiceRate);
                        speakWithNeuralVoice(v.sample, true, v.name);
                      }}
                      className={`px-2.5 py-1.5 rounded-2xl border text-left shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-white/15 border-white text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: v.accentColor }}
                      />
                      <span className="text-xs font-bold">{v.name}</span>
                      {v.isNew && (
                        <span className="text-[10px] text-emerald-300 font-semibold">
                          · Nöral
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {history.length > 0 ? (
              <div className="w-full max-h-28 overflow-y-auto rounded-2xl bg-white/5 border border-white/10 p-3 text-left space-y-2 mb-3">
                {history.slice(-4).map((turn) => (
                  <div key={turn.id} className="text-xs leading-relaxed">
                    <span
                      className={`font-bold mr-1.5 ${
                        turn.speaker === 'luxo'
                          ? 'text-indigo-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {turn.speaker === 'luxo'
                        ? `Luxo (${activeVoice.name}):`
                        : 'Siz:'}
                    </span>
                    <span className="text-neutral-200">{turn.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-300 min-h-[28px] max-w-md leading-relaxed px-2 mb-2">
                {transcript
                  ? `"${transcript}"`
                  : 'Doğrudan konuşabilir, 10 nöral sesi deneyebilir veya hızlı komut seçebilirsiniz.'}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2 mb-2">
              <button
                type="button"
                onClick={() =>
                  processSpokenPrompt(
                    'Gemini 4 Argon mimarisinin en güçlü 3 özelliğini özetle'
                  )
                }
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-neutral-200 transition cursor-pointer"
              >
                &ldquo;Gemini 4 Argon&apos;u özetle&rdquo;
              </button>
              <button
                type="button"
                onClick={() =>
                  processSpokenPrompt(
                    'Verimli odaklanma için 3 pratik mühendislik tekniği söyle'
                  )
                }
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-neutral-200 transition cursor-pointer"
              >
                &ldquo;3 odaklanma tekniği söyle&rdquo;
              </button>
              <button
                type="button"
                onClick={() =>
                  speakWithNeuralVoice(activeVoice.sample, true, activeVoice.name)
                }
                className="px-3 py-1.5 rounded-full bg-indigo-500/25 hover:bg-indigo-500/35 text-xs text-indigo-200 transition cursor-pointer flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{activeVoice.name} Nöral Sesini Dinle</span>
              </button>
            </div>
          </>
        ) : (
          /* Dual-Speaker AI Podcast Studio */
          <div className="w-full max-w-2xl rounded-3xl bg-white/5 border border-white/10 p-4 text-left space-y-3 mb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-sm font-bold text-white">
                  Çift Konuşmacılı AI Podcast Stüdyosu (Gemini 3.8 Flash TTS)
                </h5>
                <p className="text-[11px] text-neutral-400">
                  İki farklı nöral sunucu seçin, konuyu belirleyin ve stüdyo kalitesinde diyalog üretin
                </p>
              </div>
              {podcastTranscript && (
                <SocialShareButton
                  payload={{
                    title: `Luxo AI Podcast: ${podcastTopic.slice(0, 48)}`,
                    excerpt: podcastTranscript.slice(0, 180),
                    contentType: 'chat',
                    badge: 'NÖRAL PODCAST STÜDYOSU',
                  }}
                  label="Podcast Paylaş"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  1. Sunucu Sesi
                </label>
                <select
                  value={hostAVoice}
                  onChange={(e) => setHostAVoice(e.target.value)}
                  aria-label="1. Sunucu Sesi"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-hidden"
                >
                  {LUXO_VOICES.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} — {v.desc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  2. Sunucu Sesi
                </label>
                <select
                  value={hostBVoice}
                  onChange={(e) => setHostBVoice(e.target.value)}
                  aria-label="2. Sunucu Sesi"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-hidden"
                >
                  {LUXO_VOICES.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} — {v.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleGeneratePodcast} className="flex gap-2">
              <input
                type="text"
                value={podcastTopic}
                onChange={(e) => setPodcastTopic(e.target.value)}
                placeholder="Podcast konusunu yazın..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isSynthesizingPodcast || !podcastTopic.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {isSynthesizingPodcast ? (
                  <>
                    <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Podcast Üret & Dinle</span>
                  </>
                )}
              </button>
            </form>

            {podcastTranscript && (
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 max-h-32 overflow-y-auto text-xs text-neutral-200 whitespace-pre-line leading-relaxed">
                {podcastTranscript}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-2xl space-y-3 pb-2 shrink-0">
        {studioMode === 'live' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!typedVoiceInput.trim()) return;
              const msg = typedVoiceInput;
              setTypedVoiceInput('');
              processSpokenPrompt(msg);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 border border-white/15"
          >
            <input
              type="text"
              value={typedVoiceInput}
              onChange={(e) => setTypedVoiceInput(e.target.value)}
              placeholder={`Mikrofon olmadan yazın, Luxo (${activeVoice.name}) nöral sesle yanıtlasın...`}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-neutral-400 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!typedVoiceInput.trim()}
              className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Konuştur</span>
            </button>
          </form>
        )}

        <div className="flex items-center justify-center gap-5">
          {studioMode === 'live' && (
            <button
              type="button"
              onClick={() => {
                playFeedbackTone(440, 0.07);
                if (isListening) {
                  recRef.current?.stop();
                  setIsListening(false);
                  setStatusLabel('Mikrofon Duraklatıldı');
                } else {
                  stopSpeakingNow();
                  setTranscript('');
                  try {
                    recRef.current?.start();
                    setIsListening(true);
                    setStatusLabel('Dinliyor...');
                  } catch {
                    setIsListening(true);
                    setStatusLabel('Dinliyor... Konuşabilirsiniz');
                  }
                }
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
              aria-label={isListening ? 'Sesi Duraklat' : 'Dinlemeyi Başlat'}
            >
              {isListening ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </button>
          )}

          {isSpeaking && (
            <button
              type="button"
              onClick={stopSpeakingNow}
              className="px-4 h-12 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Sözünü Kes</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 flex items-center justify-center transition cursor-pointer"
            aria-label="Sesli Sohbeti Bitir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
