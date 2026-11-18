import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Wrench,
} from 'lucide-react';
import type {
  LuxoModelCategory,
  LuxoModelConfig,
  LuxoModelId,
  SelfEvolutionState,
  TrainingConsentStatus,
} from '../types/luxo';
import { LUXO_MODEL_CATEGORIES, LUXO_MODELS } from '../utils/luxoLogic';
import { getActiveDirectivesForModel } from '../utils/selfEvolutionEngine';
import { EvolutionDashboardPanel } from './EvolutionDashboardPanel';
import { LuxoLogo } from './LuxoLogo';

interface SelfEvolutionHubProps {
  onBack: () => void;
  evolutionState: SelfEvolutionState;
  consentStatus: TrainingConsentStatus;
  onChangeConsent: (status: 'granted' | 'denied') => void;
  onRunEvolutionCycle: (
    focusCategory?: LuxoModelCategory | 'Tüm Modeller'
  ) => Promise<void>;
  onCalibrateAllModels: () => Promise<void>;
  onRunBenchmark: () => Promise<void>;
  onCustomTrain: (input: {
    goalText: string;
    category: LuxoModelCategory | 'Tüm Modeller';
    targetModelId?: LuxoModelId;
  }) => Promise<boolean>;
  onBoostModel: (modelId: LuxoModelId) => Promise<void>;
  onToggleRule: (ruleId: string) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
  onToggleAutoEvolution: (enabled: boolean) => Promise<void>;
  onTestRuleInChat: (prompt: string, modelId?: LuxoModelId) => void;
  onOpenModelMetrics?: () => void;
}

type EvolutionTab =
  | 'dashboard'
  | 'rules'
  | 'train'
  | 'benchmark'
  | 'models'
  | 'logs';
type RuleFilter = 'all' | 'active' | 'custom' | 'benchmark' | 'autonomous';

const EVOLUTION_PHASES = [
  '1/4 · Denetleyici motor 113 modelin yanıt tutarlılığını ve hız metriklerini tarıyor...',
  '2/4 · Kod, Türkçe dilbilgisi, matematik ve görsel/video istem uç durumları sınanıyor...',
  '3/4 · Yeni doğrulama kuralı ve yönlendirme ağırlık yaması sentezleniyor...',
  '4/4 · Sistem istemleri ve model önbellekleri canlı olarak güncelleniyor...',
];

const CATEGORY_DEFAULT_MODEL: Record<LuxoModelCategory, LuxoModelId> = {
  'Google Gemini': 'gemini-4-argon',
  'OpenAI & ChatGPT': 'chatgpt-5-2-pro',
  'Anthropic Claude': 'claude-4-5-sonnet',
  DeepSeek: 'deepseek-r2',
  'Grok & Meta Llama': 'grok-4-heavy',
  'Mistral & Qwen': 'qwen-3-coder-plus',
  'Sinema & Görsel AI': 'nano-banana-2-1-ultra',
  'Perplexity & Küresel AI': 'perplexity-sonar-pro',
  'Luxo Özel': 'luxo-auto-router',
};

const QUICK_TRAINING_GOALS: {
  label: string;
  goal: string;
  category: LuxoModelCategory | 'Tüm Modeller';
  modelId?: LuxoModelId;
}[] = [
  {
    label: 'SQL İndeks & Sorgu Güvenliği',
    goal: 'SQL sorgularında tam tablo taraması yerine indeks dostu filtreler ve parametrik sorgu güvenliği uygula',
    category: 'Mistral & Qwen',
    modelId: 'qwen-3-coder-plus',
  },
  {
    label: 'Finans & Bileşik Oran Sağlaması',
    goal: 'Finans, faiz, yüzde ve olasılık hesaplamalarında birimleri ve ara adımları çift yönlü kontrol et',
    category: 'DeepSeek',
    modelId: 'deepseek-math-v2',
  },
  {
    label: 'Bellek Sızıntısı & İptal Koruması',
    goal: 'TypeScript ve React kodlarında zamanlayıcı ve ağ isteklerini temizleme (cleanup/AbortController) ile koru',
    category: 'Anthropic Claude',
    modelId: 'claude-4-5-sonnet',
  },
  {
    label: 'Nano Banana & Veo Optik Netlik',
    goal: 'Görsel ve video sahnelerinde doğal ışık yönünü, keskin odak düzlemini ve dengeli kamera hızını koru',
    category: 'Sinema & Görsel AI',
    modelId: 'nano-banana-2-1-ultra',
  },
];

