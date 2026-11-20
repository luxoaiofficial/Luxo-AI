import type {
  ChatThread,
  GeneratedVisual,
  LibraryItem,
  LuxoModelId,
  LuxoProject,
  PinnedWorkspaceId,
  SelfEvolutionState,
} from '../types/luxo.ts';
import type { PublishedStudioArticle } from './contentStudioEngine.ts';
import {
  buildAllModelPerformanceMetrics,
  extractModelAlerts,
  type ModelPerformanceAlert,
  type ModelPerformanceMetric,
} from './modelMetricsEngine.ts';

export interface WorkspaceDefinition {
  id: PinnedWorkspaceId;
  title: string;
  subtitle: string;
  accentHex: string;
  defaultPinned: boolean;
}

export const AVAILABLE_WORKSPACES: WorkspaceDefinition[] = [
  {
    id: 'chat',
    title: 'AI Sohbet Stüdyosu',
    subtitle: '115 yapay zeka modeli & karşılaştırma',
    accentHex: '#2563eb',
    defaultPinned: true,
  },
  {
    id: 'studio',
    title: 'Argon Kod Stüdyosu',
    subtitle: 'Canlı önizleme, diff ve sesli kodlama',
    accentHex: '#10b981',
    defaultPinned: true,
  },
  {
    id: 'cms',
    title: 'CMS & Blog Yöneticisi',
    subtitle: 'Makale ekle, düzenle, yayınla',
    accentHex: '#4f46e5',
    defaultPinned: true,
  },
  {
    id: 'model-metrics',
    title: 'Model Performans Metrikleri',
    subtitle: 'Gecikme, maliyet ve kullanım geçmişi',
    accentHex: '#0ea5e9',
    defaultPinned: true,
  },
  {
    id: 'projects',
    title: 'Proje Çalışma Alanları',
    subtitle: 'Özel sistem talimatları ve bağlam',
    accentHex: '#f59e0b',
    defaultPinned: true,
  },
  {
    id: 'library',
    title: 'Kitaplık & Kayıtlar',
    subtitle: 'Favori doküman, kod ve kaynaklar',
    accentHex: '#8b5cf6',
    defaultPinned: true,
  },
  {
    id: 'images',
    title: 'Nano Banana & Veo Medya',
    subtitle: '4K fotoğraf & 60fps sinema video',
    accentHex: '#ec4899',
    defaultPinned: false,
  },
  {
    id: 'evolution',
    title: 'Otonom Gelişim & Evrim',
    subtitle: 'Öz-onarım döngüsü ve doğrulama',
    accentHex: '#6366f1',
    defaultPinned: false,
  },
  {
    id: 'social',
    title: 'Etkinlik Takvimi & Sosyal',
    subtitle: 'Etkinlikler, profiller ve sohbet odaları',
    accentHex: '#0284c7',
    defaultPinned: false,
  },
  {
    id: 'settings',
    title: 'Ayarlar & Güvenlik',
    subtitle: 'Tema, bellek, hesap ve oturum',
    accentHex: '#64748b',
    defaultPinned: false,
  },
];

export const DEFAULT_PINNED_WORKSPACES: PinnedWorkspaceId[] =
  AVAILABLE_WORKSPACES.filter((w) => w.defaultPinned).map((w) => w.id);

export function normalizePinnedWorkspaces(
  raw?: unknown
): PinnedWorkspaceId[] {
  const validSet = new Set<PinnedWorkspaceId>(
    AVAILABLE_WORKSPACES.map((w) => w.id)
  );
  if (!Array.isArray(raw)) {
    return [...DEFAULT_PINNED_WORKSPACES];
  }
  const unique: PinnedWorkspaceId[] = [];
  for (const item of raw) {
    if (
      typeof item === 'string' &&
      validSet.has(item as PinnedWorkspaceId) &&
      !unique.includes(item as PinnedWorkspaceId)
    ) {
      unique.push(item as PinnedWorkspaceId);
    }
  }
  return unique.length > 0 ? unique : [...DEFAULT_PINNED_WORKSPACES];
}

