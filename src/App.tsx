/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Copy,
  Eye,
  MessageSquarePlus,
  QrCode,
  Share2,
  X,
} from 'lucide-react';
import {
  AppNotification,
  AppView,
  ArenaComparisonRun,
  AssistantPersona,
  CatalogModelEntry,
  ChatMessage,
  ChatThread,
  CinematicMotionParams,
  CitationItem,
  ComparisonModelResponse,
  DailyModelTokenUsage,
  GeneratedVisual,
  InlineAttachmentPayload,
  KnowledgeDocSummary,
  LibraryItem,
  LuxoModelCategory,
  LuxoModelId,
  LuxoPlugin,
  LuxoProject,
  LuxoUser,
  ModelTokenLimitOverride,
  NotificationPreferences,
  PinnedWorkspaceId,
  PlatformProviderConfig,
  PromptTemplateRecord,
  ProviderConnectionStatusMap,
  ScheduledRoutine,
  SelfEvolutionState,
  SharedContentPayload,
  SynthesisMode,
  TokenUsageMetadata,
  TrainingConsentStatus,
  VisualAspectRatio,
  WorkflowDefinition,
} from './types/luxo';
import {
  buildConsensusFusionPrompt,
  canAccessModel,
  cleanAssistantResponse,
  DEFAULT_CINEMATIC_MOTION,
  describeCinematicMotion,
  GUEST_MESSAGE_LIMIT,
  INITIAL_CHATS,
  INITIAL_LIBRARY_ITEMS,
  INITIAL_PLUGINS,
  INITIAL_PROJECTS,
  INITIAL_ROUTINES,
  INITIAL_VISUALS,
  LUXO_MODELS,
  normalizeCinematicMotion,
  parseShareParams,
  sanitizeLuxoBrand,
  scoreAutoRouterModel,
  shouldGenerateImageInChat,
  shouldGenerateVideoInChat,
  validateModelCatalogPassword,
  verifyAndRepairModelOutput,
} from './utils/luxoLogic';
import {
  checkTokenQuotaForRequest,
  DEFAULT_PROVIDER_STATUS,
  DEFAULT_WORKING_MODEL_ID,
  DESKTOP_SIDEBAR_STORAGE_KEY,
  isModelExecutableWithProviders,
  loadDailyTokenUsage,
  loadModelTokenOverrides,
  recordModelTokenUsage,
  saveDailyTokenUsage,
  saveModelTokenOverrides,
} from './utils/tokenLimitsEngine';
import {
  DEFAULT_ZERO_COST_POLICY,
  type ZeroCostPolicyState,
} from './utils/zeroCostPolicy';
import {
  parseRoomIdFromSearch,
  upsertSharedMessage,
} from './utils/collabState';
import { useRealtimeCollab } from './hooks/useRealtimeCollab';
import {
  auth,
  ensureAndSyncUserProfile,
  isBootstrappedAdminEmail,
  loginWithEmailPassword,
  onAuthStateChanged,
  refreshCurrentUserVerification,
  registerWithEmailPassword,
  removeChatFromFirestore,
  requestPasswordReset,
  resendVerificationEmail,
  sanitizeDisplayName,
  saveChatToFirestore,
  signInWithGoogleFirebase,
  signOutFirebase,
  subscribeUserChats,
  submitFeedbackToFirestore,
  syncArenaHistoryToFirestore,
  syncProjectV2ToFirestore,
  updateUserProfileInFirestore,
} from './firebase';
import { WelcomeView } from './components/WelcomeView';
import { SidebarDrawer } from './components/SidebarDrawer';
import { ChatWorkspace } from './components/ChatWorkspace';
import { RightContextPanel } from './components/RightContextPanel';

import { retryDynamicImport } from './utils/moduleLoader';
import type { HubTabId } from './components/CommunitySeoHub';

const CollabWorkspacePanel = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/CollabWorkspacePanel').then((m) => ({
      default: m.CollabWorkspacePanel,
    }))
  )
);
const UpgradeModal = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/Modals').then((m) => ({
      default: m.UpgradeModal,
    }))
  )
);
const FeedbackModal = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/Modals').then((m) => ({
      default: m.FeedbackModal,
    }))
  )
);
const AuthModal = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/Modals').then((m) => ({
      default: m.AuthModal,
    }))
  )
);
const VoiceModal = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/Modals').then((m) => ({
      default: m.VoiceModal,
    }))
  )
);
const CommandPaletteModal = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/CommandPaletteModal').then((m) => ({
      default: m.CommandPaletteModal,
    }))
  )
);
const NotificationCenterModal = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/NotificationCenterModal').then((m) => ({
      default: m.NotificationCenterModal,
    }))
  )
);
const CinematicMotionController = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/CinematicMotionController').then((m) => ({
      default: m.CinematicMotionController,
    }))
  )
);
const VoiceCommandModal = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/VoiceCommandModal').then((m) => ({
      default: m.VoiceCommandModal,
    }))
  )
);
const GmailWorkspaceModal = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/GmailWorkspaceModal').then((m) => ({
      default: m.GmailWorkspaceModal,
    }))
  )
);
const KeyboardShortcutsModal = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/KeyboardShortcutsModal').then((m) => ({
      default: m.KeyboardShortcutsModal,
    }))
  )
);

const ArgonCodeStudio = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/ArgonCodeStudio').then((m) => ({
      default: m.ArgonCodeStudio,
    }))
  )
);
const ImagesStudioView = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/ImagesStudioView').then((m) => ({
      default: m.ImagesStudioView,
    }))
  )
);
const SelfEvolutionHub = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/SelfEvolutionHub').then((m) => ({
      default: m.SelfEvolutionHub,
    }))
  )
);
const CommunitySeoHub = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/CommunitySeoHub').then((m) => ({
      default: m.CommunitySeoHub,
    }))
  )
);
const SocialCalendarWorkspace = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/SocialCalendarWorkspace').then((m) => ({
      default: m.SocialCalendarWorkspace,
    }))
  )
);
const LibraryView = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/LibraryAndProjectsView').then((m) => ({
      default: m.LibraryView,
    }))
  )
);
const ProjectsView = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/LibraryAndProjectsView').then((m) => ({
      default: m.ProjectsView,
    }))
  )
);
const SettingsView = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/SettingsView').then((m) => ({
      default: m.SettingsView,
    }))
  )
);
const PersonalDashboardView = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/PersonalDashboardView').then((m) => ({
      default: m.PersonalDashboardView,
    }))
  )
);
const HomeDashboardView = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/HomeDashboardView').then((m) => ({
      default: m.HomeDashboardView,
    }))
  )
);
const ModelCenterView = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/ModelCenterView').then((m) => ({
      default: m.ModelCenterView,
    }))
  )
);
const ModelArenaView = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/ModelArenaView').then((m) => ({
      default: m.ModelArenaView,
    }))
  )
);
const V2StudiosView = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/V2StudiosView').then((m) => ({
      default: m.V2StudiosView,
    }))
  )
);
const AdminDashboardView = React.lazy(() =>
  retryDynamicImport(() =>
    import('./components/AdminDashboardView').then((m) => ({
      default: m.AdminDashboardView,
    }))
  )
);
import {
  createInitialEvolutionState,
  EVOLUTION_LOCAL_CACHE_KEY,
  hydrateEvolutionState,
  normalizeConsentStatus,
  processModelFeedbackSignal,
  recordModelUsageInState,
  TRAINING_CONSENT_STORAGE_KEY,
} from './utils/selfEvolutionEngine';
import {
  createInitialStudioArticles,
  type PublishedStudioArticle,
} from './utils/contentStudioEngine';
import {
  normalizePinnedWorkspaces,
  togglePinnedWorkspace,
} from './utils/dashboardEngine';
import type { VoiceCommandAction } from './utils/voiceCommandEngine';
import {
  appendNotification,
  clearReadNotifications,
  createInitialNotifications,
  createNotification,
  DEFAULT_NOTIFICATION_PREFERENCES,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  normalizeNotificationPreferences,
  NOTIFICATION_PREFS_STORAGE_KEY,
  NOTIFICATION_STORAGE_KEY,
} from './utils/notificationEngine';
import { syncClientSeoMeta } from './components/SocialShareBar';

