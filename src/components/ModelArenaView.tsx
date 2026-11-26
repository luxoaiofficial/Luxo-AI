import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Database,
  History,
  PanelLeft,
  Plus,
  Send,
  Swords,
  Trophy,
  X,
} from 'lucide-react';
import type {
  ArenaComparisonRun,
  CatalogModelEntry,
  KnowledgeDocSummary,
} from '../types/luxo';
import { MarkdownContent, ModelBrandAvatar } from './LuxoLogo';

interface ModelArenaViewProps {
  catalogModels: CatalogModelEntry[];
  zeroCostEnabled: boolean;
  knowledgeDocs: KnowledgeDocSummary[];
  initialModelIds?: string[];
  arenaHistory: ArenaComparisonRun[];
  onSaveArenaRun: (run: ArenaComparisonRun) => void;
  onSelectArenaWinner: (runId: string, winnerModelId: string) => void;
  onOpenSidebar: () => void;
  onBackHome: () => void;
}

export const ModelArenaView: React.FC<ModelArenaViewProps> = ({
  catalogModels,
  zeroCostEnabled,
  knowledgeDocs,
  initialModelIds,
  arenaHistory,
  onSaveArenaRun,
  onSelectArenaWinner,
  onOpenSidebar,
  onBackHome,
}) => {
  const defaultCandidates = React.useMemo(() => {
    const ready = catalogModels
      .filter((m) => m.executable && (!zeroCostEnabled || m.zeroCostAllowed))
      .map((m) => m.id);
    if (initialModelIds && initialModelIds.length >= 2) {
      return initialModelIds.slice(0, 4);
    }
    const base =
      initialModelIds && initialModelIds.length === 1
        ? [initialModelIds[0], ...ready.filter((id) => id !== initialModelIds[0])]
        : ready;
    return base.slice(0, Math.min(3, Math.max(2, base.length)));
  }, [catalogModels, zeroCostEnabled, initialModelIds]);

  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(
    defaultCandidates.length >= 2
      ? defaultCandidates
      : ['gemini-2.5-flash', 'gemini-2.5-flash-lite']
  );
  const [prompt, setPrompt] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<ArenaComparisonRun | null>(
    arenaHistory[0] || null
  );

  const handleAddModel = () => {
    if (selectedModelIds.length >= 4) return;
    const unused = catalogModels.find(
      (m) =>
        !selectedModelIds.includes(m.id) &&
        m.executable &&
        (!zeroCostEnabled || m.zeroCostAllowed)
    ) || catalogModels.find((m) => !selectedModelIds.includes(m.id));
    if (unused) {
      setSelectedModelIds((prev) => [...prev, unused.id]);
    }
  };

  const handleRemoveModel = (idx: number) => {
    if (selectedModelIds.length <= 2) return;
    setSelectedModelIds((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRunArena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || selectedModelIds.length < 2 || isRunning) return;
    setIsRunning(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          modelIds: selectedModelIds,
          knowledgeDocIds: selectedDocIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data?.error || 'Arena request failed.');
        return;
      }
      const run: ArenaComparisonRun = {
        id: data.id || `arena_${Date.now()}`,
        prompt: prompt.trim(),
        modelIds: selectedModelIds,
        responses: Array.isArray(data.responses) ? data.responses : [],
        createdAt: data.createdAt || Date.now(),
      };
      setActiveRun(run);
      onSaveArenaRun(run);
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Network error executing Arena'
      );
    } finally {
      setIsRunning(false);
    }
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const paneCount = activeRun?.responses.length || selectedModelIds.length;
  const gridColsClass =
    paneCount >= 4
      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
      : paneCount === 3
      ? 'grid-cols-1 lg:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2';

  return (
    <div
      data-testid="model-arena-view"
      className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#0b0d14] text-slate-900 dark:text-slate-100 overflow-hidden"
    >
      <header className="h-13 px-3 sm:px-5 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-[#0b0d14]/90 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Toggle navigation sidebar"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181c2b] transition cursor-pointer shrink-0"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onBackHome}
            aria-label="Back to Home Dashboard"
            className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181c2b] transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Swords className="w-4 h-4 text-violet-500 shrink-0" />
          <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white truncate">
            Model Arena
          </h1>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap shrink-0">
          {selectedModelIds.length} models selected
        </span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Arena Configuration & Prompt */}
          <form
            onSubmit={handleRunArena}
            className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Select 2 to 4 Models to Compare Side by Side
              </div>
              {selectedModelIds.length < 4 && (
                <button
                  type="button"
                  data-testid="arena-add-model-btn"
                  onClick={handleAddModel}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Slot</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {selectedModelIds.map((mId, idx) => (
                <div
                  key={`${idx}-${mId}`}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800"
                >
                  <select
                    aria-label={`Arena slot ${idx + 1} model`}
                    value={mId}
                    onChange={(e) => {
                      const next = [...selectedModelIds];
                      next[idx] = e.target.value;
                      setSelectedModelIds(next);
                    }}
                    className="flex-1 min-w-0 bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 px-2 py-1 focus:outline-hidden cursor-pointer truncate"
                  >
                    {catalogModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.providerLabel}
                        {zeroCostEnabled && !m.zeroCostAllowed
                          ? ' · Blocked'
                          : ''}
                        )
                      </option>
                    ))}
                  </select>
                  {selectedModelIds.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveModel(idx)}
                      aria-label={`Remove slot ${idx + 1}`}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {knowledgeDocs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Database className="w-3.5 h-3.5" />
                  <span>RAG Context:</span>
                </span>
                {knowledgeDocs.map((doc) => {
                  const active = selectedDocIds.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => toggleDoc(doc.id)}
                      className={`px-2.5 py-1 rounded-md border text-xs transition cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-violet-600/15 border-violet-500 text-violet-600 dark:text-violet-300 font-medium'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {doc.title}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <textarea
                data-testid="arena-prompt-input"
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a shared prompt to benchmark all selected models concurrently..."
                aria-label="Arena prompt"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-violet-500 resize-none"
              />
              <button
                type="submit"
                data-testid="arena-run-btn"
                disabled={isRunning || !prompt.trim() || selectedModelIds.length < 2}
                className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-45 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isRunning ? 'Running Arena...' : 'Run Arena'}</span>
              </button>
            </div>

            {errorBanner && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorBanner}</span>
              </div>
            )}
          </form>

          {/* Active Comparison Results */}
          {activeRun && (
            <section className="space-y-3" data-testid="arena-results-grid">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  Prompt: &ldquo;{activeRun.prompt}&rdquo;
                </h2>
                {activeRun.winnerModelId && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Winner:{' '}
                      {activeRun.responses.find(
                        (r) => r.modelId === activeRun.winnerModelId
                      )?.modelName || activeRun.winnerModelId}
                    </span>
                  </span>
                )}
              </div>

              <div className={`grid ${gridColsClass} gap-4`}>
                {activeRun.responses.map((resp, idx) => {
                  const isWinner = activeRun.winnerModelId === resp.modelId;
                  return (
                    <div
                      key={`${resp.modelId}-${idx}`}
                      data-testid={`arena-pane-${resp.modelId}`}
                      className={`p-4 rounded-xl bg-white dark:bg-[#111420] border flex flex-col justify-between gap-4 ${
                        isWinner
                          ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'border-slate-200 dark:border-slate-800/80'
                      }`}
                    >
                      <div className="space-y-3 min-w-0">
                        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800/80">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ModelBrandAvatar
                              name={resp.modelName}
                              logoUrl={resp.logoPath}
                              provider={resp.providerId}
                              modelId={resp.modelId}
                              sizeClass="w-7 h-7 rounded-lg"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {resp.modelName}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 inline" />
                                  {resp.latencyMs}ms
                                </span>
                                {typeof resp.outputTokens === 'number' && (
                                  <span>
                                    {' '}
                                    · {resp.inputTokens || 0} in /{' '}
                                    {resp.outputTokens} out tok
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {resp.error ? (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            {resp.error}
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed break-words">
                            <MarkdownContent content={resp.content} />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-end">
                        <button
                          type="button"
                          disabled={Boolean(resp.error)}
                          onClick={() => {
                            const updated = {
                              ...activeRun,
                              winnerModelId: resp.modelId,
                            };
                            setActiveRun(updated);
                            onSelectArenaWinner(activeRun.id, resp.modelId);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 whitespace-nowrap ${
                            isWinner
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-[#181c2b] hover:bg-slate-200 dark:hover:bg-[#1f2437] text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <Trophy className="w-3.5 h-3.5 shrink-0" />
                          <span>{isWinner ? 'Selected Winner' : 'Pick Winner'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Saved Arena History */}
          {arenaHistory.length > 0 && (
            <section className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <History className="w-4 h-4 text-slate-500" />
                <span>Saved Arena Runs</span>
              </div>
              <div className="rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-200/80 dark:divide-slate-800/80">
                {arenaHistory.slice(0, 10).map((run) => (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => setActiveRun(run)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-[#181c2b] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {run.prompt}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5 truncate">
                        {run.modelIds.join(' vs ')} ·{' '}
                        {new Date(run.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {run.winnerModelId && (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                        Winner: {run.winnerModelId}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};
