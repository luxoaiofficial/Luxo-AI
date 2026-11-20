import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Briefcase,
  Bug,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Copy,
  Database,
  Download,
  ExternalLink,
  GitBranch,
  Globe,
  Grid3x3,
  HardDrive,
  Info,
  KeyRound,
  LogOut,
  Mail,
  MailCheck,
  Megaphone,
  Mic,
  Moon,
  Pen,
  QrCode,
  RefreshCw,
  Rocket,
  Search,
  Shield,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  Sun,
  Terminal,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { LuxoPlugin, LuxoUser } from '../types/luxo';
import {
  LUXO_MODELS,
  LUXO_MODEL_IDS,
  LUXO_VOICES,
  sanitizeLuxoBrand,
} from '../utils/luxoLogic';
import {
  buildGithubPushCommands,
  GITHUB_REPO_STORAGE_KEY,
  parseAndValidateGithubRepoUrl,
  PROJECT_GITHUB_PIPELINE,
} from '../utils/githubInfo';
import { LuxoLogo } from './LuxoLogo';

interface SettingsViewProps {
  onBack: () => void;
  user: LuxoUser;
  onUpdateUser: (partial: Partial<LuxoUser>) => void;
  memoryItems: string[];
  onUpdateMemory: (items: string[]) => void;
  plugins: LuxoPlugin[];
  onTogglePlugin: (id: string) => void;
  onOpenUpgradeModal: () => void;
  onOpenFeedbackModal: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onClearAllChats: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenGmail?: () => void;
  onResendVerification?: () => Promise<void>;
  onRefreshVerification?: () => Promise<boolean>;
  onPasswordResetRequest?: () => void;
  initialSubModal?: string | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  user,
  onUpdateUser,
  memoryItems,
  onUpdateMemory,
  plugins,
  onTogglePlugin,
  onOpenUpgradeModal,
  onOpenFeedbackModal,
  onOpenAuthModal,
  onSignOut,
  onClearAllChats,
  unreadNotificationCount = 0,
  onOpenNotifications,
  onOpenGmail,
  onResendVerification,
  onRefreshVerification,
  onPasswordResetRequest,
  initialSubModal = null,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [subView, setSubView] = useState<string | null>(initialSubModal);
  const [tone, setTone] = useState(user.customTone || 'Varsayılan');
  const [warmth, setWarmth] = useState(user.customWarmth || 'Varsayılan');
  const [enthusiasm, setEnthusiasm] = useState(
    user.customEnthusiasm || 'Varsayılan'
  );
  const [formatting, setFormatting] = useState(
    user.customFormatting || 'Varsayılan'
  );
  const [emojiLevel, setEmojiLevel] = useState(
    user.customEmoji || 'Varsayılan'
  );
  const [customInstructions, setCustomInstructions] = useState(
    user.customInstructions || ''
  );
  const [pickerSheet, setPickerSheet] = useState<string | null>(null);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [reduceSensitive, setReduceSensitive] = useState(true);
  const [parentalSafeSearch, setParentalSafeSearch] = useState(true);
  const [breakReminder, setBreakReminder] = useState(false);
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(
    user.voiceName || 'Breeze'
  );
  const [selectedRate, setSelectedRate] = useState(user.voiceRate || 1.0);
  const [workspaceName, setWorkspaceName] = useState(
    user.workspaceType || 'Kişisel'
  );
  const [profileName, setProfileName] = useState(
    user.name || 'Luxo Kullanıcısı'
  );
  const [toast, setToast] = useState<string | null>(null);

  // AI Tuning state
  const [defaultModelId, setDefaultModelId] = useState<LuxoUser['defaultModelId']>(
    user.defaultModelId || 'luxo-auto-router'
  );
  const [reasoningLevel, setReasoningLevel] = useState<'fast' | 'balanced' | 'deep'>(
    user.reasoningLevel || 'balanced'
  );
  const [temperature, setTemperature] = useState<number>(
    typeof user.temperature === 'number' ? user.temperature : 0.7
  );
  const [showThinkingSteps, setShowThinkingSteps] = useState<boolean>(
    user.showThinkingSteps ?? true
  );
  const [codeTheme, setCodeTheme] = useState<'dark' | 'dracula' | 'light'>(
    user.codeTheme || 'dark'
  );
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>(
    user.fontSize || 'base'
  );
  const [streamSpeed, setStreamSpeed] = useState<'normal' | 'turbo' | 'instant'>(
    user.streamSpeed || 'turbo'
  );
  const [responseConciseness, setResponseConciseness] = useState<
    'concise' | 'balanced' | 'detailed'
  >(user.responseConciseness || 'balanced');
  const [codeStrictness, setCodeStrictness] = useState<'production' | 'explained'>(
    user.codeStrictness || 'production'
  );
  const [autoVerifyOutputs, setAutoVerifyOutputs] = useState<boolean>(
    user.autoVerifyOutputs ?? true
  );