export function togglePinnedWorkspace(
  current: PinnedWorkspaceId[],
  targetId: PinnedWorkspaceId
): PinnedWorkspaceId[] {
  const normalized = normalizePinnedWorkspaces(current);
  if (normalized.includes(targetId)) {
    // Keep at least 1 pinned workspace so the dock is never completely empty
    if (normalized.length <= 1) return normalized;
    return normalized.filter((id) => id !== targetId);
  }
  return [...normalized, targetId];
}

export interface PersonalDashboardSnapshot {
  stats: {
    totalProjects: number;
    totalChats: number;
    totalMessages: number;
    totalLibraryItems: number;
    favoriteLibraryCount: number;
    totalVisuals: number;
    publishedArticlesCount: number;
    draftArticlesCount: number;
    enabledModelsCount: number;
    totalModelsCount: number;
    avgLatencyMs: number;
    avgAccuracyPct: number;
  };
  pinnedWorkspaceDefs: WorkspaceDefinition[];
  recentLibraryItems: LibraryItem[];
  recentProjects: LuxoProject[];
  recentArticles: PublishedStudioArticle[];
  modelMetrics: ModelPerformanceMetric[];
  modelAlerts: ModelPerformanceAlert[];
}

export function aggregatePersonalDashboardData(input: {
  chats: ChatThread[];
  projects: LuxoProject[];
  libraryItems: LibraryItem[];
  visuals: GeneratedVisual[];
  studioArticles: PublishedStudioArticle[];
  evolutionState: SelfEvolutionState;
  pinnedWorkspaces?: PinnedWorkspaceId[];
  disabledModelIds?: LuxoModelId[];
}): PersonalDashboardSnapshot {
  const pinnedIds = normalizePinnedWorkspaces(input.pinnedWorkspaces);
  const pinnedWorkspaceDefs = pinnedIds
    .map((id) => AVAILABLE_WORKSPACES.find((w) => w.id === id))
    .filter((w): w is WorkspaceDefinition => Boolean(w));

  const modelMetrics = buildAllModelPerformanceMetrics(
    input.evolutionState,
    input.disabledModelIds || []
  );
  const enabledMetrics = modelMetrics.filter((m) => m.enabled);
  const avgLatencyMs =
    enabledMetrics.length > 0
      ? Math.round(
          enabledMetrics.reduce((sum, m) => sum + m.latencyMs, 0) /
            enabledMetrics.length
        )
      : 0;
  const avgAccuracyPct =
    enabledMetrics.length > 0
      ? Number(
          (
            enabledMetrics.reduce((sum, m) => sum + m.accuracyScore, 0) /
            enabledMetrics.length
          ).toFixed(1)
        )
      : 0;

  const recentLibraryItems = [...input.libraryItems]
    .sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)))
    .slice(0, 5);

  const recentProjects = [...input.projects]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 4);

  const recentArticles = [...input.studioArticles]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 4);

  const totalMessages = input.chats.reduce(
    (sum, c) => sum + (c.messages?.length || 0),
    0
  );

  return {
    stats: {
      totalProjects: input.projects.length,
      totalChats: input.chats.length,
      totalMessages,
      totalLibraryItems: input.libraryItems.length,
      favoriteLibraryCount: input.libraryItems.filter((i) => i.isFavorite).length,
      totalVisuals: input.visuals.length,
      publishedArticlesCount: input.studioArticles.filter(
        (a) => a.status === 'published'
      ).length,
      draftArticlesCount: input.studioArticles.filter((a) => a.status === 'draft')
        .length,
      enabledModelsCount: enabledMetrics.length,
      totalModelsCount: modelMetrics.length,
      avgLatencyMs,
      avgAccuracyPct,
    },
    pinnedWorkspaceDefs,
    recentLibraryItems,
    recentProjects,
    recentArticles,
    modelMetrics,
    modelAlerts: extractModelAlerts(modelMetrics),
  };
}
