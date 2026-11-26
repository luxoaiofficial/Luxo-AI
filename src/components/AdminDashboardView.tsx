import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Check,
  Database,
  DollarSign,
  KeyRound,
  Layers,
  Lock,
  PanelLeft,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type {
  AdminAuditEntry,
  CatalogModelEntry,
  DiscoveredModelCandidate,
  DiscoveryRunLog,
  ModelPricingTierStatus,
  PlatformProviderConfig,
  ProviderAdapterKind,
} from '../types/luxo';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  getVerifiedAuthBearerHeaders,
  isBootstrappedAdminEmail,
} from '../firebase';
import { listAllLogoEntries } from '../utils/logoRegistry';
import { formatTokenCount } from '../utils/tokenLimitsEngine';
import { ModelBrandAvatar } from './LuxoLogo';

interface AdminDashboardViewProps {
  onOpenSidebar: () => void;
  onBackHome: () => void;
  onOpenAuthModal: () => void;
  onCatalogRefresh: () => Promise<void>;
}

type AdminTab =
  | 'overview'
  | 'users'
  | 'providers'
  | 'models'
  | 'discovery'
  | 'logos'
  | 'connections'
  | 'pricing'
  | 'usage'
  | 'security'
  | 'audit'
  | 'settings';

interface AdminOverviewResponse {
  ok: boolean;
  adminEmail: string;
  providers: PlatformProviderConfig[];
  catalog: CatalogModelEntry[];
  discovery: {
    candidates: DiscoveredModelCandidate[];
    logs: DiscoveryRunLog[];
    scheduleHours: number;
    lastRunAt: number;
  };
  zeroCostPolicy: {
    enabled: boolean;
    allowUnknownPricing: boolean;
    maxDailyFreeRequestsPerUser: number;
  };
  usageStats: {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    blockedZeroCostCount: number;
    perModelRequests: Record<string, number>;
  };
  knowledgeCount: number;
  auditLogs: AdminAuditEntry[];
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onOpenSidebar,
  onBackHome,
  onOpenAuthModal,
  onCatalogRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  // Add Provider form
  const [pName, setPName] = useState('');
  const [pAdapter, setPAdapter] =
    useState<ProviderAdapterKind>('openai-compatible');
  const [pBaseUrl, setPBaseUrl] = useState('');
  const [pSecretEnv, setPSecretEnv] = useState('');
  const [pLogoKey, setPLogoKey] = useState('openai');

  // Add Custom Model form
  const [mName, setMName] = useState('');
  const [mProviderId, setMProviderId] = useState('google');
  const [mUpstreamId, setMUpstreamId] = useState('');
  const [mPricing, setMPricing] = useState<ModelPricingTierStatus>('FREE');
  const [mContext, setMContext] = useState(128000);
  const [mMaxOutput, setMMaxOutput] = useState(8192);

  const logoEntries = listAllLogoEntries();

  const fbUser = auth.currentUser;
  const isSignedInAsAdmin =
    Boolean(fbUser?.emailVerified) && isBootstrappedAdminEmail(fbUser?.email);

