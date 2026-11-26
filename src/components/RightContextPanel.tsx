import React from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  Bot,
  Check,
  Database,
  ExternalLink,
  PanelRightClose,
  Settings,
  Swords,
  X,
} from 'lucide-react';
import type {
  AssistantPersona,
  CatalogModelEntry,
  KnowledgeDocSummary,
  ProviderConnectionStatusMap,
} from '../types/luxo';
import { formatTokenCount } from '../utils/tokenLimitsEngine';
import { ModelBrandAvatar } from './LuxoLogo';

interface RightContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelId: string;
  catalogModels: CatalogModelEntry[];
  providerStatus: ProviderConnectionStatusMap;
  zeroCostEnabled: boolean;
  activeAssistant: AssistantPersona | null;
  assistants: AssistantPersona[];
  onSelectAssistant: (assistantId: string | null) => void;
  knowledgeDocs: KnowledgeDocSummary[];
  attachedKnowledgeDocIds: string[];
  onToggleKnowledgeDoc: (docId: string) => void;
  sessionTokens: number;
  todayTokens: number;
  dailyLimitTokens: number;
  onOpenModels: () => void;
  onOpenArena: () => void;
  onOpenKnowledge: () => void;
  onOpenSettings: () => void;
}

function pricingLabelText(status?: string): string {
  switch (status) {
    case 'FREE':
      return 'Free';
    case 'FREE_TIER':
      return 'Free Tier';
    case 'PAID':
      return 'Paid';
    case 'REQUIRES_CREDITS':
      return 'Credits Required';
    case 'UNAVAILABLE':
      return 'Unavailable';
    default:
      return 'Unknown Pricing';
  }
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({
  isOpen,
  onClose,
  activeModelId,
  catalogModels,
  providerStatus,
  zeroCostEnabled,
  activeAssistant,
  assistants,
  onSelectAssistant,
  knowledgeDocs,
  attachedKnowledgeDocIds,
  onToggleKnowledgeDoc,
  sessionTokens,
  todayTokens,
  dailyLimitTokens,
  onOpenModels,
  onOpenArena,
  onOpenKnowledge,
  onOpenSettings,
}) => {
  const modelEntry =
    catalogModels.find((m) => m.id === activeModelId) || catalogModels[0];

  const isProviderConnected = modelEntry
    ? Boolean(providerStatus[modelEntry.providerId])
    : false;
  const usagePct =
    dailyLimitTokens > 0
      ? Math.min(100, Math.round((todayTokens / dailyLimitTokens) * 100))
      : 0;

  const panelBody = (
    <div className="flex flex-col h-full bg-white dark:bg-[#111420] text-slate-900 dark:text-slate-100">
      <div className="h-13 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 shrink-0">
        <span className="text-xs font-semibold tracking-tight text-slate-900 dark:text-white">
          Model &amp; Context
        </span>
        <button
          type="button"
          data-testid="right-context-close-btn"
          onClick={onClose}
          aria-label="Close context panel"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181c2b] transition cursor-pointer"
        >
          <PanelRightClose className="w-4 h-4 hidden lg:block" />
          <X className="w-4 h-4 lg:hidden" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {modelEntry && (
          <section className="space-y-3">
            <div className="flex items-start gap-3">
              <ModelBrandAvatar
                name={modelEntry.name}
                logoUrl={modelEntry.logoPath}
                provider={modelEntry.providerId}
                modelId={modelEntry.id}
                accentColor={modelEntry.accentColor}
                sizeClass="w-10 h-10 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {modelEntry.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {modelEntry.providerLabel} ·{' '}
                  <span
                    className={
                      isProviderConnected
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-amber-600 dark:text-amber-400 font-medium'
                    }
                  >
                    {isProviderConnected ? 'Connected' : 'API Not Configured'}
                  </span>
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {modelEntry.description}
            </p>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
              <div>
                <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pricing
                </dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                  {pricingLabelText(modelEntry.pricingStatus)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                  Policy
                </dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                  {zeroCostEnabled
                    ? modelEntry.zeroCostAllowed
                      ? 'Zero-Cost OK'
                      : 'Blocked'
                    : 'Standard'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                  Context Window
                </dt>
                <dd className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                  {formatTokenCount(modelEntry.contextLength)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                  Max Output
                </dt>
                <dd className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                  {formatTokenCount(modelEntry.maxOutputTokens)}
                </dd>
              </div>
            </dl>

            {modelEntry.capabilities.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Capabilities
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {modelEntry.capabilities.join(' · ')}
                </p>
              </div>
            )}
          </section>
        )}

        <section className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="right-panel-assistant-select"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <Bot className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span>Active Assistant</span>
            </label>
          </div>
          <select
            id="right-panel-assistant-select"
            data-testid="right-panel-assistant-select"
            value={activeAssistant?.id || ''}
            onChange={(e) => onSelectAssistant(e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-violet-500 cursor-pointer"
          >
            <option value="">Default Workspace Assistant</option>
            {assistants.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.role})
              </option>
            ))}
          </select>
          {activeAssistant && (
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {activeAssistant.description}
            </p>
          )}
        </section>

        <section className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
              <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Knowledge Context</span>
            </span>
            <button
              type="button"
              onClick={onOpenKnowledge}
              className="text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              Manage
            </button>
          </div>
          {knowledgeDocs.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No indexed documents yet. Upload files in Knowledge Base to ground replies.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {knowledgeDocs.map((doc) => {
                const attached = attachedKnowledgeDocIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => onToggleKnowledgeDoc(doc.id)}
                    className={`w-full px-2.5 py-2 rounded-lg border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                      attached
                        ? 'bg-violet-600/10 border-violet-500/40 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-[#181c2b] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium truncate">
                        {doc.title}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                        {doc.chunkCount} chunks · {doc.fileName}
                      </span>
                    </span>
                    {attached && (
                      <Check className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {(sessionTokens > 0 || todayTokens > 0) && (
          <section className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              Recorded Usage
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  This session
                </span>
                <span className="font-mono font-medium tabular-nums">
                  {sessionTokens.toLocaleString()} tok
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400 truncate min-w-0">
                  Today ({modelEntry?.name || 'Model'})
                </span>
                <span className="font-mono font-medium tabular-nums whitespace-nowrap shrink-0">
                  {todayTokens.toLocaleString()} / {formatTokenCount(dailyLimitTokens)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#181c2b] overflow-hidden">
                <div
                  className="h-full bg-violet-600 transition-all"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>
          </section>
        )}

        <section className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
          <div className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
            Quick Actions
          </div>
          <button
            type="button"
            onClick={onOpenModels}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center justify-between transition cursor-pointer whitespace-nowrap"
          >
            <span className="flex items-center gap-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Explore All Models</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
          <button
            type="button"
            onClick={onOpenArena}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center justify-between transition cursor-pointer whitespace-nowrap"
          >
            <span className="flex items-center gap-2">
              <Swords className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Compare in Model Arena</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
          <button
            type="button"
            onClick={onOpenKnowledge}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center justify-between transition cursor-pointer whitespace-nowrap"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Open Knowledge Base</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center justify-between transition cursor-pointer whitespace-nowrap"
          >
            <span className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Workspace Settings</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </section>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        data-testid="right-context-panel"
        aria-label="Model and workspace context panel"
        className={`fixed lg:static top-0 right-0 bottom-0 h-[100dvh] lg:h-full z-50 lg:z-20 border-l border-slate-200 dark:border-slate-800/80 overflow-hidden transition-all duration-200 ease-out shrink-0 ${
          isOpen
            ? 'translate-x-0 w-[300px] max-w-[88vw] visible'
            : 'translate-x-full invisible pointer-events-none w-[300px] lg:w-0 lg:border-l-0'
        }`}
      >
        {panelBody}
      </aside>
    </>
  );
};
