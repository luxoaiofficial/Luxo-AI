import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  Bell,
  Bookmark,
  Brain,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Columns2,
  Copy,
  Download,
  ExternalLink,
  Folder,
  Globe,
  Image as ImageIcon,
  Key,
  LayoutDashboard,
  Lock,
  Mic,
  Moon,
  Paperclip,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  Users,
  Video,
  Volume2,
  WandSparkles,
  X,
} from 'lucide-react';
import {
  AdaptiveSiteSuggestion,
  ChatCreationMode,
  ChatThread,
  LuxoModelCategory,
  LuxoModelId,
  LuxoProject,
  LuxoUser,
  SynthesisMode,
  VisualAspectRatio,
} from '../types/luxo';
import {
  calculateGuestRemainingMessages,
  canAccessModel,
  enhanceUserPrompt,
   getVoiceOption,
  GUEST_MESSAGE_LIMIT,
  LUXO_MODEL_CATEGORIES,
  LUXO_MODELS,
  LUXO_VOICES,
  sanitizeLuxoBrand,
  SYNTHESIS_MODES,
} from '../utils/luxoLogic';
import { LuxoLogo, MarkdownContent } from './LuxoLogo';
import { SocialShareButton } from './SocialShareBar';

interface ChatWorkspaceProps {
  currentChat: ChatThread | null;
  activeModelId: LuxoModelId;
  activeProject: LuxoProject | null;
  onClearActiveProject: () => void;
  onSelectModel: (modelId: LuxoModelId) => void;
  onSendMessage: (
    text: string,
    attachment?: File,
    options?: {
      webSearch?: boolean;
      deepReasoning?: boolean;
      synthesisMode?: SynthesisMode;
      forceMediaMode?: 'image' | 'video';
      imageAspectRatio?: VisualAspectRatio;
      imageStyle?: string;
      referenceImageDataUrl?: string;
    }
  ) => void;
  onCompareMessage?: (
    text: string,
    modelA: LuxoModelId,
    modelB: LuxoModelId,
    attachment?: File,
    options?: {
      webSearch?: boolean;
      deepReasoning?: boolean;
      synthesisMode?: SynthesisMode;
    }
  ) => void;
  onSelectComparisonWinner?: (
    messageId: string,
    winnerModelId: LuxoModelId
  ) => void;
  onToggleLikeMessage: (messageId: string) => void;
  onToggleDislikeMessage?: (messageId: string) => void;
  onModelFeedback?: (
    messageId: string,
    modelId: LuxoModelId,
    rating: 'thumbs_up' | 'thumbs_down',
    snippet?: string
  ) => void;
  onRegenerate: () => void;
  onOpenSidebar: () => void;
  onOpenNewChat: () => void;
  onOpenUpgradeModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenVoiceCommands?: () => void;
  onOpenDashboard?: () => void;
  onOpenImagesView: () => void;
  onOpenEvolutionView?: () => void;
  onOpenHubView?: () => void;
  onOpenContentStudioView?: () => void;
  onOpenSocialView?: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  evolutionGeneration?: number;
  adaptiveSuggestions?: AdaptiveSiteSuggestion[];
  onOpenAuthModal: () => void;
  onSaveToLibrary: (title: string, content: string) => void;
  onOpenCommandPalette?: () => void;
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
  onSynthesizeComparison?: (
    question: string,
    modelA: LuxoModelId,
    contentA: string,
    modelB: LuxoModelId,
    contentB: string
  ) => void;
  externalCompareRequest?: number;
  collabParticipantsCount?: number;
  collabRoomId?: string;
  isCollabConnected?: boolean;
  onOpenCollabPanel?: () => void;
  onTypingActivity?: (isTyping: boolean) => void;
  user: LuxoUser;
  isStreaming: boolean;
}

