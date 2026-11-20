import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  FilePlus2,
  Globe,
  PenLine,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import type { LuxoModelId } from '../types/luxo';
import type { BlogArticle } from '../utils/seoPerfEngagementEngine';
import {
  type ContentStudioAiPack,
  type ContentStudioIntent,
  type ContentStudioTone,
  evaluateContentEntrySeo,
  generateDeterministicContentPack,
  type PublishedStudioArticle,
  removeStudioArticleById,
  slugifyStudioText,
  validateAndBuildStudioArticle,
} from '../utils/contentStudioEngine';
import { QuickSocialShareButtons } from './SocialShareBar';
import { ContentRatingAndComments } from './ContentRatingAndComments';

interface ContentStudioWorkspaceProps {
  studioArticles: PublishedStudioArticle[];
  siteOrigin: string;
  onSyncStudioArticles: (
    nextArticles: PublishedStudioArticle[],
    publishedArticle?: PublishedStudioArticle
  ) => void;
  onOpenPublishedInBlog: (articleId: string) => void;
  onAskAiInChat: (prompt: string, recommendedModelId?: LuxoModelId) => void;
}

const TONE_OPTIONS: ContentStudioTone[] = [
  'Profesyonel & Kurumsal',
  'Teknik & Mühendislik',
  'Dönüşüm & Büyüme Odaklı',
  'Eğitici & Adım Adım',
];

const INTENT_OPTIONS: ContentStudioIntent[] = ['Bilgi', 'Ticari', 'İşlemsel'];

const CATEGORY_OPTIONS: BlogArticle['category'][] = [
  'Teknik SEO',
  'Web Performansı',
  'AI Mimarisi',
  'UI/UX Tasarım',
];

function copySafe(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      return;
    }
  } catch {
    // fallback below
  }
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

