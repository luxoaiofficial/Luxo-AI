import crypto from 'node:crypto';
import path from 'node:path';

export function resolveSafeStoredFilePath(
  baseDir: string,
  rawFileName: string,
  allowedPattern: RegExp
): string | null {
  if (typeof rawFileName !== 'string') return null;
  const trimmed = rawFileName.trim();
  if (!trimmed || trimmed.includes('/') || trimmed.includes('\\')) {
    return null;
  }
  const baseName = path.basename(trimmed);
  if (!baseName || baseName === '.' || baseName === '..' || baseName.includes('..')) {
    return null;
  }
  if (!allowedPattern.test(baseName)) {
    return null;
  }
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, baseName);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return resolvedTarget;
}

export function isTrustedGoogleApiMediaUrl(rawUri: string): boolean {
  try {
    const parsed = new URL(rawUri);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'generativelanguage.googleapis.com' ||
      host.endsWith('.googleapis.com')
    );
  } catch {
    return false;
  }
}

export function sanitizeSeoTargetUrl(
  rawUrl: unknown,
  fallbackUrl: string
): string {
  if (typeof rawUrl !== 'string') return fallbackUrl;
  const cleaned = rawUrl.trim().split(/[\r\n\t\0\s]/)[0]?.trim() || '';
  if (!cleaned) return fallbackUrl;
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return fallbackUrl;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === '::1'
    ) {
      return fallbackUrl;
    }
    return parsed.origin + parsed.pathname;
  } catch {
    return fallbackUrl;
  }
}

export function signSocialAdminToken(uid: string, secret: string): string {
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  const issuedAt = Date.now().toString(36);
  const payload = `${safeUid}.${issuedAt}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySocialAdminToken(
  token: string,
  claimedAdminUid: string | null,
  secret: string
): boolean {
  if (!token || !claimedAdminUid || !secret) return false;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return false;
  const [uid, issuedAt, providedSig] = parts;
  if (!uid || !issuedAt || !providedSig) return false;
  if (uid !== claimedAdminUid) return false;
  const payload = `${uid}.${issuedAt}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}
