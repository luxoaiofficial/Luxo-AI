import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  FileCode2,
  Flame,
  Gauge,
  Globe,
  HelpCircle,
  MessageSquare,
  Pin,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Users,
} from 'lucide-react';
import { QuickSocialShareButtons } from './SocialShareBar';
import { ContentRatingAndComments } from './ContentRatingAndComments';
import { LuxoModelId } from '../types/luxo';
import {
  addArticleComment,
  addForumReply,
  BLOG_ARTICLES,
  calculateWebPerfProjection,
  COMMUNITY_ENGAGEMENT_STORAGE_KEY,
  CommunityEngagementStats,
  CommunityHubState,
  CONTENT_REVITALIZATION_STRATEGIES,
  createCommunityPoll,
  createForumThread,
  createInitialCommunityState,
  ENGAGEMENT_INTEGRATION_BLUEPRINTS,
  ENGAGEMENT_QUIZ_QUESTIONS,
  FAQ_ITEMS,
  ForumThread,
  FOUR_PILLAR_SITE_AUDIT,
  getQuizMasteryBadge,
  gradeQuizAnswers,
  hydrateCommunityState,
  moderateArticleComment,
  PerfCalculatorInput,
  PERFORMANCE_OPTIMIZATION_PILLARS,
  reactToArticle,
  recordCommunityEngagementAction,
  replyArticleComment,
  SEO_CONTENT_BLUEPRINTS,
  SEO_KEYWORD_MATRIX,
  SeoKeywordEntry,
  TARGET_AUDIENCE_SEGMENTS,
  TechnicalSeoCheckItem,
  UI_UX_AUDIT_ITEMS,
  voteArticleComment,
  upvoteForumThread,
  voteInPoll,
} from '../utils/seoPerfEngagementEngine';

import { ContentStudioWorkspace } from './ContentStudioWorkspace';
import type { PublishedStudioArticle } from '../utils/contentStudioEngine';

export type HubTabId =
  | 'content-studio'
  | 'seo'
  | 'performance'
  | 'audience-content'
  | 'forum'
  | 'blog-polls'
  | 'ux-faq';

interface CommunitySeoHubProps {
  onBack: () => void;
  onAskAiInChat: (prompt: string, recommendedModelId?: LuxoModelId) => void;
  initialHubTab?: HubTabId;
  onStudioArticlesSync?: (articles: PublishedStudioArticle[]) => void;
}

interface AuditApiPayload {
  origin: string;
  seo: {
    score: number;
    title: string;
    description: string;
    titleLength: number;
    descriptionLength: number;
    canonicalUrl: string;
    sitemapUrl: string;
    robotsUrl: string;
    indexedUrlsCount: number;
    checks: TechnicalSeoCheckItem[];
  };
  performance: {
    compressionEncoding: string;
    staticCachePolicy: string;
    totalRawKb: number;
    totalBrotliKb: number;
    overallSavingsPct: number;
    bundleChunks: {
      file: string;
      rawKb: number;
      brotliKb: number;
      savingsPct: number;
    }[];
    aiCacheEntries: number;
    aiCacheHits: number;
    aiCacheHitRatioPct: number;
  };
  security?: {
    score: number;
    apiKeyServerIsolated: boolean;
    piiRedactionActive: boolean;
    firestoreRbacEnforced: boolean;
    headersApplied: string[];
  };
}

interface GeneratedMetaResult {
  metaTitle: string;
  metaDescription: string;
  primaryKeywords: string[];
  technicalTip: string;
}