export const ContentStudioWorkspace: React.FC<ContentStudioWorkspaceProps> = ({
  studioArticles,
  siteOrigin,
  onSyncStudioArticles,
  onOpenPublishedInBlog,
  onAskAiInChat,
}) => {
  // Section 1: AI Generator State
  const [topicInput, setTopicInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [audienceInput, setAudienceInput] = useState(
    'Yazılım Geliştiriciler & Dijital Ekipler'
  );
  const [selectedTone, setSelectedTone] = useState<ContentStudioTone>(
    'Profesyonel & Kurumsal'
  );
  const [selectedIntent, setSelectedIntent] =
    useState<ContentStudioIntent>('Bilgi');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [aiPack, setAiPack] = useState<ContentStudioAiPack | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Section 2: Direct Site Content Entry & Publisher State
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [entryTitle, setEntryTitle] = useState('');
  const [entrySlug, setEntrySlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [entryMetaDescription, setEntryMetaDescription] = useState('');
  const [entryFocusKeyword, setEntryFocusKeyword] = useState('');
  const [entryCategory, setEntryCategory] =
    useState<BlogArticle['category']>('Teknik SEO');
  const [entryAuthor, setEntryAuthor] = useState('İçerik Stüdyosu Editörü');
  const [entryPublishedIso, setEntryPublishedIso] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [entryBody, setEntryBody] = useState('');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishNotice, setPublishNotice] = useState<{
    message: string;
    articleId?: string;
    status: 'published' | 'draft';
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Section 3: Filter for Direct Content Entries
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'published' | 'draft'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const liveAudit = useMemo(
    () =>
      evaluateContentEntrySeo({
        title: entryTitle,
        metaDescription: entryMetaDescription,
        slug: entrySlug || slugifyStudioText(entryTitle),
        focusKeyword: entryFocusKeyword || keywordInput,
        bodyText: entryBody,
      }),
    [
      entryTitle,
      entryMetaDescription,
      entrySlug,
      entryFocusKeyword,
      keywordInput,
      entryBody,
    ]
  );

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return studioArticles.filter((art) => {
      if (statusFilter !== 'all' && art.status !== statusFilter) return false;
      if (!q) return true;
      return (
        art.title.toLowerCase().includes(q) ||
        art.metaDescription.toLowerCase().includes(q) ||
        art.focusKeyword.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q)
      );
    });
  }, [studioArticles, statusFilter, searchQuery]);

  const handleCopy = (id: string, value: string) => {
    copySafe(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleTitleChange = (val: string) => {
    setEntryTitle(val);
    if (!slugManuallyEdited) {
      setEntrySlug(slugifyStudioText(val));
    }
  };

  const handleGeneratePack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTopic = topicInput.trim();
    if (cleanTopic.length < 3) {
      setGeneratorError(
        'Lütfen blog başlığı ve meta açıklama üretimi için en az 3 karakterlik bir konu girin.'
      );
      return;
    }
    setGeneratorError(null);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/content-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: cleanTopic,
          focusKeyword: keywordInput.trim(),
          audience: audienceInput.trim(),
          tone: selectedTone,
          intent: selectedIntent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.pack) {
        setGeneratorError(
          data?.error || 'İçerik paketi üretilirken bir hata oluştu.'
        );
      } else {
        const pack = data.pack as ContentStudioAiPack;
        setAiPack(pack);
        if (!entryFocusKeyword.trim()) {
          setEntryFocusKeyword(pack.primaryKeyword);
        }
      }
    } catch {
      const localPack = generateDeterministicContentPack({
        topic: cleanTopic,
        focusKeyword: keywordInput.trim(),
        audience: audienceInput.trim(),
        tone: selectedTone,
        intent: selectedIntent,
      });
      setAiPack(localPack);
      if (!entryFocusKeyword.trim()) {
        setEntryFocusKeyword(localPack.primaryKeyword);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyFullAiDraftToEditor = (pack: ContentStudioAiPack) => {
    const firstTitle = pack.blogTitles[0]?.title || pack.topic;
    const firstMeta = pack.metaDescriptions[0]?.description || pack.suggestedSummary;
    const formattedBody = pack.suggestedSections
      .map((s) => `## ${s.heading}\n${s.content}`)
      .join('\n\n');

    setEntryTitle(firstTitle);
    setEntrySlug(slugifyStudioText(firstTitle));
    setSlugManuallyEdited(false);
    setEntryMetaDescription(firstMeta);
    setEntryFocusKeyword(pack.primaryKeyword);
    setEntryBody(formattedBody);
    setPublishError(null);
  };

  const handleResetEditor = () => {
    setEditingArticleId(null);
    setEntryTitle('');
    setEntrySlug('');
    setSlugManuallyEdited(false);
    setEntryMetaDescription('');
    setEntryFocusKeyword('');
    setEntryPublishedIso(new Date().toISOString().slice(0, 10));
    setEntryBody('');
    setPublishError(null);
    setPublishNotice(null);
  };

  const handleSubmitEntry = async (targetStatus: 'published' | 'draft') => {
    setPublishNotice(null);
    const localResult = validateAndBuildStudioArticle(studioArticles, {
      id: editingArticleId || undefined,
      title: entryTitle,
      slug: entrySlug || slugifyStudioText(entryTitle),
      metaTitle: entryTitle,
      metaDescription: entryMetaDescription,
      focusKeyword: entryFocusKeyword || keywordInput,
      category: entryCategory,
      tone: selectedTone,
      status: targetStatus,
      authorName: entryAuthor,
      publishedIso: entryPublishedIso,
      summary: entryMetaDescription,
      bodyText: entryBody,
    });

    if (!localResult.article) {
      setPublishError(
        localResult.error ||
          'Lütfen başlık, meta açıklama ve içerik gövdesini eksiksiz doldurun.'
      );
      return;
    }

    setPublishError(null);
    setIsSaving(true);
    onSyncStudioArticles(localResult.articles, localResult.article);

    const payload = {
      id: localResult.article.id,
      title: entryTitle,
      slug: localResult.article.slug,
      metaTitle: entryTitle,
      metaDescription: localResult.article.metaDescription,
      focusKeyword: localResult.article.focusKeyword,
      category: entryCategory,
      tone: selectedTone,
      status: targetStatus,
      authorName: entryAuthor,
      publishedIso: localResult.article.publishedIso,
      summary: localResult.article.summary,
      bodyText: entryBody,
    };

    try {
      const res = await fetch('/api/content-studio/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.state?.studioArticles)) {
          onSyncStudioArticles(
            data.state.studioArticles,
            data.article || localResult.article
          );
        }
      }
    } catch {
      // optimistic state already synced
    } finally {
      setIsSaving(false);
      setEditingArticleId(null);
      setEntryTitle('');
      setEntrySlug('');
      setSlugManuallyEdited(false);
      setEntryMetaDescription('');
      setEntryPublishedIso(new Date().toISOString().slice(0, 10));
      setEntryBody('');
      setPublishNotice({
        message:
          targetStatus === 'published'
            ? `"${localResult.article.title}" doğrudan siteye yayınlandı ve /sitemap.xml haritasına eklendi.`
            : `"${localResult.article.title}" taslak olarak kaydedildi.`,
        articleId: localResult.article.id,
        status: targetStatus,
      });
    }
  };

  const handleLoadForEdit = (art: PublishedStudioArticle) => {
    setEditingArticleId(art.id);
    setEntryTitle(art.title);
    setEntrySlug(art.slug);
    setSlugManuallyEdited(true);
    setEntryMetaDescription(art.metaDescription);
    setEntryFocusKeyword(art.focusKeyword);
    setEntryCategory(art.category);
    setSelectedTone(art.tone);
    setEntryAuthor(art.authorName);
    setEntryPublishedIso(art.publishedIso || new Date().toISOString().slice(0, 10));
    setEntryBody(art.bodyText);
    setPublishError(null);
    setPublishNotice(null);
  };

  const handleDeleteEntry = async (articleId: string) => {
    const nextLocal = removeStudioArticleById(studioArticles, articleId);
    onSyncStudioArticles(nextLocal);
    if (editingArticleId === articleId) {
      handleResetEditor();
    }
    try {
      const res = await fetch('/api/content-studio/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.state?.studioArticles)) {
          onSyncStudioArticles(data.state.studioArticles);
        }
      }
    } catch {
      // optimistic delete already applied
    }
  };

  const cleanOrigin = (
    siteOrigin ||
    'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app'
  ).replace(/\/+$/, '');
  const previewSlug =
    entrySlug || slugifyStudioText(entryTitle) || 'yeni-seo-makalesi';
  const previewUrl = `${cleanOrigin}/?view=hub&article=${previewSlug}`;

  return (
    <div
      data-testid="content-studio-workspace"
      className="space-y-8"
    >
      {/* SECTION 01: AI SEO Meta Description & Blog Title Generator */}
      <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              01. SEO Blog Başlığı & Meta Açıklama Üretici
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Konunuzu girin; arama niyetine uygun yüksek tıklama oranlı (CTR) blog başlıkları, SERP kırpılma sınırlarına uyumlu meta açıklamalar ve hazır taslak bölümler üretin.
            </p>
          </div>
          <div className="text-right text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
            <span>Hedef Başlık: 30–60 kr</span>
            <span aria-hidden="true"> · </span>
            <span>Hedef Meta: 120–158 kr</span>
          </div>
        </div>

        <form onSubmit={handleGeneratePack} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 space-y-1">
              <label
                htmlFor="cs-topic-input"
                className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Konu veya Sayfa Özeti
              </label>
              <input
                id="cs-topic-input"
                data-testid="cs-topic-input"
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Örn: E-ticaret sitelerinde Core Web Vitals hızlandırma"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label
                htmlFor="cs-keyword-input"
                className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Odak Anahtar Kelime
              </label>
              <input
                id="cs-keyword-input"
                data-testid="cs-keyword-input"
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Örn: core web vitals optimizasyonu"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label
                htmlFor="cs-tone-select"
                className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                İçerik Üslubu
              </label>
              <select
                id="cs-tone-select"
                value={selectedTone}
                onChange={(e) =>
                  setSelectedTone(e.target.value as ContentStudioTone)
                }
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label
                htmlFor="cs-intent-select"
                className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Arama Niyeti
              </label>
              <select
                id="cs-intent-select"
                value={selectedIntent}
                onChange={(e) =>
                  setSelectedIntent(e.target.value as ContentStudioIntent)
                }
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
              >
                {INTENT_OPTIONS.map((intent) => (
                  <option key={intent} value={intent}>
                    {intent}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <label
                htmlFor="cs-audience-input"
                className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 whitespace-nowrap shrink-0"
              >
                Hedef Kitle:
              </label>
              <input
                id="cs-audience-input"
                type="text"
                value={audienceInput}
                onChange={(e) => setAudienceInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              data-testid="cs-generate-btn"
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Başlık & Meta Paket Üretiliyor...</span>
                </>
              ) : (
                <>
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Başlık & Meta Açıklama Üret</span>
                </>
              )}
            </button>
          </div>

          {generatorError && (
            <p
              role="alert"
              className="text-xs font-medium text-rose-600 dark:text-rose-400"
            >
              {generatorError}
            </p>
          )}
        </form>

        {/* Generated Candidates Matrix */}
        {aiPack && (
          <div
            data-testid="cs-generated-pack"
            className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                <strong className="text-neutral-900 dark:text-white">
                  Önerilen Anahtar Kelimeler:
                </strong>{' '}
                {aiPack.secondaryKeywords.join(' · ')}
              </div>
              <button
                type="button"
                data-testid="cs-apply-full-draft-btn"
                onClick={() => handleApplyFullAiDraftToEditor(aiPack)}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Tüm Taslağı İçerik Editörüne Aktar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Blog Title Candidates */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Üretilen SEO Blog Başlıkları ({aiPack.blogTitles.length})
                </h3>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border-t border-b border-neutral-100 dark:border-neutral-800">
                  {aiPack.blogTitles.map((cand) => {
                    const isSelected = entryTitle === cand.title;
                    return (
                      <div
                        key={cand.id}
                        className="py-3 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs font-semibold text-neutral-900 dark:text-white leading-snug">
                            {cand.title}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums">
                            {cand.angle} · {cand.charLength} karakter · Tahmini CTR %
                            {cand.estimatedCtrPct}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(cand.id, cand.title)}
                            aria-label={`Başlığı kopyala: ${cand.title}`}
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                          >
                            {copiedId === cand.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTitleChange(cand.title)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {isSelected ? 'Seçildi' : 'Başlığı Kullan'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Meta Description Candidates */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Üretilen SEO Meta Açıklamaları ({aiPack.metaDescriptions.length})
                </h3>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border-t border-b border-neutral-100 dark:border-neutral-800">
                  {aiPack.metaDescriptions.map((desc) => {
                    const isSelected = entryMetaDescription === desc.description;
                    return (
                      <div
                        key={desc.id}
                        className="py-3 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                            {desc.description}
                          </p>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums">
                            {desc.ctaFocus} · {desc.charLength} karakter ·{' '}
                            <span
                              className={
                                desc.inOptimalRange
                                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : 'text-amber-600 dark:text-amber-400'
                              }
                            >
                              {desc.inOptimalRange ? 'İdeal SERP Uzunluğu' : 'Kırpılma Kontrolü'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(desc.id, desc.description)}
                            aria-label={`Meta açıklamayı kopyala: ${desc.ctaFocus}`}
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                          >
                            {copiedId === desc.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEntryMetaDescription(desc.description)
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {isSelected ? 'Seçildi' : 'Metayı Kullan'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 02: Direct Site Content Entry Editor + Live SERP & SEO Score */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                02. Doğrudan Siteye İçerik Girişi & Yayınlama Editörü
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {editingArticleId
                  ? 'Seçili içeriği düzenliyorsunuz; güncellediğinizde site ve sitemap.xml anında yenilenir.'
                  : 'Yazdığınız veya yukarıdan aktardığınız içeriği doğrudan sitenin Blog akışına ve XML site haritasına yayınlayın.'}
              </p>
            </div>
            {editingArticleId && (
              <button
                type="button"
                onClick={handleResetEditor}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer whitespace-nowrap"
              >
                Düzenlemeyi İptal Et
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="cs-entry-title"
                    className="font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    Sayfa / Blog Başlığı (&lt;h1&gt; &amp; &lt;title&gt;)
                  </label>
                  <span
                    className={`font-mono tabular-nums ${
                      liveAudit.titleOptimal
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {liveAudit.titleLength}/60 kr
                  </span>
                </div>
                <input
                  id="cs-entry-title"
                  data-testid="cs-entry-title"
                  type="text"
                  value={entryTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="SEO uyumlu ana makale başlığı..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label
                  htmlFor="cs-entry-category"
                  className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  Site Kategorisi
                </label>
                <select
                  id="cs-entry-category"
                  value={entryCategory}
                  onChange={(e) =>
                    setEntryCategory(e.target.value as BlogArticle['category'])
                  }
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3 space-y-1">
                <label
                  htmlFor="cs-entry-slug"
                  className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  Kalıcı Bağlantı (Slug)
                </label>
                <input
                  id="cs-entry-slug"
                  type="text"
                  value={entrySlug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setEntrySlug(slugifyStudioText(e.target.value));
                  }}
                  placeholder="ornek-seo-rehberi"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 font-mono text-xs text-neutral-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label
                  htmlFor="cs-entry-focus-kw"
                  className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  Odak Anahtar Kelime
                </label>
                <input
                  id="cs-entry-focus-kw"
                  type="text"
                  value={entryFocusKeyword}
                  onChange={(e) => setEntryFocusKeyword(e.target.value)}
                  placeholder="anahtar kelime"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label
                  htmlFor="cs-entry-author"
                  className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  Yazar Adı
                </label>
                <input
                  id="cs-entry-author"
                  data-testid="cs-entry-author"
                  type="text"
                  value={entryAuthor}
                  onChange={(e) => setEntryAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label
                  htmlFor="cs-entry-date"
                  className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  Yayın Tarihi
                </label>
                <input
                  id="cs-entry-date"
                  data-testid="cs-entry-date"
                  type="date"
                  value={entryPublishedIso}
                  onChange={(e) => setEntryPublishedIso(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 font-mono text-xs text-neutral-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="cs-entry-meta"
                  className="font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  SEO Meta Açıklaması (&lt;meta name=&quot;description&quot;&gt;)
                </label>
                <span
                  className={`font-mono tabular-nums ${
                    liveAudit.metaDescriptionOptimal
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {liveAudit.metaDescriptionLength}/158 kr
                </span>
              </div>
              <textarea
                id="cs-entry-meta"
                data-testid="cs-entry-meta"
                rows={2}
                value={entryMetaDescription}
                onChange={(e) => setEntryMetaDescription(e.target.value)}
                placeholder="Arama sonuçlarında başlığın altında görünecek 120–158 karakterlik ikna edici özet..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white leading-relaxed focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="cs-entry-body"
                  className="font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  Makale / Sayfa İçerik Gövdesi (## Alt Başlık Destekli)
                </label>
                <span className="font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                  {liveAudit.wordCount} kelime · ~{liveAudit.readTimeMin} dk okuma
                </span>
              </div>
              <textarea
                id="cs-entry-body"
                data-testid="cs-entry-body"
                rows={7}
                value={entryBody}
                onChange={(e) => setEntryBody(e.target.value)}
                placeholder={
                  '## 01. Giriş ve Temel Strateji\nSitenizde yayınlanacak içeriği buraya girin veya yukarıdaki AI üreticiden tek tıkla aktarın...'
                }
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white leading-relaxed focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {publishError && (
              <p
                role="alert"
                data-testid="cs-publish-error"
                className="text-xs font-medium text-rose-600 dark:text-rose-400"
              >
                {publishError}
              </p>
            )}

            {publishNotice && (
              <div
                role="status"
                data-testid="cs-publish-success"
                className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200"
              >
                <span>{publishNotice.message}</span>
                {publishNotice.status === 'published' &&
                  publishNotice.articleId && (
                    <button
                      type="button"
                      data-testid="cs-view-in-blog-btn"
                      onClick={() =>
                        onOpenPublishedInBlog(publishNotice.articleId!)
                      }
                      className="font-semibold underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <span>Blog Sekmesinde Görüntüle</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleSubmitEntry('draft')}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap"
              >
                Taslak Olarak Kaydet
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {entryTitle.trim().length > 4 && (
                  <button
                    type="button"
                    onClick={() =>
                      onAskAiInChat(
                        `"${entryTitle}" başlıklı ve "${entryFocusKeyword || entryTitle}" anahtar kelimeli makalemizi örnekler, kontrol listesi ve SSS şemasıyla zenginleştir.`,
                        'gemini-4-argon'
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap"
                  >
                    Sohbette Derinleştir
                  </button>
                )}

                <button
                  type="button"
                  data-testid="cs-publish-btn"
                  disabled={isSaving}
                  onClick={() => handleSubmitEntry('published')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {editingArticleId
                      ? 'Güncellemeyi Sitede Yayınla'
                      : 'Doğrudan Sitede Yayınla'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Live Google SERP Preview + Real-Time SEO Checklist */}
        <section className="lg:col-span-5 p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Canlı Arama Sonucu (SERP) Önizlemesi & SEO Skoru
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                İçeriğiniz yayınlandığında Google arama sonuçlarında nasıl görüneceğini anlık izleyin.
              </p>
            </div>
            <div
              data-testid="cs-live-seo-score"
              className="text-right tabular-nums shrink-0"
            >
              <div
                className={`text-2xl font-bold ${
                  liveAudit.overallScore >= 80
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : liveAudit.overallScore >= 50
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {liveAudit.overallScore}/100
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Canlı İçerik Skoru
              </div>
            </div>
          </div>

          {/* Realistic SERP Snippet Preview */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#141518] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate font-mono">{previewUrl}</span>
            </div>
            <div className="text-sm sm:text-base font-semibold text-[#1a0dab] dark:text-blue-400 leading-snug line-clamp-2">
              {entryTitle.trim() ||
                'Örnek Blog Başlığı – SEO Uyumlu İçerik Stüdyosu | Luxo AI'}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
              {entryMetaDescription.trim() ||
                'Yukarıdaki üreticiden bir meta açıklama seçtiğinizde veya yazdığınızda Google arama önizlemesi burada gerçek zamanlı olarak güncellenir.'}
            </p>
          </div>

          {/* Checklist Diagnostics */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border-t border-b border-neutral-100 dark:border-neutral-800 text-xs">
            <div className="py-2.5 flex items-center justify-between gap-3">
              <span className="text-neutral-700 dark:text-neutral-300">
                Başlık Uzunluğu (30–60 karakter)
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  liveAudit.titleOptimal
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {liveAudit.titleLength} kr ·{' '}
                {liveAudit.titleOptimal ? 'Uygun' : 'Düzenlenmeli'}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between gap-3">
              <span className="text-neutral-700 dark:text-neutral-300">
                Meta Açıklama Uzunluğu (120–158 karakter)
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  liveAudit.metaDescriptionOptimal
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {liveAudit.metaDescriptionLength} kr ·{' '}
                {liveAudit.metaDescriptionOptimal ? 'Uygun' : 'Düzenlenmeli'}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between gap-3">
              <span className="text-neutral-700 dark:text-neutral-300">
                Başlık ve Metada Anahtar Kelime Eşleşmesi
              </span>
              <span
                className={`font-semibold ${
                  liveAudit.keywordInTitle && liveAudit.keywordInMeta
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {liveAudit.keywordInTitle && liveAudit.keywordInMeta
                  ? 'Tam Eşleşme'
                  : 'Kısmi / Eksik'}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between gap-3">
              <span className="text-neutral-700 dark:text-neutral-300">
                Anahtar Kelime Yoğunluğu &amp; Okuma Süresi
              </span>
              <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                %{liveAudit.keywordDensityPct} · {liveAudit.readTimeMin} dk
              </span>
            </div>
          </div>

          {/* HTML Meta Code Copy Action */}
          <button
            type="button"
            onClick={() =>
              handleCopy(
                'html-meta-snippet',
                `<title>${entryTitle || 'Sayfa Başlığı'}</title>\n<meta name="description" content="${entryMetaDescription || ''}" />\n<link rel="canonical" href="${previewUrl}" />`
              )
            }
            className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copiedId === 'html-meta-snippet' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>HTML Meta Etiket Kodu Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>HTML &lt;meta&gt; Etiket Kodunu Kopyala</span>
              </>
            )}
          </button>
        </section>
      </div>

      {/* SECTION 03: Directly Published & Draft Site Contents Table */}
      <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              03. Sitede Yayınlanan &amp; Taslak İçerikler ({studioArticles.length})
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              İçerik Stüdyosu üzerinden doğrudan siteye girilen tüm makaleler ve taslak kayıtları.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Site içeriklerinde ara"
              placeholder="Başlık veya kelime ara..."
              className="px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
            />
            <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-[#202227]">
              {(
                [
                  { id: 'all', label: 'Tümü' },
                  { id: 'published', label: 'Yayında' },
                  { id: 'draft', label: 'Taslak' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    statusFilter === f.id
                      ? 'bg-white dark:bg-[#141518] text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center space-y-2 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Seçili filtreye uygun içerik kaydı bulunamadı.
            </p>
          </div>
        ) : (
          <div
            data-testid="cs-published-list"
            className="divide-y divide-neutral-100 dark:divide-neutral-800 border-t border-neutral-100 dark:border-neutral-800"
          >
            {filteredEntries.map((art) => (
              <article
                key={art.id}
                className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                    <span
                      className={
                        art.status === 'published'
                          ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                          : 'font-semibold text-amber-700 dark:text-amber-400'
                      }
                    >
                      {art.status === 'published' ? 'Yayında' : 'Taslak'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{art.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>SEO Skoru: {art.seoScore}/100</span>
                    <span aria-hidden="true">·</span>
                    <span>{art.publishedIso}</span>
                    <span aria-hidden="true">·</span>
                    <span>{art.authorName}</span>
                  </div>

                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {art.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-2">
                    {art.metaDescription}
                  </p>
                  <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                    /?view=hub&amp;article={art.slug} · Anahtar kelime: {art.focusKeyword}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <QuickSocialShareButtons
                    compact
                    payload={{
                      title: art.title,
                      excerpt: art.metaDescription || art.summary,
                      contentType: 'blog',
                      badge: `CMS · ${art.category}`,
                    }}
                  />
                  {art.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => onOpenPublishedInBlog(art.id)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <span>Sitede Oku</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleLoadForEdit(art)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer whitespace-nowrap"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(art.id)}
                    aria-label={`İçeriği sil: ${art.title}`}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="w-full pt-2">
                  <ContentRatingAndComments
                    compact
                    contentKey={`cms:${art.id}`}
                    contentTitle={art.title}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
export default ContentStudioWorkspace;