  // Direct Standalone link & QR modal state
  const [copiedDirectLink, setCopiedDirectLink] = useState(false);
  const [showDirectQrModal, setShowDirectQrModal] = useState(false);
  const [directQrDataUrl, setDirectQrDataUrl] = useState('');
  const [savedGithubRepo, setSavedGithubRepo] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(GITHUB_REPO_STORAGE_KEY) || '';
      const parsed = parseAndValidateGithubRepoUrl(raw);
      return parsed.valid && parsed.canonicalUrl ? parsed.canonicalUrl : '';
    } catch {
      return '';
    }
  });
  const [githubRepoInput, setGithubRepoInput] = useState<string>(() => {
    try {
      return localStorage.getItem(GITHUB_REPO_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [githubRepoError, setGithubRepoError] = useState<string | null>(null);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const STANDALONE_DIRECT_URL =
    'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/';

  useEffect(() => {
    if (initialSubModal !== undefined) {
      setSubView(initialSubModal);
    }
  }, [initialSubModal]);

  const parsedSavedGithubRepo = savedGithubRepo
    ? parseAndValidateGithubRepoUrl(savedGithubRepo)
    : null;

  const handleSaveGithubRepo = (e: React.FormEvent) => {
    e.preventDefault();
    const res = parseAndValidateGithubRepoUrl(githubRepoInput);
    if (!res.valid || !res.canonicalUrl) {
      setGithubRepoError(res.error || 'Geçersiz GitHub depo adresi.');
      return;
    }
    setGithubRepoError(null);
    setSavedGithubRepo(res.canonicalUrl);
    setGithubRepoInput(res.canonicalUrl);
    try {
      localStorage.setItem(GITHUB_REPO_STORAGE_KEY, res.canonicalUrl);
    } catch {
      // ignore storage quota errors
    }
    showToast('GitHub depo bağlantısı kaydedildi.');
  };

  const handleClearGithubRepo = () => {
    setSavedGithubRepo('');
    setGithubRepoInput('');
    setGithubRepoError(null);
    try {
      localStorage.removeItem(GITHUB_REPO_STORAGE_KEY);
    } catch {
      // ignore
    }
    showToast('GitHub depo bağlantısı temizlendi.');
  };

  const handleCopyTextSafe = (txt: string, onSuccess: () => void) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(txt).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {
      // ignore
    }
    onSuccess();
  };

  useEffect(() => {
    if (showDirectQrModal) {
      QRCode.toDataURL(STANDALONE_DIRECT_URL, {
        width: 320,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => setDirectQrDataUrl(url))
        .catch(() => setDirectQrDataUrl(''));
    }
  }, [showDirectQrModal]);

  const handleCopyDirectLink = () => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(STANDALONE_DIRECT_URL);
      } else {
        const ta = document.createElement('textarea');
        ta.value = STANDALONE_DIRECT_URL;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {
      // fallback
    }
    setCopiedDirectLink(true);
    showToast('Doğrudan Canlı Site Bağlantısı Kopyalandı!');
    setTimeout(() => setCopiedDirectLink(false), 2200);
  };

  const handleSaveAiTuning = () => {
    onUpdateUser({
      defaultModelId,
      reasoningLevel,
      temperature,
      showThinkingSteps,
      codeTheme,
      fontSize,
      streamSpeed,
      responseConciseness,
      codeStrictness,
      autoVerifyOutputs,
    });
    setSubView(null);
    showToast('Yapay Zeka ve Model ayarları kaydedildi.');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSaveCustomization = () => {
    onUpdateUser({
      customTone: tone,
      customWarmth: warmth,
      customEnthusiasm: enthusiasm,
      customFormatting: formatting,
      customEmoji: emojiLevel,
      customInstructions: sanitizeLuxoBrand(customInstructions),
    });
    setSubView(null);
    showToast('Kişiselleştirme ayarları kaydedildi.');
  };

  const resolvedIsDark =
    user.theme === 'dark' ||
    (user.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const handleThemeChange = (theme: 'system' | 'light' | 'dark') => {
    onUpdateUser({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    showToast(
      `Görünüm "${
        theme === 'dark' ? 'Koyu' : theme === 'light' ? 'Açık' : 'Sistem'
      }" olarak ayarlandı.`
    );
  };

  const handleExportSettingsJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      preferences: {
        theme: user.theme,
        defaultModelId,
        reasoningLevel,
        temperature,
        showThinkingSteps,
        codeTheme,
        fontSize,
        streamSpeed,
        responseConciseness,
        codeStrictness,
        autoVerifyOutputs,
        customTone: tone,
        customWarmth: warmth,
        customEnthusiasm: enthusiasm,
        customFormatting: formatting,
        customEmoji: emojiLevel,
        customInstructions: sanitizeLuxoBrand(customInstructions),
        workspaceType: workspaceName,
        voiceName: selectedVoice,
        voiceRate: selectedRate,
      },
      memoryItems: memoryItems.map((m) => sanitizeLuxoBrand(m)),
    };
    const uri = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(payload, null, 2)
    )}`;
    const a = document.createElement('a');
    a.href = uri;
    a.download = 'luxo_ai_ayarlar.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Yapılandırma ve ayar yedeği (.json) indirildi.');
  };

  const handleResetSettingsDefaults = () => {
    setTone('Varsayılan');
    setWarmth('Varsayılan');
    setEnthusiasm('Varsayılan');
    setFormatting('Varsayılan');
    setEmojiLevel('Varsayılan');
    setCustomInstructions('');
    setDefaultModelId('luxo-auto-router');
    setReasoningLevel('balanced');
    setTemperature(0.7);
    setShowThinkingSteps(true);
    setCodeTheme('dark');
    setFontSize('base');
    setStreamSpeed('turbo');
    setResponseConciseness('balanced');
    setCodeStrictness('production');
    setAutoVerifyOutputs(true);
    setSelectedVoice('Breeze');
    setSelectedRate(1.0);
    setWorkspaceName('Kişisel');
    onUpdateUser({
      theme: 'system',
      defaultModelId: 'luxo-auto-router',
      reasoningLevel: 'balanced',
      temperature: 0.7,
      showThinkingSteps: true,
      codeTheme: 'dark',
      fontSize: 'base',
      streamSpeed: 'turbo',
      responseConciseness: 'balanced',
      codeStrictness: 'production',
      autoVerifyOutputs: true,
      customTone: 'Varsayılan',
      customWarmth: 'Varsayılan',
      customEnthusiasm: 'Varsayılan',
      customFormatting: 'Varsayılan',
      customEmoji: 'Varsayılan',
      customInstructions: '',
      workspaceType: 'Kişisel',
      voiceName: 'Breeze',
      voiceRate: 1.0,
    });
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    showToast('Tüm tercihler önerilen varsayılanlara sıfırlandı.');
  };

  const matchesSearch = (label: string) =>
    !searchFilter.trim() ||
    label.toLowerCase().includes(searchFilter.toLowerCase());

  if (subView === 'customization') {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#000000] border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold tracking-tight">Kişiselleştirme</h2>
          <button
            type="button"
            onClick={handleSaveCustomization}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-neutral-900 dark:text-white"
            aria-label="Kaydet"
            title="Kaydet"
          >
            <Check className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24 max-w-xl mx-auto w-full space-y-6">
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs overflow-hidden">
            {[
              { id: 'tone', label: 'Temel üslup ve ton', value: tone },
              { id: 'warmth', label: 'Samimiyet', value: warmth },
              { id: 'enthusiasm', label: 'Coşku', value: enthusiasm },
              {
                id: 'formatting',
                label: 'Başlıklar ve listeler',
                value: formatting,
              },
              { id: 'emoji', label: 'Emoji', value: emojiLevel },
            ].map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setPickerSheet(row.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {row.label}
                </span>
                <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-sm">
                  <span>{row.value}</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 px-1">
              Özel talimatlar
            </h3>
            <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs">
              <textarea
                rows={6}
                maxLength={1500}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Luxo AI'nın yanıt verirken dikkate almasını istediğin diğer her şeyi paylaş."
                className="w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none resize-none leading-relaxed"
              />
              <div className="flex justify-end text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800 tabular-nums">
                {customInstructions.length}/1500
              </div>
            </div>
          </div>

          <button
            type="button"
            data-testid="settings-save-customization-btn"
            onClick={handleSaveCustomization}
            className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition active:scale-99 cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Kişiselleştirme Ayarlarını Kaydet</span>
          </button>
        </div>

        {pickerSheet && (
          <div
            onClick={() => setPickerSheet(null)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-white dark:bg-[#202123] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-neutral-200 dark:border-neutral-700 space-y-1"
            >
              {pickerSheet === 'tone'
                ? [
                    { label: 'Varsayılan', desc: 'Standart dengeli üslup' },
                    { label: 'Profesyonel', desc: 'Özenli, resmi ve net' },
                    { label: 'Dostane', desc: 'Samimi ve hoşsohbet' },
                    { label: 'İçten', desc: 'Açık sözlü ve cesaretlendirici' },
                    {
                      label: 'Sıra Dışı',
                      desc: 'Eğlenceli ve hayal gücü yüksek',
                    },
                    { label: 'Etkili', desc: 'Kısa, öz ve doğrudan' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setTone(opt.label);
                        setPickerSheet(null);
                      }}
                      className="w-full p-3 text-left rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-bold text-neutral-900 dark:text-white">
                          {opt.label}
                        </div>
                        <div className="text-xs text-neutral-500">{opt.desc}</div>
                      </div>
                      {tone === opt.label && (
                        <Check className="w-5 h-5 text-neutral-900 dark:text-white shrink-0" />
                      )}
                    </button>
                  ))
                : ['Daha fazla', 'Varsayılan', 'Daha az'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        if (pickerSheet === 'warmth') setWarmth(opt);
                        if (pickerSheet === 'enthusiasm') setEnthusiasm(opt);
                        if (pickerSheet === 'formatting') setFormatting(opt);
                        if (pickerSheet === 'emoji') setEmojiLevel(opt);
                        setPickerSheet(null);
                      }}
                      className="w-full p-3.5 text-left rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="text-sm font-bold text-neutral-900 dark:text-white">
                        {opt}
                      </div>
                      {(pickerSheet === 'warmth'
                        ? warmth
                        : pickerSheet === 'enthusiasm'
                        ? enthusiasm
                        : pickerSheet === 'formatting'
                        ? formatting
                        : emojiLevel) === opt && (
                        <Check className="w-5 h-5 text-neutral-900 dark:text-white shrink-0" />
                      )}
                    </button>
                  ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (subView === 'plugins') {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-full shadow-lg">
            {toast}
          </div>
        )}
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#000000] border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold tracking-tight">
            Eklentiler & Araçlar
          </h2>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 max-w-xl mx-auto w-full space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-500 px-2">
              Aktif Luxo AI Yetenek Modülleri
            </h3>
            <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs overflow-hidden">
              {plugins.map((pl) => (
                <div
                  key={pl.id}
                  className="flex items-center justify-between p-4 gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: pl.color }}
                    >
                      <LuxoLogo className="w-4 h-4 text-white" size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold block truncate">
                        {pl.name}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 block">
                        {pl.description}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePlugin(pl.id);
                      showToast(
                        `${pl.name} ${
                          pl.enabled ? 'devre dışı bırakıldı' : 'etkinleştirildi'
                        }.`
                      );
                    }}
                    className="cursor-pointer shrink-0"
                    aria-label={`${pl.name} durumunu değiştir`}
                  >
                    {pl.enabled ? (
                      <ToggleRight className="w-7 h-7 text-blue-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-neutral-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'memory') {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-full shadow-lg">
            {toast}
          </div>
        )}
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#000000] border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold tracking-tight">Bellek</h2>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-xl mx-auto w-full space-y-4">
          <p className="text-xs text-neutral-500 leading-relaxed px-1">
            Siz sohbet ettikçe Luxo AI önemli tercihleri ve teknik detayları hatırlar; bu da yanıtları daha tutarlı ve kişiselleştirilmiş hale getirir.
          </p>

          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Bellek Özelliği</h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Açık olduğunda detaylar otomatik olarak hatırlanır.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMemoryEnabled(!memoryEnabled);
                showToast(
                  memoryEnabled ? 'Bellek kapatıldı.' : 'Bellek etkinleştirildi.'
                );
              }}
              className="cursor-pointer"
              aria-label="Bellek özelliğini değiştir"
            >
              {memoryEnabled ? (
                <ToggleRight className="w-7 h-7 text-blue-500" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-neutral-400" />
              )}
            </button>
          </div>

          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">
                Belleği Yönet ({memoryItems.length} detay)
              </span>
              {memoryItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateMemory([]);
                    showToast('Tüm bellek temizlendi.');
                  }}
                  className="text-xs text-red-500 font-medium cursor-pointer"
                >
                  Tümünü Temizle
                </button>
              )}
            </div>

            <div className="space-y-2">
              {memoryItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl text-xs"
                >
                  <span className="pr-2">{sanitizeLuxoBrand(item)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateMemory(memoryItems.filter((_, i) => i !== idx))
                    }
                    className="p-1 text-neutral-400 hover:text-red-500 cursor-pointer"
                    aria-label="Bellek kaydını sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newMemoryInput}
                onChange={(e) => setNewMemoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newMemoryInput.trim()) {
                    onUpdateMemory([
                      ...memoryItems,
                      sanitizeLuxoBrand(newMemoryInput.trim()),
                    ]);
                    setNewMemoryInput('');
                    showToast('Yeni detay belleğe eklendi.');
                  }
                }}
                placeholder="Örn: Kullanıcı TypeScript ve açık kaynak tercih eder..."
                className="flex-1 px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-xl outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (newMemoryInput.trim()) {
                    onUpdateMemory([
                      ...memoryItems,
                      sanitizeLuxoBrand(newMemoryInput.trim()),
                    ]);
                    setNewMemoryInput('');
                    showToast('Yeni detay belleğe eklendi.');
                  }
                }}
                className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold cursor-pointer"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'voice') {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-full shadow-lg">
            {toast}
          </div>
        )}
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#000000] border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold tracking-tight">
            Ses Stüdyosu (10 Ses)
          </h2>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 max-w-xl mx-auto w-full space-y-4">
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-bold block">Konuşma Hızı</span>
              <span className="text-xs text-neutral-400">
                Sesli yanıtların okuma temposu
              </span>
            </div>
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
              {[0.85, 1.0, 1.15, 1.3].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => {
                    setSelectedRate(spd);
                    onUpdateUser({ voiceRate: spd });
                    showToast(`Konuşma hızı ${spd}x olarak ayarlandı.`);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold cursor-pointer transition ${
                    Math.abs(selectedRate - spd) < 0.05
                      ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-neutral-500'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {LUXO_VOICES.map((voice) => (
              <div
                key={voice.name}
                onClick={() => {
                  setSelectedVoice(voice.name);
                  onUpdateUser({ voiceName: voice.name });
                  showToast(`Ses tonu "${voice.name}" olarak ayarlandı.`);
                }}
                className={`p-4 rounded-3xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  selectedVoice === voice.name
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181b]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: voice.accentColor }}
                  >
                    <LuxoLogo className="w-4 h-4 text-white" size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {voice.name}
                      </span>
                      {voice.isNew && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          YENİ
                        </span>
                      )}
                      {selectedVoice === voice.name && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">
                      {voice.desc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance(voice.sample);
                      u.lang = 'tr-TR';
                      u.pitch = voice.pitch;
                      u.rate = Math.min(
                        1.8,
                        Math.max(0.65, voice.rate * selectedRate)
                      );
                      window.speechSynthesis.speak(u);
                    }
                    showToast(`"${voice.name}" ses önizlemesi çalınıyor...`);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Dinle</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'profile') {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#000000] border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold tracking-tight">Profil Bilgileri</h2>
          <button
            type="button"
            onClick={() => {
              const safe = sanitizeLuxoBrand(profileName.split('@')[0]).trim() || 'Luxo Kullanıcısı';
              onUpdateUser({
                name: safe,
                avatarText: safe.slice(0, 2).toUpperCase() || 'LX',
              });
              setSubView(null);
              showToast('Profil adı güncellendi.');
            }}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs text-neutral-900 dark:text-white cursor-pointer"
            aria-label="Kaydet"
          >
            <Check className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-xl mx-auto w-full space-y-4">
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5">
                Görünen Adınız
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-2xl outline-none"
              />
            </div>

            {/* Account Security & Email Verification Controls */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#202124] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <MailCheck className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    Hesap Güvenliği &amp; E-posta Doğrulama
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    user.isGuest
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                      : user.emailVerified !== false
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {user.isGuest
                    ? 'Misafir Modu'
                    : user.emailVerified !== false
                    ? 'Doğrulandı'
                    : 'Doğrulama Bekliyor'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {user.isGuest ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSubView(null);
                      onOpenAuthModal();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>E-posta veya Google ile Giriş Yap / Kayıt Ol</span>
                  </button>
                ) : (
                  <>
                    {user.emailVerified === false && onResendVerification && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onResendVerification();
                          showToast('Doğrulama bağlantısı e-posta adresinize gönderildi.');
                        }}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <MailCheck className="w-3.5 h-3.5" />
                        <span>Doğrulama E-postasını Tekrar Gönder</span>
                      </button>
                    )}
                    {onRefreshVerification && (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await onRefreshVerification();
                          showToast(
                            ok
                              ? 'Hesabınız doğrulandı ve aktif edildi!'
                              : 'Doğrulama henüz onaylanmadı; gelen kutunuzu kontrol edin.'
                          );
                        }}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Doğrulamayı Yenile</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (onPasswordResetRequest) {
                          onPasswordResetRequest();
                        } else {
                          onOpenAuthModal();
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      <span>Şifre Sıfırlama Gönder</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Gizlilik Koruması Aktif: E-posta adresiniz Luxo AI üzerinde hiçbir ekranda gösterilmez ve paylaşılmaz.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'data' || subView === 'storage') {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#000000] border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold tracking-tight">
            {subView === 'storage' ? 'Depolama' : 'Geçmiş ve veriler'}
          </h2>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-xl mx-auto w-full space-y-4">
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Senkronizasyon Modu</span>
              <span className="font-bold text-blue-500">
                {user.isGuest ? 'Yerel Önbellek' : 'Firebase Bulut + Yerel'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Veri Koruma Standardı</span>
              <span className="font-bold text-emerald-500">
                Sıfır E-posta Teşhiri
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => {
                const raw = localStorage.getItem('luxo_chats') || '[]';
                const uri = `data:text/json;charset=utf-8,${encodeURIComponent(
                  raw
                )}`;
                const a = document.createElement('a');
                a.href = uri;
                a.download = 'luxo_ai_verileri.json';
                document.body.appendChild(a);
                a.click();
                a.remove();
                showToast('Veriler JSON olarak indirildi.');
              }}
              className="w-full p-4 text-left text-sm font-medium flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition"
            >
              <span>Verileri Dışa Aktar (.json)</span>
              <Download className="w-4 h-4 text-neutral-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                onClearAllChats();
                localStorage.removeItem('luxo_chats');
                showToast('Tüm sohbet geçmişi silindi.');
                setSubView(null);
              }}
              className="w-full p-4 text-left text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition flex items-center justify-between"
            >
              <span>Tüm Sohbetleri Sil</span>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'ai_tuning') {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#000000] border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold tracking-tight">
            Yapay Zeka & Model Ayarları
          </h2>
          <button
            type="button"
            onClick={handleSaveAiTuning}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Kaydet"
          >
            <Check className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 max-w-xl mx-auto w-full space-y-5">
          {/* Default Model */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-3">
            <div>
              <span className="text-sm font-bold block text-neutral-900 dark:text-white">
                Varsayılan Model Tercihi
              </span>
              <span className="text-xs text-neutral-500">
                Yeni sohbet başlattığınızda otomatik atanacak model
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { id: 'luxo-auto-router', name: 'Luxo Auto-Router (Önerilen)' },
                { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen (Yeni · Yüksek Doğruluk)' },
                { id: 'gemini-4-argon', name: 'Gemini 4 Argon (Amiral Gemisi)' },
                { id: 'gemini-3-8-flash', name: 'Gemini 3.8 Flash' },
                { id: 'deepseek-r2', name: 'DeepSeek R2 Muhakeme' },
                { id: 'chatgpt-5-2-pro', name: 'ChatGPT-5.2 Pro' },
                { id: 'claude-4-6-opus', name: 'Claude 4.6 Opus' },
                { id: 'qwen-3-max', name: 'Qwen 3 Max' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`settings-default-model-${m.id}`}
                  onClick={() => setDefaultModelId(m.id as LuxoUser['defaultModelId'])}
                  className={`p-3 rounded-2xl text-left border transition cursor-pointer font-medium ${
                    defaultModelId === m.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1f2024] text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Reasoning Level */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-3">
            <div>
              <span className="text-sm font-bold block text-neutral-900 dark:text-white">
                Akıl Yürütme (Reasoning) Derinliği
              </span>
              <span className="text-xs text-neutral-500">
                Yapay zekanın cevap üretmeden önceki düşünce derinliği
              </span>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'fast', label: 'Hızlı', desc: 'Düşük gecikme' },
                { id: 'balanced', label: 'Dengeli', desc: 'Standart akıl yürütme' },
                { id: 'deep', label: 'Derin Analitik', desc: 'Maksimum kanıt & doğrulama' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setReasoningLevel(lvl.id as typeof reasoningLevel)}
                  className={`flex-1 p-3 rounded-2xl text-center border transition cursor-pointer ${
                    reasoningLevel === lvl.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1f2024] text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="text-xs font-bold">{lvl.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{lvl.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-sm font-medium block">
                  Düşünce Adımlarını Açık Tut
                </span>
                <span className="text-xs text-neutral-400">
                  Modelin iç akıl yürütme adımlarını yanıtta göster
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowThinkingSteps(!showThinkingSteps)}
                className="cursor-pointer"
                aria-label="Düşünce Adımlarını Açık Tut"
              >
                {showThinkingSteps ? (
                  <ToggleRight className="w-7 h-7 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-neutral-400" />
                )}
              </button>
            </div>
          </div>

          {/* Response Stream Speed */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-sm font-bold block text-neutral-900 dark:text-white">
                  Yanıt Akış Hızı
                </span>
                <span className="text-xs text-neutral-500">
                  Ekranda kelime akışı ve tepki çevikliği modu
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(
                [
                  { id: 'normal', label: 'Standart', desc: 'Okuması rahat' },
                  { id: 'turbo', label: 'Turbo', desc: 'Yüksek hız (Önerilen)' },
                  { id: 'instant', label: 'Anlık', desc: 'Maksimum akış' },
                ] as const
              ).map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  data-testid={`settings-stream-speed-${sp.id}`}
                  onClick={() => setStreamSpeed(sp.id)}
                  className={`p-2.5 rounded-2xl text-center border transition cursor-pointer ${
                    streamSpeed === sp.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1f2024] text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="font-bold">{sp.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{sp.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Temperature / Creativity Slider */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold block text-neutral-900 dark:text-white">
                  Yaratıcılık & Sıcaklık ({temperature.toFixed(1)})
                </span>
                <span className="text-xs text-neutral-500">
                  {temperature <= 0.3
                    ? 'Deterministik & Teknik Kesinlik'
                    : temperature <= 0.7
                    ? 'Dengeli & Doğal Akış'
                    : 'Yüksek Yaratıcılık & Zengin Kelime Dağarcığı'}
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
              <span>0.0 (Kesin)</span>
              <span>0.5</span>
              <span>1.0 (Yaratıcı)</span>
            </div>
          </div>

          {/* Code Theme & Typography */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-4">
            <div>
              <span className="text-sm font-bold block text-neutral-900 dark:text-white">
                Görünüm & Tipografi
              </span>
              <span className="text-xs text-neutral-500">
                Kod blokları ve metin ölçeklendirme tercihleriniz
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Yazı Boyutu
              </span>
              <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl">
                {[
                  { id: 'sm', label: 'Küçük' },
                  { id: 'base', label: 'Standart' },
                  { id: 'lg', label: 'Büyük' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontSize(f.id as typeof fontSize)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                      fontSize === f.id
                        ? 'bg-white dark:bg-[#18181b] text-neutral-900 dark:text-white shadow-xs font-bold'
                        : 'text-neutral-500'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Kod Bloğu Teması
              </span>
              <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl">
                {[
                  { id: 'dark', label: 'Koyu' },
                  { id: 'dracula', label: 'Dracula' },
                  { id: 'light', label: 'Açık' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCodeTheme(c.id as typeof codeTheme)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                      codeTheme === c.id
                        ? 'bg-white dark:bg-[#18181b] text-neutral-900 dark:text-white shadow-xs font-bold'
                        : 'text-neutral-500'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Response Conciseness, Code Strictness & Auto-Verification */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-4">
            <div>
              <span className="text-sm font-bold block text-neutral-900 dark:text-white">
                Yanıt Yoğunluğu &amp; Kod Mühendisliği
              </span>
              <span className="text-xs text-neutral-500">
                115 yapay zeka modelinin tamamı için çıktı biçimi ve otomatik kalite doğrulaması
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                Yanıt Uzunluğu &amp; Derinliği
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(
                  [
                    { id: 'concise', label: 'Kısa & Öz', desc: 'Doğrudan sonuç' },
                    { id: 'balanced', label: 'Dengeli', desc: 'Net & kapsamlı' },
                    { id: 'detailed', label: 'Detaylı Analiz', desc: 'Tüm uç durumlar' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    data-testid={`settings-conciseness-${c.id}`}
                    onClick={() => setResponseConciseness(c.id)}
                    className={`p-2.5 rounded-2xl text-center border transition cursor-pointer ${
                      responseConciseness === c.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1f2024] text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-bold">{c.label}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                Kod Üretim Disiplini
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(
                  [
                    {
                      id: 'production',
                      label: 'Üretim Standardı',
                      desc: 'Tip güvenli, eksiksiz çalışır kod',
                    },
                    {
                      id: 'explained',
                      label: 'Eğitici Açıklamalı',
                      desc: 'Adım adım mimari açıklamalı',
                    },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    data-testid={`settings-code-strictness-${mode.id}`}
                    onClick={() => setCodeStrictness(mode.id)}
                    className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
                      codeStrictness === mode.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1f2024] text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-bold">{mode.label}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-sm font-medium block">
                  Otomatik Çıktı &amp; Matematik Doğrulama
                </span>
                <span className="text-xs text-neutral-400">
                  Sözdizimi, kapanmamış kod bloğu ve sayısal sağlamaları anında onar
                </span>
              </div>
              <button
                type="button"
                data-testid="settings-autoverify-toggle-btn"
                onClick={() => setAutoVerifyOutputs((prev) => !prev)}
                className="cursor-pointer shrink-0"
                aria-label="Otomatik Çıktı Doğrulamayı Değiştir"
              >
                {autoVerifyOutputs ? (
                  <ToggleRight className="w-7 h-7 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-neutral-400" />
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            data-testid="settings-save-ai-tuning-btn"
            onClick={handleSaveAiTuning}
            className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition active:scale-99 cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Yapay Zeka &amp; Model Ayarlarını Kaydet</span>
          </button>
        </div>
      </div>
    );
  }

  if (subView === 'feedback') {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#000000] border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold tracking-tight">
            Geri Bildirim & Destek Merkezi
          </h2>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-xl mx-auto w-full space-y-4">
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-6 shadow-xs space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
              <Bug className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Gelişmiş Hata & Deneyim Raporu
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Ekran görüntüsü ekleyebilir, hata türünü (UI/UX, Performans, Model Yanıtı) belirleyebilir ve Firebase şifreli veri tabanına anlık iletebilirsiniz.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onOpenFeedbackModal();
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Geri Bildirim Modalini Aç (Ekran Görüntüsü ile)</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Sıfır E-posta Teşhiri Garantisi</span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Geri bildirimleriniz ve ekran görüntüleriniz kişisel bilgilerinizi (şifreler, e-posta adresleri, oturum anahtarları) maskeleyerek aktarılır.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (subView) {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-full shadow-lg">
            {toast}
          </div>
        )}
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#000000] border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold tracking-tight">
            {subView === 'parental'
              ? 'Ebeveyn kontrolleri'
              : subView === 'safety'
              ? 'Güvenlik ve esenlik'
              : subView === 'ads'
              ? 'Reklam denetimleri'
              : subView === 'github'
              ? 'GitHub & CI/CD Bilgileri'
              : 'Hakkında'}
          </h2>
          <div className="w-11 sm:w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-xl mx-auto w-full space-y-4">
          {subView === 'github' && (
            <div data-testid="settings-github-subview" className="space-y-4 pb-8">
              <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shrink-0">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      GitHub Actions &amp; Otomatik Yayınlama
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      GitHub Pages, Netlify ve Render için hazır CI/CD yapılandırması
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border-t border-b border-neutral-100 dark:border-neutral-800 text-xs">
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                    <span className="text-neutral-500 dark:text-neutral-400 shrink-0">Workflow Dosyası</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white break-all sm:text-right">
                      {PROJECT_GITHUB_PIPELINE.workflowPath}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-neutral-500 dark:text-neutral-400">Tetikleyici Dal &amp; Node</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {PROJECT_GITHUB_PIPELINE.triggerBranch} · Node {PROJECT_GITHUB_PIPELINE.nodeVersion}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-neutral-500 dark:text-neutral-400">Statik Derleme</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {PROJECT_GITHUB_PIPELINE.lintCommand} → {PROJECT_GITHUB_PIPELINE.buildOutputDir}/
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-neutral-500 dark:text-neutral-400">Tam Sunucu Modu</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                      {PROJECT_GITHUB_PIPELINE.fullstackStartCommand} (server.ts)
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-neutral-500 dark:text-neutral-400">Açık Kaynak Lisansı</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {PROJECT_GITHUB_PIPELINE.license}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-3.5">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Kendi GitHub Deponuzu Bağlayın
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Depo adresinizi (<span className="font-mono">kullanici/luxo-ai</span> veya{' '}
                  <span className="font-mono">https://github.com/...</span>) kaydedin; canlı GitHub Pages bağlantısı ve git push komutları otomatik oluşsun.
                </p>

                <form onSubmit={handleSaveGithubRepo} className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={githubRepoInput}
                      onChange={(e) => {
                        setGithubRepoInput(e.target.value);
                        if (githubRepoError) setGithubRepoError(null);
                      }}
                      data-testid="github-repo-input"
                      aria-label="GitHub Depo Bağlantısı"
                      placeholder="https://github.com/kullanici-adi/luxo-ai"
                      className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-neutral-50 dark:bg-[#111216] border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      data-testid="save-github-repo-btn"
                      className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      Depoyu Kaydet
                    </button>
                  </div>
                  {githubRepoError && (
                    <p
                      role="alert"
                      data-testid="github-repo-error"
                      className="text-xs font-medium text-rose-600 dark:text-rose-400"
                    >
                      {githubRepoError}
                    </p>
                  )}
                </form>

                {parsedSavedGithubRepo?.valid && parsedSavedGithubRepo.canonicalUrl && (
                  <div
                    data-testid="saved-github-repo-card"
                    className="p-3.5 rounded-2xl bg-emerald-500/8 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        Bağlı Depo: {parsedSavedGithubRepo.owner}/{parsedSavedGithubRepo.repo}
                      </span>
                      <button
                        type="button"
                        onClick={handleClearGithubRepo}
                        className="text-[11px] font-semibold text-neutral-500 hover:text-rose-600 cursor-pointer"
                      >
                        Kaldır
                      </button>
                    </div>
                    {parsedSavedGithubRepo.pagesUrl && (
                      <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 break-all">
                        GitHub Pages Adresi: {parsedSavedGithubRepo.pagesUrl}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={parsedSavedGithubRepo.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>GitHub&apos;da Aç</span>
                      </a>
                      {parsedSavedGithubRepo.pagesUrl && (
                        <a
                          href={parsedSavedGithubRepo.pagesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 font-semibold text-xs inline-flex items-center gap-1.5"
                        >
                          <Rocket className="w-3.5 h-3.5 text-blue-500" />
                          <span>Pages Sitesini Aç</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
                    <Terminal className="w-4 h-4 text-indigo-500" />
                    <span>Hızlı Git Push Komutları</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyTextSafe(
                        buildGithubPushCommands(savedGithubRepo),
                        () => {
                          setCopiedGitCmd(true);
                          showToast('Git push komutları kopyalandı!');
                          setTimeout(() => setCopiedGitCmd(false), 2000);
                        }
                      )
                    }
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedGitCmd ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 rounded-2xl bg-neutral-950 text-neutral-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                  {buildGithubPushCommands(savedGithubRepo)}
                </pre>
                <div className="space-y-2 pt-1">
                  {PROJECT_GITHUB_PIPELINE.repositorySetupSteps.map((st) => (
                    <div key={st.step} className="text-xs text-neutral-600 dark:text-neutral-300">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {st.step}. {st.title}:
                      </span>{' '}
                      {st.detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {subView !== 'github' && (
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-4">
            {subView === 'safety' && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium block">
                    Hassas içerikleri azalt
                  </span>
                  <span className="text-xs text-neutral-400">
                    Ekstra güvenlik filtrelerini etkinleştir
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReduceSensitive(!reduceSensitive)}
                  className="cursor-pointer"
                >
                  {reduceSensitive ? (
                    <ToggleRight className="w-7 h-7 text-blue-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-neutral-400" />
                  )}
                </button>
              </div>
            )}

            {subView === 'parental' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium block">
                      Güvenli Aile & Eğitim Modu
                    </span>
                    <span className="text-xs text-neutral-400">
                      Yaşa uygun akademik ve güvenli yanıt filtresi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParentalSafeSearch(!parentalSafeSearch)}
                    className="cursor-pointer"
                  >
                    {parentalSafeSearch ? (
                      <ToggleRight className="w-7 h-7 text-blue-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-neutral-400" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div>
                    <span className="text-sm font-medium block">
                      Ekran Süresi Mola Hatırlatıcısı
                    </span>
                    <span className="text-xs text-neutral-400">
                      Uzun çalışma seanslarında dinlenme bildirimi göster
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBreakReminder(!breakReminder)}
                    className="cursor-pointer"
                  >
                    {breakReminder ? (
                      <ToggleRight className="w-7 h-7 text-blue-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {subView === 'ads' && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium block">
                    Kişiselleştirilmiş öneriler
                  </span>
                  <span className="text-xs text-neutral-400">
                    Çalışma alanı tercihlerinize göre şablon önerileri sun
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPersonalizedAds(!personalizedAds)}
                  className="cursor-pointer"
                >
                  {personalizedAds ? (
                    <ToggleRight className="w-7 h-7 text-blue-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-neutral-400" />
                  )}
                </button>
              </div>
            )}

            {subView === 'about' && (
              <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
                  <LuxoLogo
                    className="w-5 h-5 text-black dark:text-white"
                    size={20}
                  />
                  <span>Luxo AI Platformu · Sürüm 3.0.0</span>
                </div>
                <p>
                  {LUXO_MODEL_IDS.length} yapay zeka modeli (Gemini 4 Hydrogen, Gemini 4 Argon, ChatGPT-5.2 Pro, Claude 4.6 Opus, DeepSeek R2, Grok 4, Nano Banana 4K ve Google Veo 3 dahil), MIT lisanslı Açık Kaynak Argon Kod Stüdyosu, 10 sesli Canlı Ses Stüdyosu ve Firebase bulut senkronizasyonu ile güçlendirilmiştir.
                </p>
                <button
                  type="button"
                  onClick={() => setSubView('github')}
                  className="min-h-[44px] w-full px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-indigo-500" />
                    <span>GitHub Actions &amp; Depo Bilgilerini Aç</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <header className="flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Geri Dön"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-base font-bold tracking-tight">Ayarlar</h2>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Hesap, Workspace &amp; AI Tercihleri
          </p>
        </div>
        <div className="w-11 sm:w-10" />
      </header>

      {/* Top Sticky Search Bar for Instant Setting Filtering */}
      <div className="px-4 py-2.5 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-900 shrink-0">
        <div className="flex items-center gap-2.5 px-4 py-2 bg-neutral-100/90 dark:bg-[#18181b] rounded-2xl border border-neutral-200/80 dark:border-neutral-800 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/15 transition max-w-xl mx-auto w-full">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Ayar ara (Gmail, Tema, GitHub, AI Model...)"
            aria-label="Ayar ara"
            data-testid="settings-search-input"
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
              aria-label="Aramayı Temizle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-20 max-w-xl mx-auto w-full">
        {/* Standalone Direct Link Hero Card */}
        <div className="bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 rounded-3xl p-5 border border-blue-200 dark:border-blue-800/60 shadow-xs space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Doğrudan Canlı Siteye Giriş</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    Aktif & Herkese Açık
                  </span>
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Google hesabı veya stüdyo editörü gerekmez; herkes direkt açabilir.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800">
            <span className="text-xs font-mono text-neutral-600 dark:text-neutral-300 truncate flex-1 px-1">
              {STANDALONE_DIRECT_URL}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              data-testid="settings-copy-direct-link-btn"
              onClick={handleCopyDirectLink}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                copiedDirectLink
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-md ring-2 ring-emerald-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copiedDirectLink ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Bağlantıyı Kopyala</span>
                </>
              )}
            </button>

            <a
              href={STANDALONE_DIRECT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-200 dark:border-neutral-700"
              title="Yeni Sekmede Aç"
            >
              <ExternalLink className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Aç</span>
            </a>

            <button
              type="button"
              data-testid="settings-show-qr-btn"
              onClick={() => setShowDirectQrModal(true)}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-200 dark:border-neutral-700 cursor-pointer"
              title="Mobil Cihazlar İçin QR Kod Göster"
            >
              <QrCode className="w-4 h-4 text-indigo-500" />
              <span>QR Kod</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center pt-2 pb-3">
          <button
            type="button"
            className="relative group cursor-pointer"
            onClick={() => setSubView('profile')}
            aria-label="Profili Düzenle"
          >
            <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 text-2xl font-bold shadow-xs border-2 border-white dark:border-neutral-800 overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                user.avatarText || 'LX'
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-[#202123] border border-neutral-300 dark:border-neutral-700 flex items-center justify-center shadow-xs text-neutral-600 dark:text-neutral-300 group-hover:scale-110 transition">
              <Pen className="w-3.5 h-3.5" />
            </div>
          </button>
          <h3 className="mt-2.5 font-bold text-base text-neutral-900 dark:text-white">
            {sanitizeLuxoBrand(user.name || 'Luxo Kullanıcısı')}
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {user.isGuest
                ? 'Misafir Oturumu · E-posta Gizli'
                : user.emailVerified === false
                ? 'Doğrulama Bekliyor · E-posta Gizli'
                : 'Doğrulanmış Hesap · E-posta Gizli'}
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {user.isGuest ? (
              <button
                type="button"
                data-testid="settings-auth-signin-btn"
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>E-posta ile Giriş / Kayıt Ol</span>
              </button>
            ) : (
              <>
                {user.emailVerified === false && onResendVerification && (
                  <button
                    type="button"
                    data-testid="settings-resend-verification-btn"
                    onClick={async () => {
                      await onResendVerification();
                      showToast('Doğrulama e-postası gönderildi.');
                    }}
                    className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MailCheck className="w-3.5 h-3.5" />
                    <span>Doğrulama Gönder</span>
                  </button>
                )}
                {onRefreshVerification && (
                  <button
                    type="button"
                    data-testid="settings-refresh-verification-btn"
                    onClick={async () => {
                      const ok = await onRefreshVerification();
                      showToast(
                        ok
                          ? 'E-posta doğrulamanız onaylandı!'
                          : 'Doğrulama henüz tamamlanmadı.'
                      );
                    }}
                    className="px-3 py-1.5 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Doğrulamayı Yenile</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Active Configuration Quick Summary Strip */}
        <div
          data-testid="settings-quick-summary-bar"
          className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
        >
          <button
            type="button"
            onClick={() => handleThemeChange(resolvedIsDark ? 'light' : 'dark')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800 hover:border-blue-400/60 transition text-left cursor-pointer shadow-xs flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              {resolvedIsDark ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Aktif Tema
              </div>
              <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {user.theme === 'dark'
                  ? 'Koyu Mod'
                  : user.theme === 'light'
                  ? 'Açık Mod'
                  : `Sistem (${resolvedIsDark ? 'Koyu' : 'Açık'})`}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSubView('ai_tuning')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800 hover:border-blue-400/60 transition text-left cursor-pointer shadow-xs flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/12 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Varsayılan AI
              </div>
              <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {LUXO_MODELS[defaultModelId || 'luxo-auto-router']?.name ||
                  'Luxo Auto-Router'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSubView('ai_tuning')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800 hover:border-blue-400/60 transition text-left cursor-pointer shadow-xs flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Muhakeme &amp; Akış
              </div>
              <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {reasoningLevel === 'fast'
                  ? 'Hızlı'
                  : reasoningLevel === 'deep'
                  ? 'Derin'
                  : 'Dengeli'}{' '}
                ·{' '}
                {streamSpeed === 'instant'
                  ? 'Anlık'
                  : streamSpeed === 'turbo'
                  ? 'Turbo'
                  : 'Standart'}
              </div>
            </div>
          </button>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-neutral-500 px-2 mb-2">
            Luxo AI&apos;m
          </h3>
          <div className="bg-white dark:bg-[#18181b] rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs">
            {matchesSearch('Bildirimler') && onOpenNotifications && (
              <button
                type="button"
                data-testid="settings-nav-notifications-btn"
                onClick={onOpenNotifications}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Bell className="w-5 h-5 text-indigo-500" />
                  <div>
                    <span className="text-sm font-medium block">
                      Bildirim Merkezi &amp; Tercihler
                    </span>
                    <span className="text-xs text-neutral-400">
                      Mesajlar, topluluk etkinlikleri ve sistem güncellemeleri
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadNotificationCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold tabular-nums">
                      {unreadNotificationCount} yeni
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}
            {matchesSearch('Yapay Zeka & Model') && (
              <button
                type="button"
                data-testid="settings-nav-ai-tuning-btn"
                onClick={() => setSubView('ai_tuning')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <SlidersHorizontal className="w-5 h-5 text-blue-500" />
                  <div>
                    <span className="text-sm font-medium block">
                      Yapay Zeka & Model Tercihleri
                    </span>
                    <span className="text-xs text-neutral-400">
                      Varsayılan model, akıl yürütme seviyesi ve yaratıcılık
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400">
                    {reasoningLevel === 'fast'
                      ? 'Hızlı'
                      : reasoningLevel === 'deep'
                      ? 'Derin'
                      : 'Dengeli'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}

            {matchesSearch('Kişiselleştirme') && (
              <button
                type="button"
                onClick={() => setSubView('customization')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Smile className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Kişiselleştirme</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400">{tone}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}

            {matchesSearch('Bellek') && (
              <button
                type="button"
                onClick={() => setSubView('memory')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <BookOpen className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Bellek</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {memoryItems.length} kayıt
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}

            {matchesSearch('Eklentiler') && (
              <button
                type="button"
                onClick={() => setSubView('plugins')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Grid3x3 className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Eklentiler</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {plugins.filter((p) => p.enabled).length} aktif
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-neutral-500 px-2 mb-2">
            Hesap
          </h3>
          <div className="bg-white dark:bg-[#18181b] rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs">
            {(matchesSearch('Gmail') ||
              matchesSearch('Google Workspace') ||
              matchesSearch('E-posta')) &&
              onOpenGmail && (
                <button
                  type="button"
                  data-testid="settings-nav-gmail-btn"
                  onClick={onOpenGmail}
                  className="w-full min-h-[56px] flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium block truncate">
                        Google Workspace · Gmail
                      </span>
                      <span className="text-[11px] text-neutral-400 block truncate">
                        Gelen kutusu, yıldızlı e-postalar ve güvenli e-posta gönderimi
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                      OAuth
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </button>
              )}

            {matchesSearch('Google Bulut Hesabı') && (
              <button
                type="button"
                onClick={() => {
                  if (user.isGuest) {
                    onOpenAuthModal();
                  } else {
                    setSubView('profile');
                  }
                }}
                className="w-full min-h-[52px] flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/12 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">
                    Google Bulut Senkronizasyonu
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400">
                    {user.isGuest ? 'Bağlan' : 'Aktif'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}

            {matchesSearch('Çalışma alanı') && (
              <button
                type="button"
                onClick={() => {
                  const list = ['Kişisel', 'İş & Projeler', 'Eğitim'];
                  const next =
                    list[(list.indexOf(workspaceName) + 1) % list.length];
                  setWorkspaceName(next);
                  onUpdateUser({ workspaceType: next });
                  showToast(`Çalışma alanı "${next}" olarak değiştirildi.`);
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Briefcase className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Çalışma alanı</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400">
                    {workspaceName}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}

            {(matchesSearch('Abonelik') ||
              matchesSearch('Plus') ||
              matchesSearch('Go')) && (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <LuxoLogo className="w-5 h-5 text-amber-500" size={20} />
                  <div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                      Abonelik (Go & Plus)
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {user.isUnlockedDev
                        ? 'Luxo-Dev (Plus VIP) Aktif'
                        : user.isUnlockedDevHelper
                        ? "Luxo-Dev's Helper (Go) Aktif"
                        : 'Ücretsiz Temel Plan'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-blue-500 font-semibold">
                    {user.isUnlockedDev
                      ? 'PLUS VIP'
                      : user.isUnlockedDevHelper
                      ? 'GO HELPER'
                      : 'Yükselt'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                </div>
              </button>
            )}

            {matchesSearch('Ebeveyn kontrolleri') && (
              <button
                type="button"
                onClick={() => setSubView('parental')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Users className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">
                    Ebeveyn kontrolleri
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-neutral-500 px-2 mb-2">
            Uygulama
          </h3>
          <div className="bg-white dark:bg-[#18181b] rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs">
            {matchesSearch('Renk teması') && (
              <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <Sun className="w-5 h-5 text-neutral-700 dark:text-neutral-300 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium block">Renk teması</span>
                    <span className="text-xs text-neutral-500">
                      Açık ve koyu mod tercihinizi belirleyin
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="settings-theme-toggle-btn"
                    onClick={() =>
                      handleThemeChange(resolvedIsDark ? 'light' : 'dark')
                    }
                    className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition cursor-pointer border border-neutral-200 dark:border-neutral-700"
                    aria-label="Açık/Koyu Mod Değiştir"
                    title="Açık/Koyu Mod Değiştir"
                  >
                    {resolvedIsDark ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-neutral-600" />
                    )}
                  </button>
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full text-xs font-semibold">
                    {(
                      [
                        { id: 'system', label: 'Sistem' },
                        { id: 'light', label: 'Açık' },
                        { id: 'dark', label: 'Koyu' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        data-testid={`settings-theme-btn-${t.id}`}
                        onClick={() => handleThemeChange(t.id)}
                        className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                          user.theme === t.id
                            ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {matchesSearch('Ses') && (
              <button
                type="button"
                onClick={() => setSubView('voice')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Mic className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">
                    Ses Stüdyosu (10 Ses)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400">
                    {selectedVoice} · {selectedRate}x
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}

            {matchesSearch('Güvenlik ve esenlik') && (
              <button
                type="button"
                onClick={() => setSubView('safety')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Shield className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">
                    Güvenlik ve esenlik
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            )}

            {matchesSearch('Depolama') && (
              <button
                type="button"
                onClick={() => setSubView('storage')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <HardDrive className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Depolama</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400">
                    {user.isGuest ? 'Yerel' : 'Bulut'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}

            {matchesSearch('Geçmiş ve veriler') && (
              <button
                type="button"
                onClick={() => setSubView('data')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Database className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Geçmiş ve veriler</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            )}

            {matchesSearch('Reklam denetimleri') && (
              <button
                type="button"
                onClick={() => setSubView('ads')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Megaphone className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">
                    Reklam denetimleri
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            )}

            {matchesSearch('Hata bildir') && (
              <button
                type="button"
                data-testid="settings-nav-feedback-btn"
                onClick={() => setSubView('feedback')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Bug className="w-5 h-5 text-rose-500" />
                  <div>
                    <span className="text-sm font-medium block">
                      Geri Bildirim & Hata Destek Merkezi
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Ekran görüntüsü ve detaylı tanılama ile iletin
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            )}

            {(matchesSearch('GitHub') ||
              matchesSearch('CI/CD') ||
              matchesSearch('Depo') ||
              matchesSearch('Workflow') ||
              matchesSearch('Pages')) && (
              <button
                type="button"
                data-testid="settings-nav-github-btn"
                onClick={() => setSubView('github')}
                className="w-full min-h-[56px] flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <GitBranch className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium block truncate">
                      GitHub &amp; CI/CD Yayınlama Bilgileri
                    </span>
                    <span className="text-[11px] text-neutral-400 block truncate">
                      {parsedSavedGithubRepo?.valid
                        ? `${parsedSavedGithubRepo.owner}/${parsedSavedGithubRepo.repo} · Actions Hazır`
                        : 'Workflow (.github/workflows), repo bağlantısı & push komutları'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono text-neutral-400">
                    Actions
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}

            {matchesSearch('Hakkında') && (
              <button
                type="button"
                onClick={() => setSubView('about')}
                className="w-full min-h-[52px] flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Info className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-sm font-medium">Hakkında</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400 tabular-nums">
                    v3.0.0
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Export & Reset Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            data-testid="settings-export-prefs-btn"
            onClick={handleExportSettingsJson}
            className="py-3.5 px-4 bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/70 transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Ayarları Dışa Aktar (.json)</span>
          </button>
          <button
            type="button"
            data-testid="settings-reset-defaults-btn"
            onClick={handleResetSettingsDefaults}
            className="py-3.5 px-4 bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Varsayılanlara Sıfırla</span>
          </button>
        </div>

        <div className="pt-1 pb-6">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-4 px-4 bg-white dark:bg-[#18181b] rounded-full border border-neutral-200 dark:border-neutral-800 text-rose-600 dark:text-rose-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Oturumu kapat</span>
          </button>
        </div>
      </div>

      {showDirectQrModal && (
        <div
          onClick={() => setShowDirectQrModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-center text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Mobil İçin Canlı Site QR Kodu
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectQrModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Telefonunuzun kamerasını bu koda doğrultarak siteyi doğrudan mobil cihazınızda açabilirsiniz.
            </p>

            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-inner flex items-center justify-center mx-auto w-64 h-64">
              {directQrDataUrl ? (
                <img
                  src={directQrDataUrl}
                  alt="Doğrudan Site QR Kodu"
                  data-testid="settings-direct-qr-img"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <p className="text-[11px] font-mono text-neutral-400 break-all">
              {STANDALONE_DIRECT_URL}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