function readFileAsInlineAttachment(
  file: File
): Promise<InlineAttachmentPayload | undefined> {
  return new Promise((resolve) => {
    if (file.size > 8 * 1024 * 1024) {
      resolve(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const res = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = res.indexOf(',');
      if (commaIdx > 0) {
        resolve({
          mimeType: file.type || 'application/octet-stream',
          data: res.slice(commaIdx + 1),
          name: file.name,
        });
      } else {
        resolve(undefined);
      }
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

function stripSensitiveUserFields(raw: Record<string, unknown>): LuxoUser {
  const safeName = sanitizeDisplayName(String(raw.name || 'Misafir Kullanıcı'));
  return {
    id: String(raw.id || 'guest-init'),
    name: safeName,
    avatarText: String(raw.avatarText || 'LX').slice(0, 4),
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : undefined,
    isGuest: raw.isGuest !== false,
    emailVerified:
      typeof raw.emailVerified === 'boolean' ? raw.emailVerified : true,
    isUnlockedDev:
      Boolean(raw.isUnlockedDev) ||
      localStorage.getItem('luxo_dev_unlocked') === 'true',
    isUnlockedDevHelper:
      Boolean(raw.isUnlockedDevHelper) ||
      localStorage.getItem('luxo_dev_helper_unlocked') === 'true',
    ageGroup: String(raw.ageGroup || 'Genç'),
    theme:
      raw.theme === 'dark' || raw.theme === 'light' || raw.theme === 'system'
        ? raw.theme
        : 'dark',
    accentColor: String(raw.accentColor || '#7c3aed'),
    customInstructions: sanitizeLuxoBrand(
      String(raw.customInstructions || '')
    ),
    customTone: typeof raw.customTone === 'string' ? raw.customTone : 'Varsayılan',
    customWarmth:
      typeof raw.customWarmth === 'string' ? raw.customWarmth : 'Varsayılan',
    customEnthusiasm:
      typeof raw.customEnthusiasm === 'string'
        ? raw.customEnthusiasm
        : 'Varsayılan',
    customFormatting:
      typeof raw.customFormatting === 'string'
        ? raw.customFormatting
        : 'Varsayılan',
    customEmoji:
      typeof raw.customEmoji === 'string' ? raw.customEmoji : 'Varsayılan',
    workspaceType:
      typeof raw.workspaceType === 'string' ? raw.workspaceType : 'Kişisel',
    voiceName: typeof raw.voiceName === 'string' ? raw.voiceName : 'Breeze',
    voiceRate: typeof raw.voiceRate === 'number' ? raw.voiceRate : 1.0,
    guestMessageCount:
      typeof raw.guestMessageCount === 'number' ? raw.guestMessageCount : 0,
    fontSize:
      raw.fontSize === 'sm' || raw.fontSize === 'lg' ? raw.fontSize : 'base',
    codeTheme:
      raw.codeTheme === 'dracula' || raw.codeTheme === 'light'
        ? raw.codeTheme
        : 'dark',
    defaultModelId:
      typeof raw.defaultModelId === 'string' && raw.defaultModelId in LUXO_MODELS
        ? (raw.defaultModelId as LuxoModelId)
        : DEFAULT_WORKING_MODEL_ID,
    reasoningLevel:
      raw.reasoningLevel === 'fast' || raw.reasoningLevel === 'deep'
        ? raw.reasoningLevel
        : 'balanced',
    showThinkingSteps: raw.showThinkingSteps !== false,
    temperature:
      typeof raw.temperature === 'number' ? Math.max(0, Math.min(1, raw.temperature)) : 0.7,
    compactLayout: Boolean(raw.compactLayout),
    streamSpeed:
      raw.streamSpeed === 'turbo' || raw.streamSpeed === 'instant'
        ? raw.streamSpeed
        : 'normal',
    responseConciseness:
      raw.responseConciseness === 'concise' || raw.responseConciseness === 'detailed'
        ? raw.responseConciseness
        : 'balanced',
    codeStrictness:
      raw.codeStrictness === 'explained' ? 'explained' : 'production',
    autoVerifyOutputs: raw.autoVerifyOutputs !== false,
    pinnedWorkspaces: normalizePinnedWorkspaces(raw.pinnedWorkspaces),
    disabledModelIds: Array.isArray(raw.disabledModelIds)
      ? (raw.disabledModelIds.filter(
          (id): id is LuxoModelId =>
            typeof id === 'string' && id in LUXO_MODELS
        ) as LuxoModelId[])
      : [],
  };
}

export default function App() {
  const [user, setUser] = useState<LuxoUser>(() => {
    const saved = localStorage.getItem('luxo_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        return stripSensitiveUserFields(parsed);
      } catch {
        // fallback below
      }
    }
    return stripSensitiveUserFields({});
  });

  const [sharedIncoming, setSharedIncoming] =
    useState<SharedContentPayload | null>(() =>
      parseShareParams(window.location.search)
    );
  const [sharedLinkCopied, setSharedLinkCopied] = useState(false);
  const [shareBarPreviewModal, setShareBarPreviewModal] = useState(false);
  const [shareBarPreviewPlatform, setShareBarPreviewPlatform] = useState<
    'x' | 'facebook'
  >('x');
  const [shareBarQrModal, setShareBarQrModal] = useState(false);
  const [shareBarQrDataUrl, setShareBarQrDataUrl] = useState('');

  const [hubInitialTab, setHubInitialTab] = useState<HubTabId | undefined>(
    () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'content-studio') return 'content-studio';
      return undefined;
    }
  );

  const [currentView, setCurrentView] = useState<AppView>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'home') return 'home';
    if (v === 'chat') return 'chat';
    if (v === 'models') return 'models';
    if (v === 'arena') return 'arena';
    if (v === 'assistants') return 'assistants';
    if (v === 'knowledge') return 'knowledge';
    if (v === 'prompts') return 'prompts';
    if (v === 'workflows') return 'workflows';
    if (v === 'admin') return 'admin';
    if (v === 'dashboard') return 'dashboard';
    if (v === 'social') return 'social';
    if (v === 'evolution') return 'evolution';
    if (v === 'hub' || v === 'content-studio') return 'hub';
    if (v === 'images') return 'images';
    if (v === 'studio') return 'studio';
    if (v === 'library') return 'library';
    if (v === 'projects') return 'projects';
    if (v === 'settings') return 'settings';
    if (params.get('welcome') === '1' && params.get('autostart') !== '1') {
      return 'welcome';
    }
    return 'home';
  });

  const [chats, setChats] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem('luxo_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatThread[];
        if (Array.isArray(parsed)) {
          return parsed
            .filter(
              (c) => !/argon\s+kod\s+stüdyo|argon\s+stüdyo/iu.test(c.title || '')
            )
            .map((c) => ({
              ...c,
              messages: (c.messages || []).map((m) =>
                m.role === 'assistant'
                  ? {
                      ...m,
                      content: cleanAssistantResponse(
                        m.content || '',
                        (m.content || '').includes('```')
                      ),
                    }
                  : m
              ),
            }));
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_CHATS;
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] =
    useState<ProviderConnectionStatusMap>(DEFAULT_PROVIDER_STATUS);
  const [tokenOverrides, setTokenOverrides] = useState<
    Partial<Record<LuxoModelId, ModelTokenLimitOverride>>
  >(() => loadModelTokenOverrides());
  const [dailyTokenUsage, setDailyTokenUsage] = useState<
    Record<string, DailyModelTokenUsage>
  >(() => loadDailyTokenUsage());

  const [activeModelId, setActiveModelId] = useState<LuxoModelId>(() => {
    const def = user.defaultModelId;
    if (
      def &&
      def in LUXO_MODELS &&
      isModelExecutableWithProviders(
        def,
        DEFAULT_PROVIDER_STATUS,
        user,
        LUXO_MODELS[def]?.allowGuest !== false
      ).unlocked
    ) {
      return def;
    }
    return DEFAULT_WORKING_MODEL_ID;
  });
  const [projects, setProjects] = useState<LuxoProject[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(
    INITIAL_LIBRARY_ITEMS
  );
  const [routines, setRoutines] =
    useState<ScheduledRoutine[]>(INITIAL_ROUTINES);
  const [plugins, setPlugins] = useState<LuxoPlugin[]>(INITIAL_PLUGINS);
  const [visuals, setVisuals] = useState<GeneratedVisual[]>(INITIAL_VISUALS);
  const [memoryItems, setMemoryItems] = useState<string[]>([
    'Kullanıcı Türkçe, kısa, öz ve doğrudan anlaşılır yanıtları tercih eder.',
    'Yanıtlarda değişik semboller kullanılmaz; sade ve doğal bir anlatım tercih edilir.',
  ]);

  const [studioInitialCode, setStudioInitialCode] = useState<
    string | undefined
  >(undefined);
  const [studioInitialLang, setStudioInitialLang] = useState<
    string | undefined
  >(undefined);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(
    () => {
      try {
        const stored = localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY);
        return stored === null ? true : stored === 'true';
      } catch {
        return true;
      }
    }
  );
  const [isCollabPanelOpen, setIsCollabPanelOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isVoiceCommandModalOpen, setIsVoiceCommandModalOpen] = useState(false);
  const [dashboardFocusSection, setDashboardFocusSection] = useState<
    'overview' | 'model-metrics'
  >('overview');
  const [studioArticles, setStudioArticles] = useState<
    PublishedStudioArticle[]
  >(() => {
    const saved = localStorage.getItem('luxo_studio_articles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PublishedStudioArticle[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback below
      }
    }
    return createInitialStudioArticles();
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [compareTriggerCount, setCompareTriggerCount] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCatalogUnlocked, setIsCatalogUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('luxo_model_catalog_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [showExtendedModelsInChat, setShowExtendedModelsInChat] =
    useState<boolean>(() => {
      try {
        return localStorage.getItem('luxo_show_extended_in_chat') === 'true';
      } catch {
        return false;
      }
    });
  const [lastCloudSync, setLastCloudSync] = useState<{
    chatId: string;
    syncedAt: number;
  } | null>(null);
  const cloudSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settingsSubModal, setSettingsSubModal] = useState<string | null>(null);
  const [cinematicMotion, setCinematicMotion] = useState<CinematicMotionParams>(
    () => ({ ...DEFAULT_CINEMATIC_MOTION })
  );
  const [pendingVeoRequest, setPendingVeoRequest] = useState<{
    prompt: string;
    highFidelity: boolean;
    webSearch?: boolean;
    deepReasoning?: boolean;
    synthesisMode?: SynthesisMode;
    referenceImageDataUrl?: string;
  } | null>(null);

  const [trainingConsent, setTrainingConsent] = useState<TrainingConsentStatus>(
    () =>
      normalizeConsentStatus(
        localStorage.getItem(TRAINING_CONSENT_STORAGE_KEY)
      )
  );

  const [evolutionState, setEvolutionState] = useState<SelfEvolutionState>(() => {
    const cached = localStorage.getItem(EVOLUTION_LOCAL_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as SelfEvolutionState;
        if (parsed && typeof parsed.generation === 'number') {
          return hydrateEvolutionState(parsed);
        }
      } catch {
        // fallback below
      }
    }
    return createInitialEvolutionState();
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppNotification[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback below
      }
    }
    return createInitialNotifications();
  });

  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>(() => {
      const saved = localStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY);
      if (saved) {
        try {
          return normalizeNotificationPreferences(JSON.parse(saved));
        } catch {
          // fallback below
        }
      }
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);

  // ======================== LUXO AI V2 PLATFORM STATE ========================
  const [catalogModels, setCatalogModels] = useState<CatalogModelEntry[]>([]);
  const [platformProviders, setPlatformProviders] = useState<PlatformProviderConfig[]>([]);
  const [zeroCostPolicy, setZeroCostPolicy] = useState<ZeroCostPolicyState>(
    DEFAULT_ZERO_COST_POLICY
  );
  const [favoriteModelIds, setFavoriteModelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('luxo_v2_favorite_models');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch {
      // ignore
    }
    return ['gemini-2.5-flash', 'gemini-4-hydrogen', 'luxo-auto-router'];
  });
  const [recentModelIds, setRecentModelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('luxo_v2_recent_models');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch {
      // ignore
    }
    return ['gemini-2.5-flash', 'gemini-3-1-flash-lite'];
  });
  const [assistants, setAssistants] = useState<AssistantPersona[]>(() => {
    try {
      const saved = localStorage.getItem('luxo_v2_assistants');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    const now = Date.now();
    return [
      {
        id: 'ast-architect',
        name: 'Principal Code Architect',
        role: 'Full-Stack Systems & Code Review',
        description:
          'Designs production TypeScript, React, and backend architectures with clean APIs and defensive error handling.',
        systemPrompt:
          'You are a Principal Full-Stack Architect. Provide concise, production-ready TypeScript/React/Node solutions with edge-case validation and clear trade-offs.',
        defaultModelId: 'gemini-2.5-flash',
        temperature: 0.25,
        capabilities: ['code', 'reasoning', 'architecture'],
        knowledgeDocIds: [],
        category: 'Coding',
        isFeatured: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ast-research',
        name: 'Deep Research Analyst',
        role: 'Evidence-Based Synthesis & Citations',
        description:
          'Synthesizes complex technical or market topics into structured executive briefs with verified sources.',
        systemPrompt:
          'You are a Deep Research Analyst. Break down claims systematically, highlight assumptions, and cite sources clearly.',
        defaultModelId: 'gemini-4-hydrogen',
        temperature: 0.35,
        capabilities: ['research', 'web-search', 'analysis'],
        knowledgeDocIds: [],
        category: 'Research',
        isFeatured: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ast-writer',
        name: 'Editorial Product Writer',
        role: 'Product Copy, Docs & Localization',
        description:
          'Crafts crisp documentation, changelogs, and multilingual product copy without fluff.',
        systemPrompt:
          'You are an Editorial Product Writer. Write clear, high-signal documentation and copy tailored to the user language.',
        defaultModelId: 'gemini-3-1-flash-lite',
        temperature: 0.65,
        capabilities: ['writing', 'localization'],
        knowledgeDocIds: [],
        category: 'Writing',
        isFeatured: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ast-security',
        name: 'Security & Cloud Auditor',
        role: 'AppSec, Auth & Infrastructure Hardening',
        description:
          'Audits endpoints, auth flows, Firestore rules, and SSRF/XSS vectors with actionable fixes.',
        systemPrompt:
          'You are a Senior Application Security Engineer. Identify concrete vulnerabilities and supply minimal, hardened patches.',
        defaultModelId: 'gemini-2.5-flash',
        temperature: 0.2,
        capabilities: ['security', 'code', 'audit'],
        knowledgeDocIds: [],
        category: 'Coding',
        isFeatured: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
  });
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplateRecord[]>(() => {
    try {
      const saved = localStorage.getItem('luxo_v2_prompts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    const now = Date.now();
    return [
      {
        id: 'prm-arch-review',
        title: 'API & Architecture Critique',
        category: 'Coding',
        description: 'Audit an endpoint or module for bottlenecks, failure modes, and security gaps.',
        content:
          'Review this architecture/code for: 1) single points of failure, 2) auth & input validation gaps, 3) latency bottlenecks, and 4) concrete refactored code.',
        recommendedModelId: 'gemini-2.5-flash',
        isFavorite: true,
        usageCount: 14,
        createdAt: now,
      },
      {
        id: 'prm-exec-brief',
        title: 'Executive Research Brief',
        category: 'Research',
        description: 'Turn any topic into a structured brief with key risks, trade-offs, and next steps.',
        content:
          'Create a crisp executive brief on the topic below: Core Thesis, Key Evidence, Trade-offs & Risks, and Recommended Action Plan.',
        recommendedModelId: 'gemini-4-hydrogen',
        isFavorite: true,
        usageCount: 9,
        createdAt: now,
      },
      {
        id: 'prm-sql-opt',
        title: 'Database Query & Index Tuner',
        category: 'Analysis',
        description: 'Diagnose slow queries and propose composite indexes and schema improvements.',
        content:
          'Analyze the following query and schema. Identify full-table scans, N+1 patterns, and provide optimal indexes and rewritten SQL.',
        recommendedModelId: 'gemini-2.5-flash',
        isFavorite: false,
        usageCount: 7,
        createdAt: now,
      },
      {
        id: 'prm-ui-spec',
        title: 'SaaS UI Component Specification',
        category: 'Design',
        description: 'Generate an accessible React + Tailwind layout spec with states and keyboard behavior.',
        content:
          'Design an accessible React + Tailwind CSS component spec including empty, loading, error states, keyboard navigation, and responsive breakpoints.',
        recommendedModelId: 'gemini-3-1-flash-lite',
        isFavorite: false,
        usageCount: 11,
        createdAt: now,
      },
      {
        id: 'prm-release-notes',
        title: 'Crisp Release Notes & Changelog',
        category: 'Writing',
        description: 'Convert raw commits or feature notes into customer-ready release highlights.',
        content:
          'Turn these engineering notes into concise, user-focused release notes grouped by New Features, Improvements, and Fixes.',
        recommendedModelId: 'gemini-3-1-flash-lite',
        isFavorite: false,
        usageCount: 5,
        createdAt: now,
      },
      {
        id: 'prm-rag-qa',
        title: 'Knowledge-Grounded Verification',
        category: 'General',
        description: 'Answer strictly from attached Knowledge Base documents and list unsupported gaps.',
        content:
          'Answer the question using only the attached Knowledge Base context. Explicitly flag anything not covered in the source documents.',
        recommendedModelId: 'gemini-2.5-flash',
        isFavorite: true,
        usageCount: 12,
        createdAt: now,
      },
    ];
  });
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('luxo_v2_workflows');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    const now = Date.now();
    return [
      {
        id: 'wf-spec-to-plan',
        name: 'Product Spec to Engineering Plan',
        description:
          'Two-stage workflow: clarifies requirements first, then generates milestones and verification checks.',
        category: 'Engineering',
        steps: [
          {
            id: 'step-1',
            title: 'Requirements & Edge Cases',
            instruction:
              'Extract functional requirements, non-functional constraints, and top 5 edge cases from the input.',
            modelId: 'gemini-2.5-flash',
            usePreviousOutput: false,
          },
          {
            id: 'step-2',
            title: 'Implementation & Test Plan',
            instruction:
              'Using the previous requirements, outline the modular architecture, API endpoints, and concrete verification checklist.',
            modelId: 'gemini-2.5-flash',
            usePreviousOutput: true,
          },
        ],
        createdAt: now,
      },
      {
        id: 'wf-draft-polish',
        name: 'Research Synthesis & Executive Polish',
        description:
          'Extracts structured insights then polishes them into a concise stakeholder update.',
        category: 'Productivity',
        steps: [
          {
            id: 'step-a',
            title: 'Fact & Risk Extraction',
            instruction:
              'Extract key metrics, facts, open questions, and risks as bullet points.',
            modelId: 'gemini-3-1-flash-lite',
            usePreviousOutput: false,
          },
          {
            id: 'step-b',
            title: 'Stakeholder Memo',
            instruction:
              'Rewrite the extracted findings into a crisp 3-paragraph executive memo with clear next actions.',
            modelId: 'gemini-2.5-flash',
            usePreviousOutput: true,
          },
        ],
        createdAt: now,
      },
    ];
  });
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocSummary[]>([]);
  const [attachedKnowledgeDocIds, setAttachedKnowledgeDocIds] = useState<string[]>([]);
  const [arenaHistory, setArenaHistory] = useState<ArenaComparisonRun[]>(() => {
    try {
      const saved = localStorage.getItem('luxo_v2_arena_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [arenaInitialModels, setArenaInitialModels] = useState<string[]>([
    'gemini-2.5-flash',
    'gemini-4-hydrogen',
  ]);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined' || window.innerWidth < 1280) {
      return false;
    }
    try {
      const saved = localStorage.getItem('luxo_v2_right_panel_open');
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return true;
  });
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const wasDesktopRightPanelRef = useRef<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : false
  );
  const chatAbortControllerRef = useRef<AbortController | null>(null);

  const unreadNotificationCount = getUnreadNotificationCount(
    notifications,
    notificationPrefs
  );

  const pushNotification = (input: {
    category: AppNotification['category'];
    title: string;
    body: string;
    targetView?: AppNotification['targetView'];
  }) => {
    const nextItem = createNotification(input);
    setNotifications((prev) =>
      appendNotification(prev, nextItem, notificationPrefs)
    );
  };

  useEffect(() => {
    localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify(notifications)
    );
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(
      NOTIFICATION_PREFS_STORAGE_KEY,
      JSON.stringify(notificationPrefs)
    );
  }, [notificationPrefs]);

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    setSystemPrefersDark(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const isDarkTheme =
    user.theme === 'dark' || (user.theme === 'system' && systemPrefersDark);

  const userRef = useRef(user);
  userRef.current = user;
  const activeChatIdRef = useRef(activeChatId);
  activeChatIdRef.current = activeChatId;
  const trainingConsentRef = useRef(trainingConsent);
  trainingConsentRef.current = trainingConsent;

  const collabSurface = isCollabPanelOpen
    ? 'doc'
    : currentView === 'studio'
    ? 'code'
    : 'chat';

  const collab = useRealtimeCollab({
    userName: user.name,
    activeModelId,
    activeSurface: collabSurface,
    onRoomInitMessages: (initMessages, joinedRoomId) => {
      if (initMessages.length === 0) return;
      const roomThreadId = `collab_room_${joinedRoomId}`;
      setChats((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === roomThreadId);
        if (existingIdx >= 0) {
          const copy = [...prev];
          let mergedMsgs = copy[existingIdx].messages;
          for (const m of initMessages) {
            mergedMsgs = upsertSharedMessage(mergedMsgs, m);
          }
          copy[existingIdx] = {
            ...copy[existingIdx],
            messages: mergedMsgs,
            updatedAt: Date.now(),
          };
          return copy;
        }
        const roomThread: ChatThread = {
          id: roomThreadId,
          title: `Ortak Oda · #${joinedRoomId}`,
          modelId: 'gemini-4-argon',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: initMessages,
        };
        return [roomThread, ...prev];
      });
      if (
        !activeChatIdRef.current &&
        parseRoomIdFromSearch(window.location.search)
      ) {
        setActiveChatId(roomThreadId);
      }
    },
    onRemoteChatMessage: (remoteMsg) => {
      const roomThreadId = `collab_room_${collab.roomId}`;
      setChats((prev) => {
        // Check if active chat or any existing thread already contains this message
        const containingIdx = prev.findIndex((c) =>
          c.messages.some((m) => m.id === remoteMsg.id)
        );
        if (containingIdx >= 0) {
          const copy = [...prev];
          copy[containingIdx] = {
            ...copy[containingIdx],
            messages: upsertSharedMessage(
              copy[containingIdx].messages,
              remoteMsg
            ),
            updatedAt: Date.now(),
          };
          return copy;
        }

        const roomIdx = prev.findIndex((c) => c.id === roomThreadId);
        if (roomIdx >= 0) {
          const copy = [...prev];
          copy[roomIdx] = {
            ...copy[roomIdx],
            messages: upsertSharedMessage(copy[roomIdx].messages, remoteMsg),
            updatedAt: Date.now(),
          };
          return copy;
        }

        const createdRoomThread: ChatThread = {
          id: roomThreadId,
          title: `Ortak Oda · #${collab.roomId}`,
          modelId: remoteMsg.modelId || 'gemini-4-argon',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [remoteMsg],
        };
        return [createdRoomThread, ...prev];
      });

      if (
        !activeChatIdRef.current &&
        parseRoomIdFromSearch(window.location.search)
      ) {
        setActiveChatId(roomThreadId);
      }
    },
  });

  useEffect(() => {
    syncClientSeoMeta(sharedIncoming);
  }, [sharedIncoming]);

  useEffect(() => {
    let active = true;
    if (shareBarQrModal && sharedIncoming) {
      const targetUrl =
        sharedIncoming.shareUrl ||
        (typeof window !== 'undefined' ? window.location.href : '');
      if (targetUrl) {
        import('qrcode')
          .then((mod) =>
            mod.default.toDataURL(targetUrl, {
              width: 300,
              margin: 2,
              color: { dark: '#0f172a', light: '#ffffff' },
            })
          )
          .then((url) => {
            if (active) setShareBarQrDataUrl(url);
          })
          .catch(() => {
            if (active) setShareBarQrDataUrl('');
          });
      }
    }
    return () => {
      active = false;
    };
  }, [shareBarQrModal, sharedIncoming]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', Boolean(isDarkTheme));
    document.documentElement.style.colorScheme = isDarkTheme ? 'dark' : 'light';
  }, [isDarkTheme]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (mod && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setIsKeyboardShortcutsOpen((prev) => !prev);
        return;
      }

      if (!mod && !e.altKey && e.key === '?' && !isEditableTarget(e.target)) {
        e.preventDefault();
        setIsKeyboardShortcutsOpen((prev) => !prev);
        return;
      }

      if (mod && !e.shiftKey && key === 'b') {
        e.preventDefault();
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
          setIsDesktopSidebarOpen((prev) => !prev);
        } else {
          setIsSidebarOpen((prev) => !prev);
        }
        return;
      }

      if (mod && !e.shiftKey && e.key === ',') {
        e.preventDefault();
        setSettingsSubModal(null);
        setCurrentView('settings');
        return;
      }

      if (mod && e.shiftKey && key === 'o') {
        e.preventDefault();
        setActiveChatId(null);
        setCurrentView('chat');
        return;
      }

      if (mod && e.shiftKey && key === 'e') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('luxo-export-active-chat-pdf'));
        return;
      }

      if (e.altKey && !mod) {
        if (key === 'd') {
          e.preventDefault();
          setDashboardFocusSection('overview');
          setCurrentView('dashboard');
          return;
        }
        if (key === 't') {
          e.preventDefault();
          const darkNow = document.documentElement.classList.contains('dark');
          setUser((prev) => ({
            ...prev,
            theme: darkNow ? 'light' : 'dark',
          }));
          return;
        }
        if (key === 's') {
          e.preventDefault();
          setHubInitialTab(undefined);
          setCurrentView('hub');
          return;
        }
        if (key === 'm') {
          e.preventDefault();
          setIsVoiceCommandModalOpen(true);
          return;
        }
      }

      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsKeyboardShortcutsOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (cloudSyncTimerRef.current) {
        clearTimeout(cloudSyncTimerRef.current);
      }
    };
  }, []);

  const persistChatAndTrackSync = async (thread: ChatThread) => {
    try {
      const synced = await saveChatToFirestore(thread);
      if (!synced) return;
      setLastCloudSync({ chatId: thread.id, syncedAt: Date.now() });
      if (cloudSyncTimerRef.current) {
        clearTimeout(cloudSyncTimerRef.current);
      }
      cloudSyncTimerRef.current = setTimeout(() => {
        setLastCloudSync(null);
      }, 3200);
    } catch {
      // Firestore errors are handled inside firebase helper
    }
  };

  useEffect(() => {
    let unsubChats: (() => void) | null = null;
    let disposed = false;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubChats) {
        unsubChats();
        unsubChats = null;
      }

      if (fbUser) {
        try {
          const synced = await ensureAndSyncUserProfile(
            fbUser,
            userRef.current
          );
          if (disposed || auth.currentUser?.uid !== fbUser.uid) {
            return;
          }
          setUser((prev) => ({
            ...prev,
            ...synced,
            isGuest: false,
            emailVerified: Boolean(fbUser.emailVerified),
            guestMessageCount: 0,
            isUnlockedDev:
              prev.isUnlockedDev ||
              localStorage.getItem('luxo_dev_unlocked') === 'true',
            isUnlockedDevHelper:
              prev.isUnlockedDevHelper ||
              localStorage.getItem('luxo_dev_helper_unlocked') === 'true',
          }));
          localStorage.setItem('luxo_has_onboarded', 'true');
          setCurrentView((v) => (v === 'welcome' ? 'home' : v));

          if (fbUser.emailVerified) {
            unsubChats = subscribeUserChats(fbUser.uid, (cloudChats) => {
              if (cloudChats.length > 0) {
                setChats((prev) => {
                  const localIds = new Set(prev.map((p) => p.id));
                  const merged = [...prev];
                  for (const cc of cloudChats) {
                    if (!localIds.has(cc.id)) {
                      merged.unshift(cc);
                    }
                  }
                  return merged;
                });
              }
            });
          }
        } catch {
          // handled by firebase error logger
        }
      }
    });

    return () => {
      disposed = true;
      unsubAuth();
      if (unsubChats) unsubChats();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('luxo_user', JSON.stringify(user));
    if (user.isUnlockedDev) {
      localStorage.setItem('luxo_dev_unlocked', 'true');
    }
    if (user.isUnlockedDevHelper) {
      localStorage.setItem('luxo_dev_helper_unlocked', 'true');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('luxo_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'luxo_model_catalog_unlocked',
        isCatalogUnlocked ? 'true' : 'false'
      );
    } catch {
      // ignore storage quota errors
    }
  }, [isCatalogUnlocked]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'luxo_show_extended_in_chat',
        showExtendedModelsInChat ? 'true' : 'false'
      );
    } catch {
      // ignore storage quota errors
    }
  }, [showExtendedModelsInChat]);

  useEffect(() => {
    localStorage.setItem(TRAINING_CONSENT_STORAGE_KEY, trainingConsent);
  }, [trainingConsent]);

  useEffect(() => {
    localStorage.setItem(
      EVOLUTION_LOCAL_CACHE_KEY,
      JSON.stringify(evolutionState)
    );
  }, [evolutionState]);

  useEffect(() => {
    saveModelTokenOverrides(tokenOverrides);
  }, [tokenOverrides]);

  useEffect(() => {
    saveDailyTokenUsage(dailyTokenUsage);
  }, [dailyTokenUsage]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DESKTOP_SIDEBAR_STORAGE_KEY,
        isDesktopSidebarOpen ? 'true' : 'false'
      );
    } catch {
      // ignore storage quota errors
    }
  }, [isDesktopSidebarOpen]);

  const refreshPlatformCatalog = async () => {
    try {
      const res = await fetch('/api/catalog');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.models)) {
        setCatalogModels(data.models as CatalogModelEntry[]);
      }
      if (Array.isArray(data?.providers)) {
        const nextProvidersList = data.providers as PlatformProviderConfig[];
        setPlatformProviders(nextProvidersList);
        const mapped: ProviderConnectionStatusMap = { ...DEFAULT_PROVIDER_STATUS };
        for (const p of nextProvidersList) {
          mapped[p.id] = Boolean(p.connected);
        }
        setProviderStatus((prev) => ({ ...prev, ...mapped }));
      }
      if (data?.zeroCostPolicy) {
        setZeroCostPolicy(data.zeroCostPolicy as ZeroCostPolicyState);
      }
    } catch {
      // ignore transient network error
    }
  };

  const refreshKnowledgeDocs = async () => {
    try {
      const res = await fetch('/api/knowledge/docs');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.docs)) {
        setKnowledgeDocs(data.docs as KnowledgeDocSummary[]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('luxo_v2_favorite_models', JSON.stringify(favoriteModelIds));
    } catch {
      // ignore
    }
  }, [favoriteModelIds]);

  useEffect(() => {
    try {
      localStorage.setItem('luxo_v2_recent_models', JSON.stringify(recentModelIds));
    } catch {
      // ignore
    }
  }, [recentModelIds]);

  useEffect(() => {
    try {
      localStorage.setItem('luxo_v2_assistants', JSON.stringify(assistants));
    } catch {
      // ignore
    }
  }, [assistants]);

  useEffect(() => {
    try {
      localStorage.setItem('luxo_v2_prompts', JSON.stringify(promptTemplates));
    } catch {
      // ignore
    }
  }, [promptTemplates]);

  useEffect(() => {
    try {
      localStorage.setItem('luxo_v2_workflows', JSON.stringify(workflows));
    } catch {
      // ignore
    }
  }, [workflows]);

  useEffect(() => {
    try {
      localStorage.setItem('luxo_v2_arena_history', JSON.stringify(arenaHistory.slice(0, 20)));
    } catch {
      // ignore
    }
  }, [arenaHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1280) {
      try {
        localStorage.setItem('luxo_v2_right_panel_open', isRightPanelOpen ? 'true' : 'false');
      } catch {
        // ignore
      }
    }
  }, [isRightPanelOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1280;
      if (wasDesktopRightPanelRef.current && !isDesktop) {
        setIsRightPanelOpen(false);
      }
      wasDesktopRightPanelRef.current = isDesktop;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void refreshPlatformCatalog().finally(() => {
      if (!cancelled) setProvidersLoaded(true);
    });
    void refreshKnowledgeDocs();

    fetch('/api/providers/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.providers) {
          const nextProviders = {
            ...DEFAULT_PROVIDER_STATUS,
            ...data.providers,
          } as ProviderConnectionStatusMap;
          setProviderStatus(nextProviders);
          setActiveModelId((curr) => {
            const avail = isModelExecutableWithProviders(
              curr,
              nextProviders,
              userRef.current,
              LUXO_MODELS[curr]?.allowGuest !== false
            );
            if (avail.unlocked) return curr;
            if (nextProviders.google) return DEFAULT_WORKING_MODEL_ID;
            return curr;
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProvidersLoaded(true);
      });

    fetch('/api/evolution/state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.state) {
          setEvolutionState(data.state as SelfEvolutionState);
        }
      })
      .catch(() => {});

    fetch('/api/community/state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (
          !cancelled &&
          data?.state &&
          Array.isArray(data.state.studioArticles) &&
          data.state.studioArticles.length > 0
        ) {
          setStudioArticles(data.state.studioArticles as PublishedStudioArticle[]);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'luxo_studio_articles',
        JSON.stringify(studioArticles)
      );
    } catch {
      // ignore quota error
    }
  }, [studioArticles]);

  useEffect(() => {
    if (!evolutionState.autoEvolutionEnabled) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetch('/api/evolution/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focusCategory: 'Tüm Modeller',
          trigger: 'auto-site',
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.state) {
            setEvolutionState(data.state as SelfEvolutionState);
          }
        })
        .catch(() => {});
    }, 90_000);
    return () => clearInterval(interval);
  }, [evolutionState.autoEvolutionEnabled]);

  const handleSelectTrainingConsent = (nextStatus: 'granted' | 'denied') => {
    setTrainingConsent(nextStatus);
    localStorage.setItem(TRAINING_CONSENT_STORAGE_KEY, nextStatus);
  };

  const submitConsentedChatSignal = (
    userPrompt: string,
    assistantReply: string,
    modelId: LuxoModelId,
    signalType: 'complete' | 'liked' | 'regenerated' | 'winner'
  ) => {
    if (trainingConsentRef.current !== 'granted') return;
    fetch('/api/evolution/ingest-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt,
        assistantReply,
        modelId,
        signalType,
        consentStatus: trainingConsentRef.current,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.state) {
          setEvolutionState(data.state as SelfEvolutionState);
        }
      })
      .catch(() => {});
  };

  const handleRunEvolutionCycle = async (
    focusCategory: LuxoModelCategory | 'Tüm Modeller' = 'Tüm Modeller'
  ) => {
    try {
      const res = await fetch('/api/evolution/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusCategory, trigger: 'manual' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          setEvolutionState(data.state as SelfEvolutionState);
        }
      }
    } catch {
      // ignore transient network error
    }
  };

  const handleCalibrateAllModels = async () => {
    try {
      const res = await fetch('/api/evolution/calibrate-all', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          setEvolutionState(data.state as SelfEvolutionState);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleToggleEvolutionRule = async (ruleId: string) => {
    try {
      const res = await fetch('/api/evolution/toggle-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          setEvolutionState(data.state as SelfEvolutionState);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleToggleAutoEvolution = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/evolution/toggle-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoEvolutionEnabled: enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          setEvolutionState(hydrateEvolutionState(data.state));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleRunBenchmark = async () => {
    try {
      const res = await fetch('/api/evolution/benchmark', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          setEvolutionState(hydrateEvolutionState(data.state));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleCustomTrain = async (input: {
    goalText: string;
    category: LuxoModelCategory | 'Tüm Modeller';
    targetModelId?: LuxoModelId;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/evolution/custom-train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          setEvolutionState(hydrateEvolutionState(data.state));
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  };

  const handleBoostModel = async (modelId: LuxoModelId) => {
    try {
      const res = await fetch('/api/evolution/boost-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          setEvolutionState(hydrateEvolutionState(data.state));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteEvolutionRule = async (ruleId: string) => {
    try {
      const res = await fetch('/api/evolution/delete-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          setEvolutionState(hydrateEvolutionState(data.state));
        }
      }
    } catch {
      // ignore
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || null;
  const activeAssistant =
    assistants.find((a) => a.id === activeAssistantId) || null;
  const isAdminUser = Boolean(
    !user.isGuest &&
      user.emailVerified &&
      isBootstrappedAdminEmail(auth.currentUser?.email)
  );
  const connectedProviderCount = useMemo(
    () =>
      platformProviders.length > 0
        ? platformProviders.filter((p) => p.connected).length
        : Object.values(providerStatus).filter(Boolean).length,
    [platformProviders, providerStatus]
  );

  const trackRecentModel = (modelId: string) => {
    if (!modelId) return;
    setRecentModelIds((prev) =>
      [modelId, ...prev.filter((id) => id !== modelId)].slice(0, 8)
    );
  };

  const handleToggleFavoriteModel = (modelId: string) => {
    setFavoriteModelIds((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [modelId, ...prev]
    );
  };

  const handleToggleAttachKnowledgeDoc = (docId: string) => {
    setAttachedKnowledgeDocIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const handleUpdateUser = (partial: Partial<LuxoUser>) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      if (!next.isGuest) {
        updateUserProfileInFirestore(next).catch(() => {});
      }
      return next;
    });
    if (
      partial.defaultModelId &&
      partial.defaultModelId in LUXO_MODELS &&
      (!activeChat || activeChat.messages.length === 0)
    ) {
      setActiveModelId(partial.defaultModelId);
    }
  };

  const handleSkipToGuest = () => {
    setUser((prev) => ({ ...prev, isGuest: true, guestMessageCount: 0 }));
    localStorage.setItem('luxo_has_onboarded', 'true');
    setCurrentView('home');
  };

  const handleFirebaseGoogleSignIn = async () => {
    await signInWithGoogleFirebase();
    localStorage.setItem('luxo_has_onboarded', 'true');
    setCurrentView('home');
  };

  const handleSignOut = async () => {
    try {
      await signOutFirebase();
    } catch {
      // ignore if guest
    }
    setUser(
      stripSensitiveUserFields({
        id: `guest-${Date.now()}`,
        name: 'Misafir Kullanıcı',
        avatarText: 'LX',
        isGuest: true,
        guestMessageCount: 0,
      })
    );
    localStorage.removeItem('luxo_has_onboarded');
    setCurrentView('welcome');
  };

  const handleTogglePinWorkspace = (workspaceId: PinnedWorkspaceId) => {
    handleUpdateUser({
      pinnedWorkspaces: togglePinnedWorkspace(
        normalizePinnedWorkspaces(user.pinnedWorkspaces),
        workspaceId
      ),
    });
  };

  const handleToggleModelEnabled = (modelId: LuxoModelId) => {
    const currentDisabled = new Set(user.disabledModelIds || []);
    if (currentDisabled.has(modelId)) {
      currentDisabled.delete(modelId);
    } else {
      currentDisabled.add(modelId);
    }
    handleUpdateUser({ disabledModelIds: Array.from(currentDisabled) });
  };

  const handleCreateQuickProject = (
    name: string,
    category: LuxoProject['category']
  ) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const created: LuxoProject = {
      id: `proj-${Date.now()}`,
      name: sanitizeLuxoBrand(trimmed),
      description: 'Hızlı oluşturulan proje çalışma alanı',
      category,
      color: '#2563eb',
      systemPrompt: `Sen "${sanitizeLuxoBrand(trimmed)}" projesinin uzman yapay zeka asistanısın. Tüm yanıtları proje hedefine odaklı, net ve uygulanabilir şekilde ver.`,
      updatedAt: Date.now(),
      filesCount: 1,
    };
    setProjects((prev) => [created, ...prev]);
    setActiveProjectId(created.id);
    pushNotification({
      category: 'system_update',
      title: 'Yeni Proje Başlatıldı',
      body: `"${created.name}" (${created.category}) çalışma alanı oluşturuldu.`,
      targetView: 'projects',
    });
  };

  const handleOpenDashboard = (
    focus: 'overview' | 'model-metrics' = 'overview'
  ) => {
    setDashboardFocusSection(focus);
    setCurrentView('dashboard');
  };

  const handleExecuteVoiceCommand = (
    action: VoiceCommandAction,
    _rawText: string
  ) => {
    switch (action.type) {
      case 'switch_theme': {
        const nextTheme =
          action.theme === 'toggle'
            ? isDarkTheme
              ? 'light'
              : 'dark'
            : action.theme;
        handleUpdateUser({ theme: nextTheme });
        return;
      }
      case 'new_project': {
        if (action.projectName) {
          handleCreateQuickProject(action.projectName, 'Araştırma');
        }
        setCurrentView('projects');
        return;
      }
      case 'new_chat': {
        handleCreateNewChat();
        return;
      }
      case 'navigate': {
        if (action.targetView === 'hub') {
          setHubInitialTab(action.hubTab);
        }
        if (action.targetView === 'dashboard') {
          setDashboardFocusSection('overview');
        }
        setCurrentView(action.targetView);
        return;
      }
      case 'open_model_metrics': {
        setDashboardFocusSection('model-metrics');
        setCurrentView('dashboard');
        return;
      }
      case 'open_cms': {
        setHubInitialTab('content-studio');
        setCurrentView('hub');
        return;
      }
      case 'select_model': {
        const access = canAccessModel(action.modelId, user);
        if (access.allowed) {
          setActiveModelId(action.modelId);
          setCurrentView('chat');
        } else if (access.reason === 'guest') {
          setIsAuthModalOpen(true);
        } else {
          setIsUpgradeModalOpen(true);
        }
        return;
      }
      case 'open_auth': {
        setIsAuthModalOpen(true);
        return;
      }
      case 'sign_out': {
        void handleSignOut();
        return;
      }
      case 'chat_prompt': {
        if (action.prompt.trim()) {
          setCurrentView('chat');
          void handleSendMessage(action.prompt);
        }
      }
    }
  };

  const handleUpgradeSuccess = (plan: 'go' | 'plus') => {
    setUser((prev) => ({
      ...prev,
      isUnlockedDevHelper: true,
      isUnlockedDev: plan === 'plus' || prev.isUnlockedDev,
    }));
    localStorage.setItem('luxo_dev_helper_unlocked', 'true');
    if (plan === 'plus') {
      localStorage.setItem('luxo_dev_unlocked', 'true');
    }
    setActiveModelId(plan === 'plus' ? 'luxo-dev' : 'luxo-dev-helper');
  };

  const handleCreateNewChat = () => {
    const preferredModel =
      user.defaultModelId &&
      user.defaultModelId in LUXO_MODELS &&
      canAccessModel(user.defaultModelId, user).allowed
        ? user.defaultModelId
        : activeModelId;
    setActiveModelId(preferredModel);
    const newThread: ChatThread = {
      id: `chat_${Date.now()}`,
      title: 'Yeni Sohbet',
      modelId: preferredModel,
      projectId: activeProjectId || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setChats((prev) => [newThread, ...prev]);
    setActiveChatId(newThread.id);
    setCurrentView('chat');
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    removeChatFromFirestore(chatId).catch(() => {});
    if (activeChatId === chatId) {
      const remaining = chats.filter((c) => c.id !== chatId);
      setActiveChatId(remaining[0]?.id || null);
    }
  };

  const handleToggleLikeMessage = (messageId: string) => {
    if (!activeChatId) return;
    const thread = chats.find((c) => c.id === activeChatId);
    const targetIdx = thread
      ? thread.messages.findIndex((m) => m.id === messageId)
      : -1;
    if (thread && targetIdx >= 0 && !thread.messages[targetIdx].liked) {
      const targetMsg = thread.messages[targetIdx];
      const prevUser = thread.messages
        .slice(0, targetIdx)
        .reverse()
        .find((m) => m.role === 'user');
      if (prevUser) {
        submitConsentedChatSignal(
          prevUser.content,
          targetMsg.content,
          targetMsg.modelId || activeModelId,
          'liked'
        );
      }
    }
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, liked: !m.liked, disliked: false }
                  : m
              ),
            }
          : c
      )
    );
  };

  const handleToggleDislikeMessage = (messageId: string) => {
    if (!activeChatId) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, disliked: !m.disliked, liked: false }
                  : m
              ),
            }
          : c
      )
    );
  };

  const handleModelFeedback = (
    messageId: string,
    modelId: LuxoModelId,
    rating: 'thumbs_up' | 'thumbs_down',
    snippet?: string
  ) => {
    setEvolutionState((prev) => {
      const updated = processModelFeedbackSignal(prev, {
        messageId,
        modelId,
        rating,
        responseSnippet: snippet,
      });
      localStorage.setItem(EVOLUTION_LOCAL_CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    fetch('/api/evolution/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, modelId, rating, snippet }),
    }).catch(() => {});
  };

  const handleUnlockModelCatalog = (code: string): boolean => {
    if (!validateModelCatalogPassword(code)) {
      return false;
    }
    setIsCatalogUnlocked(true);
    try {
      localStorage.setItem('luxo_model_catalog_unlocked', 'true');
      if (code.trim() === 'serpilmurat123') {
        localStorage.setItem('luxo_dev_unlocked', 'true');
        localStorage.setItem('luxo_dev_helper_unlocked', 'true');
        setUser((prev) => ({
          ...prev,
          isUnlockedDev: true,
          isUnlockedDevHelper: true,
        }));
      } else {
        localStorage.setItem('luxo_dev_helper_unlocked', 'true');
        setUser((prev) => ({
          ...prev,
          isUnlockedDevHelper: true,
        }));
      }
    } catch {
      // ignore storage errors
    }
    return true;
  };

  const handleLockModelCatalog = () => {
    setIsCatalogUnlocked(false);
    setShowExtendedModelsInChat(false);
    try {
      localStorage.removeItem('luxo_model_catalog_unlocked');
      localStorage.setItem('luxo_show_extended_in_chat', 'false');
    } catch {
      // ignore
    }
  };

  const handleSelectModelFromSettings = (modelId: LuxoModelId) => {
    setActiveModelId(modelId);
    handleUpdateUser({ defaultModelId: modelId });
    setCurrentView('chat');
  };

  const handleUpdateModelTokenOverride = (
    modelId: LuxoModelId,
    override: ModelTokenLimitOverride
  ) => {
    setTokenOverrides((prev) => ({
      ...prev,
      [modelId]: override,
    }));
  };

  const handleResetModelTokenOverride = (modelId: LuxoModelId) => {
    setTokenOverrides((prev) => {
      const copy = { ...prev };
      delete copy[modelId];
      return copy;
    });
  };

  const handleStopGenerating = () => {
    if (chatAbortControllerRef.current) {
      try {
        chatAbortControllerRef.current.abort();
      } catch {
        // ignore
      }
      chatAbortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleEditAndRerunMessage = (messageId: string, newContent: string) => {
    if (!activeChatId || !newContent.trim()) return;
    handleStopGenerating();
    void handleSendMessage(newContent, undefined, {
      truncateBeforeMessageId: messageId,
    });
  };

  const handleSendMessage = async (
    text: string,
    attachment?: File,
    options?: {
      webSearch?: boolean;
      deepReasoning?: boolean;
      synthesisMode?: SynthesisMode;
      overrideImageUrl?: string;
      overrideVideoUrl?: string;
      motionControl?: CinematicMotionParams;
      highFidelity?: boolean;
      skipMotionController?: boolean;
      forceMediaMode?: 'image' | 'video';
      imageAspectRatio?: VisualAspectRatio;
      imageStyle?: string;
      referenceImageDataUrl?: string;
      extraSystemContext?: string;
      truncateBeforeMessageId?: string;
      forceNewChat?: boolean;
      assistantId?: string;
    }
  ) => {
    if (user.isGuest && user.guestMessageCount >= GUEST_MESSAGE_LIMIT) {
      setIsAuthModalOpen(true);
      return;
    }

    const cleanUserText = sanitizeLuxoBrand(
      text.trim() ||
        (attachment ? `"${attachment.name}" dosyasını detaylı analiz et.` : '')
    );

    const autoRouterDecision =
      activeModelId === 'luxo-auto-router'
        ? scoreAutoRouterModel({
            prompt: cleanUserText,
            reasoningLevel: user.reasoningLevel || 'balanced',
            codeStrictness: user.codeStrictness || 'production',
            webSearch: options?.webSearch,
            hasAttachment: Boolean(attachment),
            evolutionState,
            availableProviders: providerStatus,
          })
        : null;
    const routedModelId: LuxoModelId =
      autoRouterDecision?.targetModelId || activeModelId;
    trackRecentModel(routedModelId);

    const matchedCatalogModel = catalogModels.find((m) => m.id === routedModelId);
    const baseAvailability =
      matchedCatalogModel && !(routedModelId in LUXO_MODELS)
        ? {
            unlocked:
              matchedCatalogModel.executable &&
              (!zeroCostPolicy.enabled || matchedCatalogModel.zeroCostAllowed),
            reasonLabelTr:
              matchedCatalogModel.zeroCostReason ||
              (matchedCatalogModel.executable
                ? 'Canlı API Hazır'
                : 'Sağlayıcı Anahtarı Gerekli'),
          }
        : isModelExecutableWithProviders(
            routedModelId,
            providerStatus,
            user,
            LUXO_MODELS[routedModelId]?.allowGuest !== false
          );
    const modelAvailability =
      zeroCostPolicy.enabled &&
      matchedCatalogModel &&
      !matchedCatalogModel.zeroCostAllowed
        ? {
            unlocked: false,
            reasonLabelTr:
              matchedCatalogModel.zeroCostReason ||
              'Zero-Cost Politikası: Ücretli modeller engellendi',
          }
        : baseAvailability;
    const quotaCheck = checkTokenQuotaForRequest(
      routedModelId,
      cleanUserText,
      tokenOverrides,
      dailyTokenUsage
    );

    if (!modelAvailability.unlocked || !quotaCheck.allowed) {
      const targetTitle = cleanUserText.slice(0, 42) || 'Yeni Sohbet';
      let tChatId = activeChatId;
      let tChat = chats.find((c) => c.id === tChatId);
      if (!tChat) {
        const created: ChatThread = {
          id: `chat_${Date.now()}`,
          title: targetTitle,
          modelId: routedModelId,
          projectId: activeProjectId || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        setChats((prev) => [created, ...prev]);
        tChatId = created.id;
        tChat = created;
        setActiveChatId(created.id);
      }
      const uMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: cleanUserText,
        timestamp: Date.now(),
        authorName: user.name,
        authorColor: collab.myColor,
      };
      const blockReason = !modelAvailability.unlocked
        ? `${LUXO_MODELS[routedModelId]?.name || routedModelId} şu an kilitli (${modelAvailability.reasonLabelTr}). Ayarlar > Yapay Zeka, API & Token Ayarları bölümünden sağlayıcı bağlantı durumunu görebilir veya API bağlantısı hazır bir model seçebilirsiniz.`
        : quotaCheck.reason === 'input_too_large'
        ? `İstem boyutu (~${quotaCheck.estimatedInputTokens} tok) bu modelin bağlam sınırını (${quotaCheck.maxInputTokens} tok) aşıyor.`
        : `Günlük model token kotası doldu (${quotaCheck.usedTodayTokens}/${quotaCheck.dailyLimitTokens} tok). Token limiti ayarlarınızdan günlük kotayı artırabilirsiniz.`;
      const errMsg: ChatMessage = {
        id: `msg_lock_${Date.now() + 1}`,
        role: 'assistant',
        content: blockReason,
        timestamp: Date.now() + 1,
        modelId: routedModelId,
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === tChatId
            ? {
                ...c,
                title: c.messages.length === 0 ? targetTitle : c.title,
                messages: [...c.messages, uMsg, errMsg],
                updatedAt: Date.now(),
              }
            : c
        )
      );
      return;
    }

    const isVideoGenTurn =
      options?.forceMediaMode === 'video' ||
      (options?.forceMediaMode !== 'image' &&
        !options?.overrideVideoUrl &&
        !options?.overrideImageUrl &&
        !attachment &&
        shouldGenerateVideoInChat(cleanUserText, routedModelId));

    const isImageGenTurn =
      !isVideoGenTurn &&
      (options?.forceMediaMode === 'image' ||
        (!options?.overrideImageUrl &&
          !attachment &&
          shouldGenerateImageInChat(cleanUserText, routedModelId)));

    // Pre-Render 'Cinematic Motion Controller' Gate: let user dynamically tune speed, pan, and tilt BEFORE Google Veo 3 begins rendering
    if (isVideoGenTurn && !options?.skipMotionController) {
      const autoHiFi =
        activeModelId === 'veo-3-1-ultra-cinema' ||
        /\b(4k|60\s*fps|interpolasyon|yüksek\s*sadakat|yuksek\s*sadakat|ultra\s*hd)\b/i.test(
          cleanUserText
        );
      setPendingVeoRequest({
        prompt: cleanUserText,
        highFidelity: autoHiFi,
        webSearch: options?.webSearch,
        deepReasoning: options?.deepReasoning,
        synthesisMode: options?.synthesisMode,
        referenceImageDataUrl: options?.referenceImageDataUrl,
      });
      return;
    }
    const firstSentence = cleanUserText
      .split('\n')[0]
      .replace(/\[.*?\]/g, '')
      .trim();
    const cleanChatTitle =
      firstSentence.length <= 46
        ? firstSentence || 'Yeni Sohbet'
        : (firstSentence.slice(0, 46).replace(/\s+\S*$/, '') ||
            firstSentence.slice(0, 46)) + '…';

    let targetChatId = options?.forceNewChat ? null : activeChatId;
    let targetChat = targetChatId
      ? chats.find((c) => c.id === targetChatId)
      : undefined;

    if (targetChat) {
      if (targetChat.messages.length === 0 && cleanUserText.trim()) {
        targetChat.title = cleanChatTitle;
      }
    } else {
      const created: ChatThread = {
        id: `chat_${Date.now()}`,
        title: cleanChatTitle,
        modelId: activeModelId,
        projectId: activeProjectId || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setChats((prev) => [created, ...prev]);
      targetChatId = created.id;
      targetChat = created;
      setActiveChatId(created.id);
    }

    let attachmentUrl = options?.overrideImageUrl;
    if (!attachmentUrl && attachment && attachment.type.startsWith('image/')) {
      attachmentUrl = URL.createObjectURL(attachment);
    }

    const inlineAttachment = attachment
      ? await readFileAsInlineAttachment(attachment)
      : undefined;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: cleanUserText,
      timestamp: Date.now(),
      authorName:
        user.name === 'Misafir Kullanıcı'
          ? `Katılımcı-${collab.clientId.slice(-4).toUpperCase()}`
          : user.name,
      authorColor: collab.myColor,
      imageUrl: attachmentUrl,
      videoUrl: options?.overrideVideoUrl,
      attachmentName: attachment?.name,
      inlineAttachment,
    };

    let baseThreadMessages = targetChat.messages;
    if (options?.truncateBeforeMessageId) {
      const cutIdx = baseThreadMessages.findIndex(
        (m) => m.id === options.truncateBeforeMessageId
      );
      if (cutIdx >= 0) {
        baseThreadMessages = baseThreadMessages.slice(0, cutIdx);
      }
    }

    const updatedMessages = [...baseThreadMessages, userMsg];
    const resolvedTitle =
      baseThreadMessages.length === 0 && cleanUserText.trim()
        ? cleanChatTitle
        : targetChat.title;

    setChats((prev) =>
      prev.map((c) =>
        c.id === targetChatId
          ? {
              ...c,
              title: resolvedTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : c
      )
    );
    collab.broadcastChatMessage(userMsg);

    if (user.isGuest) {
      setUser((prev) => ({
        ...prev,
        guestMessageCount: prev.guestMessageCount + 1,
      }));
    }

    setIsStreaming(true);
    const aiMsgId = `msg_ai_${Date.now()}`;
    const placeholderAiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: routedModelId,
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === targetChatId
          ? { ...c, messages: [...updatedMessages, placeholderAiMsg] }
          : c
      )
    );

    let finalAssistantText = '';
    let finalThinkingSteps: string[] | undefined;
    let finalCitations: CitationItem[] | undefined;
    let finalFollowUps: string[] | undefined;
    let finalTokenUsage: TokenUsageMetadata | undefined;

    if (isVideoGenTurn) {
      try {
        const appliedMotion = normalizeCinematicMotion(
          options?.motionControl || cinematicMotion
        );
        const motionInfo = describeCinematicMotion(appliedMotion);
        const wantsHiFi =
          Boolean(options?.highFidelity) ||
          activeModelId === 'veo-3-1-ultra-cinema' ||
          /\b(4k|60\s*fps|interpolasyon|yüksek\s*sadakat|yuksek\s*sadakat|ultra\s*hd)\b/i.test(
            cleanUserText
          );
        let parsedRefBase64: string | undefined;
        let parsedRefMime: string | undefined;
        if (
          options?.referenceImageDataUrl &&
          options.referenceImageDataUrl.startsWith('data:image/')
        ) {
          const commaIdx = options.referenceImageDataUrl.indexOf(',');
          if (commaIdx > 0) {
            const header = options.referenceImageDataUrl.slice(5, commaIdx);
            parsedRefMime = header.split(';')[0] || 'image/jpeg';
            parsedRefBase64 = options.referenceImageDataUrl.slice(commaIdx + 1);
          }
        }
        const vidResp = await fetch('/api/video-gen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanUserText,
            style: options?.imageStyle || 'Sinematik',
            cameraMotion: `Sinematik Hareket (${motionInfo.summaryTr})`,
            aspectRatio: '16:9',
            duration: '5s',
            resolution: wantsHiFi ? '4k' : '1080p',
            highFidelity: wantsHiFi,
            frameInterpolation: wantsHiFi,
            enhancePrompt: true,
            useNanoBananaFrame: !parsedRefBase64,
            referenceImageBase64: parsedRefBase64,
            referenceMimeType: parsedRefMime,
            motionControl: appliedMotion,
          }),
        });
        if (vidResp.ok) {
          const vidData = await vidResp.json();
          if (vidData.videoUrl) {
            const resolvedHiFi = Boolean(vidData.highFidelity ?? wantsHiFi);
            const newVis: GeneratedVisual = {
              id: vidData.id || `vid-${Date.now()}`,
              mediaType: 'video',
              title: sanitizeLuxoBrand(vidData.title || cleanUserText.slice(0, 42)),
              prompt: cleanUserText,
              style: `Sinematik · ${motionInfo.summaryTr}`,
              aspectRatio: '16:9',
              dataUrl: vidData.posterUrl || vidData.dataUrl || '',
              posterUrl: vidData.posterUrl || vidData.dataUrl || '',
              videoUrl: vidData.videoUrl,
              engineLabel:
                vidData.engineLabel ||
                (resolvedHiFi
                  ? 'Google Veo 3 · 4K 60fps MP4'
                  : 'Google Veo 3 · HD Sinema MP4'),
              resolution: resolvedHiFi ? '4K UHD' : '1080P',
              duration: '5s',
              highFidelity: resolvedHiFi,
              fps: vidData.fps || (resolvedHiFi ? 60 : 24),
              frameInterpolation: resolvedHiFi
                ? 'optical-60fps'
                : 'standard-24fps',
              motionControl: appliedMotion,
              createdAt: Date.now(),
            };
            setVisuals((prev) => [newVis, ...prev]);

            finalAssistantText = `Google Veo 3 ve Nano Banana sinema motoru ile istediğiniz sesli ${
              resolvedHiFi ? '4K UHD 60fps' : '1080P'
            } MP4 video sahnesi sentezlendi (${motionInfo.summaryTr}).`;
            finalThinkingSteps = [
              `Sinematik Hareket Kontrolcüsü parametreleri kilitlendi: ${motionInfo.summaryTr}`,
              resolvedHiFi
                ? 'Yüksek sadakatli 4K anahtar kare ve 60fps optik kare interpolasyonu sentezlendi'
                : 'Kamera hızı, yatay pan, dikey tilt ve nöral ses kuşağı birleştirildi',
              'Gerçek H.264/AAC MP4 akışı hazırlandı ve sohbet ile Stüdyo Galerisine eklendi',
            ];
            const resolvedPosterUrl =
              vidData.posterUrl || vidData.dataUrl || undefined;
            const finalVideoMsg: ChatMessage = {
              id: aiMsgId,
              role: 'assistant',
              content: finalAssistantText,
              timestamp: Date.now(),
              modelId: activeModelId,
              thinkingSteps: finalThinkingSteps,
              videoUrl: vidData.videoUrl,
              posterUrl: resolvedPosterUrl,
            };
            setChats((prev) =>
              prev.map((c) =>
                c.id === targetChatId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === aiMsgId ? finalVideoMsg : m
                      ),
                    }
                  : c
              )
            );
            collab.broadcastChatMessage(finalVideoMsg);
            setIsStreaming(false);
            if (!user.isGuest && targetChatId) {
              void persistChatAndTrackSync({
                id: targetChatId,
                title: resolvedTitle,
                modelId: activeModelId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                messages: [
                  ...updatedMessages,
                  {
                    id: aiMsgId,
                    role: 'assistant',
                    content: finalAssistantText,
                    timestamp: Date.now(),
                    modelId: activeModelId,
                    videoUrl: vidData.videoUrl,
                    ...(resolvedPosterUrl ? { posterUrl: resolvedPosterUrl } : {}),
                  },
                ],
              });
            }
            return;
          }
        }
      } catch {
        // Fall through to standard chat response if video endpoint is unreachable
      }
    } else if (isImageGenTurn) {
      try {
        const chosenRatio: VisualAspectRatio =
          options?.imageAspectRatio || '16:9';
        const chosenStyle = options?.imageStyle || 'Fotogerçekçi';
        const selectedNanoBackend =
          activeModelId === 'nano-banana-pro-4k'
            ? 'gemini-3-pro-image'
            : 'gemini-nano-banana-2.1';
        const imgResp = await fetch('/api/image-gen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanUserText,
            style: chosenStyle,
            aspectRatio: chosenRatio,
            imageModel: selectedNanoBackend,
            imageSize: '4K',
            enhancePrompt: true,
          }),
        });
        if (imgResp.ok) {
          const imgData = await imgResp.json();
          if (imgData.dataUrl) {
            const newVis: GeneratedVisual = {
              id: imgData.id || `vis-${Date.now()}`,
              mediaType: 'image',
              title: sanitizeLuxoBrand(
                imgData.title || cleanUserText.slice(0, 42)
              ),
              prompt: cleanUserText,
              style: imgData.style || chosenStyle,
              aspectRatio: chosenRatio,
              dataUrl: imgData.dataUrl,
              engineLabel: imgData.engineLabel || 'Nano Banana 2.1 · 4K',
              modelUsed: imgData.modelUsed || selectedNanoBackend,
              resolution: imgData.resolution || '4K',
              createdAt: Date.now(),
            };
            setVisuals((prev) => [newVis, ...prev]);

            finalAssistantText = `Nano Banana 2.1 Ultra motoru ile istediğiniz yüksek çözünürlüklü gerçek fotoğraf üretildi ve galeriye kaydedildi (${cleanUserText}).`;
            finalThinkingSteps = [
              'Görsel sentez niyeti algılandı ve Nano Banana 2.1 4K fotogerçekçi hattına yönlendirildi',
              'İstemdeki ana özne, renk paleti, doğal optik ışık ve yüzey dokusu ayrıştırıldı',
              'Gerçek yüksek çözünürlüklü fotoğraf sentezlendi ve sohbet ile Stüdyo Galerisine eklendi',
            ];
            const finalImageMsg: ChatMessage = {
              id: aiMsgId,
              role: 'assistant',
              content: finalAssistantText,
              timestamp: Date.now(),
              modelId: activeModelId,
              thinkingSteps: finalThinkingSteps,
              imageUrl: imgData.dataUrl,
            };
            setChats((prev) =>
              prev.map((c) =>
                c.id === targetChatId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === aiMsgId ? finalImageMsg : m
                      ),
                    }
                  : c
              )
            );
            collab.broadcastChatMessage(finalImageMsg);
            setIsStreaming(false);
            if (!user.isGuest && targetChatId) {
              void persistChatAndTrackSync({
                id: targetChatId,
                title: resolvedTitle,
                modelId: activeModelId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                messages: [
                  ...updatedMessages,
                  {
                    id: aiMsgId,
                    role: 'assistant',
                    content: finalAssistantText,
                    timestamp: Date.now(),
                    modelId: activeModelId,
                    imageUrl: imgData.dataUrl,
                  },
                ],
              });
            }
            return;
          }
        }
      } catch {
        // Fall through to standard chat response if image endpoint is unreachable
      }
    }

    const chatRequestStartMs = Date.now();
    let recordedChatTelemetry = false;
    let requestSucceeded = false;
    const abortController = new AbortController();
    chatAbortControllerRef.current = abortController;
    const resolvedAssistant = options?.assistantId
      ? assistants.find((a) => a.id === options.assistantId) || activeAssistant
      : activeAssistant;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.inlineAttachment ? { inlineAttachment: m.inlineAttachment } : {}),
          })),
          modelId: routedModelId,
          maxOutputTokens: quotaCheck.maxOutputTokens,
          customInstructions: user.customInstructions,
          customTone: user.customTone,
          customWarmth: user.customWarmth,
          customEnthusiasm: user.customEnthusiasm,
          customFormatting: user.customFormatting,
          customEmoji: user.customEmoji,
          memoryItems,
          projectContext:
            [
              activeProject?.systemPrompt,
              resolvedAssistant?.systemPrompt,
              options?.extraSystemContext,
            ]
              .filter(Boolean)
              .join('\n\n') || undefined,
          knowledgeDocIds:
            attachedKnowledgeDocIds.length > 0
              ? attachedKnowledgeDocIds
              : undefined,
          webSearch: options?.webSearch,
          deepReasoning: options?.deepReasoning,
          synthesisMode: options?.synthesisMode,
          reasoningLevel: user.reasoningLevel || 'balanced',
          responseConciseness: user.responseConciseness || 'balanced',
          codeStrictness: user.codeStrictness || 'production',
          autoVerifyOutputs: user.autoVerifyOutputs !== false,
          temperature: resolvedAssistant?.temperature ?? user.temperature,
          inlineAttachment,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => null);
        const errMessage =
          (errPayload && typeof errPayload.error === 'string' && errPayload.error) ||
          (response.status === 403
            ? `${LUXO_MODELS[routedModelId]?.name || routedModelId} modeli için sunucu API anahtarı tanımlı olmadığından model kilitlidir.`
            : `Sunucu hatası (HTTP ${response.status}). Lütfen bağlantıyı kontrol edip tekrar deneyin.`);
        finalAssistantText = errMessage;
        setChats((prev) =>
          prev.map((c) =>
            c.id === targetChatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === aiMsgId ? { ...m, content: finalAssistantText } : m
                  ),
                }
              : c
          )
        );
        return;
      }

      requestSucceeded = true;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let sseBuffer = '';
          let streamDone = false;
          while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) {
              sseBuffer += decoder.decode();
              streamDone = true;
            } else {
              sseBuffer += decoder.decode(value, { stream: true });
            }
            const rawLines = sseBuffer.split('\n');
            sseBuffer = streamDone ? '' : rawLines.pop() || '';

            for (const rawLine of rawLines) {
              const line = rawLine.trim();
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') {
                streamDone = true;
                break;
              }
              try {
                const parsed = JSON.parse(payload);
                if (parsed.meta) {
                  finalThinkingSteps = parsed.meta.thinkingSteps;
                  finalCitations = parsed.meta.citations;
                  finalFollowUps = parsed.meta.followUpSuggestions;
                  if (parsed.meta.tokenUsage) {
                    finalTokenUsage = parsed.meta.tokenUsage as TokenUsageMetadata;
                  }
                  if (!recordedChatTelemetry) {
                    recordedChatTelemetry = true;
                    const measuredLatencyMs =
                      typeof parsed.meta.latencyMs === 'number'
                        ? parsed.meta.latencyMs
                        : Math.max(120, Date.now() - chatRequestStartMs);
                    const telemetryModel = (parsed.meta.resolvedModel ||
                      routedModelId) as LuxoModelId;
                    setEvolutionState((prev) =>
                      recordModelUsageInState(prev, telemetryModel, {
                        latencyMs: measuredLatencyMs,
                        success: true,
                      })
                    );
                  }
                }
                if (parsed.text) {
                  finalAssistantText += sanitizeLuxoBrand(parsed.text);
                }
                setChats((prev) =>
                  prev.map((c) =>
                    c.id === targetChatId
                      ? {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === aiMsgId
                              ? {
                                  ...m,
                                  content: finalAssistantText,
                                  thinkingSteps: finalThinkingSteps,
                                  citations: finalCitations,
                                  followUpSuggestions: finalFollowUps,
                                  tokenUsage: finalTokenUsage,
                                }
                              : m
                          ),
                        }
                      : c
                  )
                );
              } catch {
                // ignore malformed SSE frame
              }
            }
          }
        }
      } else {
        const data = await response.json();
        finalAssistantText = cleanAssistantResponse(
          data.text || 'Yanıt oluşturuldu.',
          true
        );
        finalThinkingSteps = data.thinkingSteps;
        finalCitations = data.citations;
        finalFollowUps = data.followUpSuggestions;
        if (data.tokenUsage) {
          finalTokenUsage = data.tokenUsage as TokenUsageMetadata;
        }
        if (!recordedChatTelemetry) {
          recordedChatTelemetry = true;
          const measuredLatencyMs =
            typeof data.latencyMs === 'number'
              ? data.latencyMs
              : Math.max(120, Date.now() - chatRequestStartMs);
          const telemetryModel = (data.resolvedModel ||
            routedModelId) as LuxoModelId;
          setEvolutionState((prev) =>
            recordModelUsageInState(prev, telemetryModel, {
              latencyMs: measuredLatencyMs,
              success: true,
            })
          );
        }
        setChats((prev) =>
          prev.map((c) =>
            c.id === targetChatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === aiMsgId
                      ? {
                          ...m,
                          content: finalAssistantText,
                          thinkingSteps: finalThinkingSteps,
                          citations: finalCitations,
                          followUpSuggestions: finalFollowUps,
                          tokenUsage: finalTokenUsage,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } catch (err) {
      const isAbort =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError');
      if (isAbort) {
        if (!finalAssistantText.trim()) {
          finalAssistantText = 'Yanıt üretimi kullanıcı tarafından durduruldu.';
        }
      } else {
        const msg =
          err instanceof Error && err.message
            ? `Model API bağlantısında sorun oluştu: ${err.message}`
            : 'Model API sunucusuna ulaşılamadı. Lütfen tekrar deneyin.';
        finalAssistantText = msg;
      }
      setChats((prev) =>
        prev.map((c) =>
          c.id === targetChatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMsgId ? { ...m, content: finalAssistantText } : m
                ),
              }
            : c
        )
      );
    } finally {
      if (chatAbortControllerRef.current === abortController) {
        chatAbortControllerRef.current = null;
      }
      if (requestSucceeded && finalAssistantText.trim()) {
        finalAssistantText =
          user.autoVerifyOutputs !== false
            ? verifyAndRepairModelOutput(finalAssistantText, {
                allowLong: true,
                autoVerify: true,
              })
            : cleanAssistantResponse(finalAssistantText, true);
      }
      if (finalTokenUsage) {
        setDailyTokenUsage((prev) =>
          recordModelTokenUsage(
            prev,
            routedModelId,
            finalTokenUsage!.inputTokens,
            finalTokenUsage!.outputTokens
          )
        );
      }
      setChats((prev) =>
        prev.map((c) =>
          c.id === targetChatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        content: finalAssistantText,
                        ...(finalTokenUsage ? { tokenUsage: finalTokenUsage } : {}),
                      }
                    : m
                ),
              }
            : c
        )
      );
      setIsStreaming(false);
      collab.broadcastChatMessage({
        id: aiMsgId,
        role: 'assistant',
        content: finalAssistantText,
        timestamp: Date.now(),
        modelId: routedModelId,
        thinkingSteps: finalThinkingSteps,
        citations: finalCitations,
        followUpSuggestions: finalFollowUps,
        tokenUsage: finalTokenUsage,
      });
      if (!user.isGuest && targetChatId) {
        const completedThread: ChatThread = {
          id: targetChatId,
          title: resolvedTitle,
          modelId: routedModelId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [
            ...updatedMessages,
            {
              id: aiMsgId,
              role: 'assistant',
              content: finalAssistantText,
              timestamp: Date.now(),
              modelId: routedModelId,
              ...(finalTokenUsage ? { tokenUsage: finalTokenUsage } : {}),
            },
          ],
        };
        void persistChatAndTrackSync(completedThread);
      }
      if (requestSucceeded && cleanUserText && finalAssistantText) {
        submitConsentedChatSignal(
          cleanUserText,
          finalAssistantText,
          routedModelId,
          'complete'
        );
      }
    }
  };

  const handleSelectComparisonWinner = (
    messageId: string,
    winnerModelId: LuxoModelId
  ) => {
    if (!activeChatId) return;
    let updatedTargetMsg: ChatMessage | null = null;
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        return {
          ...c,
          messages: c.messages.map((m) => {
            if (m.id !== messageId) return m;
            updatedTargetMsg = {
              ...m,
              preferredComparisonModelId: winnerModelId,
            };
            return updatedTargetMsg;
          }),
        };
      })
    );
    if (updatedTargetMsg) {
      collab.broadcastChatMessage(updatedTargetMsg);
      const thread = chats.find((c) => c.id === activeChatId);
      const prevUser = thread?.messages
        .slice()
        .reverse()
        .find((m) => m.role === 'user');
      const winningPane = (
        updatedTargetMsg as ChatMessage
      ).comparisonResponses?.find((p) => p.modelId === winnerModelId);
      if (prevUser && winningPane?.content) {
        submitConsentedChatSignal(
          prevUser.content,
          winningPane.content,
          winnerModelId,
          'winner'
        );
      }
    }
  };

  const handleCompareMessage = async (
    text: string,
    modelA: LuxoModelId,
    modelB: LuxoModelId,
    attachment?: File,
    options?: {
      webSearch?: boolean;
      deepReasoning?: boolean;
      synthesisMode?: SynthesisMode;
    }
  ) => {
    if (user.isGuest && user.guestMessageCount >= GUEST_MESSAGE_LIMIT) {
      setIsAuthModalOpen(true);
      return;
    }

    const cleanUserText = sanitizeLuxoBrand(
      text.trim() ||
        (attachment ? `"${attachment.name}" dosyasını karşılaştırmalı analiz et.` : '')
    );
    const firstSentence = cleanUserText
      .split('\n')[0]
      .replace(/\[.*?\]/g, '')
      .trim();
    const cleanChatTitle =
      firstSentence.length <= 42
        ? firstSentence || 'Model Karşılaştırması'
        : firstSentence.slice(0, 42) + '…';

    let targetChatId = activeChatId;
    let targetChat = chats.find((c) => c.id === targetChatId);

    if (!targetChat) {
      const created: ChatThread = {
        id: `chat_${Date.now()}`,
        title: cleanChatTitle,
        modelId: modelA,
        projectId: activeProjectId || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setChats((prev) => [created, ...prev]);
      targetChatId = created.id;
      targetChat = created;
      setActiveChatId(created.id);
    }

    let attachmentUrl: string | undefined;
    if (attachment && attachment.type.startsWith('image/')) {
      attachmentUrl = URL.createObjectURL(attachment);
    }
    const inlineAttachment = attachment
      ? await readFileAsInlineAttachment(attachment)
      : undefined;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: cleanUserText,
      timestamp: Date.now(),
      authorName:
        user.name === 'Misafir Kullanıcı'
          ? `Katılımcı-${collab.clientId.slice(-4).toUpperCase()}`
          : user.name,
      authorColor: collab.myColor,
      imageUrl: attachmentUrl,
      attachmentName: attachment?.name,
      inlineAttachment,
    };

    const updatedMessages = [...targetChat.messages, userMsg];
    const resolvedTitle =
      targetChat.messages.length === 0 && cleanUserText.trim()
        ? cleanChatTitle
        : targetChat.title;

    const aiMsgId = `msg_cmp_${Date.now()}`;
    const panes: ComparisonModelResponse[] = [
      { modelId: modelA, content: '', isStreaming: true },
      { modelId: modelB, content: '', isStreaming: true },
    ];

    const initialCompareMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: modelA,
      comparisonResponses: panes,
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === targetChatId
          ? {
              ...c,
              title: resolvedTitle,
              messages: [...updatedMessages, initialCompareMsg],
              updatedAt: Date.now(),
            }
          : c
      )
    );

    collab.broadcastChatMessage(userMsg);
    collab.broadcastChatMessage(initialCompareMsg);

    if (user.isGuest) {
      setUser((prev) => ({
        ...prev,
        guestMessageCount: prev.guestMessageCount + 1,
      }));
    }

    setIsStreaming(true);

    const syncComparePanesToState = () => {
      const combinedSummary = panes
        .map((p) => `${LUXO_MODELS[p.modelId]?.name || p.modelId}:\n${p.content}`)
        .join('\n\n');

      setChats((prev) =>
        prev.map((c) =>
          c.id === targetChatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        content: combinedSummary,
                        comparisonResponses: panes.map((p) => ({ ...p })),
                      }
                    : m
                ),
              }
            : c
        )
      );
    };

    const runSinglePane = async (paneIdx: number, targetModelId: LuxoModelId) => {
      const startedAt = Date.now();
      let paneText = '';
      let paneThinking: string[] | undefined;
      let paneCitations: CitationItem[] | undefined;
      let paneTokenUsage: TokenUsageMetadata | undefined;

      const avail = isModelExecutableWithProviders(
        targetModelId,
        providerStatus,
        user,
        LUXO_MODELS[targetModelId]?.allowGuest !== false
      );
      const qCheck = checkTokenQuotaForRequest(
        targetModelId,
        cleanUserText,
        tokenOverrides,
        dailyTokenUsage
      );

      if (!avail.unlocked) {
        panes[paneIdx] = {
          modelId: targetModelId,
          content: `${LUXO_MODELS[targetModelId]?.name || targetModelId} kilitli (${avail.reasonLabelTr}).`,
          latencyMs: Date.now() - startedAt,
          isStreaming: false,
        };
        syncComparePanesToState();
        return;
      }

      if (!qCheck.allowed) {
        panes[paneIdx] = {
          modelId: targetModelId,
          content:
            qCheck.reason === 'input_too_large'
              ? 'İstem model bağlam sınırını aşıyor.'
              : 'Günlük token kotası doldu.',
          latencyMs: Date.now() - startedAt,
          isStreaming: false,
        };
        syncComparePanesToState();
        return;
      }

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
              ...(m.inlineAttachment ? { inlineAttachment: m.inlineAttachment } : {}),
            })),
            modelId: targetModelId,
            maxOutputTokens: qCheck.maxOutputTokens,
            customInstructions: user.customInstructions,
            customTone: user.customTone,
            customWarmth: user.customWarmth,
            customEnthusiasm: user.customEnthusiasm,
            customFormatting: user.customFormatting,
            customEmoji: user.customEmoji,
            memoryItems,
            projectContext: activeProject?.systemPrompt,
            webSearch: options?.webSearch,
            deepReasoning: options?.deepReasoning,
            synthesisMode: options?.synthesisMode,
            inlineAttachment,
            stream: true,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          paneText =
            (errJson && typeof errJson.error === 'string' && errJson.error) ||
            (res.status === 403
              ? `${LUXO_MODELS[targetModelId]?.name || targetModelId} modeli kilitli (API anahtarı gerekli).`
              : `HTTP ${res.status} yanıt hatası.`);
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = '';
          let streamDone = false;
          while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) {
              sseBuffer += decoder.decode();
              streamDone = true;
            } else {
              sseBuffer += decoder.decode(value, { stream: true });
            }
            const rawLines = sseBuffer.split('\n');
            sseBuffer = streamDone ? '' : rawLines.pop() || '';

            for (const rawLine of rawLines) {
              const line = rawLine.trim();
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') {
                streamDone = true;
                break;
              }
              try {
                const parsed = JSON.parse(payload);
                if (parsed.meta) {
                  paneThinking = parsed.meta.thinkingSteps;
                  paneCitations = parsed.meta.citations;
                  if (parsed.meta.tokenUsage) {
                    paneTokenUsage = parsed.meta.tokenUsage as TokenUsageMetadata;
                  }
                }
                if (parsed.text) {
                  paneText += sanitizeLuxoBrand(parsed.text);
                }
                panes[paneIdx] = {
                  modelId: targetModelId,
                  content: paneText,
                  thinkingSteps: paneThinking,
                  citations: paneCitations,
                  tokenUsage: paneTokenUsage,
                  latencyMs: Date.now() - startedAt,
                  isStreaming: true,
                };
                syncComparePanesToState();
              } catch {
                // ignore malformed SSE frame
              }
            }
          }
        } else {
          const data = await res.json();
          paneText = sanitizeLuxoBrand(data.text || 'Yanıt oluşturuldu.');
          paneThinking = data.thinkingSteps;
          paneCitations = data.citations;
          if (data.tokenUsage) {
            paneTokenUsage = data.tokenUsage as TokenUsageMetadata;
          }
        }
      } catch (err) {
        paneText =
          err instanceof Error && err.message
            ? `Model API bağlantısında sorun: ${err.message}`
            : 'Model sunucusuna bağlanılamadı.';
      } finally {
        if (paneTokenUsage) {
          setDailyTokenUsage((prev) =>
            recordModelTokenUsage(
              prev,
              targetModelId,
              paneTokenUsage!.inputTokens,
              paneTokenUsage!.outputTokens
            )
          );
        }
        panes[paneIdx] = {
          modelId: targetModelId,
          content: cleanAssistantResponse(paneText, true),
          thinkingSteps: paneThinking,
          citations: paneCitations,
          tokenUsage: paneTokenUsage,
          latencyMs: Date.now() - startedAt,
          isStreaming: false,
        };
        syncComparePanesToState();
      }
    };

    try {
      await Promise.all([runSinglePane(0, modelA), runSinglePane(1, modelB)]);
    } finally {
      setIsStreaming(false);
      const finalSummary = panes
        .map((p) => `${LUXO_MODELS[p.modelId]?.name || p.modelId}:\n${p.content}`)
        .join('\n\n');
      const completedCompareMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: finalSummary,
        timestamp: Date.now(),
        modelId: modelA,
        comparisonResponses: panes.map((p) => ({ ...p, isStreaming: false })),
      };
      collab.broadcastChatMessage(completedCompareMsg);

      if (!user.isGuest && targetChatId) {
        void persistChatAndTrackSync({
          id: targetChatId,
          title: resolvedTitle,
          modelId: modelA,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [...updatedMessages, completedCompareMsg],
        });
      }
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="w-full h-screen overflow-hidden flex flex-col bg-[#f8fafc] dark:bg-[#0b0d14] text-slate-900 dark:text-slate-100">
      {sharedIncoming && (
        <div className="px-4 py-2.5 bg-indigo-600/10 dark:bg-indigo-500/15 border-b border-indigo-500/25 flex items-center justify-between gap-3 shrink-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="min-w-0 text-xs">
              <span className="font-bold text-indigo-700 dark:text-indigo-300">
                {sharedIncoming.badge || 'PAYLAŞILAN LUXO AI İÇERİĞİ'}:{' '}
              </span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {sharedIncoming.title}
              </span>
              {sharedIncoming.excerpt && (
                <span className="hidden md:inline text-neutral-600 dark:text-neutral-300">
                  {' '}
                  — {sharedIncoming.excerpt.slice(0, 95)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="share-bar-copy-link-btn"
              onClick={() => {
                const targetUrl =
                  sharedIncoming.shareUrl ||
                  (typeof window !== 'undefined' ? window.location.href : '');
                if (!targetUrl) return;
                try {
                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(targetUrl).catch(() => {});
                  } else {
                    const ta = document.createElement('textarea');
                    ta.value = targetUrl;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                  }
                } catch {
                  // ignore
                }
                setSharedLinkCopied(true);
                setTimeout(() => setSharedLinkCopied(false), 2200);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all duration-300 shadow-xs ${
                sharedLinkCopied
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-4 ring-emerald-500/20 shadow-emerald-500/25 scale-[1.02]'
                  : 'bg-white/80 dark:bg-[#202125] hover:bg-white dark:hover:bg-neutral-800 border border-indigo-400/40 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-300'
              }`}
              title="Bağlantıyı Panoya Kopyala"
            >
              {sharedLinkCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 animate-in zoom-in-75" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Bağlantıyı Kopyala</span>
                </>
              )}
            </button>

            {/* Preview Social Card Button */}
            <button
              type="button"
              data-testid="share-bar-preview-card-btn"
              onClick={() => setShareBarPreviewModal(true)}
              className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-[#202125] hover:bg-white dark:hover:bg-neutral-800 border border-indigo-400/40 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap transition shadow-xs"
              title="X (Twitter) ve Facebook Sosyal Kart Önizlemesini Aç"
            >
              <Eye className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Kart Önizle</span>
            </button>

            {/* QR Code Button */}
            <button
              type="button"
              data-testid="share-bar-qr-btn"
              onClick={() => setShareBarQrModal(true)}
              className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-[#202125] hover:bg-white dark:hover:bg-neutral-800 border border-indigo-400/40 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap transition shadow-xs"
              title="Mobil Cihazlar İçin QR Kodu Göster"
            >
              <QrCode className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">QR Kod</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const incoming = sharedIncoming;
                setSharedIncoming(null);
                if (incoming.contentType === 'image' || incoming.contentType === 'video') {
                  setCurrentView('images');
                } else if (incoming.contentType === 'code') {
                  setCurrentView('studio');
                } else {
                  setCurrentView('chat');
                  handleSendMessage(
                    `Paylaşılan "${incoming.title}" içeriğini derinlemesine incele ve geliştir:\n\n${incoming.excerpt}`
                  );
                }
              }}
              className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Sohbette İncele</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setSharedIncoming(null)}
              className="p-1 rounded-full text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
              aria-label="Paylaşım Bildirimini Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Share Bar - Live Social Card Preview Modal */}
      {shareBarPreviewModal && sharedIncoming && (
        <div
          onClick={() => setShareBarPreviewModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Sosyal Medya Kart Önizlemesi"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#1c1c21] rounded-3xl p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Canlı Sosyal Medya Kart Önizlemesi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShareBarPreviewModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                aria-label="Önizlemeyi Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Toggle (X vs Facebook) */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                Hedef Platform Görünümü:
              </span>
              <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium">
                <button
                  type="button"
                  data-testid="share-preview-switch-x"
                  onClick={() => setShareBarPreviewPlatform('x')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    shareBarPreviewPlatform === 'x'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  X (Twitter)
                </button>
                <button
                  type="button"
                  data-testid="share-preview-switch-fb"
                  onClick={() => setShareBarPreviewPlatform('facebook')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    shareBarPreviewPlatform === 'facebook'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  Facebook
                </button>
              </div>
            </div>

            {/* Live Card */}
            <div
              data-testid="share-bar-live-social-card"
              className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141418]"
            >
              <div className="aspect-[1200/630] bg-neutral-900 overflow-hidden relative">
                <img
                  src={
                    sharedIncoming.ogImage ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=85'
                  }
                  alt={sharedIncoming.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {shareBarPreviewPlatform === 'x' && (
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono tracking-wide">
                    luxo.ai
                  </div>
                )}
              </div>
              <div className="p-3 space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 truncate">
                  {shareBarPreviewPlatform === 'facebook'
                    ? 'LUXO.AI · BAĞLANTI ÖNİZLEMESİ'
                    : 'LUXO.AI · X KART GÖRÜNÜMÜ'}
                </div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                  {sharedIncoming.title}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
                  {sharedIncoming.excerpt ||
                    'Gemini 4, ChatGPT-5o, Claude 4.5, DeepSeek R2, 4K Görsel & Video Stüdyosu.'}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
              Bu kart, bağlantıyı X (Twitter) veya Facebook üzerinde paylaştığınızda takipçilerinizin göreceği zengin OpenGraph önizlemesini temsil eder.
            </p>
          </div>
        </div>
      )}

      {/* Top Share Bar - QR Code Modal */}
      {shareBarQrModal && sharedIncoming && (
        <div
          onClick={() => setShareBarQrModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="QR Kod ile Paylaş"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#1c1c21] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-center text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Mobil İçin QR Kod
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShareBarQrModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                aria-label="QR Kod Penceresini Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Telefon veya tabletinizin kamerasını doğrultarak bu projeyi mobil cihazınızda anında açabilirsiniz.
            </p>

            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-inner flex items-center justify-center mx-auto w-64 h-64">
              {shareBarQrDataUrl ? (
                <img
                  src={shareBarQrDataUrl}
                  alt="Proje QR Kodu"
                  data-testid="share-bar-qr-img"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-neutral-400 animate-pulse font-mono">
                  QR Kod oluşturuluyor...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 truncate bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                {sharedIncoming.shareUrl ||
                  (typeof window !== 'undefined' ? window.location.href : '')}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="w-full flex-1 flex flex-row relative overflow-hidden transition-all min-h-0">
        {currentView !== 'welcome' && (
          <SidebarDrawer
            isOpen={isSidebarOpen}
            isDesktopOpen={isDesktopSidebarOpen}
            onToggleDesktop={() => setIsDesktopSidebarOpen((prev) => !prev)}
            onClose={() => setIsSidebarOpen(false)}
            currentView={currentView}
            providerStatus={providerStatus}
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={(id) => {
              setActiveChatId(id);
              setCurrentView('chat');
            }}
            onNewChat={handleCreateNewChat}
            onDeleteChat={handleDeleteChat}
            onOpenHome={() => setCurrentView('home')}
            onOpenModels={() => setCurrentView('models')}
            onOpenArena={() => setCurrentView('arena')}
            onOpenAssistants={() => setCurrentView('assistants')}
            onOpenKnowledge={() => setCurrentView('knowledge')}
            onOpenPrompts={() => setCurrentView('prompts')}
            onOpenWorkflows={() => setCurrentView('workflows')}
            onOpenAdmin={() => setCurrentView('admin')}
            isAdminUser={isAdminUser}
            zeroCostEnabled={zeroCostPolicy.enabled}
            connectedProviderCount={connectedProviderCount}
            onOpenImages={() => setCurrentView('images')}
            onOpenDashboard={() => handleOpenDashboard('overview')}
            onOpenVoiceCommands={() => setIsVoiceCommandModalOpen(true)}
            onSignOut={handleSignOut}
            onOpenEvolution={() => setCurrentView('evolution')}
            onOpenHub={() => {
              setHubInitialTab(undefined);
              setCurrentView('hub');
            }}
            onOpenContentStudio={() => {
              setHubInitialTab('content-studio');
              setCurrentView('hub');
            }}
            onOpenSocial={() => setCurrentView('social')}
            onOpenGmail={() => setIsGmailModalOpen(true)}
            onOpenLibrary={() => setCurrentView('library')}
            onOpenProjects={() => setCurrentView('projects')}
            onOpenStudio={() => setCurrentView('studio')}
            onOpenSettings={(sub) => {
              setSettingsSubModal(sub || null);
              setCurrentView('settings');
            }}
            onOpenKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
            unreadNotificationCount={unreadNotificationCount}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onSelectModel={setActiveModelId}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            routines={routines}
            onToggleRoutine={(id) =>
              setRoutines((prev) =>
                prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
              )
            }
            onAddRoutine={(newR) =>
              setRoutines((prev) => [
                { ...newR, id: `routine-${Date.now()}` },
                ...prev,
              ])
            }
            onRunRoutineNow={(routine) => {
              setActiveModelId(routine.modelId);
              setCurrentView('chat');
              handleSendMessage(routine.prompt);
            }}
            user={user}
            isDarkTheme={Boolean(isDarkTheme)}
            onToggleTheme={() =>
              handleUpdateUser({ theme: isDarkTheme ? 'light' : 'dark' })
            }
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden">
          {currentView === 'welcome' && (
            <WelcomeView
              onGoogleSignIn={handleFirebaseGoogleSignIn}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
              onSkipToGuest={handleSkipToGuest}
            />
          )}

          {currentView === 'chat' && (
            <ChatWorkspace
              onOpenExtendedCatalog={() => {
                setSettingsSubModal('all_models');
                setCurrentView('settings');
              }}
              showExtendedCatalog={isCatalogUnlocked && showExtendedModelsInChat}
              isCatalogUnlocked={isCatalogUnlocked}
              providerStatus={providerStatus}
              providersLoaded={providersLoaded}
              catalogModels={catalogModels}
              zeroCostEnabled={zeroCostPolicy.enabled}
              favoriteModelIds={favoriteModelIds}
              recentModelIds={recentModelIds}
              tokenOverrides={tokenOverrides}
              dailyTokenUsage={dailyTokenUsage}
              onUpdateModelTokenOverride={handleUpdateModelTokenOverride}
              onResetModelTokenOverride={handleResetModelTokenOverride}
              onOpenProviderSettings={() => {
                setSettingsSubModal('ai_tuning');
                setCurrentView('settings');
              }}
              currentChat={activeChat}
              activeModelId={activeModelId}
              activeProject={activeProject}
              onClearActiveProject={() => setActiveProjectId(null)}
              onSelectModel={setActiveModelId}
              onSendMessage={(text, file, opts) =>
                handleSendMessage(text, file, opts)
              }
              onStopGenerating={handleStopGenerating}
              onEditAndRerunMessage={handleEditAndRerunMessage}
              knowledgeDocs={knowledgeDocs}
              attachedKnowledgeDocIds={attachedKnowledgeDocIds}
              onToggleKnowledgeDoc={handleToggleAttachKnowledgeDoc}
              onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
              isRightPanelOpen={isRightPanelOpen}
              activeAssistant={activeAssistant}
              onCompareMessage={(text, mA, mB, file, opts) =>
                handleCompareMessage(text, mA, mB, file, opts)
              }
              onSelectComparisonWinner={handleSelectComparisonWinner}
              onToggleLikeMessage={handleToggleLikeMessage}
              onToggleDislikeMessage={handleToggleDislikeMessage}
              onModelFeedback={handleModelFeedback}
              onRegenerate={() => {
                if (activeChat && activeChat.messages.length >= 2) {
                  const lastUser = [...activeChat.messages]
                    .reverse()
                    .find((m) => m.role === 'user');
                  const lastAssistant = [...activeChat.messages]
                    .reverse()
                    .find((m) => m.role === 'assistant');
                  if (lastUser) {
                    if (lastAssistant) {
                      submitConsentedChatSignal(
                        lastUser.content,
                        lastAssistant.content,
                        lastAssistant.modelId || activeModelId,
                        'regenerated'
                      );
                    }
                    handleSendMessage(lastUser.content);
                  }
                }
              }}
              onOpenSidebar={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setIsDesktopSidebarOpen((prev) => !prev);
                } else {
                  setIsSidebarOpen(true);
                }
              }}
              onOpenNewChat={handleCreateNewChat}
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenVoiceCommands={() => setIsVoiceCommandModalOpen(true)}
              onOpenDashboard={() => handleOpenDashboard('overview')}
              onOpenImagesView={() => setCurrentView('images')}
              onOpenEvolutionView={() => setCurrentView('evolution')}
              onOpenHubView={() => {
                setHubInitialTab(undefined);
                setCurrentView('hub');
              }}
              onOpenContentStudioView={() => {
                setHubInitialTab('content-studio');
                setCurrentView('hub');
              }}
              onOpenSocialView={() => setCurrentView('social')}
              unreadNotificationCount={unreadNotificationCount}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              evolutionGeneration={evolutionState.generation}
              adaptiveSuggestions={evolutionState.adaptiveSuggestions}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              isDarkTheme={Boolean(isDarkTheme)}
              onToggleTheme={() =>
                handleUpdateUser({ theme: isDarkTheme ? 'light' : 'dark' })
              }
              externalCompareRequest={compareTriggerCount}
              onSynthesizeComparison={(question, mA, cA, mB, cB) => {
                handleSendMessage(
                  buildConsensusFusionPrompt(question, mA, cA, mB, cB)
                );
              }}
              onSaveToLibrary={(title, content) => {
                setLibraryItems((prev) => [
                  {
                    id: `lib-${Date.now()}`,
                    title: title.slice(0, 42),
                    summary: content.slice(0, 90) + '...',
                    content,
                    type: 'document',
                    tab: 'Kaydedilenler',
                    createdAt: 'Az önce',
                    isFavorite: true,
                  },
                  ...prev,
                ]);
              }}
              collabParticipantsCount={collab.participants.length}
              collabRoomId={collab.roomId}
              isCollabConnected={collab.isConnected}
              onOpenCollabPanel={() => setIsCollabPanelOpen(true)}
              onTypingActivity={(isTyping) =>
                collab.updatePresence({ isTyping })
              }
              cloudSyncVisible={Boolean(
                lastCloudSync && activeChatId && lastCloudSync.chatId === activeChatId
              )}
              user={user}
              isStreaming={isStreaming}
            />
          )}

        <React.Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              Modül yükleniyor...
            </div>
          }
        >
          {currentView === 'home' && (
            <HomeDashboardView
              user={user}
              activeModelId={activeModelId}
              onSelectModel={setActiveModelId}
              catalogModels={catalogModels}
              providers={platformProviders}
              providerStatus={providerStatus}
              zeroCostEnabled={zeroCostPolicy.enabled}
              favoriteModelIds={favoriteModelIds}
              recentModelIds={recentModelIds}
              assistants={assistants}
              chats={chats}
              prompts={promptTemplates}
              projects={projects}
              knowledgeDocs={knowledgeDocs}
              attachedKnowledgeDocIds={attachedKnowledgeDocIds}
              onStartChat={(promptText, file, opts) => {
                if (opts?.assistantId) {
                  setActiveAssistantId(opts.assistantId);
                }
                setCurrentView('chat');
                void handleSendMessage(promptText, file, {
                  webSearch: opts?.webSearch,
                  deepReasoning: opts?.deepReasoning,
                  assistantId: opts?.assistantId,
                  forceNewChat: true,
                });
              }}
              onSelectChat={(chatId) => {
                setActiveChatId(chatId);
                setCurrentView('chat');
              }}
              onSelectAssistantForChat={(assistant) => {
                setActiveAssistantId(assistant.id);
                if (assistant.defaultModelId) {
                  setActiveModelId(assistant.defaultModelId as LuxoModelId);
                }
                handleCreateNewChat();
              }}
              onSelectPromptForChat={(prm) => {
                if (prm.recommendedModelId) {
                  setActiveModelId(prm.recommendedModelId as LuxoModelId);
                }
                setPromptTemplates((prev) =>
                  prev.map((item) =>
                    item.id === prm.id
                      ? { ...item, usageCount: item.usageCount + 1 }
                      : item
                  )
                );
                setCurrentView('chat');
                void handleSendMessage(prm.content, undefined, {
                  forceNewChat: true,
                });
              }}
              onSelectProject={(projectId) => {
                setActiveProjectId(projectId);
                setCurrentView('chat');
              }}
              onNavigateView={(view) => setCurrentView(view)}
              onOpenSidebar={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setIsDesktopSidebarOpen((prev) => !prev);
                } else {
                  setIsSidebarOpen(true);
                }
              }}
              onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
              isRightPanelOpen={isRightPanelOpen}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onOpenSettings={() => {
                setSettingsSubModal('ai_tuning');
                setCurrentView('settings');
              }}
            />
          )}

          {currentView === 'models' && (
            <ModelCenterView
              catalogModels={catalogModels}
              providers={platformProviders}
              zeroCostEnabled={zeroCostPolicy.enabled}
              favoriteModelIds={favoriteModelIds}
              onToggleFavorite={handleToggleFavoriteModel}
              onLaunchChat={(modelId) => {
                setActiveModelId(modelId);
                trackRecentModel(modelId);
                handleCreateNewChat();
              }}
              onLaunchArenaWithModel={(modelId) => {
                const partner =
                  catalogModels.find(
                    (m) =>
                      m.id !== modelId &&
                      m.executable &&
                      (!zeroCostPolicy.enabled || m.zeroCostAllowed)
                  )?.id || 'gemini-2.5-flash';
                setArenaInitialModels([modelId, partner]);
                setCurrentView('arena');
              }}
              onOpenSidebar={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setIsDesktopSidebarOpen((prev) => !prev);
                } else {
                  setIsSidebarOpen(true);
                }
              }}
              onBackHome={() => setCurrentView('home')}
            />
          )}

          {currentView === 'arena' && (
            <ModelArenaView
              catalogModels={catalogModels}
              zeroCostEnabled={zeroCostPolicy.enabled}
              knowledgeDocs={knowledgeDocs}
              initialModelIds={arenaInitialModels}
              arenaHistory={arenaHistory}
              onSaveArenaRun={(run) => {
                setArenaHistory((prev) => [run, ...prev.filter((r) => r.id !== run.id)].slice(0, 20));
                for (const mId of run.modelIds) trackRecentModel(mId);
                if (!user.isGuest && user.emailVerified) {
                  const summary = run.responses
                    .map((r) => `${r.modelName}: ${r.content || r.error || ''}`)
                    .join('\n\n');
                  void syncArenaHistoryToFirestore({
                    id: run.id,
                    prompt: run.prompt,
                    modelIds: run.modelIds,
                    winnerModelId: run.winnerModelId,
                    summaryText: summary,
                  }).catch(() => {});
                }
              }}
              onSelectArenaWinner={(runId, winnerModelId) => {
                setArenaHistory((prev) =>
                  prev.map((r) =>
                    r.id === runId ? { ...r, winnerModelId } : r
                  )
                );
                const run = arenaHistory.find((r) => r.id === runId);
                if (run && !user.isGuest && user.emailVerified) {
                  const summary = run.responses
                    .map((r) => `${r.modelName}: ${r.content || r.error || ''}`)
                    .join('\n\n');
                  void syncArenaHistoryToFirestore({
                    id: run.id,
                    prompt: run.prompt,
                    modelIds: run.modelIds,
                    winnerModelId,
                    summaryText: summary,
                  }).catch(() => {});
                }
              }}
              onOpenSidebar={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setIsDesktopSidebarOpen((prev) => !prev);
                } else {
                  setIsSidebarOpen(true);
                }
              }}
              onBackHome={() => setCurrentView('home')}
            />
          )}

          {(currentView === 'assistants' ||
            currentView === 'knowledge' ||
            currentView === 'prompts' ||
            currentView === 'workflows') && (
            <V2StudiosView
              activeSection={currentView}
              onSwitchSection={(section) => setCurrentView(section)}
              onOpenSidebar={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setIsDesktopSidebarOpen((prev) => !prev);
                } else {
                  setIsSidebarOpen(true);
                }
              }}
              onBackHome={() => setCurrentView('home')}
              catalogModels={catalogModels}
              assistants={assistants}
              onCreateAssistant={(draft) => {
                const now = Date.now();
                const created: AssistantPersona = {
                  ...draft,
                  id: `ast-${now}`,
                  createdAt: now,
                  updatedAt: now,
                };
                setAssistants((prev) => [created, ...prev]);
              }}
              onDeleteAssistant={(id) => {
                setAssistants((prev) => prev.filter((a) => a.id !== id));
                if (activeAssistantId === id) setActiveAssistantId(null);
              }}
              onLaunchAssistantInChat={(assistant) => {
                setActiveAssistantId(assistant.id);
                if (assistant.defaultModelId) {
                  setActiveModelId(assistant.defaultModelId as LuxoModelId);
                }
                handleCreateNewChat();
              }}
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
                if (id) setCurrentView('chat');
              }}
              onCreateProject={(proj) => {
                const created: LuxoProject = {
                  ...proj,
                  id: `proj-${Date.now()}`,
                  updatedAt: Date.now(),
                  filesCount: 1,
                };
                setProjects((prev) => [created, ...prev]);
                setActiveProjectId(created.id);
                if (!user.isGuest && user.emailVerified) {
                  void syncProjectV2ToFirestore(created).catch(() => {});
                }
              }}
              knowledgeDocs={knowledgeDocs}
              attachedKnowledgeDocIds={attachedKnowledgeDocIds}
              onToggleAttachKnowledgeDoc={handleToggleAttachKnowledgeDoc}
              onRefreshKnowledgeDocs={refreshKnowledgeDocs}
              prompts={promptTemplates}
              onCreatePrompt={(draft) => {
                const created: PromptTemplateRecord = {
                  ...draft,
                  id: `prm-${Date.now()}`,
                  usageCount: 0,
                  createdAt: Date.now(),
                };
                setPromptTemplates((prev) => [created, ...prev]);
              }}
              onToggleFavoritePrompt={(id) => {
                setPromptTemplates((prev) =>
                  prev.map((p) =>
                    p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
                  )
                );
              }}
              onDeletePrompt={(id) => {
                setPromptTemplates((prev) => prev.filter((p) => p.id !== id));
              }}
              onLaunchPromptInChat={(prm) => {
                if (prm.recommendedModelId) {
                  setActiveModelId(prm.recommendedModelId as LuxoModelId);
                }
                setPromptTemplates((prev) =>
                  prev.map((item) =>
                    item.id === prm.id
                      ? { ...item, usageCount: item.usageCount + 1 }
                      : item
                  )
                );
                setCurrentView('chat');
                void handleSendMessage(prm.content, undefined, {
                  forceNewChat: true,
                });
              }}
              workflows={workflows}
              onCreateWorkflow={(draft) => {
                const created: WorkflowDefinition = {
                  ...draft,
                  id: `wf-${Date.now()}`,
                  createdAt: Date.now(),
                };
                setWorkflows((prev) => [created, ...prev]);
              }}
              onSaveWorkflowResult={(wfId, output) => {
                setWorkflows((prev) =>
                  prev.map((w) =>
                    w.id === wfId
                      ? { ...w, lastRunAt: Date.now(), lastRunOutput: output }
                      : w
                  )
                );
              }}
              onSendWorkflowOutputToChat={(title, output) => {
                setCurrentView('chat');
                void handleSendMessage(
                  `Review and expand this "${title}" workflow output:\n\n${output}`,
                  undefined,
                  { forceNewChat: true }
                );
              }}
            />
          )}

          {currentView === 'admin' && (
            <AdminDashboardView
              onOpenSidebar={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setIsDesktopSidebarOpen((prev) => !prev);
                } else {
                  setIsSidebarOpen(true);
                }
              }}
              onBackHome={() => setCurrentView('home')}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onCatalogRefresh={refreshPlatformCatalog}
            />
          )}

          {currentView === 'studio' && (
            <ArgonCodeStudio
              onBack={() => setCurrentView('chat')}
              initialCode={studioInitialCode}
              initialLang={studioInitialLang}
              onSendCodeToChat={(promptText) => {
                setCurrentView('chat');
                handleSendMessage(promptText);
              }}
              sharedCode={collab.sharedCode}
              participants={collab.participants}
              isCollabConnected={collab.isConnected}
              onUpdateSharedCode={collab.updateSharedCode}
              onUpdatePresence={collab.updatePresence}
              onOpenCollabPanel={() => setIsCollabPanelOpen(true)}
            />
          )}

          {currentView === 'images' && (
            <ImagesStudioView
              onBack={() => setCurrentView('chat')}
              visuals={visuals}
              onCreateVisual={(vis) => setVisuals((prev) => [vis, ...prev])}
              onDeleteVisual={(id) =>
                setVisuals((prev) => prev.filter((v) => v.id !== id))
              }
              onSendToChat={(promptText, imgUrl, vidUrl) => {
                setCurrentView('chat');
                handleSendMessage(promptText, undefined, {
                  overrideImageUrl: imgUrl,
                  overrideVideoUrl: vidUrl,
                });
              }}
            />
          )}

          {currentView === 'dashboard' && (
            <PersonalDashboardView
              onBack={() => setCurrentView('chat')}
              user={user}
              activeModelId={activeModelId}
              chats={chats}
              projects={projects}
              libraryItems={libraryItems}
              visuals={visuals}
              studioArticles={studioArticles}
              evolutionState={evolutionState}
              isDarkTheme={Boolean(isDarkTheme)}
              initialFocusSection={dashboardFocusSection}
              onToggleTheme={() =>
                handleUpdateUser({ theme: isDarkTheme ? 'light' : 'dark' })
              }
              onNavigateView={(view, opts) => {
                if (view === 'hub') {
                  setHubInitialTab(opts?.hubTab);
                }
                setCurrentView(view);
              }}
              onTogglePinWorkspace={handleTogglePinWorkspace}
              onToggleModelEnabled={handleToggleModelEnabled}
              onSelectModel={(modelId) => {
                const access = canAccessModel(modelId, user);
                if (access.allowed) {
                  setActiveModelId(modelId);
                  setCurrentView('chat');
                } else if (access.reason === 'guest') {
                  setIsAuthModalOpen(true);
                } else {
                  setIsUpgradeModalOpen(true);
                }
              }}
              onCreateQuickProject={handleCreateQuickProject}
              onOpenLibraryItemInChat={(title, content) => {
                setCurrentView('chat');
                handleSendMessage(
                  `"${title}" kaynağı üzerinden detaylı analiz yap:\n\n${content}`
                );
              }}
              onOpenVoiceCommands={() => setIsVoiceCommandModalOpen(true)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenGmail={() => setIsGmailModalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onSignOut={handleSignOut}
            />
          )}

          {currentView === 'evolution' && (
            <SelfEvolutionHub
              onBack={() => setCurrentView('chat')}
              evolutionState={evolutionState}
              consentStatus={trainingConsent}
              onChangeConsent={handleSelectTrainingConsent}
              onRunEvolutionCycle={handleRunEvolutionCycle}
              onCalibrateAllModels={handleCalibrateAllModels}
              onRunBenchmark={handleRunBenchmark}
              onCustomTrain={handleCustomTrain}
              onBoostModel={handleBoostModel}
              onToggleRule={handleToggleEvolutionRule}
              onDeleteRule={handleDeleteEvolutionRule}
              onToggleAutoEvolution={handleToggleAutoEvolution}
              onOpenModelMetrics={() => handleOpenDashboard('model-metrics')}
              onTestRuleInChat={(promptText, suggestedModelId) => {
                if (suggestedModelId) {
                  setActiveModelId(suggestedModelId);
                }
                setCurrentView('chat');
                handleSendMessage(promptText);
              }}
            />
          )}

          {currentView === 'hub' && (
            <CommunitySeoHub
              initialHubTab={hubInitialTab}
              onBack={() => setCurrentView('chat')}
              onStudioArticlesSync={setStudioArticles}
              onAskAiInChat={(promptText, suggestedModelId) => {
                if (suggestedModelId) {
                  setActiveModelId(suggestedModelId);
                }
                setCurrentView('chat');
                handleSendMessage(promptText);
              }}
            />
          )}

          {currentView === 'social' && (
            <SocialCalendarWorkspace
              user={user}
              onBack={() => setCurrentView('chat')}
              onUpdateAppUser={handleUpdateUser}
            />
          )}

          {currentView === 'library' && (
            <LibraryView
              onBack={() => setCurrentView('chat')}
              items={libraryItems}
              onAddItem={(item) =>
                setLibraryItems((prev) => [
                  {
                    ...item,
                    id: `lib-${Date.now()}`,
                    createdAt: 'Az önce',
                  },
                  ...prev,
                ])
              }
              onToggleFavorite={(id) =>
                setLibraryItems((prev) =>
                  prev.map((it) =>
                    it.id === id ? { ...it, isFavorite: !it.isFavorite } : it
                  )
                )
              }
              onSelectItemForChat={(title, content) => {
                setCurrentView('chat');
                handleSendMessage(
                  `"${title}" kaynağı üzerinden detaylı analiz yap:\n\n${content}`
                );
              }}
            />
          )}

          {currentView === 'projects' && (
            <ProjectsView
              onBack={() => setCurrentView('chat')}
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(proj) => {
                setActiveProjectId(proj.id);
                setCurrentView('chat');
              }}
              onCreateProject={(proj) => {
                const created: LuxoProject = {
                  ...proj,
                  id: `proj-${Date.now()}`,
                  updatedAt: Date.now(),
                  filesCount: 1,
                };
                setProjects((prev) => [created, ...prev]);
                setActiveProjectId(created.id);
              }}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              onBack={() => setCurrentView('chat')}
              user={user}
              onUpdateUser={handleUpdateUser}
              memoryItems={memoryItems}
              onUpdateMemory={setMemoryItems}
              plugins={plugins}
              onTogglePlugin={(id) =>
                setPlugins((prev) =>
                  prev.map((p) =>
                    p.id === id ? { ...p, enabled: !p.enabled } : p
                  )
                )
              }
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
              onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onSignOut={handleSignOut}
              onClearAllChats={() => setChats([])}
              unreadNotificationCount={unreadNotificationCount}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onOpenGmail={() => setIsGmailModalOpen(true)}
              onOpenKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
              onResendVerification={async () => {
                await resendVerificationEmail();
              }}
              onRefreshVerification={async () => {
                const verified = await refreshCurrentUserVerification();
                if (verified) {
                  setUser((prev) => ({ ...prev, emailVerified: true }));
                }
                return verified;
              }}
              onPasswordResetRequest={() => setIsAuthModalOpen(true)}
              initialSubModal={settingsSubModal}
              isCatalogUnlocked={isCatalogUnlocked}
              onUnlockModelCatalog={handleUnlockModelCatalog}
              onLockModelCatalog={handleLockModelCatalog}
              activeModelId={activeModelId}
              onSelectModelFromSettings={handleSelectModelFromSettings}
              showExtendedModelsInChat={showExtendedModelsInChat}
              onToggleExtendedModelsInChat={setShowExtendedModelsInChat}
              providerStatus={providerStatus}
            />
          )}
        </React.Suspense>

        {/* Quick-Access Floating Feedback Button (Scoped to clean Chat view so it never overlaps studio/settings headers or modals) */}
        {currentView === 'chat' &&
          !isSidebarOpen &&
          !isRightPanelOpen &&
          !isCollabPanelOpen &&
          !isUpgradeModalOpen &&
          !isFeedbackModalOpen &&
          !isAuthModalOpen &&
          !isVoiceModalOpen &&
          !isVoiceCommandModalOpen &&
          !isCommandPaletteOpen &&
          !isKeyboardShortcutsOpen &&
          !isNotificationsOpen && (
            <button
              type="button"
              data-testid="quick-access-feedback-btn"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="hidden lg:flex fixed bottom-5 right-5 z-30 p-3 rounded-full bg-neutral-900/90 dark:bg-white/90 hover:bg-neutral-900 dark:hover:bg-white text-white dark:text-neutral-900 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer items-center gap-2 group backdrop-blur-xs border border-neutral-700/30 dark:border-neutral-200/40"
              aria-label="Geri Bildirim & Hata Bildir"
              title="Geri Bildirim & Hata Bildir / Özellik Öner"
            >
              <MessageSquarePlus className="w-5 h-5 shrink-0" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold group-hover:max-w-xs transition-all duration-300 ease-out">
                Geri Bildirim
              </span>
            </button>
          )}
        </div>

        {(currentView === 'home' || currentView === 'chat') && (
          <RightContextPanel
            isOpen={isRightPanelOpen}
            onClose={() => setIsRightPanelOpen(false)}
            activeModelId={activeModelId}
            catalogModels={catalogModels}
            providerStatus={providerStatus}
            zeroCostEnabled={zeroCostPolicy.enabled}
            activeAssistant={activeAssistant}
            assistants={assistants}
            onSelectAssistant={setActiveAssistantId}
            knowledgeDocs={knowledgeDocs}
            attachedKnowledgeDocIds={attachedKnowledgeDocIds}
            onToggleKnowledgeDoc={handleToggleAttachKnowledgeDoc}
            sessionTokens={
              activeChat
                ? activeChat.messages.reduce(
                    (acc, m) => acc + (m.tokenUsage?.totalTokens || 0),
                    0
                  )
                : 0
            }
            todayTokens={Object.values(dailyTokenUsage).reduce(
              (acc, d) => acc + (d.totalTokens || 0),
              0
            )}
            dailyLimitTokens={
              tokenOverrides[activeModelId]?.dailyTokenLimit ||
              LUXO_MODELS[activeModelId]?.defaultDailyTokenLimit ||
              400000
            }
            onOpenModels={() => setCurrentView('models')}
            onOpenArena={() => {
              setArenaInitialModels([
                activeModelId,
                catalogModels.find(
                  (m) =>
                    m.id !== activeModelId &&
                    m.executable &&
                    (!zeroCostPolicy.enabled || m.zeroCostAllowed)
                )?.id || 'gemini-2.5-flash',
              ]);
              setCurrentView('arena');
            }}
            onOpenKnowledge={() => setCurrentView('knowledge')}
            onOpenSettings={() => {
              setSettingsSubModal('ai_tuning');
              setCurrentView('settings');
            }}
          />
        )}

        <React.Suspense fallback={null}>
          {isUpgradeModalOpen && (
            <UpgradeModal
              isOpen={isUpgradeModalOpen}
              onClose={() => setIsUpgradeModalOpen(false)}
              onSuccess={handleUpgradeSuccess}
              isUnlockedDev={user.isUnlockedDev}
              isUnlockedDevHelper={user.isUnlockedDevHelper}
            />
          )}

          {isFeedbackModalOpen && (
            <FeedbackModal
              isOpen={isFeedbackModalOpen}
              onClose={() => setIsFeedbackModalOpen(false)}
              activeModelId={activeModelId}
              onSubmitFeedback={async (category, subject, message, details) => {
                await fetch('/api/feedback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: category, subject, message, details }),
                }).catch(() => {});
                await submitFeedbackToFirestore(
                  category,
                  subject,
                  message,
                  details
                ).catch(() => {});

                const targetModelId =
                  (details?.modelId && details.modelId in LUXO_MODELS
                    ? (details.modelId as LuxoModelId)
                    : activeModelId) || 'luxo-auto-router';
                const signalRating: 'thumbs_up' | 'thumbs_down' =
                  category === 'Hata Bildirimi' || (details?.rating ?? 5) <= 3
                    ? 'thumbs_down'
                    : 'thumbs_up';
                const signalSnippet = `${category}${
                  details?.errorType ? ` [${details.errorType}]` : ''
                }: ${subject} — ${message}`.slice(0, 320);

                handleModelFeedback(
                  `feedback-${Date.now()}`,
                  targetModelId,
                  signalRating,
                  signalSnippet
                );

                pushNotification({
                  category: 'system_update',
                  title: 'Geri Bildirim Model İyileştirme Motoruna İşlendi',
                  body: `${LUXO_MODELS[targetModelId]?.name || targetModelId} için rapor (${category}) Öz-Gelişim döngüsüne anlık olarak eklendi.`,
                  targetView: 'evolution',
                });
              }}
            />
          )}

          {isAuthModalOpen && (
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              onGoogleSignIn={handleFirebaseGoogleSignIn}
              onEmailSignIn={async (email, pass) => {
                await loginWithEmailPassword(email, pass);
              }}
              onEmailRegister={registerWithEmailPassword}
              onPasswordReset={requestPasswordReset}
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
              isLimitReachedNotice={
                user.isGuest && user.guestMessageCount >= GUEST_MESSAGE_LIMIT
              }
            />
          )}

          {isVoiceModalOpen && (
            <VoiceModal
              isOpen={isVoiceModalOpen}
              onClose={() => setIsVoiceModalOpen(false)}
              modelId={activeModelId}
              selectedVoiceName={user.voiceName || 'Breeze'}
              selectedVoiceRate={user.voiceRate || 1.0}
              onChangeVoice={(voiceName, rate) =>
                handleUpdateUser({
                  voiceName,
                  ...(typeof rate === 'number' ? { voiceRate: rate } : {}),
                })
              }
              onUserSpoke={async (spoken) => {
                handleSendMessage(spoken);
                try {
                  const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      messages: [{ role: 'user', content: spoken }],
                      modelId: activeModelId,
                      customInstructions: user.customInstructions,
                      customTone: user.customTone,
                      memoryItems,
                      stream: false,
                    }),
                  });
                  const data = await res.json();
                  return cleanAssistantResponse(
                    data.text ||
                      `Luxo AI (${LUXO_MODELS[activeModelId].name}) yanıtınızı hazırladı.`
                  );
                } catch {
                  return `Luxo AI (${LUXO_MODELS[activeModelId].name}) sizi dinliyor ve yanıtınızı sohbete ekledi.`;
                }
              }}
            />
          )}

          {isCollabPanelOpen && (
            <CollabWorkspacePanel
              isOpen={isCollabPanelOpen}
              onClose={() => setIsCollabPanelOpen(false)}
              roomId={collab.roomId}
              isConnected={collab.isConnected}
              clientId={collab.clientId}
              participants={collab.participants}
              sharedDoc={collab.sharedDoc}
              onChangeRoom={collab.changeRoom}
              onUpdateSharedDoc={collab.updateSharedDoc}
              onUpdateTyping={(isTyping) =>
                collab.updatePresence({ activeSurface: 'doc', isTyping })
              }
              onSendDocToChat={(promptText) => {
                setCurrentView('chat');
                handleSendMessage(promptText);
              }}
            />
          )}

          {isCommandPaletteOpen && (
            <CommandPaletteModal
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
              user={user}
              activeModelId={activeModelId}
              isDarkTheme={Boolean(isDarkTheme)}
              chats={chats}
              libraryItems={libraryItems}
              projects={projects}
              studioArticles={studioArticles}
              onSelectModel={(modelId) => {
                setActiveModelId(modelId);
                setCurrentView('chat');
              }}
              onSelectChat={(chatId) => {
                setActiveChatId(chatId);
                setCurrentView('chat');
              }}
              onOpenLibrary={() => setCurrentView('library')}
              onOpenProjects={() => setCurrentView('projects')}
              onNewChat={handleCreateNewChat}
              onOpenImages={() => setCurrentView('images')}
              onOpenDashboard={() => handleOpenDashboard('overview')}
              onOpenModelMetrics={() => handleOpenDashboard('model-metrics')}
              onOpenVoiceCommands={() => setIsVoiceCommandModalOpen(true)}
              onOpenEvolution={() => setCurrentView('evolution')}
              onOpenHub={(tab) => {
                setHubInitialTab(tab);
                setCurrentView('hub');
              }}
              onOpenContentStudio={() => {
                setHubInitialTab('content-studio');
                setCurrentView('hub');
              }}
              onOpenGithubSettings={() => {
                setSettingsSubModal('github');
                setCurrentView('settings');
              }}
              onOpenSocial={() => setCurrentView('social')}
              onOpenCollab={() => setIsCollabPanelOpen(true)}
              onToggleTheme={() =>
                handleUpdateUser({ theme: isDarkTheme ? 'light' : 'dark' })
              }
              onEnableCompareMode={() => {
                setCurrentView('chat');
                setCompareTriggerCount((c) => c + 1);
              }}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            />
          )}

          {isNotificationsOpen && (
            <NotificationCenterModal
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              notifications={notifications}
              preferences={notificationPrefs}
              onUpdatePreferences={(partial) =>
                setNotificationPrefs((prev) =>
                  normalizeNotificationPreferences({ ...prev, ...partial })
                )
              }
              onMarkAsRead={(id) =>
                setNotifications((prev) => markNotificationAsRead(prev, id))
              }
              onMarkAllAsRead={() =>
                setNotifications((prev) => markAllNotificationsAsRead(prev))
              }
              onClearRead={() =>
                setNotifications((prev) => clearReadNotifications(prev))
              }
              onNavigateView={(targetView) => setCurrentView(targetView)}
            />
          )}

          {isVoiceCommandModalOpen && (
            <VoiceCommandModal
              isOpen={isVoiceCommandModalOpen}
              onClose={() => setIsVoiceCommandModalOpen(false)}
              onExecuteCommand={(action, rawText) => {
                handleExecuteVoiceCommand(action, rawText);
              }}
            />
          )}

          {isGmailModalOpen && (
            <GmailWorkspaceModal
              isOpen={isGmailModalOpen}
              onClose={() => setIsGmailModalOpen(false)}
            />
          )}

          {isKeyboardShortcutsOpen && (
            <KeyboardShortcutsModal
              isOpen={isKeyboardShortcutsOpen}
              onClose={() => setIsKeyboardShortcutsOpen(false)}
            />
          )}

          {pendingVeoRequest && (
            <CinematicMotionController
              mode="modal"
              value={cinematicMotion}
              onChange={setCinematicMotion}
              prompt={pendingVeoRequest.prompt}
              onChangePrompt={(nextPrompt) =>
                setPendingVeoRequest((prev) =>
                  prev ? { ...prev, prompt: nextPrompt } : null
                )
              }
              highFidelity={pendingVeoRequest.highFidelity}
              onToggleHighFidelity={(nextHiFi) =>
                setPendingVeoRequest((prev) =>
                  prev ? { ...prev, highFidelity: nextHiFi } : null
                )
              }
              isRendering={isStreaming}
              onCancel={() => setPendingVeoRequest(null)}
              onConfirmRender={() => {
                const reqSnapshot = pendingVeoRequest;
                const motionSnapshot = normalizeCinematicMotion(cinematicMotion);
                setPendingVeoRequest(null);
                if (reqSnapshot && reqSnapshot.prompt.trim()) {
                  void handleSendMessage(reqSnapshot.prompt, undefined, {
                    webSearch: reqSnapshot.webSearch,
                    deepReasoning: reqSnapshot.deepReasoning,
                    synthesisMode: reqSnapshot.synthesisMode,
                    highFidelity: reqSnapshot.highFidelity,
                    motionControl: motionSnapshot,
                    skipMotionController: true,
                    forceMediaMode: 'video',
                    referenceImageDataUrl: reqSnapshot.referenceImageDataUrl,
                  });
                }
              }}
            />
          )}
        </React.Suspense>
      </div>
    </div>
    </MotionConfig>
  );
}