  const loadAdminOverview = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const headers = await getVerifiedAuthBearerHeaders();
      if (!headers.Authorization) {
        setAuthError(
          `Admin access requires a verified Firebase session for ${BOOTSTRAPPED_ADMIN_EMAIL}.`
        );
        setOverview(null);
        return;
      }
      const res = await fetch('/api/admin/overview', { headers });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data?.error || `Access denied (HTTP ${res.status}).`);
        setOverview(null);
        return;
      }
      setOverview(data as AdminOverviewResponse);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Failed to load admin overview.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminOverview();
  }, [fbUser?.uid, fbUser?.emailVerified]);

  const callAdminApi = async (
    url: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: Record<string, unknown>,
    successMsg?: string
  ) => {
    setActionBanner(null);
    const headers = await getVerifiedAuthBearerHeaders();
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setActionBanner(data?.error || `Request failed (HTTP ${res.status}).`);
      return;
    }
    if (successMsg) setActionBanner(successMsg);
    await loadAdminOverview();
    await onCatalogRefresh();
  };

  const tabs: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'providers', label: 'Providers', icon: Server },
    { id: 'models', label: 'Models', icon: Layers },
    { id: 'discovery', label: 'AI Discovery', icon: Sparkles },
    { id: 'logos', label: 'Logos', icon: Database },
    { id: 'connections', label: 'API Connections', icon: KeyRound },
    { id: 'pricing', label: 'Zero Cost Mode', icon: DollarSign },
    { id: 'usage', label: 'Usage Statistics', icon: Activity },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'audit', label: 'Audit Logs', icon: Shield },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div
      data-testid="admin-dashboard-view"
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
          <Shield className="w-4 h-4 text-violet-500 shrink-0" />
          <h1 className="text-sm font-semibold tracking-tight truncate">
            Admin Control Center
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void loadAdminOverview()}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111420] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {!isSignedInAsAdmin || authError ? (
            <div
              data-testid="admin-auth-gate"
              className="max-w-lg mx-auto p-6 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 text-center space-y-4"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold">
                  Verified Admin Authentication Required
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {authError ||
                    `Sign in with the verified admin account (${BOOTSTRAPPED_ADMIN_EMAIL}) to manage providers, models, AI discovery, Zero Cost Mode, and audit logs.`}
                </p>
              </div>
              <button
                type="button"
                data-testid="admin-signin-btn"
                onClick={onOpenAuthModal}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
              >
                Sign In with Admin Account
              </button>
            </div>
          ) : loading && !overview ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading verified admin telemetry...
            </div>
          ) : overview ? (
            <div className="space-y-6">
              {/* Sub-navigation */}
              <nav className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-violet-600 text-white'
                          : 'bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {actionBanner && (
                <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 text-xs text-violet-700 dark:text-violet-300">
                  {actionBanner}
                </div>
              )}

              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Connected Providers
                    </div>
                    <div className="text-2xl font-semibold tabular-nums mt-1">
                      {overview.providers.filter((p) => p.connected).length} /{' '}
                      {overview.providers.length}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Catalog Models
                    </div>
                    <div className="text-2xl font-semibold tabular-nums mt-1">
                      {overview.catalog.filter((m) => m.executable).length} /{' '}
                      {overview.catalog.length}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Pending Discovery
                    </div>
                    <div className="text-2xl font-semibold tabular-nums mt-1">
                      {
                        overview.discovery.candidates.filter(
                          (c) => c.status === 'pending'
                        ).length
                      }
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Zero Cost Blocked
                    </div>
                    <div className="text-2xl font-semibold tabular-nums mt-1">
                      {overview.usageStats.blockedZeroCostCount}
                    </div>
                  </div>
                </div>
              )}

              {/* USERS */}
              {activeTab === 'users' && (
                <div className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <h2 className="text-sm font-semibold">
                    Verified Admin &amp; Access Policy
                  </h2>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div>
                      Bootstrapped Admin: <span className="font-mono">{BOOTSTRAPPED_ADMIN_EMAIL}</span>
                    </div>
                    <div>
                      Current Authenticated Admin:{' '}
                      <span className="font-mono">{overview.adminEmail}</span>
                    </div>
                    <div>
                      Role Enforcement: Server Firebase RS256 ID Token + Firestore Security Rules (`isVerifiedAdmin()`)
                    </div>
                  </div>
                </div>
              )}

              {/* PROVIDERS */}
              {activeTab === 'providers' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-200/80 dark:divide-slate-800/80">
                    {overview.providers.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ModelBrandAvatar
                            name={p.name}
                            provider={p.id}
                            logoKey={p.logoKey}
                            accentColor={p.accentColor}
                            sizeClass="w-8 h-8 rounded-lg"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">
                              {p.name} ·{' '}
                              <span className="font-normal text-slate-500">
                                {p.adapter}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                              env: {p.secretEnvName} · {p.baseUrl}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-medium ${
                              p.connected
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {p.connected ? 'Connected' : 'Missing Key'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void callAdminApi(
                                '/api/admin/providers/test-connection',
                                'POST',
                                { providerId: p.id },
                                `Tested ${p.name} connection.`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs cursor-pointer"
                          >
                            Test
                          </button>
                          {!p.isBuiltin && (
                            <button
                              type="button"
                              onClick={() =>
                                void callAdminApi(
                                  `/api/admin/providers/${encodeURIComponent(p.id)}`,
                                  'DELETE',
                                  undefined,
                                  `Deleted provider ${p.name}`
                                )
                              }
                              aria-label={`Delete ${p.name}`}
                              className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void callAdminApi(
                        '/api/admin/providers',
                        'POST',
                        {
                          name: pName.trim(),
                          adapter: pAdapter,
                          baseUrl: pBaseUrl.trim(),
                          secretEnvName: pSecretEnv.trim().toUpperCase(),
                          logoKey: pLogoKey,
                        },
                        'Provider saved securely using server env var reference.'
                      );
                      setPName('');
                      setPBaseUrl('');
                      setPSecretEnv('');
                    }}
                    className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3 h-fit"
                  >
                    <h2 className="text-sm font-semibold">
                      Add SSRF-Validated Provider
                    </h2>
                    <input
                      type="text"
                      required
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="Provider Name"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                    />
                    <select
                      value={pAdapter}
                      onChange={(e) =>
                        setPAdapter(e.target.value as ProviderAdapterKind)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <option value="openai-compatible">
                        OpenAI Compatible
                      </option>
                      <option value="anthropic-compatible">
                        Anthropic Compatible
                      </option>
                      <option value="gemini">Google Gemini</option>
                    </select>
                    <input
                      type="url"
                      required
                      value={pBaseUrl}
                      onChange={(e) => setPBaseUrl(e.target.value)}
                      placeholder="https://api.example.com/v1"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={pSecretEnv}
                      onChange={(e) => setPSecretEnv(e.target.value)}
                      placeholder="Server Env Var (e.g. CUSTOM_AI_API_KEY)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs font-mono"
                    />
                    <select
                      value={pLogoKey}
                      onChange={(e) => setPLogoKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      {logoEntries.map((l) => (
                        <option key={l.key} value={l.key}>
                          Logo: {l.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Provider
                    </button>
                  </form>
                </div>
              )}

              {/* MODELS */}
              {activeTab === 'models' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-200/80 dark:divide-slate-800/80 max-h-[640px] overflow-y-auto">
                    {overview.catalog.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ModelBrandAvatar
                            name={m.name}
                            logoUrl={m.logoPath}
                            provider={m.providerId}
                            modelId={m.id}
                            sizeClass="w-7 h-7 rounded-lg"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">
                              {m.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                              {m.providerLabel} · {m.pricingStatus} ·{' '}
                              {formatTokenCount(m.contextLength)} ctx
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              void callAdminApi(
                                `/api/admin/models/${encodeURIComponent(m.id)}`,
                                'PATCH',
                                { enabled: !m.enabled },
                                `${m.name} ${m.enabled ? 'disabled' : 'enabled'}.`
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                              m.enabled
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-200 dark:bg-[#181c2b] text-slate-500'
                            }`}
                          >
                            {m.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                          {(m.isCustom || m.isDiscovered) && (
                            <button
                              type="button"
                              onClick={() =>
                                void callAdminApi(
                                  `/api/admin/models/${encodeURIComponent(m.id)}`,
                                  'DELETE',
                                  undefined,
                                  `Removed ${m.name}.`
                                )
                              }
                              aria-label={`Delete ${m.name}`}
                              className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void callAdminApi(
                        '/api/admin/models',
                        'POST',
                        {
                          name: mName.trim(),
                          providerId: mProviderId,
                          upstreamModelId: mUpstreamId.trim(),
                          pricingStatus: mPricing,
                          contextLength: mContext,
                          maxOutputTokens: mMaxOutput,
                        },
                        `Added model "${mName.trim()}".`
                      );
                      setMName('');
                      setMUpstreamId('');
                    }}
                    className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3 h-fit"
                  >
                    <h2 className="text-sm font-semibold">Register Model</h2>
                    <input
                      type="text"
                      required
                      value={mName}
                      onChange={(e) => setMName(e.target.value)}
                      placeholder="Display Name"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                    />
                    <select
                      value={mProviderId}
                      onChange={(e) => setMProviderId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      {overview.providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={mUpstreamId}
                      onChange={(e) => setMUpstreamId(e.target.value)}
                      placeholder="Upstream Model ID"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs font-mono"
                    />
                    <select
                      value={mPricing}
                      onChange={(e) =>
                        setMPricing(e.target.value as ModelPricingTierStatus)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <option value="FREE">FREE</option>
                      <option value="FREE_TIER">FREE_TIER</option>
                      <option value="PAID">PAID</option>
                      <option value="REQUIRES_CREDITS">REQUIRES_CREDITS</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={mContext}
                        onChange={(e) => setMContext(Number(e.target.value))}
                        placeholder="Context"
                        className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs tabular-nums"
                      />
                      <input
                        type="number"
                        value={mMaxOutput}
                        onChange={(e) => setMMaxOutput(Number(e.target.value))}
                        placeholder="Max Output"
                        className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs tabular-nums"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Model</span>
                    </button>
                  </form>
                </div>
              )}

              {/* AI DISCOVERY */}
              {activeTab === 'discovery' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold">
                        Live Model Discovery Queue
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        Auto-scan interval: every {overview.discovery.scheduleHours}h
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void callAdminApi(
                          '/api/discovery/refresh',
                          'POST',
                          undefined,
                          'Completed live discovery scan across connected providers.'
                        )
                      }
                      className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Run Discovery Scan</span>
                    </button>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-200/80 dark:divide-slate-800/80">
                    {overview.discovery.candidates.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No discovered candidates yet. Run a scan to inspect provider `/models` endpoints.
                      </div>
                    ) : (
                      overview.discovery.candidates.slice(0, 30).map((cand) => (
                        <div
                          key={cand.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">
                              {cand.displayName} ·{' '}
                              <span className="font-mono text-slate-500">
                                {cand.upstreamModelId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {cand.providerLabel} · {cand.pricingStatus} ·{' '}
                              {formatTokenCount(cand.contextLength)} ctx · Status:{' '}
                              {cand.status}
                            </div>
                          </div>
                          {cand.status === 'pending' && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  void callAdminApi(
                                    '/api/discovery/approve',
                                    'POST',
                                    { candidateId: cand.id },
                                    `Approved ${cand.displayName}.`
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void callAdminApi(
                                    '/api/discovery/reject',
                                    'POST',
                                    { candidateId: cand.id },
                                    `Rejected ${cand.displayName}.`
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* LOGOS */}
              {activeTab === 'logos' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {logoEntries.map((entry) => (
                    <div
                      key={entry.key}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 flex items-center gap-3"
                    >
                      <ModelBrandAvatar
                        name={entry.label}
                        logoUrl={entry.logoPath}
                        logoKey={entry.key}
                        sizeClass="w-8 h-8 rounded-lg"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">
                          {entry.label}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          {entry.logoPath}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* API CONNECTIONS */}
              {activeTab === 'connections' && (
                <div className="rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-200/80 dark:divide-slate-800/80">
                  {overview.providers.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          Server env ref: {p.secretEnvName}
                        </div>
                      </div>
                      <span
                        className={`font-medium ${
                          p.connected
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {p.connected ? 'Present on server' : 'Not configured'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* PRICING & ZERO COST MODE */}
              {activeTab === 'pricing' && (
                <div className="p-5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-4 max-w-2xl">
                  <h2 className="text-sm font-semibold">
                    Zero Cost Mode Governance
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    When Zero Cost Mode is active, Luxo AI enforces HTTP 403 rejection on any paid, credit-required, or unknown-pricing model across Chat, Arena, and Media endpoints.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-xs font-medium">
                      Zero Cost Mode Status:{' '}
                      {overview.zeroCostPolicy.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void callAdminApi(
                          '/api/admin/settings',
                          'PATCH',
                          { zeroCostEnabled: !overview.zeroCostPolicy.enabled },
                          `Zero Cost Mode ${
                            !overview.zeroCostPolicy.enabled
                              ? 'enabled'
                              : 'disabled'
                          }.`
                        )
                      }
                      className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      {overview.zeroCostPolicy.enabled
                        ? 'Disable Zero Cost Mode'
                        : 'Enable Zero Cost Mode'}
                    </button>
                  </div>
                </div>
              )}

              {/* USAGE STATS */}
              {activeTab === 'usage' && (
                <div className="p-5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <h2 className="text-sm font-semibold">
                    Server Runtime Usage Totals
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs tabular-nums">
                    <div>
                      <div className="text-slate-500">Total Requests</div>
                      <div className="text-lg font-semibold mt-0.5">
                        {overview.usageStats.totalRequests}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Total Input Tokens</div>
                      <div className="text-lg font-semibold mt-0.5">
                        {overview.usageStats.totalInputTokens.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Total Output Tokens</div>
                      <div className="text-lg font-semibold mt-0.5">
                        {overview.usageStats.totalOutputTokens.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY */}
              {activeTab === 'security' && (
                <div className="p-5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Active Security Controls
                  </h2>
                  <p>• SSRF Guard rejects localhost, link-local metadata, private IPv4/IPv6 ranges, and non-HTTPS URLs for custom providers.</p>
                  <p>• Provider credentials use server `process.env` variable references (`secretEnvName`) and are never exposed in client responses or Firestore documents.</p>
                  <p>• Admin endpoints verify Firebase RS256 ID tokens against Google public certificates and enforce verified admin email authorization.</p>
                </div>
              )}

              {/* AUDIT LOGS */}
              {activeTab === 'audit' && (
                <div className="rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-200/80 dark:divide-slate-800/80">
                  {overview.auditLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No audit entries recorded in this server session yet.
                    </div>
                  ) : (
                    overview.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-semibold">
                            {log.action} · {log.target}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {log.detail} · by {log.actorEmail}
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SYSTEM SETTINGS */}
              {activeTab === 'settings' && (
                <div className="p-5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3 max-w-xl">
                  <h2 className="text-sm font-semibold">
                    Discovery Schedule &amp; Daily Free Cap
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {[6, 12, 24, 48].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() =>
                          void callAdminApi(
                            '/api/admin/settings',
                            'PATCH',
                            { scheduleHours: hrs },
                            `Discovery schedule set to every ${hrs}h.`
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer tabular-nums ${
                          overview.discovery.scheduleHours === hrs
                            ? 'bg-violet-600 text-white'
                            : 'border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Every {hrs}h
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};
