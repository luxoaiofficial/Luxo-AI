import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  ArrowRight,
  Bell,
  Bookmark,
  Bot,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Columns2,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileDown,
  Folder,
  Gauge,
  Globe,
  Image as ImageIcon,
  Key,
  Lock,
  Mic,
  Moon,
  PanelLeft,
  PanelRight,
  Paperclip,
  PenLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Square,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import {
  AdaptiveSiteSuggestion,
  AssistantPersona,
  CatalogModelEntry,
  ChatCreationMode,
  ChatThread,
  DailyModelTokenUsage,
  KnowledgeDocSummary,
  LuxoModelCategory,
  LuxoModelConfig,
  LuxoModelId,
  LuxoProject,
  LuxoUser,
  ModelTokenLimitOverride,
  ProviderConnectionStatusMap,
  SynthesisMode,
  VisualAspectRatio,
} from '../types/luxo';
import {
  calculateGuestRemainingMessages,
  enhanceUserPrompt,
  EXTENDED_CATALOG_MODEL_IDS,
  getSelectableChatModelIds,
  getVoiceOption,
  GUEST_MESSAGE_LIMIT,
  LUXO_MODEL_CATEGORIES,
  LUXO_MODELS,
  LUXO_VOICES,
  sanitizeLuxoBrand,
  SYNTHESIS_MODES,
} from '../utils/luxoLogic';
import {
  DEFAULT_PROVIDER_STATUS,
  DEFAULT_WORKING_MODEL_ID,
  formatTokenCount,
  getEffectiveModelTokenLimits,
  getModelDailyUsage,
  isModelExecutableWithProviders,
  PROVIDER_META,
} from '../utils/tokenLimitsEngine';
import { LuxoLogo, MarkdownContent, ModelBrandAvatar } from './LuxoLogo';
import { QuickSocialShareButtons } from './SocialShareBar';
import { ContentRatingAndComments } from './ContentRatingAndComments';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';

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
  cloudSyncVisible?: boolean;
  onOpenExtendedCatalog?: () => void;
  onOpenProviderSettings?: () => void;
  showExtendedCatalog?: boolean;
  isCatalogUnlocked?: boolean;
  providerStatus?: ProviderConnectionStatusMap;
  providersLoaded?: boolean;
  tokenOverrides?: Partial<Record<string, ModelTokenLimitOverride>>;
  dailyTokenUsage?: Record<string, DailyModelTokenUsage>;
  onUpdateModelTokenOverride?: (
    modelId: LuxoModelId,
    override: ModelTokenLimitOverride
  ) => void;
  onResetModelTokenOverride?: (modelId: LuxoModelId) => void;
  catalogModels?: CatalogModelEntry[];
  zeroCostEnabled?: boolean;
  favoriteModelIds?: string[];
  recentModelIds?: string[];
  onStopGenerating?: () => void;
  onEditAndRerunMessage?: (messageId: string, newContent: string) => void;
  knowledgeDocs?: KnowledgeDocSummary[];
  attachedKnowledgeDocIds?: string[];
  onToggleKnowledgeDoc?: (docId: string) => void;
  onToggleRightPanel?: () => void;
  isRightPanelOpen?: boolean;
  activeAssistant?: AssistantPersona | null;
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
  onOpenImagesView,
  onOpenEvolutionView,
  onOpenAuthModal,
  onSaveToLibrary,
  onOpenCommandPalette,
  isDarkTheme = false,
  onToggleTheme,
  onSynthesizeComparison,
  externalCompareRequest = 0,
  onTypingActivity,
  cloudSyncVisible = false,
  onOpenExtendedCatalog,
  onOpenProviderSettings,
  showExtendedCatalog = false,
  isCatalogUnlocked = false,
  providerStatus = DEFAULT_PROVIDER_STATUS,
  providersLoaded = true,
  tokenOverrides,
  dailyTokenUsage,
  onUpdateModelTokenOverride,
  onResetModelTokenOverride,
  catalogModels,
  zeroCostEnabled = false,
  favoriteModelIds = [],
  recentModelIds = [],
  onStopGenerating,
  onEditAndRerunMessage,
  knowledgeDocs = [],
  attachedKnowledgeDocIds = [],
  onToggleKnowledgeDoc,
  onToggleRightPanel,
  isRightPanelOpen = false,
  activeAssistant = null,
  user,
  isStreaming,
}) => {
  const [inputText, setInputText] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [showModelModal, setShowModelModal] = useState(false);
  const [isTokenPopoverOpen, setIsTokenPopoverOpen] = useState(false);
  const [modelCategoryFilter, setModelCategoryFilter] = useState<
    'Tümü' | LuxoModelCategory
  >('Tümü');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareModelA, setCompareModelA] = useState<LuxoModelId>(
    DEFAULT_WORKING_MODEL_ID
  );
  const [compareModelB, setCompareModelB] =
    useState<LuxoModelId>('gemini-4-hydrogen');
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
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolsPopoverRef = useRef<HTMLDivElement | null>(null);
  const tokenPopoverRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentModel: LuxoModelConfig = useMemo(() => {
    if (LUXO_MODELS[activeModelId]) return LUXO_MODELS[activeModelId];
    const cat = catalogModels?.find((c) => c.id === activeModelId);
    if (cat) {
      return {
        id: cat.id as LuxoModelId,
        name: cat.name || cat.id,
        badge:
          cat.pricingStatus === 'FREE' || cat.pricingStatus === 'FREE_TIER'
            ? 'Free'
            : 'Catalog',
        category: 'Perplexity & Küresel AI',
        provider: cat.providerId as LuxoModelConfig['provider'],
        sdkBackend: cat.adapter || 'openai-compatible',
        tagline: cat.description || cat.providerLabel || cat.providerId,
        description: cat.description || '',
        speed: 'Hızlı',
        isLocked: !cat.executable,
        accentColor: cat.accentColor || '#7c3aed',
        thinkingLevel: 'MEDIUM',
        tier: cat.tier || 'free',
        contextWindow: `${Math.round((cat.contextLength || 128000) / 1000)}K`,
        logoUrl: cat.logoPath,
        allowGuest: true,
        capabilities: cat.capabilities || ['chat'],
        maxInputTokens: cat.contextLength || 128000,
        maxOutputTokens: cat.maxOutputTokens || 8192,
        defaultDailyTokenLimit: 400000,
        systemInstruction: '',
      };
    }
    return LUXO_MODELS[DEFAULT_WORKING_MODEL_ID];
  }, [activeModelId, catalogModels]);

  const currentLimits = getEffectiveModelTokenLimits(
    currentModel.id,
    tokenOverrides
  );
  const currentDailyUsage = getModelDailyUsage(dailyTokenUsage, currentModel.id);
  const currentCatalogEntry = catalogModels?.find(
    (c) => c.id === currentModel.id
  );
  const currentAvailability = useMemo(() => {
    if (currentCatalogEntry) {
      if (zeroCostEnabled && !currentCatalogEntry.zeroCostAllowed) {
        return {
          unlocked: false,
          provider: currentModel.provider,
          reason: 'zero_cost_blocked',
          reasonLabelTr: currentCatalogEntry.zeroCostReason || 'Zero-Cost Politikası',
        };
      }
      if (!currentCatalogEntry.executable) {
        return {
          unlocked: false,
          provider: currentModel.provider,
          reason: 'provider_unconfigured',
          reasonLabelTr: 'API Anahtarı Gerekli',
        };
      }
      return {
        unlocked: true,
        provider: currentModel.provider,
        reason: 'ok',
        reasonLabelTr: 'API Hazır',
      };
    }
    return isModelExecutableWithProviders(
      currentModel.id,
      providerStatus,
      user,
      currentModel.allowGuest !== false
    );
  }, [currentCatalogEntry, currentModel, providerStatus, user, zeroCostEnabled]);

  const dailyQuotaPercent = Math.min(
    100,
    Math.round(
      (currentDailyUsage.totalTokens /
        Math.max(1, currentLimits.dailyTokenLimit)) *
        100
    )
  );

  const messages = currentChat?.messages || [];
  const guestRemaining = calculateGuestRemainingMessages(user);
  const isGuestLimitReached = user.isGuest && guestRemaining <= 0;
  const selectableModelIds = getSelectableChatModelIds(
    activeModelId,
    showExtendedCatalog
  );
  const totalModelCount = selectableModelIds.length;
  const accessibleModelIds = selectableModelIds.filter(
    (id) =>
      isModelExecutableWithProviders(
        id,
        providerStatus,
        user,
        LUXO_MODELS[id]?.allowGuest !== false
      ).unlocked
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
    if (!isToolsMenuOpen && !isTokenPopoverOpen) return;
    const handlePointerDown = (ev: MouseEvent) => {
      if (
        isToolsMenuOpen &&
        toolsPopoverRef.current &&
        !toolsPopoverRef.current.contains(ev.target as Node)
      ) {
        setIsToolsMenuOpen(false);
      }
      if (
        isTokenPopoverOpen &&
        tokenPopoverRef.current &&
        !tokenPopoverRef.current.contains(ev.target as Node)
      ) {
        setIsTokenPopoverOpen(false);
      }
    };
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsToolsMenuOpen(false);
        setIsTokenPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isToolsMenuOpen, isTokenPopoverOpen]);

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

  const handleExportPdf = async () => {
    if (!currentChat || currentChat.messages.length === 0) {
      showToast('PDF olarak dışa aktarılacak mesaj bulunmuyor.');
      return;
    }
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const { exportChatToPdf } = await import('../utils/chatPdfExporter');
      const res = exportChatToPdf(currentChat, currentModel.name);
      showToast(
        `Sohbet formatlı PDF olarak indirildi (${res.pageCount} sayfa).`
      );
    } catch {
      showToast('PDF oluşturulurken bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  useEffect(() => {
    const onExportPdfEvent = () => {
      if (currentChat && currentChat.messages.length > 0) {
        void handleExportPdf();
      }
    };
    window.addEventListener('luxo-export-active-chat-pdf', onExportPdfEvent);
    return () => {
      window.removeEventListener(
        'luxo-export-active-chat-pdf',
        onExportPdfEvent
      );
    };
  });

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#0b0d14] text-slate-900 dark:text-slate-100 select-none relative overflow-hidden luxo-ambient-glow">
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl shadow-lg border border-slate-700/40 dark:border-slate-200">
          {toastMessage}
        </div>
      )}

      <header className="h-13 flex items-center justify-between gap-2 px-3 sm:px-5 bg-white/90 dark:bg-[#0b0d14]/90 backdrop-blur-md z-20 shrink-0 border-b border-slate-200/80 dark:border-slate-800/80 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-initial">
          <button
            type="button"
            data-testid="header-sidebar-toggle-btn"
            onClick={onOpenSidebar}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-[#181c2b] flex items-center justify-center text-slate-700 dark:text-slate-200 transition active:scale-95 cursor-pointer shrink-0"
            aria-label="Kenar Çubuğunu Aç veya Daralt"
            title="Kenar Çubuğu"
          >
            <PanelLeft className="w-4.5 h-4.5" />
          </button>

          <div className="min-w-0 flex-1 sm:flex-initial">
            <ModelSelectorDropdown
              activeModelId={activeModelId}
              onSelectModel={onSelectModel}
              user={user}
              providerStatus={providerStatus}
              tokenOverrides={tokenOverrides}
              dailyTokenUsage={dailyTokenUsage}
              catalogModels={catalogModels}
              zeroCostEnabled={zeroCostEnabled}
              favoriteModelIds={favoriteModelIds}
              recentModelIds={recentModelIds}
              onOpenUpgradeModal={onOpenUpgradeModal}
              onOpenExtendedCatalog={onOpenExtendedCatalog}
              onOpenProviderSettings={onOpenProviderSettings}
              showExtendedCatalog={showExtendedCatalog}
              isCatalogUnlocked={isCatalogUnlocked}
              compact
              testIdPrefix="top-model-selector"
            />
          </div>

          {activeAssistant && (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-300 shrink-0 pl-1">
              <Bot className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate max-w-[130px]">
                {activeAssistant.name}
              </span>
            </div>
          )}

          {activeProject && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 shrink-0 pl-1">
              <Folder className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-medium truncate max-w-[120px]">
                {activeProject.name}
              </span>
              <button
                type="button"
                onClick={onClearActiveProject}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                aria-label="Proje bağlamını kaldır"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Inline Token Limit & Daily Quota Popover Trigger */}
          <div ref={tokenPopoverRef} className="relative">
            <button
              type="button"
              data-testid="token-limit-popover-btn"
              onClick={() => setIsTokenPopoverOpen((prev) => !prev)}
              aria-expanded={isTokenPopoverOpen}
              aria-haspopup="dialog"
              title="Aktif model token sınırı ve günlük kota ayarları"
              className={`h-9 flex items-center gap-1.5 px-2.5 rounded-xl border text-xs font-medium transition cursor-pointer whitespace-nowrap tabular-nums ${
                dailyQuotaPercent >= 90
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-[#232429] text-neutral-700 dark:text-neutral-200'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
              <span className="hidden md:inline font-mono text-[11px]">
                {formatTokenCount(currentLimits.maxOutputTokens)} çıktı
              </span>
              <span className="text-neutral-300 dark:text-neutral-700 hidden md:inline">
                ·
              </span>
              <span className="font-mono text-[11px]">
                {formatTokenCount(currentDailyUsage.totalTokens)}/
                {formatTokenCount(currentLimits.dailyTokenLimit)}
              </span>
            </button>

            {isTokenPopoverOpen && (
              <div
                role="dialog"
                aria-label="Model Token Limitleri ve Günlük Kota"
                data-testid="token-limit-popover"
                className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-14 sm:top-full sm:mt-2 z-50 sm:w-[340px] bg-white dark:bg-[#191a1e] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-4 space-y-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {currentModel.name} · Token Sınırları
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                      {PROVIDER_META[currentModel.provider]?.shortLabel} · Bağlam:{' '}
                      {formatTokenCount(currentLimits.maxInputTokens)} ·{' '}
                      {currentAvailability.reasonLabelTr}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTokenPopoverOpen(false)}
                    aria-label="Token limit penceresini kapat"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Daily Quota Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-neutral-600 dark:text-neutral-300">
                      Bugünkü Tüketim
                    </span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {currentDailyUsage.totalTokens.toLocaleString('tr-TR')} /{' '}
                      {currentLimits.dailyTokenLimit.toLocaleString('tr-TR')} tok
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        dailyQuotaPercent >= 90
                          ? 'bg-amber-500'
                          : 'bg-neutral-900 dark:bg-white'
                      }`}
                      style={{ width: `${dailyQuotaPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 tabular-nums">
                    <span>{currentDailyUsage.requestCount} istek</span>
                    <span>
                      ↓ {formatTokenCount(currentDailyUsage.inputTokens)} · ↑{' '}
                      {formatTokenCount(currentDailyUsage.outputTokens)}
                    </span>
                  </div>
                </div>

                {/* Max Output Tokens Slider */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <label
                      htmlFor="popover-max-output-range"
                      className="font-medium text-neutral-700 dark:text-neutral-200"
                    >
                      Yanıt Başına Maks. Çıktı
                    </label>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {currentLimits.maxOutputTokens.toLocaleString('tr-TR')} tok
                    </span>
                  </div>
                  <input
                    id="popover-max-output-range"
                    data-testid="token-max-output-slider"
                    type="range"
                    min={512}
                    max={currentLimits.hardMaxOutputTokens}
                    step={256}
                    value={currentLimits.maxOutputTokens}
                    onChange={(e) =>
                      onUpdateModelTokenOverride?.(currentModel.id, {
                        maxOutputTokens: Number(e.target.value),
                        dailyTokenLimit: currentLimits.dailyTokenLimit,
                      })
                    }
                    className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono tabular-nums">
                    <span>512</span>
                    <span>{formatTokenCount(currentLimits.hardMaxOutputTokens)}</span>
                  </div>
                </div>

                {/* Daily Quota Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <label
                      htmlFor="popover-daily-quota-range"
                      className="font-medium text-neutral-700 dark:text-neutral-200"
                    >
                      Günlük Token Kotası
                    </label>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {formatTokenCount(currentLimits.dailyTokenLimit)} tok
                    </span>
                  </div>
                  <input
                    id="popover-daily-quota-range"
                    data-testid="token-daily-quota-slider"
                    type="range"
                    min={10000}
                    max={2000000}
                    step={10000}
                    value={currentLimits.dailyTokenLimit}
                    onChange={(e) =>
                      onUpdateModelTokenOverride?.(currentModel.id, {
                        maxOutputTokens: currentLimits.maxOutputTokens,
                        dailyTokenLimit: Number(e.target.value),
                      })
                    }
                    className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    data-testid="token-limit-reset-btn"
                    onClick={() => {
                      onResetModelTokenOverride?.(currentModel.id);
                      showToast('Model token sınırları varsayılana sıfırlandı.');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Varsayılana Sıfırla</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {onOpenCommandPalette && (
            <button
              type="button"
              data-testid="header-search-btn"
              onClick={onOpenCommandPalette}
              aria-label="Hızlı Model ve Komut Arama"
              title="Hızlı Arama (Ctrl+K)"
              className="hidden sm:flex h-9 items-center justify-center gap-1.5 px-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-[#232429] text-neutral-600 dark:text-neutral-300 text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:inline font-mono text-[11px]">⌘K</span>
            </button>
          )}
          {messages.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-testid="export-chat-pdf-btn"
                disabled={isExportingPdf}
                onClick={() => void handleExportPdf()}
                className="h-9 flex items-center gap-1 px-2.5 rounded-xl border border-violet-500/30 bg-violet-600/15 hover:bg-violet-600/25 disabled:opacity-60 text-violet-700 dark:text-violet-200 transition cursor-pointer shrink-0 text-[11px] font-semibold"
                aria-label="Sohbeti PDF Olarak Dışa Aktar"
                title="Formatlı PDF Belgesi Olarak İndir"
              >
                <FileDown className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {isExportingPdf ? 'Hazır...' : 'PDF'}
                </span>
              </button>
              <button
                type="button"
                data-testid="export-chat-btn"
                onClick={() => handleExportChat('txt')}
                className="hidden md:flex h-9 items-center gap-1 px-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#232429] transition cursor-pointer shrink-0 text-[11px] font-medium"
                aria-label="Export Chat"
                title="Metin dosyası olarak indir (.txt)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>TXT</span>
              </button>
            </div>
          )}
          {onToggleTheme && (
            <button
              type="button"
              data-testid="header-theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label={isDarkTheme ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
              title={isDarkTheme ? 'Açık Tema' : 'Koyu Tema'}
              className="w-9 h-9 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#232429] flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition cursor-pointer shrink-0"
            >
              {isDarkTheme ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onOpenNewChat}
            className="hidden sm:flex w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-[#181c2b] items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer shrink-0"
            aria-label="Yeni Sohbet"
            title="Yeni Sohbet"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onToggleRightPanel && (
            <button
              type="button"
              data-testid="chat-right-panel-toggle-btn"
              onClick={onToggleRightPanel}
              aria-pressed={isRightPanelOpen}
              aria-label="Bağlam Panelini Aç veya Kapat"
              title="Sağ Bağlam Paneli"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0 ${
                isRightPanelOpen
                  ? 'bg-violet-600/12 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181c2b]'
              }`}
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {user.isGuest && (
        <div className="bg-neutral-50 dark:bg-[#1c1d22] border-b border-neutral-200/70 dark:border-neutral-800/80 px-3 sm:px-5 py-1 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-300 shrink-0">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <span className="font-medium truncate tabular-nums">
              {guestRemaining > 0
                ? `Misafir oturumu · Kalan ${guestRemaining} mesaj`
                : 'Misafir mesaj kotası doldu'}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="font-semibold text-neutral-900 dark:text-white hover:underline shrink-0 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Google ile Giriş</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col justify-between">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full py-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3.5">
                <ModelBrandAvatar
                  name={currentModel.name}
                  logoUrl={currentModel.logoUrl}
                  provider={currentModel.provider}
                  modelId={currentModel.id}
                  accentColor={currentModel.accentColor}
                  sizeClass="w-11 h-11 rounded-xl"
                  imgClass="w-full h-full object-contain p-1"
                />
              </div>
              <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-neutral-900 dark:text-white mb-1.5">
                Bugün ne üzerinde çalışıyoruz?
              </h1>
              <p className="text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 tabular-nums">
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {currentModel.name}
                </span>{' '}
                · {formatTokenCount(currentLimits.maxInputTokens)} bağlam ·{' '}
                {formatTokenCount(currentLimits.maxOutputTokens)} maks çıktı ·{' '}
                <button
                  type="button"
                  onClick={() => setShowModelModal(true)}
                  className="font-medium text-neutral-800 dark:text-neutral-200 hover:underline cursor-pointer"
                >
                  {accessibleModelIds.length} Aktif / {totalModelCount} Model
                </button>
              </p>

              {providersLoaded && !currentAvailability.unlocked && (
                <div
                  data-testid="locked-active-model-notice"
                  className="mt-4 mx-auto max-w-lg p-3 rounded-xl border border-amber-500/30 bg-amber-500/8 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-neutral-700 dark:text-neutral-200">
                      <span className="font-semibold">{currentModel.name}</span> şu
                      an kilitli ({currentAvailability.reasonLabelTr}).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectModel(DEFAULT_WORKING_MODEL_ID)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[11px] font-semibold shrink-0 cursor-pointer"
                  >
                    Aktif Modele Geç
                  </button>
                </div>
              )}

              <div
                data-testid="quick-brand-switcher"
                className="mt-4 flex flex-wrap items-center justify-center gap-1.5"
              >
                {(
                  [
                    { id: DEFAULT_WORKING_MODEL_ID, label: 'Gemini 3.1 Lite' },
                    { id: 'gemini-4-hydrogen', label: 'Gemini 4' },
                    { id: 'luxo-auto-router', label: 'Auto Router' },
                    { id: 'chatgpt-5-2-pro', label: 'ChatGPT-5.2' },
                    { id: 'claude-5-5-opus', label: 'Claude 5.5' },
                    { id: 'deepseek-r2', label: 'DeepSeek R2' },
                  ] as const
                ).map((item) => {
                  const m = LUXO_MODELS[item.id];
                  if (!m) return null;
                  const avail = isModelExecutableWithProviders(
                    item.id,
                    providerStatus,
                    user,
                    m.allowGuest !== false
                  );
                  const isSelected = activeModelId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (!avail.unlocked) {
                          showToast(
                            `${m.name} kilitli: ${avail.reasonLabelTr}`
                          );
                          onOpenProviderSettings?.();
                          return;
                        }
                        onSelectModel(item.id);
                        showToast(`${m.name} seçildi.`);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                          : avail.unlocked
                          ? 'bg-white dark:bg-[#202126] text-neutral-700 dark:text-neutral-200 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                          : 'bg-neutral-50 dark:bg-[#1b1c20] text-neutral-400 dark:text-neutral-500 border-neutral-200/60 dark:border-neutral-800/70'
                      }`}
                    >
                      <ModelBrandAvatar
                        name={m.name}
                        logoUrl={m.logoUrl}
                        provider={m.provider}
                        modelId={m.id}
                        accentColor={m.accentColor}
                        sizeClass="w-3.5 h-3.5 rounded-sm"
                      />
                      <span>{item.label}</span>
                      {!avail.unlocked && (
                        <Lock className="w-3 h-3 opacity-75 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onSelectModel('gemini-4-hydrogen');
                  setSynthesisMode('uzman-mimari');
                  setInputText(
                    'Yüksek trafikli bir API servisi için en sade ve güvenilir hız sınırlama yöntemini kısaca açıkla.'
                  );
                }}
                className="flex items-start gap-3 p-3.5 bg-white dark:bg-[#1e1f24] rounded-2xl border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer text-left"
              >
                <PenLine className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Kısa &amp; Net Sistem Çözümü
                  </h2>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Doğrudan, yalın ve uygulanabilir mimari özet
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCompareMode(true);
                  showToast('Yan yana karşılaştırma modu etkinleştirildi.');
                }}
                className="flex items-start gap-3 p-3.5 bg-white dark:bg-[#1e1f24] rounded-2xl border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer text-left"
              >
                <Columns2 className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Yan Yana Model Karşılaştır
                  </h2>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Aktif modelleri eşzamanlı kıyaslayın
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenImagesView}
                className="flex items-start gap-3 p-3.5 bg-white dark:bg-[#1e1f24] rounded-2xl border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer text-left"
              >
                <Video className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Nano Banana 4K &amp; Google Veo
                  </h2>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Görsel ve video stüdyosunda üretim yapın
                  </div>
                </div>
              </button>

              <button
                type="button"
                data-testid="welcome-evolution-card"
                onClick={() =>
                  onOpenEvolutionView
                    ? onOpenEvolutionView()
                    : onOpenCommandPalette?.()
                }
                className="flex items-start gap-3 p-3.5 bg-white dark:bg-[#1e1f24] rounded-2xl border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer text-left"
              >
                <Brain className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-semibold text-neutral-900 dark:text-white">
                    AI Gelişim &amp; Benchmark
                  </h2>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Modeller arası benchmark ve akıllı yönlendirme
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`${
              anyComparisonInThread || compareMode ? 'max-w-5xl' : 'max-w-3xl'
            } mx-auto w-full space-y-5 mt-auto pt-3 sm:pt-6 pb-4 transition-all`}
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
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
                                  <ModelBrandAvatar
                                    name={compModel.name}
                                    logoUrl={compModel.logoUrl}
                                    provider={compModel.provider}
                                    modelId={compModel.id}
                                    accentColor={compModel.accentColor}
                                    sizeClass="w-6 h-6 rounded-lg"
                                  />
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
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  data-testid={`chat-message-${message.role}`}
                  className={`flex flex-col ${
                    isAssistant ? 'items-start' : 'items-end'
                  }`}
                >
                  {!isAssistant && message.authorName && (
                    <div className="flex items-center gap-1.5 mb-1 px-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span className="font-semibold">{message.authorName}</span>
                    </div>
                  )}
                  <div
                    className={`group/msg max-w-[94%] sm:max-w-[86%] p-3.5 sm:p-4 transition-all ${
                      isAssistant
                        ? 'bg-transparent text-slate-900 dark:text-slate-100 w-full'
                        : 'bg-white dark:bg-[#181c2b] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-br-sm shadow-xs'
                    }`}
                  >
                    {isAssistant && (
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2 min-w-0">
                          <ModelBrandAvatar
                            name={msgModel?.name || currentModel.name}
                            logoUrl={msgModel?.logoUrl || currentModel.logoUrl}
                            provider={msgModel?.provider || currentModel.provider}
                            modelId={msgModel?.id || currentModel.id}
                            accentColor={msgModel?.accentColor || currentModel.accentColor}
                            sizeClass="w-5 h-5 rounded-md"
                          />
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {msgModel?.name || currentModel.name}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate text-[11px]">
                            {PROVIDER_META[msgModel?.provider || currentModel.provider]?.shortLabel || msgModel?.category}
                          </span>
                        </div>
                        {message.tokenUsage && (
                          <span
                            data-testid={`msg-token-usage-${message.id}`}
                            className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0"
                          >
                            ↓ {formatTokenCount(message.tokenUsage.inputTokens)} · ↑{' '}
                            {formatTokenCount(message.tokenUsage.outputTokens)} tok · limit{' '}
                            {formatTokenCount(message.tokenUsage.maxOutputTokens)}
                          </span>
                        )}
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
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                          >
                            <Brain className="w-3.5 h-3.5 text-violet-500" />
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
                            <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-[#111420] border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                              {message.thinkingSteps.map((step, sIdx) => (
                                <div key={sIdx} className="flex items-start gap-2">
                                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
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
                      ) : editingMsgId === message.id ? (
                        <div className="space-y-2 min-w-[240px] sm:min-w-[360px]">
                          <textarea
                            value={editingDraft}
                            onChange={(e) => setEditingDraft(e.target.value)}
                            rows={3}
                            aria-label="Mesajı düzenle"
                            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#0b0d14] border border-violet-500/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden resize-y"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMsgId(null);
                                setEditingDraft('');
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              İptal
                            </button>
                            <button
                              type="button"
                              data-testid={`msg-edit-save-${message.id}`}
                              disabled={!editingDraft.trim() || isStreaming}
                              onClick={() => {
                                const nextText = editingDraft.trim();
                                setEditingMsgId(null);
                                setEditingDraft('');
                                if (nextText) {
                                  onEditAndRerunMessage?.(message.id, nextText);
                                }
                              }}
                              className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                            >
                              Kaydet ve Yeniden Çalıştır
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="whitespace-pre-wrap">
                            {sanitizeLuxoBrand(message.content)}
                          </div>
                          {onEditAndRerunMessage && !isStreaming && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                data-testid={`msg-edit-btn-${message.id}`}
                                onClick={() => {
                                  setEditingMsgId(message.id);
                                  setEditingDraft(message.content);
                                }}
                                aria-label="Mesajı düzenle ve yeniden çalıştır"
                                title="Düzenle ve Yeniden Çalıştır"
                                className="opacity-70 hover:opacity-100 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer"
                              >
                                <PenLine className="w-3 h-3" />
                                <span>Düzenle</span>
                              </button>
                            </div>
                          )}
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
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                            Doğrulanmış Kaynaklar
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {message.citations.map((cit, cIdx) => {
                              const isLocalRag =
                                cit.domain === 'knowledge-base' ||
                                cit.url.startsWith('#');
                              if (isLocalRag) {
                                return (
                                  <div
                                    key={cIdx}
                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#111420] border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-2 text-left"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                        {sanitizeLuxoBrand(cit.title)}
                                      </div>
                                      <div className="text-[11px] text-violet-600 dark:text-violet-400 truncate">
                                        Bilgi Tabanı (RAG)
                                      </div>
                                    </div>
                                    <Database className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                                  </div>
                                );
                              }
                              return (
                                <a
                                  key={cIdx}
                                  href={cit.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#111420] border border-slate-200/70 dark:border-slate-800 hover:border-violet-500/50 transition flex items-start justify-between gap-2 text-left"
                                >
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                      {sanitizeLuxoBrand(cit.title)}
                                    </div>
                                    <div className="text-[11px] text-slate-400 truncate">
                                      {cit.domain}
                                    </div>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                </a>
                              );
                            })}
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
                        <QuickSocialShareButtons
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

                    {isAssistant && (
                      <div className="mt-2">
                        <ContentRatingAndComments
                          compact
                          contentKey={`chat:${currentChat?.id || 'draft'}:${message.id}`}
                          contentTitle={currentChat?.title || currentModel.name}
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
                </motion.div>
              );
            })}

            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className="flex items-center justify-between gap-2 text-xs text-slate-500 py-2"
              >
                <div className="flex items-center gap-2">
                  <ModelBrandAvatar
                    name={currentModel.name}
                    logoUrl={currentModel.logoUrl}
                    provider={currentModel.provider}
                    modelId={currentModel.id}
                    accentColor={currentModel.accentColor}
                    sizeClass="w-5 h-5 rounded-md"
                  />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currentModel.name}
                  </span>
                  <span>yanıt oluşturuyor...</span>
                </div>
                {onStopGenerating && (
                  <button
                    type="button"
                    data-testid="stop-generating-inline-btn"
                    onClick={onStopGenerating}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-semibold hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Durdur</span>
                  </button>
                )}
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <div className="p-3 sm:p-4 bg-white/90 dark:bg-[#0b0d14]/95 backdrop-blur-md shrink-0 border-t border-slate-200/70 dark:border-slate-800/80">
        <div className="max-w-3xl mx-auto w-full">
          {knowledgeDocs.length > 0 && attachedKnowledgeDocIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                <Database className="w-3 h-3 text-violet-500" />
                <span>RAG Bağlamı:</span>
              </span>
              {attachedKnowledgeDocIds.map((docId) => {
                const doc = knowledgeDocs.find((d) => d.id === docId);
                if (!doc) return null;
                return (
                  <button
                    key={docId}
                    type="button"
                    onClick={() => onToggleKnowledgeDoc?.(docId)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-600/10 dark:bg-violet-500/15 border border-violet-500/30 text-violet-700 dark:text-violet-300 font-medium cursor-pointer"
                    title="Bağlamdan çıkar"
                  >
                    <span className="truncate max-w-[140px]">{doc.title}</span>
                    <X className="w-3 h-3 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {attachedFile && (
            <div className="flex items-center gap-2 p-2 mb-2 bg-slate-100 dark:bg-[#181c2b] rounded-xl text-xs">
              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate flex-1 font-medium">
                {attachedFile.name}
              </span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-1 hover:text-rose-500 transition cursor-pointer"
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
                <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-[#1e1f24] border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      <Columns2 className="w-3.5 h-3.5" />
                      <span>Yan Yana Model Karşılaştırma</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {(
                        [
                          {
                            label: 'Flash Lite vs Gemini 4',
                            a: DEFAULT_WORKING_MODEL_ID,
                            b: 'gemini-4-hydrogen',
                          },
                          {
                            label: 'Gemini 4 vs Carbon',
                            a: 'gemini-4-hydrogen',
                            b: 'gemini-4-carbon',
                          },
                          {
                            label: 'GPT-5 vs Claude 5.5',
                            a: 'chatgpt-5-2-pro',
                            b: 'claude-5-5-opus',
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
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-[#26272e] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-[10px] font-medium text-neutral-700 dark:text-neutral-200 cursor-pointer transition"
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
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#26272e] border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white focus:outline-hidden cursor-pointer"
                    >
                      {(accessibleModelIds.length > 0
                        ? accessibleModelIds
                        : selectableModelIds
                      ).map((mId) => (
                        <option key={mId} value={mId}>
                          Sol: {LUXO_MODELS[mId].name}
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
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#26272e] border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center cursor-pointer transition shrink-0"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>

                    <select
                      value={compareModelB}
                      onChange={(e) =>
                        setCompareModelB(e.target.value as LuxoModelId)
                      }
                      aria-label="Sağ Karşılaştırma Modeli"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#26272e] border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white focus:outline-hidden cursor-pointer"
                    >
                      {(accessibleModelIds.length > 0
                        ? accessibleModelIds
                        : selectableModelIds
                      ).map((mId) => (
                        <option key={mId} value={mId}>
                          Sağ: {LUXO_MODELS[mId].name}
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
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
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
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-[28px] bg-white/90 dark:bg-[#23242b]/95 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-700/70 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_32px_rgb(0,0,0,0.35)] focus-within:border-indigo-500/70 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all"
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
                    className="w-11 h-11 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-neutral-700 dark:text-neutral-200 bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 transition cursor-pointer shrink-0"
                    aria-label="Dosya veya Resim Ekle"
                    title="Dosya veya Görsel Ekle"
                  >
                    <Plus className="w-4.5 h-4.5 stroke-[2.2]" />
                  </button>

                  <button
                    type="button"
                    data-testid="open-composer-tools-btn"
                    onClick={() => setIsToolsMenuOpen((prev) => !prev)}
                    aria-expanded={isToolsMenuOpen}
                    aria-haspopup="dialog"
                    aria-label="Üretim, Muhakeme ve Sentez Araçları"
                    title="Görsel, Video, Derin Düşünme, Web Araştırması ve Sentez Araçları"
                    className={`w-11 h-11 sm:w-auto sm:h-9 sm:px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                      isToolsMenuOpen || activeToolCount > 0
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-500/25'
                        : 'bg-neutral-100/90 dark:bg-[#2c2d36] text-neutral-700 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-700/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Araçlar</span>
                    {activeToolCount > 0 && (
                      <span className="hidden sm:inline font-mono text-[11px] tabular-nums">
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
                        ? 'Üretilecek fotoğrafı tarif edin...'
                        : creationMode === 'video'
                        ? 'Üretilecek video sahnesini tarif edin...'
                        : compareMode
                        ? `${LUXO_MODELS[compareModelA].name} vs ${LUXO_MODELS[compareModelB].name}...`
                        : "Luxo AI'ya sor..."
                    }
                    disabled={isStreaming}
                    className="flex-1 min-w-0 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-hidden py-2 px-1.5"
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
                    className={`w-11 h-11 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ${
                      isRecording
                        ? 'text-red-500 bg-red-100 dark:bg-red-900/30 ring-2 ring-red-400/40'
                        : 'text-neutral-700 dark:text-neutral-200 bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                    aria-label="Mikrofon"
                  >
                    <Mic className="w-4.5 h-4.5 stroke-[1.9]" />
                  </button>

                  {isStreaming && onStopGenerating ? (
                    <button
                      type="button"
                      data-testid="stop-generating-btn"
                      onClick={onStopGenerating}
                      className="h-11 sm:h-9 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                      aria-label="Üretimi Durdur"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Durdur</span>
                    </button>
                  ) : (
                    inputText.trim() && (
                      <button
                        type="submit"
                        data-testid="chat-send-btn"
                        disabled={isStreaming}
                        className="w-11 h-11 sm:w-9 sm:h-9 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
                        aria-label="Gönder"
                      >
                        <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )
                  )}

                  {onOpenVoiceCommands && (
                    <button
                      type="button"
                      data-testid="composer-voice-cmd-btn"
                      onClick={onOpenVoiceCommands}
                      className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-2xl bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
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
                    className="w-11 h-11 sm:w-10 sm:h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm shadow-blue-600/25 shrink-0"
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

          {/* Subtle Firestore Cloud Sync Indicator */}
          <div className="mt-1.5 min-h-[18px] flex items-center justify-center pointer-events-none select-none">
            <div
              data-testid="cloud-sync-indicator"
              role="status"
              aria-live="polite"
              aria-hidden={!cloudSyncVisible}
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 transition-all duration-300 ${
                cloudSyncVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-1'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Saved to Cloud</span>
            </div>
          </div>
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
                    Açık Modeller ({totalModelCount} Güçlü AI)
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Claude 5.5 / Fable 5.2, GPT-Astra, ChatGPT-5.2, Sol, Luna &amp; Gemini 4 Serisi
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
                  placeholder="Açık modellerde ara (Örn: Claude 5.5, Fable, GPT-Astra, Gemini 4, Sol, Luna)..."
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
                {LUXO_MODEL_CATEGORIES.filter(
                  (cat) =>
                    cat === 'Tümü' ||
                    selectableModelIds.some((id) => LUXO_MODELS[id]?.category === cat)
                ).map((cat) => {
                  const activeCat = modelCategoryFilter === cat;
                  const count =
                    cat === 'Tümü'
                      ? selectableModelIds.length
                      : selectableModelIds.filter(
                          (id) => LUXO_MODELS[id]?.category === cat
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
              {selectableModelIds
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
                  const avail = isModelExecutableWithProviders(
                    mId,
                    providerStatus,
                    user,
                    m.allowGuest !== false
                  );
                  const limits = getEffectiveModelTokenLimits(
                    mId,
                    tokenOverrides
                  );
                  const isSelected = activeModelId === mId;
                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => {
                        if (avail.unlocked) {
                          onSelectModel(mId);
                          setShowModelModal(false);
                          showToast(`${m.name} modeli seçildi.`);
                        } else {
                          setShowModelModal(false);
                          if (avail.reason === 'guest_restricted') {
                            onOpenAuthModal();
                            showToast(
                              `${m.name} modelini kullanabilmek için Google ile giriş yapın.`
                            );
                          } else if (avail.reason === 'tier_locked') {
                            onOpenUpgradeModal();
                          } else {
                            onOpenProviderSettings?.();
                            showToast(
                              `${m.name} kilitli: ${avail.reasonLabelTr}`
                            );
                          }
                        }
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition cursor-pointer border ${
                        isSelected
                          ? 'border-neutral-900 dark:border-white bg-neutral-100/80 dark:bg-neutral-800/70'
                          : avail.unlocked
                          ? 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                          : 'border-neutral-200/70 dark:border-neutral-800/70 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <ModelBrandAvatar
                        name={m.name}
                        logoUrl={m.logoUrl}
                        provider={m.provider}
                        modelId={m.id}
                        accentColor={m.accentColor}
                        sizeClass="w-9 h-9 rounded-xl mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                            {m.name}
                          </span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white shrink-0" />
                          ) : !avail.unlocked ? (
                            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5 tabular-nums">
                          <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                            {PROVIDER_META[m.provider]?.shortLabel} · {formatTokenCount(limits.maxInputTokens)} /{' '}
                            {formatTokenCount(limits.maxOutputTokens)}
                          </span>
                          <span
                            className={`text-[10px] font-medium shrink-0 ${
                              avail.unlocked
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {avail.reasonLabelTr}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-snug">
                          {m.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
              {onOpenExtendedCatalog && (
                <button
                  type="button"
                  onClick={() => {
                    setShowModelModal(false);
                    onOpenExtendedCatalog();
                  }}
                  className="w-full py-2.5 px-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-full text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                  <span>
                    Diğer Modeller (Ayarlar · {EXTENDED_CATALOG_MODEL_IDS.length})
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowModelModal(false);
                  onOpenUpgradeModal();
                }}
                className={`w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  onOpenExtendedCatalog ? '' : 'sm:col-span-2'
                }`}
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
        </div>
      )}
    </div>
  );
};
