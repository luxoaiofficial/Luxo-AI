import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialEvolutionState } from './selfEvolutionEngine';
import { createInitialStudioArticles } from './contentStudioEngine';
import {
  aggregatePersonalDashboardData,
  DEFAULT_PINNED_WORKSPACES,
  normalizePinnedWorkspaces,
  togglePinnedWorkspace,
} from './dashboardEngine';

test('togglePinnedWorkspace pins/unpins while preserving at least one pinned workspace', () => {
  const initial = normalizePinnedWorkspaces(undefined);
  assert.deepEqual(initial, DEFAULT_PINNED_WORKSPACES);

  const added = togglePinnedWorkspace(initial, 'evolution');
  assert.ok(added.includes('evolution'));

  const removed = togglePinnedWorkspace(added, 'evolution');
  assert.ok(!removed.includes('evolution'));

  const singleOnly = togglePinnedWorkspace(['chat'], 'chat');
  assert.deepEqual(singleOnly, ['chat']);
});

test('aggregatePersonalDashboardData summarizes project stats, library items, articles, and model alerts', () => {
  const evo = createInitialEvolutionState(1_760_000_000_000);
  const articles = createInitialStudioArticles(1_760_000_000_000);
  const snap = aggregatePersonalDashboardData({
    chats: [
      {
        id: 'c1',
        title: 'Test',
        modelId: 'gemini-4-hydrogen',
        createdAt: 100,
        updatedAt: 200,
        messages: [
          { id: 'm1', role: 'user', content: 'Merhaba', timestamp: 100 },
          { id: 'm2', role: 'assistant', content: 'Selam', timestamp: 120 },
        ],
      },
    ],
    projects: [
      {
        id: 'p1',
        name: 'Alpha',
        description: 'Desc',
        systemPrompt: 'Prompt',
        category: 'Yazılım',
        updatedAt: 500,
        filesCount: 2,
        color: '#2563eb',
      },
    ],
    libraryItems: [
      {
        id: 'l1',
        title: 'Not 1',
        summary: 'Özet',
        content: 'İçerik',
        type: 'document',
        tab: 'Kaydedilenler',
        createdAt: 'Bugün',
        isFavorite: true,
      },
    ],
    visuals: [],
    studioArticles: articles,
    evolutionState: evo,
    pinnedWorkspaces: ['chat', 'cms', 'model-metrics'],
  });

  assert.equal(snap.stats.totalProjects, 1);
  assert.equal(snap.stats.totalMessages, 2);
  assert.equal(snap.stats.favoriteLibraryCount, 1);
  assert.equal(snap.stats.publishedArticlesCount, 1);
  assert.equal(snap.stats.totalModelsCount, 115);
  assert.equal(snap.stats.enabledModelsCount, 115);
  assert.equal(snap.pinnedWorkspaceDefs.length, 3);
  assert.ok(snap.modelAlerts.length >= 1);
});
