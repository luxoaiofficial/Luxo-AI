import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  QrCode,
  Share2,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { SharedContentPayload } from '../types/luxo';
import {
  buildOpenGraphMeta,
  buildSocialShareLinks,
  isPrivateDevPreviewOrigin,
  resolvePublicAppUrl,
  sanitizeLuxoBrand,
} from '../utils/luxoLogic';
import { LuxoLogo } from './LuxoLogo';

interface SocialShareButtonProps {
  payload: SharedContentPayload;
  compact?: boolean;
  label?: string;
  className?: string;
  onShared?: (platform: string) => void;
}

function copyTextFallback(text: string) {
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

export function syncClientSeoMeta(shared?: SharedContentPayload | null) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const origin = resolvePublicAppUrl(window.location.origin);
  const meta = buildOpenGraphMeta(origin, shared);

  document.title = meta.title;

  const upsertMeta = (
    attr: 'name' | 'property',
    key: string,
    content: string
  ) => {
    let el = document.head.querySelector(
      `meta[${attr}="${key}"]`
    ) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  upsertMeta('name', 'description', meta.description);
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', meta.canonicalUrl);
  upsertMeta('property', 'og:image', meta.ogImageUrl);
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', meta.ogImageUrl);

  let canonical = document.head.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', meta.canonicalUrl);
}

export const SocialShareButton: React.FC<SocialShareButtonProps> = ({
  payload,
  compact = false,
  label = 'Paylaş',
  className = '',
  onShared,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedTunnel, setCopiedTunnel] = useState(false);
  const [livePublicGateway, setLivePublicGateway] = useState<string>('');
  const [liveTunnelGateway, setLiveTunnelGateway] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [previewPlatform, setPreviewPlatform] = useState<'x' | 'facebook'>('x');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public-url')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          if (typeof data.permanentUrl === 'string' && data.permanentUrl) {
            setLivePublicGateway(data.permanentUrl.replace(/\/+$/, ''));
          }
          if (typeof data.tunnelUrl === 'string' && data.tunnelUrl) {
            setLiveTunnelGateway(data.tunnelUrl.replace(/\/+$/, ''));
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const rawOrigin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  const isDevPreview = !livePublicGateway && isPrivateDevPreviewOrigin(rawOrigin);
  const origin = livePublicGateway || resolvePublicAppUrl(rawOrigin);
  let publicHost = 'luxo.ai';
  try {
    publicHost = new URL(origin).host;
  } catch {
    publicHost = 'luxo.ai';
  }
  const cleanPayload: SharedContentPayload = {
    title: sanitizeLuxoBrand(payload.title || 'Luxo AI Paylaşımı'),
    excerpt: sanitizeLuxoBrand(payload.excerpt || ''),
    contentType: payload.contentType,
    badge: payload.badge ? sanitizeLuxoBrand(payload.badge) : undefined,
  };

  const links = buildSocialShareLinks(origin, cleanPayload);
  const ogMeta = buildOpenGraphMeta(origin, cleanPayload);

  useEffect(() => {
    if (isOpen) {
      syncClientSeoMeta(cleanPayload);
    }
  }, [isOpen, cleanPayload.title, cleanPayload.excerpt]);

  const directRootUrl = `${origin}/`;

  const targetShareUrl =
    cleanPayload.contentType === 'chat' &&
    cleanPayload.title === 'Luxo AI'
      ? directRootUrl
      : links.shareUrl;

  useEffect(() => {
    if (showQrModal && targetShareUrl) {
      QRCode.toDataURL(targetShareUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(''));
    }
  }, [showQrModal, targetShareUrl]);

  const handleCopyLink = () => {
    const targetUrl =
      cleanPayload.contentType === 'chat' &&
      cleanPayload.title === 'Luxo AI'
        ? directRootUrl
        : links.shareUrl;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(targetUrl)
          .catch(() => copyTextFallback(targetUrl));
      } else {
        copyTextFallback(targetUrl);
      }
    } catch {
      copyTextFallback(targetUrl);
    }
    setCopied(true);
    onShared?.('Bağlantı Kopyalandı');
    setTimeout(() => setCopied(false), 2200);
  };

  const liveTunnelRootUrl = liveTunnelGateway ? `${liveTunnelGateway}/` : '';

  const handleCopyTunnelLink = () => {
    if (!liveTunnelRootUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(liveTunnelRootUrl)
          .catch(() => copyTextFallback(liveTunnelRootUrl));
      } else {
        copyTextFallback(liveTunnelRootUrl);
      }
    } catch {
      copyTextFallback(liveTunnelRootUrl);
    }
    setCopiedTunnel(true);
    onShared?.('Doğrudan Tünel Bağlantısı Kopyalandı');
    setTimeout(() => setCopiedTunnel(false), 2200);
  };

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: ogMeta.title,
        text: ogMeta.description,
        url: links.shareUrl,
      });
      onShared?.('Sistem Paylaşımı');
    } catch {
      // user cancelled
    }
  };

  const platforms = [
    {
      id: 'twitter',
      name: 'X (Twitter)',
      href: links.twitter,
      bg: 'bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      name: 'Facebook',
      href: links.facebook,
      bg: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      ),
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      href: links.linkedin,
      bg: 'bg-[#0A66C2] hover:bg-[#0958a8] text-white',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      href: links.whatsapp,
      bg: 'bg-[#16a34a] hover:bg-[#15803d] text-white',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24z" />
        </svg>
      ),
    },
    {
      id: 'reddit',
      name: 'Reddit',
      href: links.reddit,
      bg: 'bg-[#FF4500] hover:bg-[#e03d00] text-white',
      icon: <Globe className="w-3.5 h-3.5" />,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      href: links.telegram,
      bg: 'bg-[#0284c7] hover:bg-[#0369a1] text-white',
      icon: <ExternalLink className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={
          className ||
          (compact
            ? 'p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer'
            : 'px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap')
        }
        aria-label={`Sosyal Medyada Paylaş: ${cleanPayload.title.slice(0, 32)}`}
        title="Sosyal Medyada Paylaş"
      >
        <Share2 className="w-3.5 h-3.5" />
        {!compact && <span>{label}</span>}
      </button>

      {isOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Sosyal Medyada Paylaş"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#1c1c21] rounded-3xl p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <LuxoLogo className="w-4 h-4 text-white" size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Sosyal Medyada Paylaş
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    OpenGraph & X/Twitter kart önizlemesi optimize edildi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                aria-label="Paylaşım Penceresini Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Social Card Preview Header & Platform Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  Sosyal Medya Kart Önizlemesi
                </span>
                <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('x')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      previewPlatform === 'x'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    X (Twitter)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('facebook')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      previewPlatform === 'facebook'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    Facebook
                  </button>
                </div>
              </div>

              {/* Dynamic Card Display */}
              <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141418]">
                <div className="aspect-[1200/630] bg-neutral-900 overflow-hidden relative">
                  <img
                    src={ogMeta.ogImageUrl}
                    alt={ogMeta.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {previewPlatform === 'x' && (
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono tracking-wide">
                      {publicHost}
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-0.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 truncate">
                    {previewPlatform === 'facebook'
                      ? `${publicHost.toUpperCase()} · BAĞLANTI ÖNİZLEMESİ`
                      : `${publicHost} · X KART PAYLAŞIMI`}
                  </div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                    {ogMeta.title}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
                    {ogMeta.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Social Platform Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {platforms.map((plat) => (
                <a
                  key={plat.id}
                  href={plat.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onShared?.(plat.name)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs ${plat.bg}`}
                >
                  {plat.icon}
                  <span>{plat.name}</span>
                </a>
              ))}
            </div>

            {(isDevPreview || origin.includes('.run.app')) && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-200 leading-snug">
                <strong>Kalıcı Resmi Site Adresi:</strong> Aşağıdaki birincil bağlantı kalıcıdır ve süresi dolmaz. Herkese açık erişim için AI Studio sağ üst çubuktaki <strong>Paylaş (Share) → Public</strong> veya <strong>Deploy</strong> seçeneğinin açık olduğundan emin olun.
              </div>
            )}

            {/* Direct One-Tap Open Link */}
            <div className="flex items-center gap-2">
              <a
                href={directRootUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onShared?.('Doğrudan Site Bağlantısı')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Kalıcı Siteyi Aç</span>
              </a>
              <button
                type="button"
                data-testid="share-modal-open-qr-btn"
                onClick={() => setShowQrModal(true)}
                className="py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                title="Mobil Cihazlar İçin QR Kod Göster"
              >
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>QR Kod</span>
              </button>
            </div>

            {/* Copy Permanent Link & Native Share */}
            <div className="pt-0.5 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 min-w-0">
                <Link2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={directRootUrl}
                  aria-label="Kalıcı Resmi Site Bağlantısı"
                  className="w-full bg-transparent text-[11px] font-mono text-neutral-600 dark:text-neutral-300 focus:outline-hidden truncate"
                />
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopyala</span>
                  </>
                )}
              </button>
              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer shrink-0"
                  aria-label="Cihaz Menüsüyle Paylaş"
                  title="Cihazda Paylaş"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {liveTunnelRootUrl && (
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                    Anlık Doğrudan Erişim Tüneli (Girişsiz)
                  </span>
                  <a
                    href={liveTunnelRootUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <span>Aç</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 min-w-0">
                    <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <input
                      type="text"
                      readOnly
                      value={liveTunnelRootUrl}
                      aria-label="Anlık Doğrudan Tünel Bağlantısı"
                      className="w-full bg-transparent text-[11px] font-mono text-neutral-600 dark:text-neutral-300 focus:outline-hidden truncate"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTunnelLink}
                    className="px-3 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    {copiedTunnel ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Tüneli Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showQrModal && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setShowQrModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="QR Kod ile Paylaş"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#1c1c21] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-center text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Mobil Cihaz İçin QR Kod
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                aria-label="QR Kod Penceresini Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Telefonunuzun veya tabletinizin kamerasını bu koda doğrultarak projeyi doğrudan açabilirsiniz.
            </p>

            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-inner flex items-center justify-center mx-auto w-64 h-64">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Proje Paylaşım QR Kodu"
                  data-testid="share-qr-code-img"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-neutral-400 animate-pulse font-mono">
                  QR Kod oluşturuluyor...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 truncate bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                {targetShareUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Bağlantı Panoya Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Bağlantıyı Kopyala</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface QuickSocialShareButtonsProps {
  payload: SharedContentPayload;
  compact?: boolean;
  showMoreModal?: boolean;
  className?: string;
  onShared?: (platform: string) => void;
}

export const QuickSocialShareButtons: React.FC<QuickSocialShareButtonsProps> = ({
  payload,
  compact = true,
  showMoreModal = true,
  className = '',
  onShared,
}) => {
  const rawOrigin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  const origin = resolvePublicAppUrl(rawOrigin);
  const cleanPayload: SharedContentPayload = {
    title: sanitizeLuxoBrand(payload.title || 'Luxo AI Paylaşımı'),
    excerpt: sanitizeLuxoBrand(payload.excerpt || ''),
    contentType: payload.contentType,
    badge: payload.badge ? sanitizeLuxoBrand(payload.badge) : undefined,
  };
  const links = buildSocialShareLinks(origin, cleanPayload);

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}
      data-testid="quick-social-share-bar"
    >
      <a
        href={links.facebook}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onShared?.('Facebook')}
        aria-label="Facebook'ta Paylaş"
        title="Facebook'ta Paylaş"
        data-testid="quick-share-facebook"
        className={`inline-flex items-center justify-center gap-1 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white border border-[#1877F2]/25 transition font-semibold cursor-pointer ${
          compact ? 'px-2.5 py-1.5 text-[11px] min-h-[32px]' : 'px-3 py-2 text-xs min-h-[36px]'
        }`}
      >
        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
        </svg>
        {!compact && <span>Facebook</span>}
      </a>

      <a
        href={links.twitter}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onShared?.('Twitter')}
        aria-label="X (Twitter)'da Paylaş"
        title="X (Twitter)'da Paylaş"
        data-testid="quick-share-twitter"
        className={`inline-flex items-center justify-center gap-1 rounded-full bg-neutral-900/10 dark:bg-white/10 hover:bg-neutral-900 dark:hover:bg-white text-neutral-800 dark:text-neutral-200 hover:text-white dark:hover:text-neutral-950 border border-neutral-300/60 dark:border-neutral-700 transition font-semibold cursor-pointer ${
          compact ? 'px-2.5 py-1.5 text-[11px] min-h-[32px]' : 'px-3 py-2 text-xs min-h-[36px]'
        }`}
      >
        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        {!compact && <span>Twitter</span>}
      </a>

      <a
        href={links.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onShared?.('LinkedIn')}
        aria-label="LinkedIn'de Paylaş"
        title="LinkedIn'de Paylaş"
        data-testid="quick-share-linkedin"
        className={`inline-flex items-center justify-center gap-1 rounded-full bg-[#0A66C2]/10 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white border border-[#0A66C2]/25 transition font-semibold cursor-pointer ${
          compact ? 'px-2.5 py-1.5 text-[11px] min-h-[32px]' : 'px-3 py-2 text-xs min-h-[36px]'
        }`}
      >
        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
        {!compact && <span>LinkedIn</span>}
      </a>

      {showMoreModal && (
        <SocialShareButton
          payload={cleanPayload}
          compact={compact}
          label="Diğer"
          onShared={onShared}
        />
      )}
    </div>
  );
};

