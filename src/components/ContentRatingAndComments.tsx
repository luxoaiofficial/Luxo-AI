import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, Star } from 'lucide-react';
import {
  type CommunityHubState,
  computeContentRatingSummary,
  type ContentCommentEntry,
  type ContentRatingEntry,
  addGenericContentComment,
  rateContentItem,
} from '../utils/seoPerfEngagementEngine';

interface ContentRatingAndCommentsProps {
  contentKey: string;
  contentTitle?: string;
  communityState?: CommunityHubState;
  authorName?: string;
  compact?: boolean;
  onCommunityUpdated?: (nextState: CommunityHubState) => void;
}

export const ContentRatingAndComments: React.FC<
  ContentRatingAndCommentsProps
> = ({
  contentKey,
  contentTitle,
  communityState,
  authorName = 'Ziyaretçi',
  compact = false,
  onCommunityUpdated,
}) => {
  const [localRatings, setLocalRatings] = useState<ContentRatingEntry[]>(
    () => communityState?.contentRatings?.[contentKey] || []
  );
  const [localComments, setLocalComments] = useState<ContentCommentEntry[]>(
    () => communityState?.contentComments?.[contentKey] || []
  );
  const [hoverStar, setHoverStar] = useState<number>(0);
  const [selectedStar, setSelectedStar] = useState<number>(0);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [commentBody, setCommentBody] = useState<string>('');
  const [commentAuthor, setCommentAuthor] = useState<string>(authorName);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (communityState?.contentRatings?.[contentKey]) {
      setLocalRatings(communityState.contentRatings[contentKey]);
    }
    if (communityState?.contentComments?.[contentKey]) {
      setLocalComments(communityState.contentComments[contentKey]);
    }
  }, [communityState, contentKey]);

  const summary = computeContentRatingSummary(localRatings);

  const handleRate = async (stars: number) => {
    setSelectedStar(stars);
    setFeedbackMsg(null);
    const optimisticEntry: ContentRatingEntry = {
      id: `rat-opt-${Date.now()}`,
      contentKey,
      stars,
      authorName: commentAuthor || authorName,
      createdAt: Date.now(),
    };
    const nextLocal = [optimisticEntry, ...localRatings];
    setLocalRatings(nextLocal);

    if (communityState && onCommunityUpdated) {
      const localRes = rateContentItem(communityState, {
        contentKey,
        stars,
        authorName: commentAuthor || authorName,
      });
      if (localRes.entry) {
        onCommunityUpdated(localRes.state);
      }
    }

    try {
      const resp = await fetch('/api/community/content/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentKey,
          stars,
          authorName: commentAuthor || authorName,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.state) {
          if (data.state.contentRatings?.[contentKey]) {
            setLocalRatings(data.state.contentRatings[contentKey]);
          }
          onCommunityUpdated?.(data.state);
        }
        setFeedbackMsg(`${stars} yıldız kaydedildi`);
      }
    } catch {
      setFeedbackMsg(`${stars} yıldız kaydedildi`);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentBody.trim();
    if (trimmed.length < 3 || submitting) return;

    setSubmitting(true);
    setFeedbackMsg(null);

    if (communityState && onCommunityUpdated) {
      const localRes = addGenericContentComment(communityState, {
        contentKey,
        authorName: commentAuthor || authorName,
        body: trimmed,
        ratingStars: selectedStar >= 1 ? selectedStar : undefined,
      });
      if (localRes.comment) {
        setLocalComments(localRes.state.contentComments?.[contentKey] || []);
        if (localRes.state.contentRatings?.[contentKey]) {
          setLocalRatings(localRes.state.contentRatings[contentKey]);
        }
        onCommunityUpdated(localRes.state);
      }
    } else {
      const optComment: ContentCommentEntry = {
        id: `ccom-opt-${Date.now()}`,
        contentKey,
        authorName: (commentAuthor || authorName).trim() || 'Topluluk Üyesi',
        body: trimmed,
        ratingStars: selectedStar >= 1 ? selectedStar : undefined,
        helpfulCount: 1,
        createdAt: Date.now(),
      };
      setLocalComments((prev) => [optComment, ...prev]);
    }

    setCommentBody('');

    try {
      const resp = await fetch('/api/community/content/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentKey,
          authorName: commentAuthor || authorName,
          body: trimmed,
          ratingStars: selectedStar >= 1 ? selectedStar : undefined,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.state) {
          if (data.state.contentComments?.[contentKey]) {
            setLocalComments(data.state.contentComments[contentKey]);
          }
          if (data.state.contentRatings?.[contentKey]) {
            setLocalRatings(data.state.contentRatings[contentKey]);
          }
          onCommunityUpdated?.(data.state);
        }
        setFeedbackMsg('Yorumunuz eklendi');
      }
    } catch {
      setFeedbackMsg('Yorumunuz eklendi');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarValue = hoverStar || selectedStar || Math.round(summary.average);

  return (
    <div
      className={`${compact ? 'pt-2 mt-2' : 'pt-3 mt-3'} border-t border-neutral-200/70 dark:border-neutral-800 space-y-2.5`}
      data-testid={`content-rating-widget-${contentKey}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="inline-flex items-center gap-0.5"
            role="group"
            aria-label={
              contentTitle
                ? `${contentTitle} için 1-5 yıldız değerlendirmesi`
                : '1-5 yıldız değerlendirmesi'
            }
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= activeStarValue;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => void handleRate(star)}
                  aria-label={`${star} Yıldız Ver`}
                  data-testid={`rate-star-${star}`}
                  className="p-1 rounded-md hover:bg-amber-500/10 transition cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  <Star
                    className={`w-4 h-4 transition ${
                      filled
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-300 dark:text-neutral-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <span
            data-testid="content-rating-avg"
            className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 tabular-nums"
          >
            {summary.count > 0
              ? `★ ${summary.average.toFixed(1)} / 5 · ${summary.count} oy`
              : 'Henüz puanlanmadı'}
          </span>

          {feedbackMsg && (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              {feedbackMsg}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          data-testid={`toggle-comments-${contentKey}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
          <span>Yorumlar ({localComments.length})</span>
        </button>
      </div>

      {showComments && (
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="Adınız"
                aria-label="Yorum yazarı adı"
                className="sm:w-36 px-3 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Bu içerik hakkında görüş veya değerlendirmenizi yazın..."
                aria-label="Yorum metni"
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={submitting || commentBody.trim().length < 3}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gönder</span>
              </button>
            </div>
          </form>

          {localComments.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {localComments.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-neutral-950/90 border border-neutral-200/60 dark:border-neutral-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {c.authorName}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                      {typeof c.ratingStars === 'number' && (
                        <span className="text-amber-500 font-semibold">
                          ★ {c.ratingStars}/5
                        </span>
                      )}
                      <span>
                        {new Date(c.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center py-2">
              Henüz yorum yok. İlk yorumu ve yıldız değerlendirmesini siz paylaşın.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