function fallbackCopy(text: string) {
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

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  currentChat,
  activeModelId,
  activeProject,
  onClearActiveProject,
  onSelectModel,
  onSendMessage,
  onCompareMessage,
  onSelectComparisonWinner,
  onToggleLikeMessage,
  onToggleDislikeMessage,
  onModelFeedback,
  onRegenerate,
  onOpenSidebar,
  onOpenNewChat,
  onOpenUpgradeModal,
  onOpenVoiceModal,
  onOpenVoiceCommands,
  onOpenDashboard,
  onOpenImagesView,
  onOpenEvolutionView,
  onOpenHubView,
  onOpenContentStudioView,
  onOpenSocialView,
  unreadNotificationCount = 0,
  onOpenNotifications,
  evolutionGeneration = 2,
  adaptiveSuggestions = [],
  onOpenAuthModal,
  onSaveToLibrary,
  onOpenCommandPalette,
  isDarkTheme = false,
  onToggleTheme,
  onSynthesizeComparison,
  externalCompareRequest = 0,
  collabParticipantsCount = 1,
  collabRoomId = 'genel-studyo',
  isCollabConnected = false,
  onOpenCollabPanel,
  onTypingActivity,
  user,
  isStreaming,
}) => {
  const [inputText, setInputText] = useState('');
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelCategoryFilter, setModelCategoryFilter] = useState<
    'Tümü' | LuxoModelCategory
  >('Tümü');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareModelA, setCompareModelA] =
    useState<LuxoModelId>('gemini-4-argon');
  const [compareModelB, setCompareModelB] =
    useState<LuxoModelId>('claude-4-sonnet');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [deepReasoningEnabled, setDeepReasoningEnabled] = useState(false);
  const [synthesisMode, setSynthesisMode] =
    useState<SynthesisMode>('standart');
  const [creationMode, setCreationMode] = useState<ChatCreationMode>('auto');
  const [chatImageRatio, setChatImageRatio] =
    useState<VisualAspectRatio>('16:9');
  const [chatImageStyle, setChatImageStyle] = useState<string>('Fotogerçekçi');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<
    Record<string, boolean>
  >({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolsPopoverRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentModel = LUXO_MODELS[activeModelId] || LUXO_MODELS['gemini-4-argon'];
  const messages = currentChat?.messages || [];
  const guestRemaining = calculateGuestRemainingMessages(user);
  const isGuestLimitReached = user.isGuest && guestRemaining <= 0;
  const totalModelCount = Object.keys(LUXO_MODELS).length;
  const accessibleModelIds = (Object.keys(LUXO_MODELS) as LuxoModelId[]).filter(
    (id) => canAccessModel(id, user).allowed
  );
  const anyComparisonInThread = messages.some(
    (m) => Array.isArray(m.comparisonResponses) && m.comparisonResponses.length >= 2
  );
  const activeToolCount =
    (creationMode !== 'auto' ? 1 : 0) +
    (compareMode ? 1 : 0) +
    (deepReasoningEnabled ? 1 : 0) +
    (webSearchEnabled ? 1 : 0) +
    (synthesisMode !== 'standart' ? 1 : 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (externalCompareRequest > 0) {
      setCompareMode(true);
    }
  }, [externalCompareRequest]);

  useEffect(() => {
    if (!isToolsMenuOpen) return;
    const handlePointerDown = (ev: MouseEvent) => {
      if (
        toolsPopoverRef.current &&
        !toolsPopoverRef.current.contains(ev.target as Node)
      ) {
        setIsToolsMenuOpen(false);
      }
    };
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isToolsMenuOpen]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  const handleEnhanceInputPrompt = async () => {
    if (!inputText.trim() || isEnhancingPrompt) return;
    setIsEnhancingPrompt(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputText.trim(),
          mode: 'chat',
          synthesisMode,
        }),
      });
      if (!res.ok) throw new Error('enhance failed');
      const data = await res.json();
      if (data.enhancedPrompt) {
        setInputText(sanitizeLuxoBrand(data.enhancedPrompt));
        showToast('İstem Gemini 4 Argon standardında güçlendirildi.');
      } else {
        setInputText(enhanceUserPrompt(inputText, synthesisMode));
        showToast('İstem yapılandırıldı ve güçlendirildi.');
      }
    } catch {
      setInputText(enhanceUserPrompt(inputText, synthesisMode));
      showToast('İstem yapılandırıldı ve güçlendirildi.');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handlePickSurpriseChatScene = () => {
    const scenes =
      creationMode === 'video'
        ? [
            'Altın saat ışığında İstanbul Boğazı üzerinde süzülen sinematik drone çekimi ve parlayan dalgalar',
            'Yağmurlu neon Tokyo bulvarında ilerleyen kırmızı spor araba, 35mm sinematik takip çekimi',
            'Kuzey ışıkları altında karlı dağ gölü üzerinde süzülen yörünge kamera hareketi',
            'Mars yüzeyinde yürüyen kırmızı uzay giysili astronot ve ufukta parlayan Dünya',
          ]
        : [
            'Mars yüzeyinde yürüyen kırmızı astronot ve yıldızlı gökyüzünde mavi Dünya, 8K DSLR fotoğraf',
            'Güneşli ahşap pencere kenarında şapka takan sevimli turuncu tekir kedi, 85mm portre lensi',
            'Gece yağmurlu siberpunk sokakta parlayan neon yansımalar arasında kırmızı spor araba',
            'Gün doğumunda Kapadokya peri bacaları üzerinde yükselen rengarenk sıcak hava balonları',
          ];
    const picked = scenes[Math.floor(Math.random() * scenes.length)];
    setInputText(picked);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuestLimitReached) {
      onOpenAuthModal();
      return;
    }
    if ((!inputText.trim() && !attachedFile) || isStreaming) return;
    if (compareMode && onCompareMessage && creationMode === 'auto') {
      onCompareMessage(
        inputText,
        compareModelA,
        compareModelB,
        attachedFile || undefined,
        {
          webSearch: webSearchEnabled,
          deepReasoning: deepReasoningEnabled,
          synthesisMode,
        }
      );
    } else {
      onSendMessage(inputText, attachedFile || undefined, {
        webSearch: webSearchEnabled,
        deepReasoning: deepReasoningEnabled,
        synthesisMode,
        ...(creationMode !== 'auto'
          ? {
              forceMediaMode: creationMode,
              imageAspectRatio: chatImageRatio,
              imageStyle: chatImageStyle,
            }
          : {}),
      });
    }
    setInputText('');
    setAttachedFile(null);
    if (creationMode !== 'auto') {
      setCreationMode('auto');
    }
    onTypingActivity?.(false);
  };

  const handleCopyMessage = (content: string, id: string) => {
    const safe = sanitizeLuxoBrand(content);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(safe).catch(() => fallbackCopy(safe));
      } else {
        fallbackCopy(safe);
      }
    } catch {
      fallbackCopy(safe);
    }
    setCopiedId(id);
    showToast('Metin panoya kopyalandı.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakMessage = (content: string, id: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Sesli okuma bu tarayıcıda desteklenmiyor.');
      return;
    }
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      showToast('Sesli okuma durduruldu.');
      return;
    }
    window.speechSynthesis.cancel();
    const voiceOpt = getVoiceOption(user.voiceName);
    const cleaned = sanitizeLuxoBrand(content)
      .replace(/```[\s\S]*?```/g, ' kod bloğu. ')
      .replace(/[*#`_[\]()>|]/g, '')
      .slice(0, 480);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'tr-TR';
    utterance.pitch = voiceOpt.pitch;
    utterance.rate = Math.min(
      1.8,
      Math.max(0.65, voiceOpt.rate * (user.voiceRate || 1.0))
    );
    const trVoices = window.speechSynthesis
      .getVoices()
      .filter((v) => v.lang.toLowerCase().startsWith('tr'));
    if (trVoices.length > 0) {
      const idx =
        LUXO_VOICES.findIndex((v) => v.name === voiceOpt.name) %
        trVoices.length;
      utterance.voice = trVoices[Math.max(0, idx)];
    }
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
    showToast(`${voiceOpt.name} sesiyle okunuyor...`);
  };

  const handleExportChat = (format: 'txt' | 'md' = 'txt') => {
    if (!currentChat || currentChat.messages.length === 0) {
      showToast('Dışa aktarılacak mesaj bulunmuyor.');
      return;
    }
    const cleanTitle = sanitizeLuxoBrand(currentChat.title || 'Sohbet');
    const safeFilename =
      cleanTitle
        .replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_')
        .slice(0, 30) || 'luxo_sohbet';
    const dateStr = new Date().toLocaleString('tr-TR');

    let content = '';
    let mimeType = 'text/plain;charset=utf-8';
    let ext = 'txt';

    if (format === 'txt') {
      const lines = [
        '==================================================',
        'LUXO AI - SOHBET GEÇMİŞİ / CHAT TRANSCRIPT',
        `Başlık: ${cleanTitle}`,
        `Model: ${currentModel.name}`,
        `Tarih: ${dateStr}`,
        `Toplam Mesaj: ${currentChat.messages.length}`,
        '==================================================\n',
      ];
      currentChat.messages.forEach((m, idx) => {
        const speaker = m.role === 'user' ? 'Kullanıcı' : currentModel.name;
        const time = m.timestamp
          ? new Date(m.timestamp).toLocaleTimeString('tr-TR')
          : '';
        lines.push(`[${idx + 1}] ${speaker}${time ? ` (${time})` : ''}:`);
        lines.push(sanitizeLuxoBrand(m.content));
        lines.push('\n' + '-'.repeat(40) + '\n');
      });
      content = lines.join('\n');
      mimeType = 'text/plain;charset=utf-8';
      ext = 'txt';
    } else {
      content = [
        `# ${cleanTitle}`,
        `**Model**: ${currentModel.name}`,
        `**Tarih**: ${dateStr}`,
        '',
        '---',
        '',
        ...currentChat.messages.map(
          (m) =>
            `### ${
              m.role === 'user' ? 'Kullanıcı' : currentModel.name
            }\n\n${sanitizeLuxoBrand(m.content)}\n`
        ),
      ].join('\n');
      mimeType = 'text/markdown;charset=utf-8';
      ext = 'md';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFilename}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Sohbet metin dosyası (.${ext}) olarak indirildi.`);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] text-neutral-900 dark:text-neutral-100 select-none relative overflow-hidden">
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold rounded-full shadow-lg">
          {toastMessage}
        </div>
      )}

      <header className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#18181b] z-20 shrink-0 border-b border-neutral-100 dark:border-neutral-800 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#202123] border border-neutral-200/80 dark:border-neutral-700 shadow-xs flex flex-col items-center justify-center gap-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition active:scale-95 cursor-pointer shrink-0"
            aria-label="Menüyü Aç"
          >
            <span className="w-4 h-0.5 bg-black dark:bg-white rounded-full" />
            <span className="w-3.5 h-0.5 bg-black dark:bg-white rounded-full self-start ml-2.5 sm:ml-3" />
          </button>

          <button
            type="button"
            onClick={() => setShowModelModal(true)}
            aria-label={`Aktif Model: ${currentModel.name}. Model seçmek için tıklayın`}
            data-testid="header-model-selector-btn"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#e8f3ff] dark:bg-blue-950/60 hover:bg-[#d8ebff] dark:hover:bg-blue-900/60 text-[#0266ff] dark:text-blue-300 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs min-w-0 sm:shrink-0 max-w-[185px] sm:max-w-[250px]"
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: currentModel.accentColor }}
            >
              <LuxoLogo className="w-3.5 h-3.5 text-white" size={14} />
            </span>
            <span className="truncate">
              {user.isUnlockedDev
                ? `${currentModel.name} (Dev Plus)`
                : user.isUnlockedDevHelper
                ? `${currentModel.name} (Dev Go)`
                : currentModel.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          </button>

          {activeProject && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 shrink-0">
              <Folder className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold truncate max-w-[130px]">
                {activeProject.name}
              </span>
              <button
                type="button"
                onClick={onClearActiveProject}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                aria-label="Proje bağlamını kaldır"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              aria-label="Hızlı Model ve Komut Arama"
              title="Hızlı Arama (Ctrl+K)"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#202123] dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">⌘K</span>
            </button>
          )}
          {onToggleTheme && (
            <button
              type="button"
              data-testid="header-theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label={isDarkTheme ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
              title={isDarkTheme ? 'Açık Tema (Gündüz)' : 'Koyu Tema (Gece)'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#202123] border border-neutral-200/80 dark:border-neutral-700 shadow-xs flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition active:scale-95 cursor-pointer shrink-0"
            >
              {isDarkTheme ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          )}
          {onOpenDashboard && (
            <button
              type="button"
              data-testid="header-dashboard-btn"
              onClick={onOpenDashboard}
              aria-label="Kişisel Kontrol Paneli (Dashboard)"
              title="Kişisel Kontrol Paneli, Sabitlenen Alanlar & Model Metrikleri"
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#202123] dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden lg:inline">Panel</span>
            </button>
          )}
          {onOpenEvolutionView && (
            <button
              type="button"
              data-testid="open-evolution-hub-btn"
              onClick={onOpenEvolutionView}
              aria-label="Otonom Gelişim ve Öz-Onarım Merkezi"
              title="Kendi Kendini Geliştiren AI & Hata Onarım Merkezi"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Otonom Gelişim</span>
              <span className="font-mono text-[11px] tabular-nums">
                v{evolutionGeneration}
              </span>
            </button>
          )}
          {onOpenSocialView && (
            <button
              type="button"
              data-testid="open-social-workspace-btn"
              onClick={onOpenSocialView}
              aria-label="Etkinlik Takvimi, Duyurular, Özel Sohbet Odaları ve Kullanıcı Profilleri"
              title="Etkinlik Takvimi, Duyurular, Özel Sohbet Odaları ve Kullanıcı Profilleri"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/25 text-blue-700 dark:text-blue-300 text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden 2xl:inline">Takvim &amp; Sosyal</span>
            </button>
          )}
          {onOpenContentStudioView && (
            <button
              type="button"
              data-testid="open-content-studio-btn"
              onClick={onOpenContentStudioView}
              aria-label="İçerik Stüdyosu – SEO Meta Açıklama, Blog Başlığı ve Doğrudan İçerik Girişi"
              title="İçerik Stüdyosu (SEO Meta, Blog Başlığı & Doğrudan Yayın)"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#202123] dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <PenLine className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden 2xl:inline">İçerik Stüdyosu</span>
            </button>
          )}
          {onOpenHubView && (
            <button
              type="button"
              data-testid="open-community-hub-btn"
              onClick={onOpenHubView}
              aria-label="Keşfet, SEO ve Performans Merkezi"
              title="SEO Stratejisi, Performans Hesaplayıcı, Forum, Blog, Anket ve SSS"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#202123] dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden 2xl:inline">Keşfet &amp; SEO</span>
            </button>
          )}
          {onOpenCollabPanel && (
            <button
              type="button"
              onClick={onOpenCollabPanel}
              aria-label="Canlı Ortak Çalışma"
              title={`Canlı Ortak Çalışma Odası: #${collabRoomId}`}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCollabConnected
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <Users className="w-3.5 h-3.5" />
              <span className="hidden 2xl:inline">Canlı Ortak Çalışma</span>
              <span className="font-mono text-[11px] tabular-nums">
                ({Math.max(1, collabParticipantsCount)} Aktif)
              </span>
            </button>
          )}
          <div className="hidden sm:block shrink-0">
            <SocialShareButton
              payload={{
                title: currentChat?.title || `Luxo AI · ${totalModelCount} Yapay Zeka Modeli`,
                excerpt:
                  [...messages]
                    .reverse()
                    .find((m) => m.role === 'assistant')?.content ||
                  messages[messages.length - 1]?.content ||
                  'Gemini 4, ChatGPT-5o, Claude 4.5, DeepSeek R2, Grok 4, Nano Banana 4K ve Google Veo 3 stüdyosu.',
                contentType: 'chat',
                badge: `${currentModel.name} · LUXO AI`,
              }}
              label="Link & Paylaş"
              onShared={(plat) => showToast(`${plat} hazırlandı.`)}
            />
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              data-testid="export-chat-btn"
              onClick={() => handleExportChat('txt')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white dark:bg-[#202123] border border-neutral-200/80 dark:border-neutral-700 shadow-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition active:scale-95 cursor-pointer shrink-0 text-xs font-semibold"
              aria-label="Export Chat"
              title="Export Chat (.txt metin dosyası olarak indir)"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Export Chat</span>
            </button>
          )}
          {onOpenNotifications && (
            <button
              type="button"
              data-testid="header-notifications-btn"
              onClick={onOpenNotifications}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#202123] border border-neutral-200/80 dark:border-neutral-700 shadow-xs flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition active:scale-95 cursor-pointer shrink-0"
              aria-label="Bildirim Merkezi"
              title="Bildirimler & Tercihler"
            >
              <Bell className="w-4 h-4 text-indigo-500" />
              {unreadNotificationCount > 0 && (
                <span
                  data-testid="header-notifications-badge"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow-xs"
                >
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onOpenNewChat}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#202123] border border-neutral-200/80 dark:border-neutral-700 shadow-xs flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition active:scale-95 cursor-pointer shrink-0"
            aria-label="Yeni Sohbet"
            title="Yeni Sohbet"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {user.isGuest && (
        <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 shrink-0">
          <div className="flex items-center gap-2 truncate pr-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-medium truncate tabular-nums">
              {guestRemaining > 0
                ? `Misafir Modu: Kalan ${guestRemaining} mesajınız var`
                : 'Misafir limitiniz doldu!'}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-semibold text-[11px] shrink-0 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Google ile Giriş</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col justify-between">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full py-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 text-white shadow-sm" style={{ backgroundColor: currentModel.accentColor }}>
                <LuxoLogo className="w-7 h-7 text-white" size={28} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                Bugün ne üzerinde çalışıyoruz?
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Aktif Motor:{' '}
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {currentModel.name}
                </span>{' '}
                · {currentModel.contextWindow} Bağlam ·{' '}
                <button
                  type="button"
                  onClick={() => setShowModelModal(true)}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {totalModelCount} Yapay Zeka Modeli
                </button>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={onOpenImagesView}
                className="flex items-center gap-3.5 px-4 py-4 bg-white dark:bg-[#202123] rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 group-hover:scale-105 transition" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Nano Banana 4K & Google Veo
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    4K fotogerçekçi görsel ve sinematik video üret
                  </div>
                </div>
              </button>

              {onOpenSocialView && (
                <button
                  type="button"
                  onClick={onOpenSocialView}
                  className="flex items-center gap-3.5 px-4 py-4 bg-white dark:bg-[#202123] rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 group-hover:scale-105 transition" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Etkinlik Takvimi, Sohbet Odaları & Profiller
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Duyuruları favorile, arkadaş ekle ve özel oda kur
                    </div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setCompareMode(true);
                  showToast('Yan yana karşılaştırma modu etkinleştirildi.');
                }}
                className="flex items-center gap-3.5 px-4 py-4 bg-white dark:bg-[#202123] rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Columns2 className="w-5 h-5 group-hover:scale-105 transition" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Yan Yana Model Karşılaştır
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    ChatGPT-5o, Claude 4, DeepSeek R2 ve Gemini 4 eşzamanlı
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectModel('gemini-4-argon');
                  setSynthesisMode('uzman-mimari');
                  setInputText(
                    'Yüksek trafikli bir API servisi için en sade ve güvenilir hız sınırlama yöntemini kısaca açıkla.'
                  );
                }}
                className="flex items-center gap-3.5 px-4 py-4 bg-white dark:bg-[#202123] rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5 group-hover:scale-105 transition" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Kısa & Net Sistem Çözümü
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Uzatmadan doğrudan, yalın ve uygulanabilir mimari özet
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectModel('perplexity-sonar-pro');
                  setSynthesisMode('akademik-kanit');
                  setWebSearchEnabled(true);
                  setInputText(
                    '2026 yılı bulut bilişim ve yapay zeka donanım gelişmelerini kısaca özetle.'
                  );
                }}
                className="flex items-center gap-3.5 px-4 py-4 bg-white dark:bg-[#202123] rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 group-hover:scale-105 transition" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Canlı Web & Kanıt Özeti
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Doğrulanmış kaynaklarla kısa ve öz araştırma
                  </div>
                </div>
              </button>

              {onOpenContentStudioView && (
                <button
                  type="button"
                  onClick={onOpenContentStudioView}
                  className="flex items-center gap-3.5 px-4 py-4 bg-white dark:bg-[#202123] rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <PenLine className="w-5 h-5 group-hover:scale-105 transition" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                      İçerik Stüdyosu (SEO & Doğrudan Yayın)
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      SEO meta açıklaması, blog başlığı üret ve siteye yayınla
                    </div>
                  </div>
                </button>
              )}
            </div>

            {(onOpenEvolutionView || adaptiveSuggestions.length > 0) && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#202123] border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
                    Otonom Öz-Gelişim Önerileri · Nesil v{evolutionGeneration}
                  </div>
                  {onOpenEvolutionView && (
                    <button
                      type="button"
                      onClick={onOpenEvolutionView}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Gelişim Merkezini Aç</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {adaptiveSuggestions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {adaptiveSuggestions.slice(0, 2).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(item.recommendedModelId);
                          setInputText(item.prompt);
                        }}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-neutral-200/70 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-500/60 transition text-left cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`${
              anyComparisonInThread || compareMode ? 'max-w-5xl' : 'max-w-3xl'
            } mx-auto w-full space-y-6 pb-6 transition-all`}
          >
            {messages.map((message, mIndex) => {
              const isAssistant = message.role === 'assistant';
              const msgModel = message.modelId
                ? LUXO_MODELS[message.modelId]
                : currentModel;
              const isThinkingOpen = !!expandedThinking[message.id];
              const isLastMessage = mIndex === messages.length - 1;
              const hasComparison =
                isAssistant &&
                Array.isArray(message.comparisonResponses) &&
                message.comparisonResponses.length >= 2;

              if (hasComparison && message.comparisonResponses) {
                return (
                  <div
                    key={message.id}
                    data-testid="split-comparison-block"
                    className="flex flex-col items-start w-full space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 w-full px-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <Columns2 className="w-4 h-4" />
                        <span>
                          Bölünmüş Ekran Model Karşılaştırması · Eşzamanlı Yanıtlar
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onSynthesizeComparison &&
                          !isStreaming &&
                          message.comparisonResponses.every(
                            (c) => !c.isStreaming && c.content.trim().length > 0
                          ) && (
                            <button
                              type="button"
                              onClick={() => {
                                const prevUserMsg = messages
                                  .slice(0, mIndex)
                                  .reverse()
                                  .find((pm) => pm.role === 'user');
                                const cA = message.comparisonResponses![0];
                                const cB = message.comparisonResponses![1];
                                onSynthesizeComparison(
                                  prevUserMsg?.content || 'Karşılaştırma özeti',
                                  cA.modelId,
                                  cA.content,
                                  cB.modelId,
                                  cB.content
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>İki Yanıtı Sentezle (Ortak Akıl)</span>
                            </button>
                          )}
                        {message.preferredComparisonModelId && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                            <Trophy className="w-3 h-3" />
                            <span>
                              Tercih Edilen:{' '}
                              {LUXO_MODELS[message.preferredComparisonModelId]
                                ?.name || message.preferredComparisonModelId}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                      {message.comparisonResponses.map((comp, cIdx) => {
                        const compModel =
                          LUXO_MODELS[comp.modelId] || currentModel;
                        const compKey = `${message.id}_${comp.modelId}_${cIdx}`;
                        const isCompThinkingOpen = !!expandedThinking[compKey];
                        const isWinner =
                          message.preferredComparisonModelId === comp.modelId;

                        return (
                          <div
                            key={compKey}
                            data-testid={`comparison-pane-${cIdx}`}
                            className={`flex flex-col justify-between p-4 rounded-2xl border transition-all bg-white dark:bg-[#202123] shadow-xs ${
                              isWinner
                                ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                                : 'border-neutral-200 dark:border-neutral-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                                    style={{
                                      backgroundColor: compModel.accentColor,
                                    }}
                                  >
                                    <LuxoLogo
                                      className="w-3.5 h-3.5 text-white"
                                      size={14}
                                    />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                      {compModel.name}
                                    </div>
                                    <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                                      {compModel.badge}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {typeof comp.latencyMs === 'number' && (
                                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-neutral-600 dark:text-neutral-300 tabular-nums">
                                      {(comp.latencyMs / 1000).toFixed(1)}sn
                                    </span>
                                  )}
                                  {comp.isStreaming && (
                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold animate-pulse">
                                      Yazıyor...
                                    </span>
                                  )}
                                </div>
                              </div>

                              {comp.thinkingSteps &&
                                comp.thinkingSteps.length > 0 && (
                                  <div className="mb-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedThinking((prev) => ({
                                          ...prev,
                                          [compKey]: !prev[compKey],
                                        }))
                                      }
                                      className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer"
                                    >
                                      <Brain className="w-3.5 h-3.5 text-purple-500" />
                                      <span>
                                        Akıl Yürütme ({comp.thinkingSteps.length}{' '}
                                        adım)
                                      </span>
                                      {isCompThinkingOpen ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    {isCompThinkingOpen && (
                                      <div className="mt-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200/70 dark:border-neutral-800 space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                                        {comp.thinkingSteps.map((st, sIdx) => (
                                          <div
                                            key={sIdx}
                                            className="flex items-start gap-1.5"
                                          >
                                            <span className="font-mono text-[10px] text-neutral-400">
                                              0{sIdx + 1}.
                                            </span>
                                            <span>{sanitizeLuxoBrand(st)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                              <div className="text-sm leading-relaxed break-words">
                                {comp.content ? (
                                  <MarkdownContent content={comp.content} />
                                ) : (
                                  <div className="text-xs text-neutral-400 py-4 flex items-center gap-2">
                                    <LuxoLogo
                                      className="w-3.5 h-3.5 text-blue-500 animate-spin"
                                      size={14}
                                    />
                                    <span>
                                      {compModel.name} yanıtı oluşturuyor...
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                              <div className="flex items-center gap-1 text-neutral-400">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyMessage(comp.content, compKey)
                                  }
                                  aria-label={`${compModel.name} yanıtını kopyala`}
                                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
                                >
                                  {copiedId === compKey ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSpeakMessage(comp.content, compKey)
                                  }
                                  aria-label={`${compModel.name} yanıtını sesli dinle`}
                                  className={`p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer ${
                                    speakingId === compKey
                                      ? 'text-blue-500'
                                      : 'hover:text-neutral-700 dark:hover:text-neutral-200'
                                  }`}
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  onSelectComparisonWinner?.(
                                    message.id,
                                    comp.modelId
                                  );
                                  onSelectModel(comp.modelId);
                                  showToast(
                                    `${compModel.name} kazanan yanıt olarak seçildi.`
                                  );
                                }}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                  isWinner
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                                }`}
                              >
                                <Trophy className="w-3 h-3" />
                                <span>
                                  {isWinner ? 'Seçilen Yanıt' : 'Bu Yanıtı Seç'}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    isAssistant ? 'items-start' : 'items-end'
                  }`}
                >
                  {!isAssistant && message.authorName && (
                    <div className="flex items-center gap-1.5 mb-1 px-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: message.authorColor || '#2563eb',
                        }}
                      />
                      <span className="font-semibold">{message.authorName}</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[94%] sm:max-w-[86%] p-4 transition-all ${
                      isAssistant
                        ? 'bg-transparent text-neutral-900 dark:text-neutral-100 w-full'
                        : 'bg-neutral-100 dark:bg-[#2d2f34] text-neutral-900 dark:text-white rounded-3xl rounded-br-md shadow-xs'
                    }`}
                  >
                    {isAssistant && (
                      <div className="flex items-center gap-2 mb-2.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{
                            backgroundColor:
                              msgModel?.accentColor || currentModel.accentColor,
                          }}
                        >
                          <LuxoLogo className="w-3.5 h-3.5 text-white" size={14} />
                        </span>
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {msgModel?.name || currentModel.name}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{msgModel?.badge}</span>
                      </div>
                    )}

                    {isAssistant &&
                      message.thinkingSteps &&
                      message.thinkingSteps.length > 0 && (
                        <div className="mb-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedThinking((prev) => ({
                                ...prev,
                                [message.id]: !prev[message.id],
                              }))
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer"
                          >
                            <Brain className="w-3.5 h-3.5 text-purple-500" />
                            <span>
                              Akıl Yürütme Süreci · {message.thinkingSteps.length} adım
                            </span>
                            {isThinkingOpen ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isThinkingOpen && (
                            <div className="mt-2 p-3 rounded-2xl bg-neutral-50 dark:bg-[#202123] border border-neutral-200/80 dark:border-neutral-800 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                              {message.thinkingSteps.map((step, sIdx) => (
                                <div key={sIdx} className="flex items-start gap-2">
                                  <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
                                    0{sIdx + 1}.
                                  </span>
                                  <span>{sanitizeLuxoBrand(step)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    <div
                      className={`${
                        user.fontSize === 'sm'
                          ? 'text-[13px]'
                          : user.fontSize === 'lg'
                          ? 'text-base'
                          : 'text-sm'
                      } leading-relaxed break-words font-normal`}
                    >
                      {isAssistant ? (
                        <MarkdownContent content={message.content} />
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {sanitizeLuxoBrand(message.content)}
                        </div>
                      )}
                    </div>

                    {message.videoUrl && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 max-w-xl bg-black">
                        <video
                          src={message.videoUrl}
                          poster={message.posterUrl}
                          controls
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="auto"
                          onLoadedData={() =>
                            bottomRef.current?.scrollIntoView({
                              behavior: 'smooth',
                            })
                          }
                          className="w-full aspect-video object-cover"
                        />
                        <div className="px-3.5 py-2 bg-neutral-900 text-neutral-200 flex items-center justify-between text-xs">
                          <span className="font-mono text-[11px] text-emerald-400">
                            NANO BANANA & GOOGLE VEO · HD MP4
                          </span>
                          <a
                            href={message.videoUrl}
                            download="luxo-sinema-video.mp4"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>MP4 İndir</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {message.imageUrl && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 max-w-xl bg-neutral-950">
                        <img
                          src={message.imageUrl}
                          alt="Görsel İçerik"
                          referrerPolicy="no-referrer"
                          onLoad={() =>
                            bottomRef.current?.scrollIntoView({
                              behavior: 'smooth',
                            })
                          }
                          className="w-full object-cover"
                        />
                        {isAssistant && (
                          <div className="px-3.5 py-2.5 bg-neutral-900 text-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-mono text-[11px] text-amber-400">
                              NANO BANANA 2.1 · 4K GÖRSEL
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isStreaming}
                                onClick={() => {
                                  const rawScene =
                                    messages[mIndex - 1]?.role === 'user'
                                      ? messages[mIndex - 1].content
                                      : currentChat?.title || 'Sinematik sahne';
                                  onSendMessage(rawScene, undefined, {
                                    forceMediaMode: 'video',
                                    referenceImageDataUrl: message.imageUrl,
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Videoya Dönüştür (Veo 3)</span>
                              </button>
                              <button
                                type="button"
                                disabled={isStreaming}
                                onClick={() => {
                                  const rawScene =
                                    messages[mIndex - 1]?.role === 'user'
                                      ? messages[mIndex - 1].content
                                      : currentChat?.title || 'Sinematik fotoğraf';
                                  onSendMessage(
                                    `${rawScene} (farklı açı ve kompozisyon varyasyonu)`,
                                    undefined,
                                    {
                                      forceMediaMode: 'image',
                                      imageAspectRatio: chatImageRatio,
                                      imageStyle: chatImageStyle,
                                    }
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-semibold transition cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>Varyasyon Üret</span>
                              </button>
                              <a
                                href={message.imageUrl}
                                download={
                                  message.imageUrl.startsWith('data:image/svg')
                                    ? 'luxo-nano-banana.svg'
                                    : message.imageUrl.startsWith('data:image/jpeg') ||
                                      message.imageUrl.endsWith('.jpg')
                                    ? 'luxo-nano-banana.jpg'
                                    : 'luxo-nano-banana.png'
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Görseli İndir</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isAssistant &&
                      message.citations &&
                      message.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                          <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                            Doğrulanmış Kaynaklar
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {message.citations.map((cit, cIdx) => (
                              <a
                                key={cIdx}
                                href={cit.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#202123] border border-neutral-200/70 dark:border-neutral-800 hover:border-blue-500/50 transition flex items-start justify-between gap-2 text-left"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                    {sanitizeLuxoBrand(cit.title)}
                                  </div>
                                  <div className="text-[11px] text-neutral-400 truncate">
                                    {cit.domain}
                                  </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                    {isAssistant && (
                      <div className="flex items-center gap-1.5 mt-3 pt-2 text-neutral-400">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyMessage(message.content, message.id)
                          }
                          className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
                          aria-label="Kopyala"
                          title="Kopyala"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSpeakMessage(message.content, message.id)
                          }
                          className={`p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer ${
                            speakingId === message.id
                              ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
                              : 'hover:text-neutral-700 dark:hover:text-neutral-200'
                          }`}
                          aria-label="Sesli Dinle"
                          title="Sesli Dinle"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          data-testid={`msg-thumbs-up-${message.id}`}
                          onClick={() => {
                            onToggleLikeMessage(message.id);
                            const modelToFeedback =
                              message.modelId ||
                              currentChat?.modelId ||
                              activeModelId;
                            if (!message.liked) {
                              onModelFeedback?.(
                                message.id,
                                modelToFeedback,
                                'thumbs_up',
                                message.content.slice(0, 140)
                              );
                              showToast(
                                'Model İyileştirme Motoru: Başparmak yukarı sinyali kaydedildi (+İsabet/Öncelik)!'
                              );
                            }
                          }}
                          className={`p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer ${
                            message.liked
                              ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                              : 'hover:text-neutral-700 dark:hover:text-neutral-200'
                          }`}
                          aria-label="Faydalı Buldum (Başparmak Yukarı)"
                          title="Faydalı Buldum (Modeli Güçlendir)"
                        >
                          <ThumbsUp
                            className={`w-3.5 h-3.5 ${
                              message.liked ? 'fill-current' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          data-testid={`msg-thumbs-down-${message.id}`}
                          onClick={() => {
                            onToggleDislikeMessage?.(message.id);
                            const modelToFeedback =
                              message.modelId ||
                              currentChat?.modelId ||
                              activeModelId;
                            if (!message.disliked) {
                              onModelFeedback?.(
                                message.id,
                                modelToFeedback,
                                'thumbs_down',
                                message.content.slice(0, 140)
                              );
                              showToast(
                                'Model İyileştirme Motoru: Başparmak aşağı incelendi (Otonom Onarım Kuralları Devrede)!'
                              );
                            }
                          }}
                          className={`p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer ${
                            message.disliked
                              ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30'
                              : 'hover:text-neutral-700 dark:hover:text-neutral-200'
                          }`}
                          aria-label="Faydalı Değil (Başparmak Aşağı)"
                          title="Faydalı Değil (Otonom Onarımı Başlat)"
                        >
                          <ThumbsDown
                            className={`w-3.5 h-3.5 ${
                              message.disliked ? 'fill-current' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={onRegenerate}
                          className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
                          aria-label="Yeniden Yanıtla"
                          title="Yeniden Yanıtla"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSaveToLibrary(
                              currentChat?.title || 'Kaydedilen Yanıt',
                              sanitizeLuxoBrand(message.content)
                            );
                            setSavedId(message.id);
                            showToast('Yanıt Kitaplığa kaydedildi.');
                            setTimeout(() => setSavedId(null), 2000);
                          }}
                          className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
                          aria-label="Kitaplığa Kaydet"
                          title="Kitaplığa Kaydet"
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              savedId === message.id
                                ? 'text-blue-500 fill-current'
                                : ''
                            }`}
                          />
                        </button>
                        <SocialShareButton
                          compact
                          payload={{
                            title:
                              currentChat?.title ||
                              `${msgModel?.name || currentModel.name} Sentezi`,
                            excerpt: message.content,
                            contentType: 'chat',
                            badge: `${msgModel?.name || currentModel.name} · LUXO AI`,
                          }}
                          onShared={(plat) =>
                            showToast(`${plat} paylaşımı hazırlandı.`)
                          }
                        />
                      </div>
                    )}

                    {isAssistant &&
                      isLastMessage &&
                      !isStreaming &&
                      message.followUpSuggestions &&
                      message.followUpSuggestions.length > 0 && (
                        <div className="mt-3 pt-2 flex flex-wrap gap-1.5">
                          {message.followUpSuggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() =>
                                onSendMessage(sug, undefined, {
                                  webSearch: webSearchEnabled,
                                  deepReasoning: deepReasoningEnabled,
                                  synthesisMode,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#202123] dark:hover:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-800 transition cursor-pointer text-left flex items-center gap-1.5"
                            >
                              <span>{sug}</span>
                              <ArrowRight className="w-3 h-3 text-neutral-400 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              );
            })}

            {isStreaming && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 py-2">
                <LuxoLogo className="w-4 h-4 text-blue-500 animate-spin" size={16} />
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {currentModel.name}
                </span>
                <span>sentezliyor ve yanıtlıyor...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <div className="p-3 sm:p-4 bg-white dark:bg-[#18181b] shrink-0 border-t border-neutral-100 dark:border-neutral-800/60">
        <div className="max-w-3xl mx-auto w-full">
          {attachedFile && (
            <div className="flex items-center gap-2 p-2 mb-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs">
              <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
              <span className="truncate flex-1 font-medium">
                {attachedFile.name}
              </span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-1 hover:text-red-500 transition cursor-pointer"
                aria-label="Dosyayı Kaldır"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isGuestLimitReached ? (
            <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 rounded-3xl p-4 shadow-xs text-center">
              <div className="flex items-center justify-center gap-2 mb-1.5 text-amber-800 dark:text-amber-200 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{GUEST_MESSAGE_LIMIT} Mesajlık Misafir Limiti Doldu</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 max-w-md mx-auto">
                Sohbete sınırsız devam etmek, gelişmiş Luxo modellerini açmak ve bulut senkronizasyonu için Google ile giriş yapın:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>Google ile Giriş Yap</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-white dark:bg-[#202123] border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-full text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Şifre ile Yükselt</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {compareMode && (
                <div className="p-2.5 rounded-2xl bg-indigo-500/8 dark:bg-indigo-950/35 border border-indigo-500/25 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      <Columns2 className="w-3.5 h-3.5" />
                      <span>Yan Yana Model Karşılaştırma Modu Aktif</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {(
                        [
                          {
                            label: 'Gemini 4 vs Claude 4',
                            a: 'gemini-4-argon',
                            b: 'claude-4-sonnet',
                          },
                          {
                            label: 'ChatGPT-5o vs DeepSeek R2',
                            a: 'chatgpt-5-omni',
                            b: 'deepseek-r2',
                          },
                          {
                            label: 'Gemini 4 vs Higgsfield',
                            a: 'gemini-4-argon',
                            b: 'higgsfield-cinema',
                          },
                        ] as const
                      ).map((pair) => (
                        <button
                          key={pair.label}
                          type="button"
                          onClick={() => {
                            setCompareModelA(pair.a);
                            setCompareModelB(pair.b);
                          }}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-[#202123] hover:bg-indigo-50 dark:hover:bg-neutral-800 border border-indigo-500/20 text-[10px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer transition"
                        >
                          {pair.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={compareModelA}
                      onChange={(e) =>
                        setCompareModelA(e.target.value as LuxoModelId)
                      }
                      aria-label="Sol Karşılaştırma Modeli"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-white focus:outline-hidden cursor-pointer"
                    >
                      {accessibleModelIds.map((mId) => (
                        <option key={mId} value={mId}>
                          Sol Model: {LUXO_MODELS[mId].name} ({LUXO_MODELS[mId].category})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        const prevA = compareModelA;
                        setCompareModelA(compareModelB);
                        setCompareModelB(prevA);
                      }}
                      aria-label="Modelleri Yer Değiştir"
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center cursor-pointer transition shrink-0"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>

                    <select
                      value={compareModelB}
                      onChange={(e) =>
                        setCompareModelB(e.target.value as LuxoModelId)
                      }
                      aria-label="Sağ Karşılaştırma Modeli"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-white focus:outline-hidden cursor-pointer"
                    >
                      {accessibleModelIds.map((mId) => (
                        <option key={mId} value={mId}>
                          Sağ Model: {LUXO_MODELS[mId].name} ({LUXO_MODELS[mId].category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {creationMode !== 'auto' && (
                <div className="p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/35 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                    {creationMode === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <Video className="w-4 h-4 text-indigo-500 shrink-0" />
                    )}
                    <span>
                      {creationMode === 'image'
                        ? 'Nano Banana 2.1 · Doğrudan 4K Fotoğraf Modu'
                        : 'Google Veo 3 · Doğrudan MP4 Sinema Video Modu'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {creationMode === 'image' && (
                      <select
                        value={chatImageRatio}
                        onChange={(e) =>
                          setChatImageRatio(e.target.value as VisualAspectRatio)
                        }
                        aria-label="Görsel En-Boy Oranı"
                        className="px-2 py-1 rounded-lg bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-800 dark:text-neutral-100 cursor-pointer"
                      >
                        <option value="16:9">16:9 Yatay</option>
                        <option value="1:1">1:1 Kare</option>
                        <option value="9:16">9:16 Dikey</option>
                        <option value="4:3">4:3 Klasik</option>
                      </select>
                    )}
                    <select
                      value={chatImageStyle}
                      onChange={(e) => setChatImageStyle(e.target.value)}
                      aria-label="Görsel ve Video Stili"
                      className="px-2 py-1 rounded-lg bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-800 dark:text-neutral-100 cursor-pointer"
                    >
                      <option value="Fotogerçekçi">Fotogerçekçi DSLR</option>
                      <option value="Sinematik">Sinematik 35mm</option>
                      <option value="Siberpunk">Siberpunk Neon</option>
                      <option value="3B İllüstrasyon">3B & Anime Stüdyo</option>
                    </select>
                    <button
                      type="button"
                      onClick={handlePickSurpriseChatScene}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#202123] hover:bg-amber-50 dark:hover:bg-neutral-800 border border-amber-500/30 text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1 cursor-pointer transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Sürpriz Sahne</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreationMode('auto')}
                      aria-label="Üretim Modunu Kapat"
                      className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div
                ref={toolsPopoverRef}
                className="relative rounded-3xl bg-[#f4f5f7] dark:bg-[#1e1f24] border border-neutral-200/80 dark:border-neutral-800 focus-within:border-neutral-400 dark:focus-within:border-neutral-600 transition shadow-xs"
              >
                {/* Unified Araçlar & Modlar Popover Hub */}
                {isToolsMenuOpen && (
                  <div
                    role="dialog"
                    aria-label="Araçlar, Üretim ve Akıl Yürütme Modları"
                    data-testid="unified-tools-popover"
                    className="absolute bottom-full left-0 right-0 sm:right-auto sm:w-[440px] mb-2.5 p-3.5 rounded-2xl bg-white dark:bg-[#18191e] border border-neutral-200 dark:border-neutral-800 shadow-xl z-40 space-y-3.5"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                      <div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-white">
                          Araçlar, Medya & Muhakeme Merkezi
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Görsel, video, model karşılaştırma ve derin düşünme modları
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsToolsMenuOpen(false)}
                        aria-label="Araçlar menüsünü kapat"
                        className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Section 1: Media & Comparison Modes */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                        Üretim & Karşılaştırma
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCreationMode(
                              creationMode === 'image' ? 'auto' : 'image'
                            );
                            setCompareMode(false);
                            setIsToolsMenuOpen(false);
                          }}
                          aria-pressed={creationMode === 'image'}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 cursor-pointer text-left ${
                            creationMode === 'image'
                              ? 'bg-amber-500 text-neutral-950 border-amber-500'
                              : 'bg-neutral-50 dark:bg-[#202228] border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <ImageIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate">Görsel Üret (4K)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCreationMode(
                              creationMode === 'video' ? 'auto' : 'video'
                            );
                            setCompareMode(false);
                            setIsToolsMenuOpen(false);
                          }}
                          aria-pressed={creationMode === 'video'}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 cursor-pointer text-left ${
                            creationMode === 'video'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-neutral-50 dark:bg-[#202228] border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <Video className="w-4 h-4 shrink-0" />
                          <span className="truncate">Video Üret (Veo 3)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCompareMode(!compareMode);
                            setCreationMode('auto');
                            setIsToolsMenuOpen(false);
                          }}
                          aria-pressed={compareMode}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 cursor-pointer text-left ${
                            compareMode
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-neutral-50 dark:bg-[#202228] border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <Columns2 className="w-4 h-4 shrink-0" />
                          <span className="truncate">Yan Yana Karşılaştır</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsToolsMenuOpen(false);
                            onOpenImagesView();
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border bg-neutral-50 dark:bg-[#202228] border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center gap-2 cursor-pointer text-left"
                        >
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="truncate">4K Medya Stüdyosu</span>
                        </button>
                      </div>
                    </div>

                    {/* Section 2: Reasoning, Web Research & Prompt Enhancer */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                        Akıl Yürütme & Araştırma
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={deepReasoningEnabled}
                          onClick={() =>
                            setDeepReasoningEnabled(!deepReasoningEnabled)
                          }
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-between gap-2 cursor-pointer ${
                            deepReasoningEnabled
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-neutral-50 dark:bg-[#202228] border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Brain className="w-4 h-4 shrink-0" />
                            <span className="truncate">Derin Düşünme</span>
                          </span>
                          {deepReasoningEnabled && (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          )}
                        </button>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={webSearchEnabled}
                          onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-between gap-2 cursor-pointer ${
                            webSearchEnabled
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-neutral-50 dark:bg-[#202228] border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Globe className="w-4 h-4 shrink-0" />
                            <span className="truncate">Web Araştırması</span>
                          </span>
                          {webSearchEnabled && (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleEnhanceInputPrompt();
                          setIsToolsMenuOpen(false);
                        }}
                        disabled={!inputText.trim() || isEnhancingPrompt}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-45 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <WandSparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isEnhancingPrompt
                            ? 'İstem Güçlendiriliyor...'
                            : 'Yazılan İstemi Güçlendir (Prompt Optimizer)'}
                        </span>
                      </button>

                      {onOpenVoiceCommands && (
                        <button
                          type="button"
                          data-testid="tools-voice-cmd-btn"
                          onClick={() => {
                            setIsToolsMenuOpen(false);
                            onOpenVoiceCommands();
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Mic className="w-3.5 h-3.5 shrink-0" />
                          <span>Sesli Komut Modu (Tema, Proje, Navigasyon)</span>
                        </button>
                      )}
                    </div>

                    {/* Section 3: Synthesis Style */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <label
                        htmlFor="unified-synthesis-select"
                        className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400"
                      >
                        Yanıt Sentez Üslubu
                      </label>
                      <select
                        id="unified-synthesis-select"
                        value={synthesisMode}
                        onChange={(e) =>
                          setSynthesisMode(e.target.value as SynthesisMode)
                        }
                        aria-label="Sentez Modu"
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-50 dark:bg-[#202228] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 focus:outline-hidden cursor-pointer"
                      >
                        {SYNTHESIS_MODES.map((m) => (
                          <option key={m.id} value={m.id}>
                            Sentez: {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Compact Active Mode Indicators (shown ONLY when at least one non-default mode is enabled) */}
                {activeToolCount > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 px-3.5 pt-2.5 pb-0.5">
                    {creationMode === 'image' && (
                      <button
                        type="button"
                        onClick={() => setCreationMode('auto')}
                        className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-amber-500/25 transition whitespace-nowrap"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Görsel Üret</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {creationMode === 'video' && (
                      <button
                        type="button"
                        onClick={() => setCreationMode('auto')}
                        className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-indigo-500/25 transition whitespace-nowrap"
                      >
                        <Video className="w-3 h-3" />
                        <span>Video Üret</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {compareMode && (
                      <button
                        type="button"
                        onClick={() => setCompareMode(false)}
                        className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-indigo-500/25 transition whitespace-nowrap"
                      >
                        <Columns2 className="w-3 h-3" />
                        <span>Karşılaştır</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {deepReasoningEnabled && (
                      <button
                        type="button"
                        onClick={() => setDeepReasoningEnabled(false)}
                        className="px-2.5 py-0.5 rounded-lg bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-purple-500/25 transition whitespace-nowrap"
                      >
                        <Brain className="w-3 h-3" />
                        <span>Derin Düşünme</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {webSearchEnabled && (
                      <button
                        type="button"
                        onClick={() => setWebSearchEnabled(false)}
                        className="px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-blue-500/25 transition whitespace-nowrap"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Web Araştırması</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {synthesisMode !== 'standart' && (
                      <button
                        type="button"
                        onClick={() => setSynthesisMode('standart')}
                        className="px-2.5 py-0.5 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-neutral-300/70 dark:hover:bg-neutral-700 transition whitespace-nowrap"
                      >
                        <span>
                          Sentez:{' '}
                          {SYNTHESIS_MODES.find((m) => m.id === synthesisMode)
                            ?.label || synthesisMode}
                        </span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 transition cursor-pointer shrink-0"
                    aria-label="Dosya veya Resim Ekle"
                    title="Dosya veya Görsel Ekle"
                  >
                    <Plus className="w-5 h-5 stroke-[2.2]" />
                  </button>

                  <button
                    type="button"
                    data-testid="open-composer-tools-btn"
                    onClick={() => setIsToolsMenuOpen((prev) => !prev)}
                    aria-expanded={isToolsMenuOpen}
                    aria-haspopup="dialog"
                    aria-label="Üretim, Muhakeme ve Sentez Araçları"
                    title="Görsel, Video, Derin Düşünme, Web Araştırması ve Sentez Araçları"
                    className={`h-8 px-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                      isToolsMenuOpen || activeToolCount > 0
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#27282f] text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden xs:inline sm:inline">Araçlar</span>
                    {activeToolCount > 0 && (
                      <span className="font-mono text-[11px] tabular-nums">
                        ({activeToolCount})
                      </span>
                    )}
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      onTypingActivity?.(true);
                      if (typingTimerRef.current) {
                        clearTimeout(typingTimerRef.current);
                      }
                      typingTimerRef.current = setTimeout(() => {
                        onTypingActivity?.(false);
                      }, 1200);
                    }}
                    placeholder={
                      creationMode === 'image'
                        ? 'Üretilecek fotoğrafı tarif edin (Örn: Mars yüzeyinde yürüyen kırmızı astronot)...'
                        : creationMode === 'video'
                        ? 'Üretilecek MP4 video sahnesini tarif edin (Örn: Gün batımında İstanbul Boğazı drone uçuşu)...'
                        : compareMode
                        ? `${LUXO_MODELS[compareModelA].name} ve ${LUXO_MODELS[compareModelB].name} modellerine aynı anda sor...`
                        : "Luxo AI'ya sor veya Araçlar'dan mod seç..."
                    }
                    disabled={isStreaming}
                    className="flex-1 min-w-0 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-hidden py-1.5 px-1"
                  />

                  <button
                    type="button"
                    onClick={() => {
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
                        onOpenVoiceModal();
                        return;
                      }
                      if (isRecording) {
                        setIsRecording(false);
                        return;
                      }
                      const rec = new (SpeechRec as new () => {
                        lang: string;
                        onstart: () => void;
                        onresult: (e: { results: { transcript: string }[][] }) => void;
                        onend: () => void;
                        onerror: () => void;
                        start: () => void;
                      })();
                      rec.lang = 'tr-TR';
                      rec.onstart = () => {
                        setIsRecording(true);
                        showToast('Dinleniyor... Konuşun.');
                      };
                      rec.onresult = (ev) => {
                        const transcript = ev.results[0][0].transcript;
                        setInputText((prev) =>
                          prev ? `${prev} ${transcript}` : transcript
                        );
                      };
                      rec.onend = () => setIsRecording(false);
                      rec.onerror = () => {
                        setIsRecording(false);
                        showToast('Ses algılanamadı, Canlı Ses Stüdyosu açılabilir.');
                      };
                      rec.start();
                    }}
                    className={`p-2 rounded-full transition cursor-pointer shrink-0 ${
                      isRecording
                        ? 'text-red-500 bg-red-100 dark:bg-red-900/30'
                        : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
                    }`}
                    aria-label="Mikrofon"
                  >
                    <Mic className="w-4.5 h-4.5 stroke-[1.9]" />
                  </button>

                  {inputText.trim() && (
                    <button
                      type="submit"
                      disabled={isStreaming}
                      className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
                      aria-label="Gönder"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onOpenVoiceCommands && (
                    <button
                      type="button"
                      data-testid="composer-voice-cmd-btn"
                      onClick={onOpenVoiceCommands}
                      className="hidden sm:flex items-center gap-1 px-2.5 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                      aria-label="Sesli Komut Modu"
                      title="Sesli Komut Modu (Doğal dil ile tema, proje ve gezinme komutları)"
                    >
                      <Mic className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden md:inline">Komut</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onOpenVoiceModal}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1b64f2] hover:bg-blue-700 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs shrink-0"
                    aria-label="Canlı Sesli Sohbet"
                    title="Canlı Ses Stüdyosu (10 Ses)"
                  >
                    <div className="flex items-center gap-0.5">
                      <span className="w-0.5 h-3 bg-white rounded-full" />
                      <span className="w-0.5 h-4 bg-white rounded-full" />
                      <span className="w-0.5 h-2.5 bg-white rounded-full" />
                      <span className="w-0.5 h-3.5 bg-white rounded-full" />
                    </div>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModelModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Luxo AI Modelleri"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModelModal(false);
          }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-2xl bg-white dark:bg-[#202123] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <LuxoLogo className="w-4 h-4 text-white" size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                    Yapay Zeka Model Merkezi ({totalModelCount} Model)
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Gemini, ChatGPT & o3/o4, Claude, DeepSeek, Grok, Llama 4, Mistral, Qwen, Runway, Kling & Perplexity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModelModal(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                aria-label="Model Seçimini Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 mb-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  placeholder={`${totalModelCount} model içinde ara (Örn: GPT-4.5, Claude 4, DeepSeek R2, Runway Gen-4, Kling 2, Grok 3, Qwen 3)...`}
                  aria-label="Yapay zeka modeli ara"
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:border-indigo-500"
                />
                {modelSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModelSearchQuery('')}
                    aria-label="Aramayı temizle"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {LUXO_MODEL_CATEGORIES.map((cat) => {
                  const activeCat = modelCategoryFilter === cat;
                  const count =
                    cat === 'Tümü'
                      ? Object.keys(LUXO_MODELS).length
                      : (Object.keys(LUXO_MODELS) as LuxoModelId[]).filter(
                          (id) => LUXO_MODELS[id].category === cat
                        ).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setModelCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                        activeCat
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-neutral-100 dark:bg-[#18181b] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 overflow-y-auto pr-1 flex-1">
              {(Object.keys(LUXO_MODELS) as LuxoModelId[])
                .filter((mId) => {
                  const m = LUXO_MODELS[mId];
                  if (
                    modelCategoryFilter !== 'Tümü' &&
                    m.category !== modelCategoryFilter
                  ) {
                    return false;
                  }
                  if (modelSearchQuery.trim()) {
                    const q = modelSearchQuery.toLowerCase();
                    return (
                      m.name.toLowerCase().includes(q) ||
                      m.badge.toLowerCase().includes(q) ||
                      m.description.toLowerCase().includes(q) ||
                      m.capabilities.some((c) => c.toLowerCase().includes(q))
                    );
                  }
                  return true;
                })
                .map((mId) => {
                  const m = LUXO_MODELS[mId];
                  const access = canAccessModel(mId, user);
                  const isSelected = activeModelId === mId;
                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => {
                        if (access.allowed) {
                          onSelectModel(mId);
                          setShowModelModal(false);
                          showToast(`${m.name} modeli seçildi.`);
                        } else {
                          setShowModelModal(false);
                          if (access.reason === 'guest') {
                            onOpenAuthModal();
                            showToast(
                              `${m.name} modelini kullanabilmek için Google ile giriş yapın.`
                            );
                          } else {
                            onOpenUpgradeModal();
                          }
                        }
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition cursor-pointer border ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/25'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white shadow-xs"
                        style={{ backgroundColor: m.accentColor }}
                      >
                        <LuxoLogo className="w-4 h-4 text-white" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {m.name}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                            {m.badge}
                          </span>
                          {access.allowed ? (
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium shrink-0 tabular-nums">
                              {m.contextWindow}
                            </span>
                          ) : access.reason === 'guest' ? (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-semibold shrink-0">
                              <Lock className="w-2.5 h-2.5" /> Giriş
                            </span>
                          ) : access.reason === 'dev_helper_locked' ? (
                            <span className="text-[10px] text-sky-600 dark:text-sky-400 flex items-center gap-0.5 font-semibold shrink-0">
                              <Lock className="w-2.5 h-2.5" /> Go
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-semibold shrink-0">
                              <Lock className="w-2.5 h-2.5" /> Plus
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-snug">
                          {m.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowModelModal(false);
                onOpenUpgradeModal();
              }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <LuxoLogo className="w-4 h-4 text-white" size={16} />
              <span>
                {user.isUnlockedDev
                  ? 'VIP Dev Plus & Go Aktif'
                  : user.isUnlockedDevHelper
                  ? "Go Aktif - Plus'a Yükselt"
                  : 'Planı Yükselt'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