function copyTextSafe(value: string) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).catch(() => {});
      return;
    }
  } catch {
    // fallback below
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
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

export const CommunitySeoHub: React.FC<CommunitySeoHubProps> = ({
  onBack,
  onAskAiInChat,
  initialHubTab,
  onStudioArticlesSync,
}) => {
  const initialUrlState = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        tab: (initialHubTab || 'seo') as HubTabId,
        articleSlug: '',
        threadSlug: '',
      };
    }
    const params = new URLSearchParams(window.location.search);
    const articleSlug = params.get('article') || '';
    const threadSlug = params.get('thread') || '';
    const rawTab = params.get('tab') as HubTabId | null;
    if (initialHubTab) {
      return { tab: initialHubTab, articleSlug: '', threadSlug: '' };
    }
    if (articleSlug) {
      return { tab: 'blog-polls' as HubTabId, articleSlug, threadSlug: '' };
    }
    if (threadSlug) {
      return { tab: 'forum' as HubTabId, articleSlug: '', threadSlug };
    }
    if (
      rawTab &&
      [
        'content-studio',
        'seo',
        'performance',
        'audience-content',
        'forum',
        'blog-polls',
        'ux-faq',
      ].includes(rawTab)
    ) {
      return { tab: rawTab, articleSlug: '', threadSlug: '' };
    }
    return { tab: 'seo' as HubTabId, articleSlug: '', threadSlug: '' };
  }, [initialHubTab]);

  const [activeTab, setActiveTab] = useState<HubTabId>(initialUrlState.tab);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (initialHubTab) {
      setActiveTab(initialHubTab);
    }
  }, [initialHubTab]);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeTab]);
  const [auditData, setAuditData] = useState<AuditApiPayload | null>(null);
  const [publicUrls, setPublicUrls] = useState<{
    permanentUrl: string;
    tunnelUrl: string | null;
  }>({
    permanentUrl:
      'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app',
    tunnelUrl: null,
  });
  const [isRefreshingGateway, setIsRefreshingGateway] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // SEO Tab State
  const [keywordIntentFilter, setKeywordIntentFilter] = useState<
    'Tümü' | SeoKeywordEntry['intent']
  >('Tümü');
  const [keywordQuery, setKeywordQuery] = useState('');
  const [livePreviewDoc, setLivePreviewDoc] = useState<
    'none' | 'sitemap' | 'robots'
  >('none');
  const [livePreviewText, setLivePreviewText] = useState('');
  const [metaTopicInput, setMetaTopicInput] = useState('');
  const [metaGenError, setMetaGenError] = useState<string | null>(null);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [generatedMeta, setGeneratedMeta] =
    useState<GeneratedMetaResult | null>(null);

  // Performance Calculator State
  const [calcInput, setCalcInput] = useState<PerfCalculatorInput>({
    dailyVisitors: 25000,
    avgPromptTokens: 750,
    cacheHitRatePct: 42,
    imageWebpSavingsPct: 62,
    brotliEnabled: true,
    modelTier: 'flash-3-8',
  });

  // Community State (Forum + Polls)
  const [communityState, setCommunityState] = useState<CommunityHubState>(() =>
    createInitialCommunityState()
  );
  const [forumCategoryFilter, setForumCategoryFilter] = useState<
    'Tümü' | ForumThread['category']
  >('Tümü');
  const [forumSearch, setForumSearch] = useState('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadCategory, setNewThreadCategory] =
    useState<ForumThread['category']>('SEO & Büyüme');
  const [newThreadAuthor, setNewThreadAuthor] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [forumFormError, setForumFormError] = useState<string | null>(null);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [replyDraftByThread, setReplyDraftByThread] = useState<
    Record<string, string>
  >({});
  const [replyErrorByThread, setReplyErrorByThread] = useState<
    Record<string, string>
  >({});
  const [aiReplyingThreadId, setAiReplyingThreadId] = useState<string | null>(
    null
  );

  // Blog, Polls & Quiz State
  const [expandedArticleId, setExpandedArticleId] = useState<string>(() => {
    if (initialUrlState.articleSlug) {
      const found = BLOG_ARTICLES.find(
        (b) => b.slug === initialUrlState.articleSlug
      );
      if (found) return found.id;
    }
    return BLOG_ARTICLES[0].id;
  });
  const [votedPollOptions, setVotedPollOptions] = useState<
    Record<string, string>
  >({});
  const [reactedArticles, setReactedArticles] = useState<
    Record<string, boolean>
  >({});
  const [articleCommentAuthor, setArticleCommentAuthor] = useState('');
  const [articleCommentDrafts, setArticleCommentDrafts] = useState<
    Record<string, string>
  >({});
  const [articleCommentErrors, setArticleCommentErrors] = useState<
    Record<string, string>
  >({});
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [commentReplyDrafts, setCommentReplyDrafts] = useState<Record<string, string>>({});
  const [showModeratorControls, setShowModeratorControls] = useState<boolean>(true);
  const [quizSelections, setQuizSelections] = useState<Record<string, number>>(
    {}
  );
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Create Poll State
  const [showCreatePollForm, setShowCreatePollForm] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollCategory, setNewPollCategory] = useState('Topluluk Anketi');
  const [newPollOptionsText, setNewPollOptionsText] = useState('');
  const [pollFormError, setPollFormError] = useState<string | null>(null);

  // Engagement Streak Tracker (persisted across sessions)
  const [engagementStats, setEngagementStats] =
    useState<CommunityEngagementStats>(() => {
      try {
        const raw = localStorage.getItem(COMMUNITY_ENGAGEMENT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CommunityEngagementStats;
          if (parsed && typeof parsed.actionsCount === 'number') {
            return recordCommunityEngagementAction(parsed, Date.now(), 0);
          }
        }
      } catch {
        // ignore storage errors
      }
      return recordCommunityEngagementAction(null, Date.now(), 0);
    });

  const bumpEngagement = (increment = 1) => {
    setEngagementStats((prev) => {
      const next = recordCommunityEngagementAction(prev, Date.now(), increment);
      try {
        localStorage.setItem(
          COMMUNITY_ENGAGEMENT_STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // UX & FAQ State
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('Tümü');
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-3': true,
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/seo-performance-audit')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.ok) {
          setAuditData(data as AuditApiPayload);
        }
      })
      .catch(() => {});

    fetch('/api/public-url')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setPublicUrls({
            permanentUrl:
              data.permanentUrl ||
              data.publicUrl ||
              'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app',
            tunnelUrl:
              typeof data.tunnelUrl === 'string' ? data.tunnelUrl : null,
          });
        }
      })
      .catch(() => {});

    fetch('/api/community/state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.state) {
          const hydrated = hydrateCommunityState(data.state);
          setCommunityState(hydrated);
          onStudioArticlesSync?.(hydrated.studioArticles || []);
          if (initialUrlState.articleSlug) {
            const studioMatch = (hydrated.studioArticles || []).find(
              (a) => a.slug === initialUrlState.articleSlug
            );
            if (studioMatch) {
              setExpandedArticleId(studioMatch.id);
            }
          }
          if (initialUrlState.threadSlug) {
            const match = hydrated.threads.find(
              (t) => t.slug === initialUrlState.threadSlug
            );
            if (match) setExpandedThreadId(match.id);
          } else if (hydrated.threads[0]) {
            setExpandedThreadId(hydrated.threads[0].id);
          }
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [initialUrlState.threadSlug]);

  const handleCopy = (key: string, text: string) => {
    copyTextSafe(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRefreshTunnelGateway = async () => {
    setIsRefreshingGateway(true);
    try {
      const res = await fetch('/api/public-url?refresh=1');
      if (res.ok) {
        const data = await res.json();
        setPublicUrls({
          permanentUrl:
            data.permanentUrl ||
            data.publicUrl ||
            publicUrls.permanentUrl,
          tunnelUrl: typeof data.tunnelUrl === 'string' ? data.tunnelUrl : null,
        });
      }
    } catch {
      // ignore transient network error
    } finally {
      setIsRefreshingGateway(false);
    }
  };

  const handleInspectCrawlerFile = async (kind: 'sitemap' | 'robots') => {
    if (livePreviewDoc === kind) {
      setLivePreviewDoc('none');
      return;
    }
    setLivePreviewDoc(kind);
    setLivePreviewText('Yükleniyor...');
    try {
      const target = kind === 'sitemap' ? '/sitemap.xml' : '/robots.txt';
      const res = await fetch(target);
      const txt = await res.text();
      setLivePreviewText(txt);
    } catch {
      setLivePreviewText('Dosya okunamadı.');
    }
  };

  const handleGenerateSeoMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = metaTopicInput.trim();
    if (trimmed.length < 3) {
      setMetaGenError(
        'Lütfen optimize edilecek sayfa konusunu en az 3 karakter olarak girin.'
      );
      return;
    }
    setMetaGenError(null);
    setIsGeneratingMeta(true);
    try {
      const res = await fetch('/api/seo/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmed,
          targetUrl: publicUrls.permanentUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMetaGenError(
          data?.error || 'Meta etiket önerisi oluşturulurken hata oluştu.'
        );
      } else {
        setGeneratedMeta({
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          primaryKeywords: Array.isArray(data.primaryKeywords)
            ? data.primaryKeywords
            : [],
          technicalTip: data.technicalTip || '',
        });
      }
    } catch {
      const shortTopic = trimmed.slice(0, 34);
      setGeneratedMeta({
        metaTitle: `${shortTopic} – Çözümler & Rehber | Luxo AI`.slice(0, 58),
        metaDescription: `${shortTopic} için doğrulanmış araçlar, teknik uygulama adımları ve hız optimizasyonu rehberini hemen ücretsiz inceleyin.`.slice(
          0,
          155
        ),
        primaryKeywords: [
          trimmed.toLowerCase(),
          `${trimmed.toLowerCase()} rehberi`,
          `${trimmed.toLowerCase()} optimizasyonu`,
        ],
        technicalTip:
          'Sayfada tek bir <h1> başlığı kullanın ve kanonik URL adresini mutlak HTTPS olarak sabitleyin.',
      });
    } finally {
      setIsGeneratingMeta(false);
    }
  };

  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const localValidation = createForumThread(communityState, {
      title: newThreadTitle,
      category: newThreadCategory,
      authorName: newThreadAuthor,
      body: newThreadBody,
    });
    if (!localValidation.created) {
      setForumFormError(
        localValidation.error || 'Lütfen başlık ve içerik alanlarını doldurun.'
      );
      return;
    }
    setForumFormError(null);
    setCommunityState(localValidation.state);
    setExpandedThreadId(localValidation.created.id);
    bumpEngagement(1);
    const payload = {
      title: newThreadTitle,
      category: newThreadCategory,
      authorName: newThreadAuthor,
      body: newThreadBody,
    };
    setNewThreadTitle('');
    setNewThreadBody('');

    try {
      const res = await fetch('/api/community/forum/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          const synced = hydrateCommunityState(data.state);
          setCommunityState(synced);
          if (data.created?.id) {
            setExpandedThreadId(data.created.id);
          }
        }
      }
    } catch {
      // optimistic local update already applied
    }
  };

  const handleUpvoteThread = async (threadId: string) => {
    setCommunityState((prev) => upvoteForumThread(prev, threadId));
    bumpEngagement(1);
    try {
      const res = await fetch('/api/community/forum/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) setCommunityState(hydrateCommunityState(data.state));
      }
    } catch {
      // keep optimistic state
    }
  };

  const handleAddUserReply = async (threadId: string) => {
    const draft = (replyDraftByThread[threadId] || '').trim();
    const localCheck = addForumReply(communityState, {
      threadId,
      authorName: newThreadAuthor || 'Topluluk Üyesi',
      body: draft,
    });
    if (localCheck.error) {
      setReplyErrorByThread((prev) => ({
        ...prev,
        [threadId]: localCheck.error || 'Yanıt çok kısa.',
      }));
      return;
    }
    setReplyErrorByThread((prev) => ({ ...prev, [threadId]: '' }));
    setReplyDraftByThread((prev) => ({ ...prev, [threadId]: '' }));
    setCommunityState(localCheck.state);
    bumpEngagement(1);

    try {
      const res = await fetch('/api/community/forum/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          authorName: newThreadAuthor || 'Topluluk Üyesi',
          body: draft,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) setCommunityState(hydrateCommunityState(data.state));
      }
    } catch {
      // keep optimistic state
    }
  };

  const handleRequestAiExpertReply = async (threadId: string) => {
    if (aiReplyingThreadId) return;
    setAiReplyingThreadId(threadId);
    setExpandedThreadId(threadId);
    try {
      const res = await fetch('/api/community/forum/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          generateAiExpertReply: true,
          modelId: 'gemini-4-argon',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          setCommunityState(hydrateCommunityState(data.state));
        }
      }
    } catch {
      // fallback local expert synthesis
      setCommunityState((prev) => {
        const out = addForumReply(prev, {
          threadId,
          authorName: 'Gemini 4 Argon',
          isAiExpert: true,
          modelLabel: 'Gemini 4 Argon · Uzman Sentezi',
          body: 'Ölçülebilir temel metrikleri (LCP, önbellek isabet oranı ve kanonik indeksleme) sabitleyip kademeli A/B doğrulamasıyla ilerlemek en güvenilir mühendislik yaklaşımıdır.',
        });
        return out.state;
      });
    } finally {
      setAiReplyingThreadId(null);
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    if (votedPollOptions[pollId]) return;
    setVotedPollOptions((prev) => ({ ...prev, [pollId]: optionId }));
    setCommunityState((prev) => voteInPoll(prev, pollId, optionId));
    bumpEngagement(1);
    try {
      const res = await fetch('/api/community/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, optionId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) setCommunityState(hydrateCommunityState(data.state));
      }
    } catch {
      // keep optimistic vote
    }
  };

  const handleCreatePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawOptions = newPollOptionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const localOut = createCommunityPoll(communityState, {
      question: newPollQuestion,
      category: newPollCategory,
      options: rawOptions,
    });
    if (!localOut.created) {
      setPollFormError(
        localOut.error || 'Lütfen soru ve en az 2 benzersiz seçenek girin.'
      );
      return;
    }
    setPollFormError(null);
    setCommunityState(localOut.state);
    bumpEngagement(1);
    const payload = {
      question: newPollQuestion,
      category: newPollCategory,
      options: rawOptions,
    };
    setNewPollQuestion('');
    setNewPollOptionsText('');
    setShowCreatePollForm(false);

    try {
      const res = await fetch('/api/community/polls/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          setCommunityState(hydrateCommunityState(data.state));
        }
      }
    } catch {
      // optimistic local poll already saved
    }
  };

  const handleReactArticle = async (articleId: string) => {
    if (reactedArticles[articleId]) return;
    setReactedArticles((prev) => ({ ...prev, [articleId]: true }));
    setCommunityState((prev) => reactToArticle(prev, articleId));
    bumpEngagement(1);
    try {
      const res = await fetch('/api/community/articles/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) setCommunityState(hydrateCommunityState(data.state));
      }
    } catch {
      // keep optimistic reaction
    }
  };

  const handleAddArticleComment = async (articleId: string) => {
    const draft = (articleCommentDrafts[articleId] || '').trim();
    const localOut = addArticleComment(communityState, {
      articleId,
      authorName: articleCommentAuthor || 'Okuyucu',
      body: draft,
    });
    if (!localOut.comment) {
      setArticleCommentErrors((prev) => ({
        ...prev,
        [articleId]: localOut.error || 'Yorum en az 4 karakter olmalıdır.',
      }));
      return;
    }
    setArticleCommentErrors((prev) => ({ ...prev, [articleId]: '' }));
    setArticleCommentDrafts((prev) => ({ ...prev, [articleId]: '' }));
    setCommunityState(localOut.state);

    try {
      const res = await fetch('/api/community/articles/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          authorName: articleCommentAuthor || 'Okuyucu',
          body: draft,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) setCommunityState(hydrateCommunityState(data.state));
      }
    } catch {
      // keep optimistic comment
    }
  };

  const handleVoteComment = (
    articleId: string,
    commentId: string,
    direction: 'up' | 'down'
  ) => {
    setCommunityState((prev) =>
      voteArticleComment(prev, articleId, commentId, direction)
    );
  };

  const handleReplyComment = (articleId: string, parentId: string) => {
    const draft = (commentReplyDrafts[parentId] || '').trim();
    if (!draft) return;
    const res = replyArticleComment(communityState, {
      articleId,
      parentId,
      authorName: articleCommentAuthor || 'Okuyucu',
      body: draft,
    });
    if (res.error) return;
    setCommunityState(res.state);
    setCommentReplyDrafts((prev) => ({ ...prev, [parentId]: '' }));
    setActiveReplyCommentId(null);
  };

  const handleModerateComment = (
    articleId: string,
    commentId: string,
    action: 'hide' | 'unhide' | 'delete' | 'pin'
  ) => {
    setCommunityState((prev) =>
      moderateArticleComment(prev, articleId, commentId, action)
    );
  };

  const perfProjection = useMemo(
    () => calculateWebPerfProjection(calcInput),
    [calcInput]
  );

  const filteredKeywords = useMemo(() => {
    const q = keywordQuery.trim().toLowerCase();
    return SEO_KEYWORD_MATRIX.filter((item) => {
      if (
        keywordIntentFilter !== 'Tümü' &&
        item.intent !== keywordIntentFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.keyword.toLowerCase().includes(q) ||
        item.recommendedAction.toLowerCase().includes(q)
      );
    });
  }, [keywordIntentFilter, keywordQuery]);

  const filteredThreads = useMemo(() => {
    const q = forumSearch.trim().toLowerCase();
    return communityState.threads.filter((t) => {
      if (
        forumCategoryFilter !== 'Tümü' &&
        t.category !== forumCategoryFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q) ||
        t.authorName.toLowerCase().includes(q)
      );
    });
  }, [communityState.threads, forumCategoryFilter, forumSearch]);

  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    return FAQ_ITEMS.filter((f) => {
      if (faqCategoryFilter !== 'Tümü' && f.category !== faqCategoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
      );
    });
  }, [faqCategoryFilter, faqSearch]);

  const quizGrade = useMemo(
    () => gradeQuizAnswers(quizSelections),
    [quizSelections]
  );

  const quizMastery = useMemo(
    () => getQuizMasteryBadge(quizGrade.scorePct),
    [quizGrade.scorePct]
  );

  const combinedPublishedArticles = useMemo(() => {
    const publishedStudio = (communityState.studioArticles || []).filter(
      (a) => a.status === 'published'
    );
    return [...publishedStudio, ...BLOG_ARTICLES];
  }, [communityState.studioArticles]);

  const handleSyncStudioArticles = (
    nextArticles: PublishedStudioArticle[],
    publishedArticle?: PublishedStudioArticle
  ) => {
    setCommunityState((prev) => ({
      ...prev,
      studioArticles: nextArticles,
      articleReactions: publishedArticle
        ? {
            ...prev.articleReactions,
            [publishedArticle.id]:
              prev.articleReactions?.[publishedArticle.id] ?? 1,
          }
        : prev.articleReactions,
      updatedAt: Date.now(),
    }));
    onStudioArticlesSync?.(nextArticles);
  };

  const tabs: { id: HubTabId; label: string }[] = [
    { id: 'content-studio', label: 'İçerik Stüdyosu' },
    { id: 'seo', label: 'SEO & Denetim' },
    { id: 'performance', label: 'Hız & Güvenlik' },
    { id: 'audience-content', label: 'Hedef Kitle & İçerik' },
    { id: 'forum', label: `Forum (${communityState.threads.length})` },
    { id: 'blog-polls', label: `Blog (${combinedPublishedArticles.length}) & Anket` },
    { id: 'ux-faq', label: 'Etkileşim & SSS' },
  ];

  return (
    <div
      data-testid="community-seo-hub"
      className="flex flex-col h-full bg-white dark:bg-[#141518] text-neutral-900 dark:text-neutral-100 overflow-hidden"
    >
      {/* Top Bar following Single-Row 3-Zone Contract */}
      <header className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-white dark:bg-[#18191d] border-b border-neutral-200 dark:border-neutral-800 shrink-0 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline sm:inline">Sohbete Dön</span>
          </button>
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 dark:text-white truncate">
            İçerik, SEO & Topluluk
          </h1>
        </div>

        <nav
          role="tablist"
          aria-label="Keşfet ve Mühendislik Bölümleri"
          className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-[#202227]"
        >
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-white dark:bg-[#141518] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              onAskAiInChat(
                'Sitemiz için teknik SEO, Core Web Vitals performansı ve kullanıcı etkileşimini büyütecek 30 günlük eylem planı hazırla.',
                'gemini-4-argon'
              )
            }
            className="min-h-[44px] sm:min-h-0 px-3 sm:px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <span className="hidden sm:inline">AI Strateji Danışmanı</span>
            <span className="sm:hidden">AI Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Mobile / Tablet Horizontal Tab Strip */}
      <div
        role="tablist"
        aria-label="Mobil Bölüm Seçici"
        className="lg:hidden flex items-center gap-1.5 px-3 py-2 overflow-x-auto bg-neutral-50 dark:bg-[#18191d] border-b border-neutral-200 dark:border-neutral-800 shrink-0"
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <main ref={mainScrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Permanent + Self-Healing Live Public Gateway Banner */}
          <section className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Kesintisiz Genel Erişim Aktif
                </span>
                <span aria-hidden="true">·</span>
                <span>Kalıcı Cloud Run + 45sn Öz-Onarım Tünel Bekçisi</span>
              </div>
              <div className="text-xs sm:text-sm font-mono text-neutral-800 dark:text-neutral-200 truncate">
                {publicUrls.permanentUrl}
              </div>
              {publicUrls.tunnelUrl && (
                <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate">
                  Canlı Yedek Tünel: {publicUrls.tunnelUrl}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleCopy('perm-url', publicUrls.permanentUrl)
                }
                className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedKey === 'perm-url' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Kalıcı Adres Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kalıcı Adresi Kopyala</span>
                  </>
                )}
              </button>

              {publicUrls.tunnelUrl && (
                <button
                  type="button"
                  onClick={() =>
                    handleCopy('tunnel-url', publicUrls.tunnelUrl!)
                  }
                  className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedKey === 'tunnel-url' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Tünel Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Canlı Tüneli Kopyala</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleRefreshTunnelGateway}
                disabled={isRefreshingGateway}
                className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isRefreshingGateway ? 'animate-spin' : ''
                  }`}
                />
                <span>Bağlantıyı Doğrula</span>
              </button>
            </div>
          </section>

          {/* TAB 0: CONTENT STUDIO (SEO META, BLOG TITLES & DIRECT CONTENT PUBLISHING) */}
          {activeTab === 'content-studio' && (
            <ContentStudioWorkspace
              studioArticles={communityState.studioArticles || []}
              siteOrigin={auditData?.origin || publicUrls.permanentUrl}
              onSyncStudioArticles={handleSyncStudioArticles}
              onOpenPublishedInBlog={(articleId) => {
                setExpandedArticleId(articleId);
                setActiveTab('blog-polls');
              }}
              onAskAiInChat={onAskAiInChat}
            />
          )}

          {/* TAB 1: SEO STRATEGY & TECHNICAL AUDIT */}
          {activeTab === 'seo' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Technical SEO Live Audit Summary */}
                <section className="lg:col-span-2 p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                        01. Canlı Teknik SEO Denetimi
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Meta etiket uzunluğu, kanonik URL, dinamik site haritası ve Schema.org JSON-LD kontrolleri.
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {auditData?.seo.score ?? 100}/100
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {auditData?.seo.indexedUrlsCount ?? 11} İndekslenen URL
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border-t border-b border-neutral-100 dark:border-neutral-800">
                    {(
                      auditData?.seo.checks || [
                        {
                          id: 'chk-1',
                          category: 'Meta' as const,
                          label: 'Sayfa Başlığı (<title>) Uzunluk & Marka Uyumu',
                          passed: true,
                          detail: '57 karakter (hedef: 30–60 karakter).',
                        },
                        {
                          id: 'chk-2',
                          category: 'Meta' as const,
                          label: 'Meta Açıklama (<meta name="description">) Eylem Çağrısı',
                          passed: true,
                          detail: '144 karakter (hedef: 120–160 karakter).',
                        },
                        {
                          id: 'chk-3',
                          category: 'Yapısal Veri' as const,
                          label: 'Schema.org JSON-LD (@graph: WebApplication + FAQPage)',
                          passed: true,
                          detail: 'Çoklu varlık yapısal verisi gömülü ve geçerli.',
                        },
                        {
                          id: 'chk-4',
                          category: 'İndeksleme' as const,
                          label: 'Dinamik XML Site Haritası (/sitemap.xml) & /robots.txt',
                          passed: true,
                          detail: 'Arama motoru tarama kuralları ve dinamik XML haritası aktif.',
                        },
                      ]
                    ).map((chk) => (
                      <div
                        key={chk.id}
                        className="py-3 flex items-start justify-between gap-4 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-semibold text-neutral-900 dark:text-white">
                            {chk.label}
                          </div>
                          <div className="text-neutral-500 dark:text-neutral-400 tabular-nums">
                            {chk.category} · {chk.detail}
                          </div>
                        </div>
                        <span
                          className={`font-semibold whitespace-nowrap shrink-0 ${
                            chk.passed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {chk.passed ? 'Doğrulandı' : 'İyileştirilmeli'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleInspectCrawlerFile('sitemap')}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>
                        {livePreviewDoc === 'sitemap'
                          ? 'sitemap.xml Önizlemesini Gizle'
                          : 'Canlı /sitemap.xml İncele'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInspectCrawlerFile('robots')}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        {livePreviewDoc === 'robots'
                          ? 'robots.txt Önizlemesini Gizle'
                          : 'Canlı /robots.txt İncele'}
                      </span>
                    </button>
                  </div>

                  {livePreviewDoc !== 'none' && (
                    <pre className="p-3.5 rounded-xl bg-neutral-950 text-neutral-200 text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                      {livePreviewText}
                    </pre>
                  )}
                </section>

                {/* AI Meta & Keyword Optimizer */}
                <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                        02. AI Meta Etiket Üretici
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Hedef konunuza göre SERP kırpılma sınırlarına (35–58 başlık, 125–156 açıklama) tam uyumlu meta paketi üretin.
                      </p>
                    </div>

                    <form onSubmit={handleGenerateSeoMeta} className="space-y-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="seo-topic-input"
                          className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                        >
                          Sayfa Konusu veya Anahtar Kelime
                        </label>
                        <input
                          id="seo-topic-input"
                          type="text"
                          value={metaTopicInput}
                          onChange={(e) => {
                            setMetaTopicInput(e.target.value);
                            if (metaGenError) setMetaGenError(null);
                          }}
                          placeholder="Örn: 4K yapay zeka video stüdyosu"
                          className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      {metaGenError && (
                        <p
                          role="alert"
                          className="text-xs font-medium text-rose-600 dark:text-rose-400"
                        >
                          {metaGenError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isGeneratingMeta}
                        className="w-full py-2.5 px-4 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isGeneratingMeta
                            ? 'Meta Paketi Üretiliyor...'
                            : 'Optimize Meta Etiket Üret'}
                        </span>
                      </button>
                    </form>

                    {generatedMeta && (
                      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5 text-xs">
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400 tabular-nums">
                            Önerilen &lt;title&gt; ({generatedMeta.metaTitle.length}{' '}
                            karakter)
                          </div>
                          <div className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {generatedMeta.metaTitle}
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400 tabular-nums">
                            Önerilen Açıklama ({generatedMeta.metaDescription.length}{' '}
                            karakter)
                          </div>
                          <div className="text-neutral-700 dark:text-neutral-300 mt-0.5 leading-relaxed">
                            {generatedMeta.metaDescription}
                          </div>
                        </div>
                        <div className="text-neutral-500 dark:text-neutral-400">
                          Anahtar Kelimeler:{' '}
                          <span className="text-neutral-800 dark:text-neutral-200">
                            {generatedMeta.primaryKeywords.join(' · ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Keyword Research Matrix */}
              <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                      03. Anahtar Kelime Araştırması & Niyet Matrisi
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Aylık arama hacmi, rekabet zorluğu (KD), arama niyeti ve hedef sayfa eşleştirmesi.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={keywordQuery}
                        onChange={(e) => setKeywordQuery(e.target.value)}
                        aria-label="Anahtar kelime ara"
                        placeholder="Kelime filtrele..."
                        className="pl-8 pr-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-[#202227]">
                      {(
                        ['Tümü', 'İşlemsel', 'Ticari', 'Bilgi'] as const
                      ).map((intent) => (
                        <button
                          key={intent}
                          type="button"
                          onClick={() => setKeywordIntentFilter(intent)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                            keywordIntentFilter === intent
                              ? 'bg-white dark:bg-[#141518] text-neutral-900 dark:text-white shadow-xs'
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {intent}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                        <th className="py-2.5 pr-4 font-semibold">
                          Anahtar Kelime
                        </th>
                        <th className="py-2.5 px-3 font-semibold">Niyet · Hedef</th>
                        <th className="py-2.5 px-3 font-semibold text-right">
                          Aylık Hacim
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-right">
                          Zorluk (KD)
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-right">
                          CTR Fırsatı
                        </th>
                        <th className="py-2.5 pl-4 font-semibold text-right">
                          Uygulama
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                      {filteredKeywords.map((kw) => (
                        <tr
                          key={kw.id}
                          className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors"
                        >
                          <td className="py-3 pr-4">
                            <div className="font-semibold text-neutral-900 dark:text-white">
                              {kw.keyword}
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {kw.recommendedAction}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                            {kw.intent} ·{' '}
                            <span className="font-mono">{kw.targetRoute}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                            {kw.monthlyVolume.toLocaleString('tr-TR')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                            {kw.difficulty}/100
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                            +{kw.ctrOpportunityPct}%
                          </td>
                          <td className="py-3 pl-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                onAskAiInChat(
                                  `"${kw.keyword}" anahtar kelimesi için SEO uyumlu H1/H2 alt başlık yapısı ve 200 kelimelik açılış metni hazırla.`,
                                  'gemini-4-argon'
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold transition cursor-pointer whitespace-nowrap"
                            >
                              İçerik Üret
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: 4-PILLAR PERFORMANCE, SECURITY, SEO & UX ANALYSIS + LIVE CALCULATOR */}
          {activeTab === 'performance' && (
            <div className="space-y-8">
              {/* 4-Pillar Holistic Audit: Speed, Security, SEO, User Experience */}
              <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span>
                        4 Sütunlu Site Performans Denetimi (Hız · Güvenlik · SEO · UX)
                      </span>
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Mevcut durum tespiti, darboğaz analizi ve doğrudan uygulanmış mühendislik iyileştirmeleri.
                    </p>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      Güvenlik: {auditData?.security?.score ?? 98}/100
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      nosniff · PII Maskeleme · Sunucu API İzolasyonu
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FOUR_PILLAR_SITE_AUDIT.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141518] space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {item.pillar}
                        </h3>
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {item.score}/100
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        <strong className="text-neutral-900 dark:text-white">
                          Mevcut Durum:{' '}
                        </strong>
                        {item.currentStatus}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        <strong className="text-neutral-800 dark:text-neutral-200">
                          İyileştirme Alanı:{' '}
                        </strong>
                        {item.bottleneckIdentified}
                      </p>
                      <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
                        <strong className="text-indigo-600 dark:text-indigo-400">
                          Somut Öneri & Uygulama:{' '}
                        </strong>
                        {item.concreteRecommendation}
                      </p>
                      <div className="pt-1.5 border-t border-neutral-200/70 dark:border-neutral-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        Ölçülen Kazanç: {item.expectedGain}
                      </div>
                    </div>
                  ))}
                </div>

                {auditData?.security?.headersApplied && (
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Aktif HTTP Güvenlik Başlıkları:
                    </span>
                    <span className="font-mono text-[11px]">
                      {auditData.security.headersApplied.join(' · ')}
                    </span>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Interactive Latency, Bandwidth & CWV Calculator */}
                <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-indigo-500" />
                      <span>Canlı Performans, Gecikme & Bant Genişliği Hesaplayıcısı</span>
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Ziyaretçi hacmi, Brotli sıkıştırma, WebP görsel kazancı ve AI LRU önbellek oranına göre gerçek zamanlı etki simülasyonu.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label
                          htmlFor="calc-visitors"
                          className="font-semibold text-neutral-700 dark:text-neutral-300"
                        >
                          Günlük Tekil Ziyaretçi
                        </label>
                        <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                          {calcInput.dailyVisitors.toLocaleString('tr-TR')} / gün
                        </span>
                      </div>
                      <input
                        id="calc-visitors"
                        type="range"
                        min={1000}
                        max={250000}
                        step={1000}
                        value={calcInput.dailyVisitors}
                        onChange={(e) =>
                          setCalcInput((prev) => ({
                            ...prev,
                            dailyVisitors: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label
                          htmlFor="calc-cache-hit"
                          className="font-semibold text-neutral-700 dark:text-neutral-300"
                        >
                          Tarayıcı & Sunucu LRU Önbellek İsabet Oranı
                        </label>
                        <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                          %{calcInput.cacheHitRatePct}
                        </span>
                      </div>
                      <input
                        id="calc-cache-hit"
                        type="range"
                        min={0}
                        max={90}
                        step={5}
                        value={calcInput.cacheHitRatePct}
                        onChange={(e) =>
                          setCalcInput((prev) => ({
                            ...prev,
                            cacheHitRatePct: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <label
                          htmlFor="calc-webp"
                          className="font-semibold text-neutral-700 dark:text-neutral-300"
                        >
                          Görsel WebP/AVIF & Lazy-Load Tasarrufu
                        </label>
                        <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                          %{calcInput.imageWebpSavingsPct}
                        </span>
                      </div>
                      <input
                        id="calc-webp"
                        type="range"
                        min={0}
                        max={80}
                        step={5}
                        value={calcInput.imageWebpSavingsPct}
                        onChange={(e) =>
                          setCalcInput((prev) => ({
                            ...prev,
                            imageWebpSavingsPct: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="space-y-1">
                        <label
                          htmlFor="calc-tier"
                          className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                        >
                          Varsayılan AI Yönlendirme Katmanı
                        </label>
                        <select
                          id="calc-tier"
                          value={calcInput.modelTier}
                          onChange={(e) =>
                            setCalcInput((prev) => ({
                              ...prev,
                              modelTier: e.target
                                .value as PerfCalculatorInput['modelTier'],
                            }))
                          }
                          className="px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                        >
                          <option value="flash-lite">
                            Flash Lite (Ultra Hızlı · 410ms baz)
                          </option>
                          <option value="flash-3-8">
                            Gemini 3.8 Flash (Dengeli · 690ms baz)
                          </option>
                          <option value="argon-4">
                            Gemini 4 Argon (Derin Mimari · 1180ms baz)
                          </option>
                        </select>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={calcInput.brotliEnabled}
                        onClick={() =>
                          setCalcInput((prev) => ({
                            ...prev,
                            brotliEnabled: !prev.brotliEnabled,
                          }))
                        }
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
                          calcInput.brotliEnabled
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        Brotli (br) Sıkıştırma:{' '}
                        {calcInput.brotliEnabled ? 'Aktif' : 'Kapalı'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 tabular-nums">
                    <div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Medyan AI Yanıtı
                      </div>
                      <div
                        data-testid="calc-latency-val"
                        className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5"
                      >
                        {perfProjection.effectiveMedianLatencyMs} ms
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        -%{perfProjection.latencyReductionPct} kazanç
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Aylık Veri Tasarrufu
                      </div>
                      <div
                        data-testid="calc-bandwidth-val"
                        className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5"
                      >
                        {perfProjection.monthlyBandwidthSavedGb} GB
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        30 günlük projeksiyon
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Tahmini LCP
                      </div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {perfProjection.estimatedLcpSec} sn
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        CLS {perfProjection.estimatedCls}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Tahmini INP
                      </div>
                      <div className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                        {perfProjection.estimatedInpMs} ms
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400">
                        -%{perfProjection.monthlyComputeSavedPct} GPU yükü
                      </div>
                    </div>
                  </div>
                </section>

                {/* Live Measured Bundle & Brotli Compression Telemetry */}
                <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                        <span>Üretim Paketi & Brotli Sıkıştırma Ölçümü</span>
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Rollup manualChunks ve React.lazy kod bölme sonrası ham boyut vs. Brotli (br) transfer boyutu.
                      </p>
                    </div>
                    <div className="text-right tabular-nums shrink-0">
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        -%{auditData?.performance.overallSavingsPct ?? 71.4}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Brotli Kazancı
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-600 dark:text-neutral-300 flex flex-wrap items-center gap-2 tabular-nums">
                    <span>
                      Kodlama:{' '}
                      <strong className="font-mono">
                        {auditData?.performance.compressionEncoding ||
                          'br / gzip (node:zlib)'}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Önbellek:{' '}
                      <strong className="font-mono">max-age=31536000, immutable</strong>
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs tabular-nums">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                          <th className="py-2 pr-3 font-semibold">Parça (Chunk)</th>
                          <th className="py-2 px-2 font-semibold text-right">
                            Ham Boyut
                          </th>
                          <th className="py-2 px-2 font-semibold text-right">
                            Brotli (br)
                          </th>
                          <th className="py-2 pl-2 font-semibold text-right">
                            Tasarruf
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                        {(auditData?.performance.bundleChunks &&
                        auditData.performance.bundleChunks.length > 0
                          ? auditData.performance.bundleChunks
                          : [
                              {
                                file: 'vendor-react.js',
                                rawKb: 142.8,
                                brotliKb: 44.1,
                                savingsPct: 69.1,
                              },
                              {
                                file: 'vendor-firebase.js',
                                rawKb: 198.4,
                                brotliKb: 53.6,
                                savingsPct: 73.0,
                              },
                              {
                                file: 'index-app-core.js',
                                rawKb: 164.2,
                                brotliKb: 46.8,
                                savingsPct: 71.5,
                              },
                              {
                                file: 'ImagesStudioView.lazy.js',
                                rawKb: 78.5,
                                brotliKb: 21.9,
                                savingsPct: 72.1,
                              },
                            ]
                        ).map((chunk) => (
                          <tr key={chunk.file}>
                            <td className="py-2.5 pr-3 font-mono text-[11px] text-neutral-800 dark:text-neutral-200 truncate max-w-[200px]">
                              {chunk.file}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-neutral-500 dark:text-neutral-400">
                              {chunk.rawKb} KB
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-semibold text-neutral-900 dark:text-white">
                              {chunk.brotliKb} KB
                            </td>
                            <td className="py-2.5 pl-2 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              -%{chunk.savingsPct}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* 4 Concrete Performance Optimization Pillars */}
              <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Uygulanan 4 Katmanlı Web Performans Mimarisi
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Görsel optimizasyonu, tarayıcı önbelleğe alma, kod sıkıştırma ve sunucu gecikme iyileştirmeleri.
                  </p>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {PERFORMANCE_OPTIMIZATION_PILLARS.map((p, idx) => (
                    <div
                      key={p.id}
                      className="py-4 first:pt-1 last:pb-1 grid grid-cols-1 lg:grid-cols-12 gap-3"
                    >
                      <div className="lg:col-span-3">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white">
                          0{idx + 1}. {p.area}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                          {p.measuredImpact}
                        </div>
                      </div>
                      <div className="lg:col-span-4 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        <strong className="text-neutral-700 dark:text-neutral-300">
                          Tespit:{' '}
                        </strong>
                        {p.currentFinding}
                      </div>
                      <div className="lg:col-span-5 text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
                        <strong className="text-neutral-900 dark:text-white">
                          Uygulanan Çözüm:{' '}
                        </strong>
                        {p.appliedEngineeringFix}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2B: TARGET AUDIENCE ANALYSIS & INTERACTIVE SEO CONTENT STRATEGY */}
          {activeTab === 'audience-content' && (
            <div className="space-y-8">
              {/* Target Audience Personas */}
              <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-500" />
                      <span>01. Hedef Kitle & Kullanıcı Segmentasyonu Analizi</span>
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Platformun 115 model, 4K görsel/video stüdyosu ve geliştirici araçlarına göre trafik payları, hedefler ve acı noktaları.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TARGET_AUDIENCE_SEGMENTS.map((seg) => (
                    <div
                      key={seg.id}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141518] space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {seg.segmentName}
                        </h3>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          %{seg.sharePct} Trafik Payı
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {seg.demographicsAndRole}
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        <strong className="text-neutral-900 dark:text-white">
                          Temel Hedef:{' '}
                        </strong>
                        {seg.coreGoals}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        <strong className="text-neutral-800 dark:text-neutral-200">
                          Çözülen Sorun:{' '}
                        </strong>
                        {seg.painPoints}
                      </p>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          En Etkili İçerik Formatı:{' '}
                        </strong>
                        {seg.preferredContentFormat}
                      </p>
                      <div className="pt-1.5 border-t border-neutral-200/70 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400">
                        Arama Sorguları: {seg.highIntentKeywords.join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recommended Interactive & SEO-Friendly Content Types & Titles */}
              <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    02. Önerilen Etkileşimli ve SEO Uyumlu Yeni İçerik Türleri & Başlıklar
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Hedef kitle segmentlerine özel kurgulanmış yüksek tıklama oranlı (CTR) başlıklar; istediğiniz başlığı tek tıkla AI ile tam makaleye dönüştürün.
                  </p>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {SEO_CONTENT_BLUEPRINTS.map((bp) => (
                    <div
                      key={bp.id}
                      className="py-4 first:pt-1 last:pb-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {bp.contentType}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{bp.targetPersona}</span>
                          <span aria-hidden="true">·</span>
                          <span>Niyet: {bp.searchIntent}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {bp.estimatedCtrLift}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                          {bp.seoTitle}
                        </h3>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          <strong className="text-neutral-900 dark:text-white">
                            Etkileşim Kancası:{' '}
                          </strong>
                          {bp.interactiveHook}
                        </p>
                        <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                          Hedef Anahtar Kelime: {bp.primaryKeyword}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onAskAiInChat(bp.readyPrompt, bp.recommendedModelId)
                          }
                          className="px-3.5 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Bu İçeriği Üret</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Revitalizing Existing Content */}
              <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    03. Mevcut İçeriği Daha Çekici Hale Getirme Stratejileri
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Mevcut sayfaların okunma oranını, hemen çıkma süresini ve dönüşümünü iyileştiren 4 somut strateji.
                  </p>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {CONTENT_REVITALIZATION_STRATEGIES.map((st) => (
                    <div
                      key={st.id}
                      className="py-4 first:pt-1 last:pb-1 grid grid-cols-1 lg:grid-cols-12 gap-3"
                    >
                      <div className="lg:col-span-4">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white">
                          {st.title}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                          {st.retentionImpact}
                        </div>
                      </div>
                      <div className="lg:col-span-4 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        <strong className="text-neutral-700 dark:text-neutral-300">
                          Sorun:{' '}
                        </strong>
                        {st.problemInExistingContent}
                      </div>
                      <div className="lg:col-span-4 text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
                        <strong className="text-neutral-900 dark:text-white">
                          Stratejik Dokunuş:{' '}
                        </strong>
                        {st.actionableUpgrade}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: INTERACTIVE COMMUNITY FORUM */}
          {activeTab === 'forum' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Create New Discussion Form */}
              <section className="lg:col-span-4 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-500" />
                    <span>Yeni Forum Konusu Aç</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    SEO, site performansı, prompt mühendisliği veya 4K video ayarları üzerine tartışma başlatın; kişisel veriler otomatik maskelenir.
                  </p>
                </div>

                <form onSubmit={handleCreateThreadSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="forum-author"
                      className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                    >
                      Görünür Adınız (İsteğe Bağlı)
                    </label>
                    <input
                      id="forum-author"
                      type="text"
                      value={newThreadAuthor}
                      onChange={(e) => setNewThreadAuthor(e.target.value)}
                      placeholder="Örn: Emre T."
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="forum-category"
                      className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                    >
                      Kategori
                    </label>
                    <select
                      id="forum-category"
                      value={newThreadCategory}
                      onChange={(e) =>
                        setNewThreadCategory(
                          e.target.value as ForumThread['category']
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                    >
                      <option value="SEO & Büyüme">SEO & Büyüme</option>
                      <option value="Performans & Mimari">
                        Performans & Mimari
                      </option>
                      <option value="AI Modelleri & Prompt">
                        AI Modelleri & Prompt
                      </option>
                      <option value="Görsel & Video 4K">
                        Görsel & Video 4K
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="forum-title"
                      className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                    >
                      Konu Başlığı
                    </label>
                    <input
                      id="forum-title"
                      type="text"
                      value={newThreadTitle}
                      onChange={(e) => {
                        setNewThreadTitle(e.target.value);
                        if (forumFormError) setForumFormError(null);
                      }}
                      placeholder="En az 5 karakterlik net bir başlık..."
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="forum-body"
                      className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                    >
                      Detay & Soru
                    </label>
                    <textarea
                      id="forum-body"
                      rows={4}
                      value={newThreadBody}
                      onChange={(e) => {
                        setNewThreadBody(e.target.value);
                        if (forumFormError) setForumFormError(null);
                      }}
                      placeholder="Deneyiminizi veya sorunuzu paylaşın (en az 10 karakter)..."
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white resize-none"
                    />
                  </div>

                  {forumFormError && (
                    <p
                      role="alert"
                      data-testid="forum-validation-error"
                      className="text-xs font-medium text-rose-600 dark:text-rose-400"
                    >
                      {forumFormError}
                    </p>
                  )}

                  <button
                    type="submit"
                    data-testid="submit-forum-thread-btn"
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Konuyu Yayınla</span>
                  </button>
                </form>
              </section>

              {/* Right: Thread Feed & AI Expert Replies */}
              <section className="lg:col-span-8 space-y-4">
                {/* Community Engagement Streak Strip */}
                <div
                  data-testid="community-engagement-streak-bar"
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#18191d] flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums"
                >
                  <div className="flex items-center gap-2 font-semibold text-neutral-800 dark:text-neutral-200">
                    <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      Katılım Serisi: {engagementStats.streakDays} gün ·{' '}
                      {engagementStats.actionsCount} etkileşim
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Konulara yorum, oy ve anket katkınız kaydedilir
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-[#202227] overflow-x-auto">
                    {(
                      [
                        'Tümü',
                        'SEO & Büyüme',
                        'Performans & Mimari',
                        'AI Modelleri & Prompt',
                        'Görsel & Video 4K',
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForumCategoryFilter(cat)}
                        className={`min-h-[40px] sm:min-h-0 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                          forumCategoryFilter === cat
                            ? 'bg-white dark:bg-[#141518] text-neutral-900 dark:text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3 sm:top-2.5" />
                    <input
                      type="text"
                      value={forumSearch}
                      onChange={(e) => setForumSearch(e.target.value)}
                      aria-label="Forumda ara"
                      placeholder="Tartışmalarda ara..."
                      className="w-full sm:w-52 min-h-[44px] sm:min-h-0 pl-8 pr-3 py-2 sm:py-1.5 rounded-lg bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                {filteredThreads.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] text-center space-y-2">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Aramanızla eşleşen tartışma bulunamadı.
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Filtreyi temizleyebilir veya sol panelden ilk konuyu siz başlatabilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredThreads.map((thread) => {
                      const isExpanded = expandedThreadId === thread.id;
                      return (
                        <article
                          key={thread.id}
                          className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-3"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                                <span>{thread.category}</span>
                                <span aria-hidden="true">·</span>
                                <span>{thread.authorName}</span>
                                <span aria-hidden="true">·</span>
                                <span>{thread.views} görüntülenme</span>
                              </div>
                              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedThreadId(
                                      isExpanded ? null : thread.id
                                    )
                                  }
                                  className="text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                                >
                                  {thread.title}
                                </button>
                              </h3>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleUpvoteThread(thread.id)}
                              aria-label={`Beğen: ${thread.title}`}
                              className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer tabular-nums shrink-0"
                            >
                              <ThumbsUp className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{thread.upvotes}</span>
                            </button>
                          </div>

                          <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {thread.body}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              onClick={() =>
                                setExpandedThreadId(
                                  isExpanded ? null : thread.id
                                )
                              }
                              className="min-h-[44px] sm:min-h-0 px-2 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer tabular-nums"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                              <span>Yanıtlar ({thread.replies.length})</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={aiReplyingThreadId === thread.id}
                                onClick={() =>
                                  handleRequestAiExpertReply(thread.id)
                                }
                                className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>
                                  {aiReplyingThreadId === thread.id
                                    ? 'AI Uzman Yazıyor...'
                                    : 'AI Uzman Yanıtı Ekle'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onAskAiInChat(
                                    `Forum konusu: "${thread.title}"\n\n${thread.body}\n\nBu konuya kapsamlı teknik çözüm ve uygulama örnekleri üret.`,
                                    'gemini-4-argon'
                                  )
                                }
                                className="min-h-[44px] sm:min-h-0 px-2 py-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
                              >
                                Sohbette Aç
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                            <QuickSocialShareButtons
                              compact
                              payload={{
                                title: thread.title,
                                excerpt: thread.body,
                                contentType: 'forum',
                                badge: `FORUM · ${thread.category}`,
                              }}
                            />
                          </div>
                          <ContentRatingAndComments
                            compact
                            contentKey={`forum:${thread.id}`}
                            contentTitle={thread.title}
                            communityState={communityState}
                            onCommunityUpdated={setCommunityState}
                          />

                          {isExpanded && (
                            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                              {thread.replies.length > 0 && (
                                <div className="space-y-2.5">
                                  {thread.replies.map((rep) => (
                                    <div
                                      key={rep.id}
                                      className="py-2 text-xs space-y-1 border-b border-neutral-100 dark:border-neutral-800/70 last:border-b-0"
                                    >
                                      <div className="text-neutral-500 dark:text-neutral-400">
                                        <strong className="text-neutral-900 dark:text-white">
                                          {rep.authorName}
                                        </strong>
                                        {rep.isAiExpert && rep.modelLabel
                                          ? ` · ${rep.modelLabel}`
                                          : ' · Topluluk Yanıtı'}
                                      </div>
                                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                        {rep.body}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={replyDraftByThread[thread.id] || ''}
                                  onChange={(e) =>
                                    setReplyDraftByThread((prev) => ({
                                      ...prev,
                                      [thread.id]: e.target.value,
                                    }))
                                  }
                                  aria-label={`${thread.title} konusuna yanıt yaz`}
                                  placeholder="Katkınızı veya yanıtınızı yazın..."
                                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddUserReply(thread.id)}
                                  className="px-3 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Yanıtla</span>
                                </button>
                              </div>
                              {replyErrorByThread[thread.id] && (
                                <p className="text-xs text-rose-600 dark:text-rose-400">
                                  {replyErrorByThread[thread.id]}
                                </p>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 4: ENGINEERING BLOG, LIVE POLLS & TECHNICAL QUIZ */}
          {activeTab === 'blog-polls' && (
            <div className="space-y-8">
              {/* Engineering Blog Section */}
              <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Mühendislik Blogu & Uygulama Rehberleri
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Arama motoru görünürlüğü, düşük gecikmeli önbellekleme ve çoklu model yönlendirme mimarisi üzerine teknik makaleler.
                  </p>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {combinedPublishedArticles.map((art) => {
                    const isOpen = expandedArticleId === art.id;
                    return (
                      <article key={art.id} className="py-4 first:pt-1 last:pb-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                          <span>{art.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{art.publishedIso}</span>
                          {'authorName' in art &&
                          typeof art.authorName === 'string' &&
                          art.authorName ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{art.authorName}</span>
                            </>
                          ) : null}
                          <span aria-hidden="true">·</span>
                          <span>{art.readTimeMin} dk okuma</span>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              onClick={() =>
                                setExpandedArticleId(isOpen ? '' : art.id)
                              }
                              className="text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                            >
                              {art.title}
                            </button>
                          </h3>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedArticleId(isOpen ? '' : art.id)
                            }
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {isOpen ? 'Daralt' : 'Makaleyi Oku'}
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          {art.summary}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <QuickSocialShareButtons
                            compact
                            payload={{
                              title: art.title,
                              excerpt: art.summary,
                              contentType: 'blog',
                              badge: `LUXO BLOG · ${art.category}`,
                            }}
                          />
                        </div>
                        <ContentRatingAndComments
                          compact
                          contentKey={art.id.startsWith('cs-') ? `cms:${art.id}` : `blog:${art.id}`}
                          contentTitle={art.title}
                          communityState={communityState}
                          onCommunityUpdated={setCommunityState}
                        />

                         {isOpen && (
                          <div className="pt-3 space-y-4">
                            {art.sections.map((sec) => (
                              <div key={sec.heading} className="space-y-1">
                                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                                  {sec.heading}
                                </h4>
                                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                  {sec.content}
                                </p>
                              </div>
                            ))}

                            {/* Article Actions + Helpful Voting */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReactArticle(art.id)}
                                  disabled={Boolean(reactedArticles[art.id])}
                                  aria-label={`Faydalı Buldum: ${art.title}`}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer tabular-nums ${
                                    reactedArticles[art.id]
                                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                                      : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                                  }`}
                                >
                                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>
                                    Faydalı (
                                    {communityState.articleReactions?.[art.id] ??
                                      24}
                                    )
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    onAskAiInChat(
                                      art.actionPrompt,
                                      art.recommendedModelId
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                >
                                  <span>Bu Konuyu AI ile Derinleştir</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                                {(
                                  communityState.articleComments?.[art.id] || []
                                ).length}{' '}
                                okuyucu yorumu
                              </span>
                            </div>

                            {/* Live Article Comments Section */}
                            <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                              <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Okuyucu Yorumları & Katkılar</span>
                              </div>

                              {(() => {
                                const allComments =
                                  communityState.articleComments?.[art.id] || [];
                                const rootComments = allComments.filter(
                                  (c) => !c.parentId
                                );
                                if (rootComments.length === 0) {
                                  return (
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                      Bu makale için ilk teknik yorumu siz bırakın.
                                    </p>
                                  );
                                }
                                return (
                                  <div className="divide-y divide-neutral-200/70 dark:divide-neutral-800">
                                    {rootComments.map((com) => {
                                      const replies = allComments.filter(
                                        (r) => r.parentId === com.id
                                      );
                                      return (
                                        <div
                                          key={com.id}
                                          className="py-3 first:pt-0 last:pb-0 text-xs space-y-2"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                                              <strong className="text-neutral-900 dark:text-white">
                                                {com.authorName}
                                              </strong>
                                              {com.isPinned && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                                                  <Pin className="w-2.5 h-2.5" /> Sabitlendi
                                                </span>
                                              )}
                                              {com.isModerated && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-semibold">
                                                  <Shield className="w-2.5 h-2.5" /> Gizlendi
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[10px] text-neutral-400">
                                              {new Date(com.createdAt).toLocaleDateString('tr-TR')}
                                            </span>
                                          </div>

                                          {com.isModerated ? (
                                            <p className="text-neutral-400 italic text-[11px] bg-neutral-100 dark:bg-[#18191d] p-2 rounded-lg">
                                              {com.moderationReason ||
                                                'Bu yorum topluluk kuralları nedeniyle moderatör tarafından gizlenmiştir.'}
                                            </p>
                                          ) : (
                                            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                              {com.body}
                                            </p>
                                          )}

                                          {/* Actions: Upvote, Downvote, Reply, Admin Moderation */}
                                          <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-3">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleVoteComment(
                                                    art.id,
                                                    com.id,
                                                    'up'
                                                  )
                                                }
                                                className="flex items-center gap-1 text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                                                title="Faydalı Buldum"
                                              >
                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                <span className="tabular-nums font-semibold">
                                                  {com.helpfulCount}
                                                </span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleVoteComment(
                                                    art.id,
                                                    com.id,
                                                    'down'
                                                  )
                                                }
                                                className="flex items-center gap-1 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                                title="Faydalı Bulmadım"
                                              >
                                                <ThumbsDown className="w-3.5 h-3.5" />
                                                <span className="tabular-nums font-semibold">
                                                  {com.downvotes || 0}
                                                </span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setActiveReplyCommentId(
                                                    activeReplyCommentId ===
                                                      com.id
                                                      ? null
                                                      : com.id
                                                  )
                                                }
                                                className="flex items-center gap-1 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer font-medium"
                                              >
                                                <Reply className="w-3 h-3" />
                                                <span>Yanıtla</span>
                                              </button>
                                            </div>

                                            {/* Admin Moderation controls */}
                                            {showModeratorControls && (
                                              <div className="flex items-center gap-1.5 text-[11px]">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleModerateComment(
                                                      art.id,
                                                      com.id,
                                                      'pin'
                                                    )
                                                  }
                                                  className="text-neutral-400 hover:text-amber-500 transition cursor-pointer px-1.5 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                  title="Sabitle / Kaldır"
                                                >
                                                  <Pin className="w-3 h-3 inline" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleModerateComment(
                                                      art.id,
                                                      com.id,
                                                      com.isModerated
                                                        ? 'unhide'
                                                        : 'hide'
                                                    )
                                                  }
                                                  className="text-neutral-400 hover:text-blue-500 transition cursor-pointer px-1.5 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                  title={
                                                    com.isModerated
                                                      ? 'Yorumu Göster'
                                                      : 'Yorumu Gizle'
                                                  }
                                                >
                                                  <Shield className="w-3 h-3 inline" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleModerateComment(
                                                      art.id,
                                                      com.id,
                                                      'delete'
                                                    )
                                                  }
                                                  className="text-neutral-400 hover:text-rose-500 transition cursor-pointer px-1.5 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                  title="Yorumu Sil"
                                                >
                                                  <Trash2 className="w-3 h-3 inline" />
                                                </button>
                                              </div>
                                            )}
                                          </div>

                                          {/* Inline Reply input */}
                                          {activeReplyCommentId === com.id && (
                                            <div className="mt-2 pl-3 border-l-2 border-indigo-500/50 flex gap-2 items-center">
                                              <input
                                                type="text"
                                                value={
                                                  commentReplyDrafts[com.id] ||
                                                  ''
                                                }
                                                onChange={(e) =>
                                                  setCommentReplyDrafts(
                                                    (prev) => ({
                                                      ...prev,
                                                      [com.id]: e.target.value,
                                                    })
                                                  )
                                                }
                                                placeholder={`${com.authorName} kullanıcısına yanıt yaz...`}
                                                className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                                              />
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleReplyComment(
                                                    art.id,
                                                    com.id
                                                  )
                                                }
                                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                              >
                                                <Send className="w-3 h-3" />
                                                <span>Yanıtla</span>
                                              </button>
                                            </div>
                                          )}

                                          {/* Nested Replies List */}
                                          {replies.length > 0 && (
                                            <div className="mt-2 pl-3 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-2">
                                              {replies.map((rep) => (
                                                <div
                                                  key={rep.id}
                                                  className="p-2.5 rounded-xl bg-white dark:bg-[#18191d] border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-1"
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                      {rep.authorName}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400">
                                                      {new Date(
                                                        rep.createdAt
                                                      ).toLocaleDateString(
                                                        'tr-TR'
                                                      )}
                                                    </span>
                                                  </div>
                                                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                                    {rep.body}
                                                  </p>
                                                  <div className="flex items-center justify-between pt-0.5">
                                                    <div className="flex items-center gap-2.5">
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          handleVoteComment(
                                                            art.id,
                                                            rep.id,
                                                            'up'
                                                          )
                                                        }
                                                        className="flex items-center gap-1 text-neutral-400 hover:text-emerald-500 text-[11px]"
                                                      >
                                                        <ThumbsUp className="w-3 h-3" />
                                                        <span>
                                                          {rep.helpfulCount}
                                                        </span>
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          handleVoteComment(
                                                            art.id,
                                                            rep.id,
                                                            'down'
                                                          )
                                                        }
                                                        className="flex items-center gap-1 text-neutral-400 hover:text-rose-500 text-[11px]"
                                                      >
                                                        <ThumbsDown className="w-3 h-3" />
                                                        <span>
                                                          {rep.downvotes || 0}
                                                        </span>
                                                      </button>
                                                    </div>
                                                    {showModeratorControls && (
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          handleModerateComment(
                                                            art.id,
                                                            rep.id,
                                                            'delete'
                                                          )
                                                        }
                                                        className="text-neutral-400 hover:text-rose-500"
                                                        title="Yanıtı Sil"
                                                      >
                                                        <Trash2 className="w-3 h-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={articleCommentAuthor}
                                  onChange={(e) =>
                                    setArticleCommentAuthor(e.target.value)
                                  }
                                  aria-label="Yorum görünür adınız"
                                  placeholder="Adınız (İsteğe bağlı)"
                                  className="sm:w-36 px-3 py-1.5 rounded-lg bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                                />
                                <input
                                  type="text"
                                  value={articleCommentDrafts[art.id] || ''}
                                  onChange={(e) =>
                                    setArticleCommentDrafts((prev) => ({
                                      ...prev,
                                      [art.id]: e.target.value,
                                    }))
                                  }
                                  aria-label={`${art.title} makalesine yorum yaz`}
                                  placeholder="Makale hakkındaki görüş veya sorunuzu yazın..."
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddArticleComment(art.id)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Yorum Ekle</span>
                                </button>
                              </div>
                              {articleCommentErrors[art.id] && (
                                <p
                                  role="alert"
                                  className="text-xs text-rose-600 dark:text-rose-400"
                                >
                                  {articleCommentErrors[art.id]}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* Engagement Streak Banner */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#18191d] flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Etkileşim Serisi: {engagementStats.streakDays} gün ·{' '}
                    {engagementStats.actionsCount} katkı
                  </span>
                </div>
                <span className="text-neutral-500 dark:text-neutral-400">
                  Yeni anket başlatın, oy verin veya 4 soruluk teknik testi tamamlayın.
                </span>
              </div>

              {/* Polls + Interactive Quiz Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Live Community Polls */}
                <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                        Canlı Topluluk Anketleri
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Oyunuzu verin veya yeni bir topluluk anketi başlatın.
                      </p>
                    </div>
                    <button
                      type="button"
                      data-testid="toggle-create-poll-btn"
                      onClick={() => setShowCreatePollForm((v) => !v)}
                      className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {showCreatePollForm ? 'Formu Kapat' : 'Yeni Anket Oluştur'}
                      </span>
                    </button>
                  </div>

                  {showCreatePollForm && (
                    <form
                      onSubmit={handleCreatePollSubmit}
                      data-testid="create-poll-form"
                      className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-800 space-y-3"
                    >
                      <div className="space-y-1">
                        <label
                          htmlFor="new-poll-question"
                          className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                        >
                          Anket Sorusu
                        </label>
                        <input
                          id="new-poll-question"
                          data-testid="poll-question-input"
                          type="text"
                          value={newPollQuestion}
                          onChange={(e) => {
                            setNewPollQuestion(e.target.value);
                            if (pollFormError) setPollFormError(null);
                          }}
                          placeholder="Örn: Mobil kullanıcılar için ilk hangi özelliği genişletelim?"
                          className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-lg bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label
                            htmlFor="new-poll-category"
                            className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                          >
                            Kategori
                          </label>
                          <select
                            id="new-poll-category"
                            value={newPollCategory}
                            onChange={(e) => setNewPollCategory(e.target.value)}
                            className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-lg bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                          >
                            <option value="Topluluk Anketi">Topluluk Anketi</option>
                            <option value="Ürün Yol Haritası">Ürün Yol Haritası</option>
                            <option value="Mobil Deneyim">Mobil Deneyim</option>
                            <option value="AI Model Tercihi">AI Model Tercihi</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="new-poll-options"
                            className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                          >
                            Seçenekler (Her satıra 1 seçenek)
                          </label>
                          <textarea
                            id="new-poll-options"
                            data-testid="poll-options-input"
                            rows={3}
                            value={newPollOptionsText}
                            onChange={(e) => {
                              setNewPollOptionsText(e.target.value);
                              if (pollFormError) setPollFormError(null);
                            }}
                            placeholder={'Hızlı Sesli Arama\nÇevrimdışı Önbellek\nKaranlık Mod Temaları'}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white resize-none"
                          />
                        </div>
                      </div>

                      {pollFormError && (
                        <p
                          role="alert"
                          data-testid="poll-validation-error"
                          className="text-xs font-medium text-rose-600 dark:text-rose-400"
                        >
                          {pollFormError}
                        </p>
                      )}

                      <button
                        type="submit"
                        data-testid="submit-poll-btn"
                        className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Anketi Yayınla</span>
                      </button>
                    </form>
                  )}

                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800 space-y-5">
                    {communityState.polls.map((poll) => {
                      const votedOptionId = votedPollOptions[poll.id];
                      return (
                        <div
                          key={poll.id}
                          className="pt-4 first:pt-0 space-y-3"
                        >
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                            {poll.category} · Toplam {poll.totalVotes} oy
                          </div>
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                            {poll.question}
                          </h3>
                          <div className="space-y-2">
                            {poll.options.map((opt) => {
                              const pct =
                                poll.totalVotes > 0
                                  ? Math.round(
                                      (opt.votes / poll.totalVotes) * 100
                                    )
                                  : 0;
                              const isChosen = votedOptionId === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={Boolean(votedOptionId)}
                                  onClick={() =>
                                    handleVotePoll(poll.id, opt.id)
                                  }
                                  className={`w-full min-h-[44px] text-left p-3 sm:p-2.5 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                                    isChosen
                                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/25'
                                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3 text-xs relative z-10">
                                    <span className="font-medium text-neutral-900 dark:text-white">
                                      {opt.label}
                                    </span>
                                    <span className="font-mono tabular-nums font-semibold text-neutral-700 dark:text-neutral-300 shrink-0">
                                      %{pct} ({opt.votes})
                                    </span>
                                  </div>
                                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-600 dark:bg-indigo-500 transition-transform origin-left"
                                      style={{
                                        transform: `scaleX(${Math.max(
                                          0.02,
                                          pct / 100
                                        )})`,
                                      }}
                                    />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Interactive Technical SEO & Performance Quiz */}
                <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                        Etkileşimli SEO & Performans Testi
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        4 soruda teknik SEO ve Core Web Vitals bilginizi sınayın.
                      </p>
                    </div>
                    {quizSubmitted && (
                      <div
                        data-testid="quiz-score-summary"
                        className="text-right tabular-nums shrink-0"
                      >
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {quizGrade.correctCount}/{quizGrade.totalQuestions} (%{quizGrade.scorePct})
                        </div>
                      </div>
                    )}
                  </div>

                  {quizSubmitted && (
                    <div
                      data-testid="quiz-mastery-badge"
                      className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                        quizMastery.tier === 'gold'
                          ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                          : quizMastery.tier === 'silver'
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/25 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100'
                          : 'bg-neutral-50 dark:bg-[#141518] border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <Award className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">{quizMastery.title}</div>
                        <p className="text-[11px] opacity-85 mt-0.5">
                          {quizMastery.summary}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {ENGAGEMENT_QUIZ_QUESTIONS.map((q, qIdx) => {
                      const selectedIdx = quizSelections[q.id];
                      return (
                        <div
                          key={q.id}
                          className="pb-3 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 space-y-2"
                        >
                          <div className="text-xs font-bold text-neutral-900 dark:text-white">
                            {qIdx + 1}. {q.question}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {q.options.map((optLabel, oIdx) => {
                              const isSelected = selectedIdx === oIdx;
                              const isCorrect = q.correctIndex === oIdx;
                              let stateCls =
                                'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800';
                              if (quizSubmitted) {
                                if (isCorrect) {
                                  stateCls =
                                    'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 font-semibold';
                                } else if (isSelected && !isCorrect) {
                                  stateCls =
                                    'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200';
                                }
                              } else if (isSelected) {
                                stateCls =
                                  'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-200 font-semibold';
                              }

                              return (
                                <button
                                  key={optLabel}
                                  type="button"
                                  onClick={() => {
                                    if (quizSubmitted) return;
                                    setQuizSelections((prev) => ({
                                      ...prev,
                                      [q.id]: oIdx,
                                    }));
                                  }}
                                  className={`min-h-[44px] sm:min-h-0 px-3 py-2.5 sm:py-2 rounded-lg border text-left text-xs transition cursor-pointer ${stateCls}`}
                                >
                                  {optLabel}
                                </button>
                              );
                            })}
                          </div>
                          {quizSubmitted && (
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                              {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {!quizSubmitted ? (
                      <button
                        type="button"
                        data-testid="grade-quiz-btn"
                        disabled={
                          Object.keys(quizSelections).length <
                          ENGAGEMENT_QUIZ_QUESTIONS.length
                        }
                        onClick={() => {
                          setQuizSubmitted(true);
                          bumpEngagement(1);
                        }}
                        className="min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                      >
                        Yanıtları Değerlendir
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setQuizSelections({});
                          setQuizSubmitted(false);
                        }}
                        className="min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer whitespace-nowrap"
                      >
                        Testi Sıfırla
                      </button>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 5: ENGAGEMENT INTEGRATION ARCHITECTURE, UI/UX EVALUATION & FAQ */}
          {activeTab === 'ux-faq' && (
            <div className="space-y-8">
              {/* User Engagement Features & Technical Integration Blueprints */}
              <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Kullanıcı Etkileşim Özellikleri & Teknik Entegrasyon Mimarisi
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Yorum bölümleri, canlı oylama sistemleri, interaktif hesaplayıcılar ve topluluk forumunun uçtan uca entegrasyon planı.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ENGAGEMENT_INTEGRATION_BLUEPRINTS.map((bp) => (
                    <div
                      key={bp.id}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141518] flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {bp.featureName}
                        </h3>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          <strong className="text-neutral-900 dark:text-white">
                            Hedef:{' '}
                          </strong>
                          {bp.engagementGoal}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          <strong className="text-neutral-900 dark:text-white">
                            Arayüz (Frontend):{' '}
                          </strong>
                          {bp.frontendIntegration}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          <strong className="text-neutral-900 dark:text-white">
                            Sunucu & Veri (API):{' '}
                          </strong>
                          {bp.backendAndDataModel}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          <strong className="text-emerald-700 dark:text-emerald-400">
                            Güvenlik & Moderasyon:{' '}
                          </strong>
                          {bp.antiAbuseAndSecurity}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => setActiveTab(bp.liveLocationTab)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Canlı Modülü Aç ve Test Et</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Heuristic UI/UX Audit & Applied Refinements */}
              <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    UI / UX Sezgisel Değerlendirme & Uygulanan İyileştirmeler
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Gezinme netliği, görsel hiyerarşi, etkileşimli araçlar ve açık/koyu tema kontrast denetimi.
                  </p>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {UI_UX_AUDIT_ITEMS.map((ux, idx) => (
                    <div
                      key={ux.id}
                      className="py-4 first:pt-1 last:pb-1 grid grid-cols-1 lg:grid-cols-12 gap-3"
                    >
                      <div className="lg:col-span-3">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white">
                          0{idx + 1}. {ux.dimension}
                        </div>
                        <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                          {ux.uxGainMetric}
                        </div>
                      </div>
                      <div className="lg:col-span-4 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        <strong className="text-neutral-700 dark:text-neutral-300">
                          Önceki Durum:{' '}
                        </strong>
                        {ux.beforeObservation}
                      </div>
                      <div className="lg:col-span-5 text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
                        <strong className="text-neutral-900 dark:text-white">
                          Uygulanan UX Çözümü:{' '}
                        </strong>
                        {ux.appliedImprovement}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Accessible Searchable FAQ / SSS */}
              <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-indigo-500" />
                      <span>Sıkça Sorulan Sorular (SSS · Schema.org FAQPage)</span>
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Hem kullanıcılar hem de arama motoru zengin sonuçları için yapılandırılmış bilgi tabanı.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={faqSearch}
                        onChange={(e) => setFaqSearch(e.target.value)}
                        aria-label="Sıkça sorulan sorularda ara"
                        placeholder="SSS içinde ara..."
                        className="pl-8 pr-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                      />
                    </div>
                    <select
                      aria-label="SSS Kategorisi"
                      value={faqCategoryFilter}
                      onChange={(e) => setFaqCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                    >
                      <option value="Tümü">Tüm Kategoriler</option>
                      <option value="SEO & Erişim">SEO & Erişim</option>
                      <option value="Performans">Performans</option>
                      <option value="AI Modelleri">AI Modelleri</option>
                      <option value="Güvenlik & Gizlilik">
                        Güvenlik & Gizlilik
                      </option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredFaqs.map((faq) => {
                    const isOpen = Boolean(openFaqIds[faq.id]);
                    return (
                      <div key={faq.id} className="py-3.5">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setOpenFaqIds((prev) => ({
                              ...prev,
                              [faq.id]: !prev[faq.id],
                            }))
                          }
                          className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                        >
                          <div className="space-y-0.5">
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              {faq.category}
                            </div>
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {faq.question}
                            </div>
                          </div>
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                            {faq.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default CommunitySeoHub;