export const SelfEvolutionHub: React.FC<SelfEvolutionHubProps> = ({
  onBack,
  evolutionState,
  consentStatus,
  onChangeConsent,
  onRunEvolutionCycle,
  onCalibrateAllModels,
  onRunBenchmark,
  onCustomTrain,
  onBoostModel,
  onToggleRule,
  onDeleteRule,
  onToggleAutoEvolution,
  onTestRuleInChat,
  onOpenModelMetrics,
}) => {
  const [isEvolving, setIsEvolving] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [isCustomTraining, setIsCustomTraining] = useState(false);
  const [boostingModelId, setBoostingModelId] = useState<LuxoModelId | null>(
    null
  );
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<EvolutionTab>('dashboard');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Rules filtering state
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleFilter, setRuleFilter] = useState<RuleFilter>('all');

  // Custom training state
  const [customGoal, setCustomGoal] = useState('');
  const [customCategory, setCustomCategory] = useState<
    LuxoModelCategory | 'Tüm Modeller'
  >('Tüm Modeller');
  const [customModelId, setCustomModelId] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);

  // 112 Model Inspector state
  const [modelSearch, setModelSearch] = useState('');
  const [selectedModelCategory, setSelectedModelCategory] = useState<
    'Tümü' | LuxoModelCategory
  >('Tümü');

  const allModelsList = useMemo(
    () => Object.values(LUXO_MODELS) as LuxoModelConfig[],
    []
  );
  const totalModelsCount = allModelsList.length;

  const avgAccuracy =
    evolutionState.ecosystems.length > 0
      ? (
          evolutionState.ecosystems.reduce((acc, e) => acc + e.accuracyScore, 0) /
          evolutionState.ecosystems.length
        ).toFixed(1)
      : '98.8';

  const activeRulesCount = evolutionState.learnedRules.filter(
    (r) => r.enabled
  ).length;

  const boostedModelsCount = Object.keys(
    evolutionState.modelBoosts || {}
  ).length;

  const benchmarkResults = evolutionState.benchmarkResults || [];
  const benchmarkPassCount = benchmarkResults.filter((b) => b.passed).length;

  const filteredRules = useMemo(() => {
    const q = ruleSearch.trim().toLowerCase();
    return evolutionState.learnedRules.filter((rule) => {
      if (ruleFilter === 'active' && !rule.enabled) return false;
      if (ruleFilter === 'custom' && rule.source !== 'custom-training') {
        return false;
      }
      if (ruleFilter === 'benchmark' && rule.source !== 'benchmark-gate') {
        return false;
      }
      if (
        ruleFilter === 'autonomous' &&
        rule.source !== 'autonomous-critic' &&
        rule.source !== 'auto-repair'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        rule.title.toLowerCase().includes(q) ||
        rule.directive.toLowerCase().includes(q) ||
        rule.category.toLowerCase().includes(q)
      );
    });
  }, [evolutionState.learnedRules, ruleFilter, ruleSearch]);

  const selectableModelsForCustomTrain = useMemo(() => {
    if (customCategory === 'Tüm Modeller') return allModelsList;
    return allModelsList.filter((m) => m.category === customCategory);
  }, [allModelsList, customCategory]);

  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    return allModelsList.filter((m) => {
      if (
        selectedModelCategory !== 'Tümü' &&
        m.category !== selectedModelCategory
      ) {
        return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    });
  }, [allModelsList, modelSearch, selectedModelCategory]);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3600);
  };

  const handleTriggerEvolve = async (
    focus: LuxoModelCategory | 'Tüm Modeller' = 'Tüm Modeller'
  ) => {
    if (isEvolving || isCalibrating || isBenchmarking) return;
    setIsEvolving(true);
    setPhaseIndex(0);
    const timer = setInterval(() => {
      setPhaseIndex((prev) => Math.min(EVOLUTION_PHASES.length - 1, prev + 1));
    }, 520);
    try {
      await onRunEvolutionCycle(focus);
      showNotice(
        `${focus} için yeni öz-gelişim kuralı üretildi ve tüm aktif modellere uygulandı.`
      );
    } finally {
      clearInterval(timer);
      setIsEvolving(false);
    }
  };

  const handleTriggerCalibrate = async () => {
    if (isEvolving || isCalibrating || isBenchmarking) return;
    setIsCalibrating(true);
    try {
      await onCalibrateAllModels();
      showNotice(
        `${totalModelsCount} modelin gecikme önbelleği temizlendi ve doğruluk ağırlıkları kalibre edildi.`
      );
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleTriggerBenchmark = async () => {
    if (isBenchmarking || isEvolving) return;
    setIsBenchmarking(true);
    try {
      await onRunBenchmark();
      setActiveTab('benchmark');
      showNotice(
        '4 alanlı canlı doğrulama testi tamamlandı; tüm model metrikleri güncellendi.'
      );
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleCustomTrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customGoal.trim();
    if (trimmed.length < 4) {
      setCustomError(
        'Lütfen yapay zekaya kazandırmak istediğiniz hedefi en az 4 karakter olacak şekilde yazın.'
      );
      return;
    }
    setCustomError(null);
    setIsCustomTraining(true);
    try {
      const ok = await onCustomTrain({
        goalText: trimmed,
        category: customCategory,
        targetModelId: customModelId
          ? (customModelId as LuxoModelId)
          : undefined,
      });
      if (ok) {
        setCustomGoal('');
        setActiveTab('rules');
        setRuleFilter('all');
        showNotice(
          'Özel öz-eğitim hedefiniz canlı sistem kuralına dönüştürüldü ve modellere işlendi.'
        );
      }
    } finally {
      setIsCustomTraining(false);
    }
  };

  const handleBoostSingleModel = async (model: LuxoModelConfig) => {
    if (boostingModelId) return;
    setBoostingModelId(model.id);
    try {
      await onBoostModel(model.id);
      showNotice(
        `${model.name} çekirdeği kalibre edildi; doğruluk ve yönlendirme ağırlığı yükseltildi.`
      );
    } finally {
      setBoostingModelId(null);
    }
  };

  return (
    <div
      data-testid="self-evolution-hub"
      className="flex flex-col h-full bg-white dark:bg-[#18181b] text-neutral-900 dark:text-neutral-100 overflow-hidden"
    >
      {/* Clean Top Bar Contract */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Sohbete Dön"
            className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#202123] dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white truncate">
              Otonom Gelişim & Öz-Eğitim Merkezi
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate tabular-nums">
              Nesil v{evolutionState.generation} · {totalModelsCount} Yapay Zeka Modeli ·{' '}
              {activeRulesCount} Aktif Kural · {boostedModelsCount} Güçlendirilmiş Çekirdek
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="calibrate-all-models-btn"
            onClick={handleTriggerCalibrate}
            disabled={isEvolving || isCalibrating || isBenchmarking}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#202123] dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 disabled:opacity-50 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Wrench
              className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`}
            />
            <span>
              {isCalibrating
                ? 'Denetleniyor...'
                : `${totalModelsCount} Modeli Hızlandır`}
            </span>
          </button>

          <button
            type="button"
            data-testid="run-evolution-cycle-btn"
            onClick={() => handleTriggerEvolve('Tüm Modeller')}
            disabled={isEvolving || isCalibrating || isBenchmarking}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-60 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isEvolving ? 'animate-spin' : ''}`}
            />
            <span>
              {isEvolving ? 'Geliştiriliyor...' : 'Şimdi Kendini Geliştir'}
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-5xl mx-auto space-y-6">
          {statusNotice && (
            <div
              role="status"
              className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{statusNotice}</span>
            </div>
          )}

          {isEvolving && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-3">
              <LuxoLogo
                className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0"
                size={20}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Canlı Otonom Gelişim Döngüsü Çalışıyor
                </div>
                <div className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">
                  {EVOLUTION_PHASES[phaseIndex]}
                </div>
              </div>
            </div>
          )}

          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Evrim Nesli & Döngü
              </div>
              <div
                data-testid="evolution-generation-value"
                className="text-2xl font-bold text-neutral-900 dark:text-white mt-1 tabular-nums"
              >
                v{evolutionState.generation}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
                {evolutionState.totalCyclesRun} tamamlanan gelişim turu
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Ortalama Model İsabeti
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                %{avgAccuracy}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
                9 ekosistem · {totalModelsCount} aktif model
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Canlı Kıyaslama Doğrulaması
              </div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1 tabular-nums">
                {benchmarkPassCount}/{benchmarkResults.length || 4}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
                {evolutionState.totalBugsPatched} otomatik yama uygulandı
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                İzinli Anonim Sinyal
              </div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
                {evolutionState.consentedSignalsProcessed}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {consentStatus === 'granted'
                  ? 'Sohbet öğrenimi açık'
                  : 'Sohbet öğrenimi kapalı'}
              </div>
            </div>
          </div>

          {/* Privacy Consent & Site Self-Evolution Control Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Sohbet Yapay Zekamızı Geliştirmek İçin kullanılsın mı?
                  </h2>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  Etkinleştirildiğinde kişisel veriler (e-posta, telefon, anahtar) otomatik maskelenir; yalnızca anonim kalite sinyalleri mevcut 113 yapay zekayı geliştirir.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onChangeConsent('granted');
                    showNotice(
                      'Sohbet kalite öğrenimi etkinleştirildi (kişisel veriler maskelenir).'
                    );
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    consentStatus === 'granted'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  Evet, Kullanılsın {consentStatus === 'granted' ? '· Aktif' : ''}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeConsent('denied');
                    showNotice(
                      'Sohbet öğrenimi kapatıldı; hiçbir konuşma sinyali işlenmeyecek.'
                    );
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    consentStatus === 'denied'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  Hayır, Kullanılmasın {consentStatus === 'denied' ? '· Aktif' : ''}
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Otonom Arka Plan Öz-Gelişim & Canlı Doğrulama
                  </h2>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                    Açık olduğunda sistem yanıt hızlarını, kod çiti bütünlüğünü ve sayısal sağlamaları arka planda denetleyerek yönlendirici ağırlıklarını kendi kendine günceller.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onToggleAutoEvolution(!evolutionState.autoEvolutionEnabled)
                  }
                  aria-label="Otomatik öz-gelişim modunu değiştir"
                  className="shrink-0 text-indigo-600 dark:text-indigo-400 cursor-pointer"
                >
                  {evolutionState.autoEvolutionEnabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-neutral-400" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                <span>
                  Mod:{' '}
                  <strong className="text-neutral-800 dark:text-neutral-200">
                    {evolutionState.autoEvolutionEnabled
                      ? 'Otonom Evrim Aktif'
                      : 'Manuel Denetim'}
                  </strong>
                </span>
                <button
                  type="button"
                  data-testid="quick-run-benchmark-btn"
                  onClick={handleTriggerBenchmark}
                  disabled={isBenchmarking || isEvolving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 font-semibold text-neutral-800 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-3 h-3" />
                  <span>
                    {isBenchmarking
                      ? 'Doğrulanıyor...'
                      : 'Canlı Kıyaslama Çalıştır'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Segmented Section Tabs */}
          <div
            role="tablist"
            aria-label="Öz-gelişim çalışma alanı sekmeleri"
            className="flex items-center gap-1.5 border-b border-neutral-200 dark:border-neutral-800 pb-2.5 overflow-x-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'dashboard'}
              data-testid="tab-evolution-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Özet Panel & Grafik
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'rules'}
              onClick={() => setActiveTab('rules')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'rules'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Öğrenilen AI Kuralları ({evolutionState.learnedRules.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'train'}
              data-testid="tab-custom-train"
              onClick={() => setActiveTab('train')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'train'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Özel Hedefli Model Eğitimi
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'benchmark'}
              data-testid="tab-benchmark"
              onClick={() => setActiveTab('benchmark')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'benchmark'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Canlı Kıyaslama ({benchmarkPassCount}/{benchmarkResults.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'models'}
              data-testid="tab-models-inspector"
              onClick={() => setActiveTab('models')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'models'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              113 Model & 9 Ekosistem
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'logs'}
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'logs'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Öz-Onarım Günlüğü ({evolutionState.recentLogs.length})
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <EvolutionDashboardPanel
              evolutionState={evolutionState}
              onOpenModelMetrics={onOpenModelMetrics}
            />
          )}

          {/* TAB 1: LEARNED RULES WITH SEARCH & FILTER */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={ruleSearch}
                    onChange={(e) => setRuleSearch(e.target.value)}
                    aria-label="Öğrenilen kurallarda ara"
                    placeholder="Kural, ekosistem veya talimat ara..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-[#202123] overflow-x-auto">
                  {(
                    [
                      { id: 'all', label: 'Tümü' },
                      { id: 'active', label: 'Aktif' },
                      { id: 'custom', label: 'Özel Eğitim' },
                      { id: 'benchmark', label: 'Kıyaslama' },
                      { id: 'autonomous', label: 'Otonom' },
                    ] as { id: RuleFilter; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setRuleFilter(f.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                        ruleFilter === f.id
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRules.length === 0 ? (
                <div className="p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center space-y-3">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Seçili filtreye uygun öğrenilmiş kural bulunamadı.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('train')}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Yeni Özel Eğitim Kuralı Oluştur
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#202123] overflow-hidden">
                  {filteredRules.map((rule) => {
                    const suggestedModel: LuxoModelId =
                      rule.targetModelId ||
                      (rule.category !== 'Tüm Modeller'
                        ? CATEGORY_DEFAULT_MODEL[rule.category]
                        : 'luxo-auto-router');

                    const sourceLabel =
                      rule.source === 'custom-training'
                        ? 'Özel Hedefli Eğitim'
                        : rule.source === 'benchmark-gate'
                        ? 'Canlı Kıyaslama Kapısı'
                        : rule.source === 'chat-feedback'
                        ? 'İzinli Sohbet Sinyali'
                        : rule.source === 'auto-repair'
                        ? 'Otomatik Hata Yaması'
                        : 'Otonom Denetleyici';

                    return (
                      <div
                        key={rule.id}
                        data-testid="learned-evolution-rule"
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30 transition"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {rule.targetModelId
                                ? LUXO_MODELS[rule.targetModelId]?.name ||
                                  rule.category
                                : rule.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              +{rule.confidenceGain.toFixed(1)}% Kalite Etkisi
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{sourceLabel}</span>
                          </div>
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                            {rule.title}
                          </h3>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                            {rule.directive}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              onTestRuleInChat(rule.testPrompt, suggestedModel)
                            }
                            className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <span>Sohbette Test Et</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleRule(rule.id)}
                            aria-label={`${rule.title} kuralını aç veya kapat`}
                            className="text-indigo-600 dark:text-indigo-400 cursor-pointer p-1"
                          >
                            {rule.enabled ? (
                              <ToggleRight className="w-7 h-7" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-neutral-400" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteRule(rule.id)}
                            aria-label={`${rule.title} kuralını sil`}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOM SELF-TRAINING WORKSHOP */}
          {activeTab === 'train' && (
            <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#202123] space-y-5">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Özel Hedefli Model Eğitimi & Kural Enjeksiyonu
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  Mevcut yapay zekaların hangi alanda daha keskin, hızlı veya titiz davranmasını istediğinizi yazın. Motor bu hedefi yapılandırılmış sistem yönergesine dönüştürüp seçtiğiniz modele veya tüm 113 modele canlı olarak uygular.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Hızlı Uzmanlık Şablonları
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_TRAINING_GOALS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setCustomGoal(preset.goal);
                        setCustomCategory(preset.category);
                        setCustomModelId(preset.modelId || '');
                        setCustomError(null);
                      }}
                      className="text-left p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition cursor-pointer"
                    >
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {preset.label}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                        {preset.goal}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCustomTrainSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="custom-evolution-goal"
                    className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                  >
                    Kazandırılacak Yetenek veya Düzeltilecek Davranış
                  </label>
                  <textarea
                    id="custom-evolution-goal"
                    rows={3}
                    value={customGoal}
                    onChange={(e) => {
                      setCustomGoal(e.target.value);
                      if (customError) setCustomError(null);
                    }}
                    placeholder="Örn: Python ve TypeScript kodlarında her zaman zaman karmaşıklığını O(n) düzeyinde tut ve sınır değerleri doğrula..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-indigo-500"
                  />
                  {customError && (
                    <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                      {customError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="custom-evolution-category"
                      className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                    >
                      Hedef Ekosistem
                    </label>
                    <select
                      id="custom-evolution-category"
                      value={customCategory}
                      onChange={(e) => {
                        setCustomCategory(
                          e.target.value as LuxoModelCategory | 'Tüm Modeller'
                        );
                        setCustomModelId('');
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Tüm Modeller">
                        Tüm Modeller (113 Yapay Zeka)
                      </option>
                      {LUXO_MODEL_CATEGORIES.filter((c) => c !== 'Tümü').map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="custom-evolution-model"
                      className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                    >
                      Özel Hedef Model (İsteğe Bağlı)
                    </label>
                    <select
                      id="custom-evolution-model"
                      value={customModelId}
                      onChange={(e) => setCustomModelId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">
                        Seçili Ekosistemdeki Tüm Modeller ({selectableModelsForCustomTrain.length})
                      </option>
                      {selectableModelsForCustomTrain.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} · {m.contextWindow}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="submit"
                    data-testid="submit-custom-train-btn"
                    disabled={isCustomTraining}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-60 transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>
                      {isCustomTraining
                        ? 'Kural Sentezleniyor...'
                        : 'Hedefle Eğit & Kural Üret'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: LIVE BENCHMARK & INVARIANT VERIFICATION ARENA */}
          {activeTab === 'benchmark' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#202123]">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Çok-Alanlı Canlı Doğrulama & Öz-Sınama Arenası
                  </h2>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Sayısal cebir, tip güvenli kodlama, dağıtık mimari ve SQL optimizasyonu üzerinde modelleri gerçek zamanlı sınar; düşük puanlı alanlara otomatik yama üretir.
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="run-benchmark-suite-btn"
                  onClick={handleTriggerBenchmark}
                  disabled={isBenchmarking}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-60 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {isBenchmarking
                      ? 'Canlı Testler Koşuluyor...'
                      : 'Canlı Doğrulama Testini Çalıştır'}
                  </span>
                </button>
              </div>

              <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#202123] overflow-hidden">
                {benchmarkResults.map((b) => (
                  <div
                    key={b.id}
                    data-testid="benchmark-result-row"
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                        <span
                          className={`font-semibold ${
                            b.passed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {b.passed ? 'Doğrulandı' : 'Yama Eklendi'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {LUXO_MODELS[b.modelId]?.name || b.modelId}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Skor %{b.score.toFixed(1)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{b.latencyMs}ms</span>
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {b.domain}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Beklenen Kriter: {b.expectedInvariant}
                      </p>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1">
                        Örnek Çıktı: {b.verifiedExcerpt}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => onTestRuleInChat(b.prompt, b.modelId)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <span>Sohbette Dene</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 112 MODELS & 9 ECOSYSTEMS INSPECTOR */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              {/* 9 Ecosystems Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {evolutionState.ecosystems.map((eco) => {
                  const defaultModelId = CATEGORY_DEFAULT_MODEL[eco.category];
                  return (
                    <div
                      key={eco.category}
                      className="p-4 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {eco.category}
                          </h3>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                            %{eco.accuracyScore.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                          {eco.modelCount} Model · {eco.avgLatencyMs}ms ·{' '}
                          {eco.patchesApplied} Yama
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed line-clamp-2">
                          {eco.keyUpgradeNote}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                          type="button"
                          disabled={isEvolving}
                          onClick={() => handleTriggerEvolve(eco.category)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 cursor-pointer whitespace-nowrap"
                        >
                          Ekosistemi Geliştir
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onTestRuleInChat(
                              `${eco.category} uzmanlığıyla kısa ve doğrulanmış bir analiz yap.`,
                              defaultModelId
                            )
                          }
                          className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
                        >
                          Modeli Dene
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Individual 112 Models Calibration Matrix */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                      113 Yapay Zeka Modeli Bireysel Güçlendirme Matrisi
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                      Gösterilen: {filteredModels.length} / {totalModelsCount} model
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        aria-label="113 yapay zeka modeli içinde ara"
                        placeholder="Model adı veya yetenek ara..."
                        className="w-full sm:w-56 pl-8 pr-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <select
                      value={selectedModelCategory}
                      onChange={(e) =>
                        setSelectedModelCategory(
                          e.target.value as 'Tümü' | LuxoModelCategory
                        )
                      }
                      aria-label="Kategoriye göre modelleri filtrele"
                      className="px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      {LUXO_MODEL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#202123] overflow-hidden max-h-[460px] overflow-y-auto">
                  {filteredModels.map((model) => {
                    const boost = evolutionState.modelBoosts?.[model.id];
                    const activeDirCount = getActiveDirectivesForModel(
                      evolutionState,
                      model.id,
                      model.category
                    ).length;
                    const isBoostingThis = boostingModelId === model.id;

                    return (
                      <div
                        key={model.id}
                        data-testid="model-calibration-row"
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                              {model.name}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              · {model.category} · {model.contextWindow}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                            {activeDirCount} aktif öz-gelişim yönergesi
                            {boost
                              ? ` · Güçlendirme #${boost.boostCount} (+%${boost.accuracyDelta.toFixed(
                                  2
                                )} isabet · -${boost.latencySavedMs}ms)`
                              : ` · ${model.speed}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleBoostSingleModel(model)}
                            disabled={Boolean(boostingModelId)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                          >
                            {isBoostingThis
                              ? 'Kalibre Ediliyor...'
                              : boost
                              ? 'Tekrar Güçlendir'
                              : 'Modeli Güçlendir'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onTestRuleInChat(
                                `${model.name} uzmanlığıyla kısa ve yüksek doğruluklu bir çözüm üret.`,
                                model.id
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Konuş
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT & REPAIR LOGS */}
          {activeTab === 'logs' && (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#202123] overflow-hidden">
              {evolutionState.recentLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                    <span>
                      <strong className="text-neutral-900 dark:text-white">
                        Nesil v{log.generation}
                      </strong>{' '}
                      · {log.targetCategory}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {log.verifiedGain}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      Tespit:
                    </strong>{' '}
                    {log.challengerFinding}
                  </p>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300">
                    <strong className="text-neutral-900 dark:text-white">
                      Uygulanan Yama:
                    </strong>{' '}
                    {log.appliedPatch}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
