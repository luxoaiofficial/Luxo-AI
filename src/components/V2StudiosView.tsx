import React, { useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  Database,
  FileText,
  FolderKanban,
  Layers,
  MessageSquare,
  PanelLeft,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  Workflow,
} from 'lucide-react';
import type {
  AppView,
  AssistantPersona,
  CatalogModelEntry,
  KnowledgeDocSummary,
  LuxoProject,
  PromptTemplateRecord,
  WorkflowDefinition,
  WorkflowStepDef,
} from '../types/luxo';
import { MarkdownContent } from './LuxoLogo';

interface V2StudiosViewProps {
  activeSection: 'assistants' | 'knowledge' | 'prompts' | 'workflows';
  onSwitchSection: (section: AppView) => void;
  onOpenSidebar: () => void;
  onBackHome: () => void;
  catalogModels: CatalogModelEntry[];
  // Assistants
  assistants: AssistantPersona[];
  onCreateAssistant: (assistant: Omit<AssistantPersona, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteAssistant: (id: string) => void;
  onLaunchAssistantInChat: (assistant: AssistantPersona) => void;
  // Projects & Knowledge
  projects: LuxoProject[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onCreateProject: (proj: Omit<LuxoProject, 'id' | 'updatedAt' | 'filesCount'>) => void;
  knowledgeDocs: KnowledgeDocSummary[];
  attachedKnowledgeDocIds: string[];
  onToggleAttachKnowledgeDoc: (docId: string) => void;
  onRefreshKnowledgeDocs: () => Promise<void>;
  // Prompts
  prompts: PromptTemplateRecord[];
  onCreatePrompt: (prompt: Omit<PromptTemplateRecord, 'id' | 'createdAt' | 'usageCount'>) => void;
  onToggleFavoritePrompt: (id: string) => void;
  onDeletePrompt: (id: string) => void;
  onLaunchPromptInChat: (prompt: PromptTemplateRecord) => void;
  // Workflows
  workflows: WorkflowDefinition[];
  onCreateWorkflow: (wf: Omit<WorkflowDefinition, 'id' | 'createdAt'>) => void;
  onSaveWorkflowResult: (wfId: string, output: string) => void;
  onSendWorkflowOutputToChat: (title: string, output: string) => void;
}

export const V2StudiosView: React.FC<V2StudiosViewProps> = ({
  activeSection,
  onSwitchSection,
  onOpenSidebar,
  onBackHome,
  catalogModels,
  assistants,
  onCreateAssistant,
  onDeleteAssistant,
  onLaunchAssistantInChat,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  knowledgeDocs,
  attachedKnowledgeDocIds,
  onToggleAttachKnowledgeDoc,
  onRefreshKnowledgeDocs,
  prompts,
  onCreatePrompt,
  onToggleFavoritePrompt,
  onDeletePrompt,
  onLaunchPromptInChat,
  workflows,
  onCreateWorkflow,
  onSaveWorkflowResult,
  onSendWorkflowOutputToChat,
}) => {
  // Assistants state
  const [astName, setAstName] = useState('');
  const [astRole, setAstRole] = useState('');
  const [astDesc, setAstDesc] = useState('');
  const [astPrompt, setAstPrompt] = useState('');
  const [astModelId, setAstModelId] = useState(
    catalogModels.find((m) => m.executable && m.zeroCostAllowed)?.id ||
      'gemini-2.5-flash'
  );
  const [astTemp, setAstTemp] = useState(0.6);

  // Knowledge & Projects state
  const [projName, setProjName] = useState('');
  const [projCategory, setProjCategory] =
    useState<LuxoProject['category']>('Yazılım');
  const [projDesc, setProjDesc] = useState('');
  const [projSystemPrompt, setProjSystemPrompt] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docStatusMsg, setDocStatusMsg] = useState<string | null>(null);
  const [ragSearchQuery, setRagSearchQuery] = useState('');
  const [ragResults, setRagResults] = useState<
    { docTitle: string; content: string; score: number }[]
  >([]);

  // Prompts state
  const [promptSearch, setPromptSearch] = useState('');
  const [promptCat, setPromptCat] = useState<string>('All');
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptCategory, setNewPromptCategory] =
    useState<PromptTemplateRecord['category']>('Coding');
  const [newPromptDesc, setNewPromptDesc] = useState('');
  const [newPromptBody, setNewPromptBody] = useState('');

  // Workflows state
  const [selectedWfId, setSelectedWfId] = useState<string>(
    workflows[0]?.id || ''
  );
  const [wfInput, setWfInput] = useState('');
  const [wfRunning, setWfRunning] = useState(false);
  const [wfStepOutputs, setWfStepOutputs] = useState<
    { stepTitle: string; modelId: string; output: string; error?: string }[]
  >([]);
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');
  const [newWfStep1, setNewWfStep1] = useState('');
  const [newWfStep2, setNewWfStep2] = useState('');

  const readyModels = catalogModels.filter((m) => m.executable);

  const handleFileUpload = async (file: File) => {
    setIsUploadingDoc(true);
    setDocStatusMsg(null);
    try {
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');
      let payload: Record<string, unknown>;
      if (isPdf) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        payload = {
          title: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name,
          mimeType: 'application/pdf',
          contentBase64: btoa(binary),
          projectId: activeProjectId || undefined,
        };
      } else {
        const text = await file.text();
        payload = {
          title: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name,
          mimeType: file.type || 'text/plain',
          rawText: text,
          projectId: activeProjectId || undefined,
        };
      }

      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setDocStatusMsg(data?.error || 'Failed to index document.');
        return;
      }
      setDocStatusMsg(
        `Indexed "${data.doc?.title || file.name}" (${data.doc?.chunkCount || 1} chunks).`
      );
      await onRefreshKnowledgeDocs();
    } catch (err) {
      setDocStatusMsg(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handlePasteDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;
    setIsUploadingDoc(true);
    setDocStatusMsg(null);
    try {
      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle.trim(),
          fileName: `${docTitle.trim().toLowerCase().replace(/\s+/g, '-')}.md`,
          mimeType: 'text/markdown',
          rawText: docContent.trim(),
          projectId: activeProjectId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDocStatusMsg(data?.error || 'Indexing error.');
        return;
      }
      setDocTitle('');
      setDocContent('');
      setDocStatusMsg(
        `Indexed "${data.doc?.title}" (${data.doc?.chunkCount || 1} chunks).`
      );
      await onRefreshKnowledgeDocs();
    } catch {
      setDocStatusMsg('Failed to upload document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSearchRag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragSearchQuery.trim()) return;
    try {
      const res = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryText: ragSearchQuery.trim(), topK: 4 }),
      });
      const data = await res.json();
      const rawResults = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.matches)
          ? data.matches
          : [];
      if (res.ok) {
        setRagResults(
          rawResults.map((r: { docTitle?: string; text?: string; content?: string; score?: number }) => ({
            docTitle: String(r.docTitle || ''),
            content: String(r.text || r.content || ''),
            score: Number(r.score || 0),
          }))
        );
      }
    } catch {
      setRagResults([]);
    }
  };

  const handleDeleteKnowledgeDoc = async (docId: string) => {
    await fetch(`/api/knowledge/docs/${encodeURIComponent(docId)}`, {
      method: 'DELETE',
    }).catch(() => {});
    await onRefreshKnowledgeDocs();
  };

  const activeWorkflow =
    workflows.find((w) => w.id === selectedWfId) || workflows[0] || null;

  const handleRunWorkflow = async () => {
    if (!activeWorkflow || !wfInput.trim() || wfRunning) return;
    setWfRunning(true);
    setWfStepOutputs([]);
    let prevOutput = '';
    const outputs: {
      stepTitle: string;
      modelId: string;
      output: string;
      error?: string;
    }[] = [];

    for (const step of activeWorkflow.steps) {
      const stepPrompt =
        step.usePreviousOutput && prevOutput
          ? `${step.instruction}\n\nInput Context:\n${wfInput}\n\nPrevious Step Output:\n${prevOutput}`
          : `${step.instruction}\n\nInput:\n${wfInput}`;
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: stepPrompt }],
            modelId: step.modelId,
            stream: false,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          outputs.push({
            stepTitle: step.title,
            modelId: step.modelId,
            output: '',
            error: data?.error || `HTTP ${res.status}`,
          });
          setWfStepOutputs([...outputs]);
          break;
        }
        const reply = String(data.text || '').trim();
        prevOutput = reply;
        outputs.push({
          stepTitle: step.title,
          modelId: step.modelId,
          output: reply,
        });
        setWfStepOutputs([...outputs]);
      } catch (err) {
        outputs.push({
          stepTitle: step.title,
          modelId: step.modelId,
          output: '',
          error: err instanceof Error ? err.message : 'Execution error',
        });
        setWfStepOutputs([...outputs]);
        break;
      }
    }

    if (prevOutput) {
      onSaveWorkflowResult(activeWorkflow.id, prevOutput);
    }
    setWfRunning(false);
  };

  const sectionTabs: {
    id: 'assistants' | 'knowledge' | 'prompts' | 'workflows';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'assistants', label: 'AI Assistants', icon: Bot },
    { id: 'knowledge', label: 'Knowledge & Projects', icon: Database },
    { id: 'prompts', label: 'Prompt Library', icon: Layers },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
  ];

  return (
    <div
      data-testid={`studio-${activeSection}-view`}
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
            aria-label="Back to Home"
            className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181c2b] transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {sectionTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSwitchSection(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181c2b]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* AI ASSISTANTS */}
          {activeSection === 'assistants' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  AI Assistants
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assistants.map((ast) => (
                    <div
                      key={ast.id}
                      className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                              {ast.name}
                            </h2>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {ast.role} · {ast.category}
                            </div>
                          </div>
                          {!ast.isFeatured && (
                            <button
                              type="button"
                              onClick={() => onDeleteAssistant(ast.id)}
                              aria-label={`Delete ${ast.name}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {ast.description}
                        </p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          Model: {ast.defaultModelId} · Temp: {ast.temperature}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onLaunchAssistantInChat(ast)}
                        className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat with {ast.name}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!astName.trim() || !astPrompt.trim()) return;
                  onCreateAssistant({
                    name: astName.trim(),
                    role: astRole.trim() || 'Specialist',
                    description:
                      astDesc.trim() || 'Custom workspace assistant persona',
                    systemPrompt: astPrompt.trim(),
                    defaultModelId: astModelId,
                    temperature: astTemp,
                    capabilities: ['Reasoning', 'Analysis'],
                    knowledgeDocIds: [],
                    category: 'Custom',
                  });
                  setAstName('');
                  setAstRole('');
                  setAstDesc('');
                  setAstPrompt('');
                }}
                className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3 h-fit"
              >
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Create Custom Assistant
                </h2>
                <input
                  type="text"
                  required
                  value={astName}
                  onChange={(e) => setAstName(e.target.value)}
                  placeholder="Assistant Name"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <input
                  type="text"
                  value={astRole}
                  onChange={(e) => setAstRole(e.target.value)}
                  placeholder="Role (e.g. Security Auditor)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <input
                  type="text"
                  value={astDesc}
                  onChange={(e) => setAstDesc(e.target.value)}
                  placeholder="Short description"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <select
                  value={astModelId}
                  onChange={(e) => setAstModelId(e.target.value)}
                  aria-label="Assistant default model"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs cursor-pointer"
                >
                  {(readyModels.length > 0 ? readyModels : catalogModels).map(
                    (m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    )
                  )}
                </select>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>Temperature</span>
                    <span>{astTemp.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={astTemp}
                    onChange={(e) => setAstTemp(Number(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer"
                  />
                </div>
                <textarea
                  required
                  rows={4}
                  value={astPrompt}
                  onChange={(e) => setAstPrompt(e.target.value)}
                  placeholder="System instructions..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <button
                  type="submit"
                  className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Assistant</span>
                </button>
              </form>
            </div>
          )}

          {/* KNOWLEDGE BASE & PROJECTS */}
          {activeSection === 'knowledge' && (
            <div className="space-y-8">
              {/* Knowledge Base RAG */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Knowledge Base (RAG)
                      </h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Upload TXT, Markdown, or PDF files. Chunks are indexed for grounded answers with citations.
                      </p>
                    </div>
                    <label className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingDoc ? 'Indexing...' : 'Upload File'}</span>
                      <input
                        data-testid="knowledge-file-input"
                        type="file"
                        accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleFileUpload(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {docStatusMsg && (
                    <div
                      data-testid="knowledge-status-msg"
                      className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300"
                    >
                      {docStatusMsg}
                    </div>
                  )}

                  {/* Semantic Search Tester */}
                  <form
                    onSubmit={handleSearchRag}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        data-testid="knowledge-search-input"
                        value={ragSearchQuery}
                        onChange={(e) => setRagSearchQuery(e.target.value)}
                        placeholder="Search indexed document chunks..."
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      data-testid="knowledge-search-btn"
                      className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111420] hover:bg-slate-50 dark:hover:bg-[#181c2b] text-xs font-medium cursor-pointer whitespace-nowrap"
                    >
                      Search RAG
                    </button>
                  </form>

                  {ragResults.length > 0 && (
                    <div
                      data-testid="knowledge-search-results"
                      className="p-3.5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-2.5"
                    >
                      <div className="text-xs font-semibold">
                        Top Semantic Matches
                      </div>
                      {ragResults.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#181c2b] text-xs space-y-1"
                        >
                          <div className="font-semibold flex items-center justify-between">
                            <span>{m.docTitle}</span>
                            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                              score {m.score.toFixed(3)}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {m.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Indexed Docs List */}
                  <div className="rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-200/80 dark:divide-slate-800/80">
                    {knowledgeDocs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                        No documents indexed yet. Upload a .txt, .md, or .pdf file or paste notes on the right.
                      </div>
                    ) : (
                      knowledgeDocs.map((doc) => {
                        const attached = attachedKnowledgeDocIds.includes(doc.id);
                        return (
                          <div
                            key={doc.id}
                            data-testid={`knowledge-doc-${doc.id}`}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-violet-500 shrink-0" />
                                <span className="text-xs font-semibold truncate">
                                  {doc.title}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                                {doc.fileName} · {doc.chunkCount} chunks ·{' '}
                                {doc.embeddingMode}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {doc.previewText}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => onToggleAttachKnowledgeDoc(doc.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                                  attached
                                    ? 'bg-violet-600 text-white'
                                    : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437]'
                                }`}
                              >
                                {attached && <Check className="w-3.5 h-3.5" />}
                                <span>{attached ? 'Attached to Chat' : 'Attach'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteKnowledgeDoc(doc.id)}
                                aria-label={`Delete ${doc.title}`}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Paste Text Doc Form */}
                <form
                  onSubmit={handlePasteDocSubmit}
                  className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3 h-fit"
                >
                  <h2 className="text-sm font-semibold">
                    Index Text or Markdown Note
                  </h2>
                  <input
                    type="text"
                    required
                    data-testid="knowledge-paste-title"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Document Title"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                  />
                  <textarea
                    required
                    rows={6}
                    data-testid="knowledge-paste-content"
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Paste documentation, specs, or reference text..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                  />
                  <button
                    type="submit"
                    data-testid="knowledge-paste-submit"
                    disabled={isUploadingDoc}
                    className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                  >
                    Index Document
                  </button>
                </form>
              </section>

              {/* Projects */}
              <section className="pt-6 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-blue-500" />
                    <span>Projects</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {projects.map((proj) => {
                      const active = activeProjectId === proj.id;
                      return (
                        <div
                          key={proj.id}
                          className={`p-4 rounded-xl bg-white dark:bg-[#111420] border space-y-2 ${
                            active
                              ? 'border-violet-500 ring-1 ring-violet-500/30'
                              : 'border-slate-200 dark:border-slate-800/80'
                          }`}
                        >
                          <div className="text-sm font-semibold">{proj.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {proj.category} · {proj.filesCount} items
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {proj.description}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              onSelectProject(active ? null : proj.id)
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              active
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-100 dark:bg-[#181c2b] text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            {active ? 'Active Context' : 'Set as Active Project'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!projName.trim()) return;
                    onCreateProject({
                      name: projName.trim(),
                      category: projCategory,
                      description:
                        projDesc.trim() || 'Workspace project context',
                      systemPrompt:
                        projSystemPrompt.trim() ||
                        `You are assisting on project "${projName.trim()}".`,
                      color: '#7c3aed',
                    });
                    setProjName('');
                    setProjDesc('');
                    setProjSystemPrompt('');
                  }}
                  className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3 h-fit"
                >
                  <h3 className="text-sm font-semibold">New Project</h3>
                  <input
                    type="text"
                    required
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    placeholder="Project name"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                  />
                  <select
                    value={projCategory}
                    onChange={(e) =>
                      setProjCategory(e.target.value as LuxoProject['category'])
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <option value="Yazılım">Engineering</option>
                    <option value="Araştırma">Research</option>
                    <option value="Tasarım">Design</option>
                    <option value="İş & Strateji">Strategy</option>
                  </select>
                  <input
                    type="text"
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                  />
                  <textarea
                    rows={3}
                    value={projSystemPrompt}
                    onChange={(e) => setProjSystemPrompt(e.target.value)}
                    placeholder="Project system instructions..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Create Project
                  </button>
                </form>
              </section>
            </div>
          )}

          {/* PROMPT LIBRARY */}
          {activeSection === 'prompts' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1 className="text-lg font-semibold">Prompt Library</h1>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promptSearch}
                      onChange={(e) => setPromptSearch(e.target.value)}
                      placeholder="Search prompts..."
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800 text-xs"
                    />
                    <select
                      value={promptCat}
                      onChange={(e) => setPromptCat(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800 text-xs cursor-pointer"
                    >
                      {['All', 'Coding', 'Writing', 'Research', 'Analysis', 'Design', 'General'].map(
                        (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {prompts
                    .filter(
                      (p) =>
                        (promptCat === 'All' || p.category === promptCat) &&
                        (!promptSearch.trim() ||
                          p.title
                            .toLowerCase()
                            .includes(promptSearch.toLowerCase()) ||
                          p.content
                            .toLowerCase()
                            .includes(promptSearch.toLowerCase()))
                    )
                    .map((pr) => (
                      <div
                        key={pr.id}
                        className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold">
                                {pr.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {pr.category} · Used {pr.usageCount}×
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onToggleFavoritePrompt(pr.id)}
                                aria-label={`Favorite ${pr.title}`}
                                className={`p-1 rounded-md cursor-pointer ${
                                  pr.isFavorite
                                    ? 'text-amber-500'
                                    : 'text-slate-400'
                                }`}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    pr.isFavorite ? 'fill-current' : ''
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeletePrompt(pr.id)}
                                aria-label={`Delete ${pr.title}`}
                                className="p-1 rounded-md text-slate-400 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                            {pr.content}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onLaunchPromptInChat(pr)}
                          className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                        >
                          Use Prompt in Chat
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newPromptTitle.trim() || !newPromptBody.trim()) return;
                  onCreatePrompt({
                    title: newPromptTitle.trim(),
                    category: newPromptCategory,
                    description:
                      newPromptDesc.trim() || 'Reusable prompt template',
                    content: newPromptBody.trim(),
                  });
                  setNewPromptTitle('');
                  setNewPromptDesc('');
                  setNewPromptBody('');
                }}
                className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3 h-fit"
              >
                <h2 className="text-sm font-semibold">Save Prompt Template</h2>
                <input
                  type="text"
                  required
                  value={newPromptTitle}
                  onChange={(e) => setNewPromptTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <select
                  value={newPromptCategory}
                  onChange={(e) =>
                    setNewPromptCategory(
                      e.target.value as PromptTemplateRecord['category']
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                >
                  {['Coding', 'Writing', 'Research', 'Analysis', 'Design', 'General'].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
                <input
                  type="text"
                  value={newPromptDesc}
                  onChange={(e) => setNewPromptDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <textarea
                  required
                  rows={5}
                  value={newPromptBody}
                  onChange={(e) => setNewPromptBody(e.target.value)}
                  placeholder="Prompt content..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <button
                  type="submit"
                  className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Template
                </button>
              </form>
            </div>
          )}

          {/* WORKFLOWS */}
          {activeSection === 'workflows' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1 className="text-lg font-semibold">Multi-Step Workflows</h1>
                  <select
                    value={activeWorkflow?.id || ''}
                    onChange={(e) => setSelectedWfId(e.target.value)}
                    aria-label="Select workflow"
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800 text-xs cursor-pointer"
                  >
                    {workflows.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.steps.length} steps)
                      </option>
                    ))}
                  </select>
                </div>

                {activeWorkflow && (
                  <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-4">
                    <div>
                      <div className="text-sm font-semibold">
                        {activeWorkflow.name}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeWorkflow.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {activeWorkflow.steps.map((step, sIdx) => (
                        <div
                          key={step.id}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200/80 dark:border-slate-800 text-xs space-y-1"
                        >
                          <div className="font-semibold flex items-center justify-between">
                            <span>
                              Step {sIdx + 1}: {step.title}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {step.modelId}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">
                            {step.instruction}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                      <textarea
                        rows={3}
                        value={wfInput}
                        onChange={(e) => setWfInput(e.target.value)}
                        placeholder="Provide the input topic, code snippet, or brief for this workflow..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                      />
                      <button
                        type="button"
                        disabled={wfRunning || !wfInput.trim()}
                        onClick={() => void handleRunWorkflow()}
                        className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-45 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>
                          {wfRunning ? 'Executing Steps...' : 'Run Workflow'}
                        </span>
                      </button>
                    </div>

                    {wfStepOutputs.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                        {wfStepOutputs.map((out, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 space-y-2"
                          >
                            <div className="text-xs font-semibold flex items-center justify-between">
                              <span>{out.stepTitle}</span>
                              <span className="font-mono text-[11px] text-slate-500">
                                {out.modelId}
                              </span>
                            </div>
                            {out.error ? (
                              <div className="text-xs text-red-500">
                                {out.error}
                              </div>
                            ) : (
                              <MarkdownContent content={out.output} />
                            )}
                          </div>
                        ))}
                        {wfStepOutputs[wfStepOutputs.length - 1]?.output && (
                          <button
                            type="button"
                            onClick={() =>
                              onSendWorkflowOutputToChat(
                                activeWorkflow.name,
                                wfStepOutputs[wfStepOutputs.length - 1].output
                              )
                            }
                            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer"
                          >
                            Continue in Chat
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newWfName.trim() || !newWfStep1.trim()) return;
                  const defaultModel =
                    readyModels[0]?.id || 'gemini-2.5-flash';
                  const steps: WorkflowStepDef[] = [
                    {
                      id: `step_1_${Date.now()}`,
                      title: 'Analyze Input',
                      instruction: newWfStep1.trim(),
                      modelId: defaultModel,
                      usePreviousOutput: false,
                    },
                  ];
                  if (newWfStep2.trim()) {
                    steps.push({
                      id: `step_2_${Date.now()}`,
                      title: 'Refine & Synthesize',
                      instruction: newWfStep2.trim(),
                      modelId: defaultModel,
                      usePreviousOutput: true,
                    });
                  }
                  onCreateWorkflow({
                    name: newWfName.trim(),
                    description:
                      newWfDesc.trim() || 'Custom sequential AI workflow',
                    category: 'Custom',
                    steps,
                  });
                  setNewWfName('');
                  setNewWfDesc('');
                  setNewWfStep1('');
                  setNewWfStep2('');
                }}
                className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3 h-fit"
              >
                <h2 className="text-sm font-semibold">Create Workflow</h2>
                <input
                  type="text"
                  required
                  value={newWfName}
                  onChange={(e) => setNewWfName(e.target.value)}
                  placeholder="Workflow name"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <input
                  type="text"
                  value={newWfDesc}
                  onChange={(e) => setNewWfDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <textarea
                  required
                  rows={3}
                  value={newWfStep1}
                  onChange={(e) => setNewWfStep1(e.target.value)}
                  placeholder="Step 1 instruction..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <textarea
                  rows={3}
                  value={newWfStep2}
                  onChange={(e) => setNewWfStep2(e.target.value)}
                  placeholder="Step 2 instruction (chains Step 1 output, optional)..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                />
                <button
                  type="submit"
                  className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Workflow
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
