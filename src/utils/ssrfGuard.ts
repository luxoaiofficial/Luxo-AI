export interface SsrfValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  reason?: string;
}

const PRIVATE_IPV4_CIDR_PATTERNS = [
  /^127\./,
  /^10\./,
  /^0\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'metadata',
]);

export function isPrivateOrReservedHostname(hostnameRaw: string): boolean {
  const host = hostnameRaw.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost') ||
    host.endsWith('.arpa')
  ) {
    return true;
  }
  if (PRIVATE_IPV4_CIDR_PATTERNS.some((re) => re.test(host))) {
    return true;
  }
  // IPv6 loopback, unique local (fc00::/7), link-local (fe80::/10), IPv4-mapped loopback/private
  if (
    host === '::' ||
    host === '::1' ||
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe80:') ||
    host.startsWith('::ffff:127.') ||
    host.startsWith('::ffff:10.') ||
    host.startsWith('::ffff:192.168.') ||
    host.startsWith('::ffff:169.254.') ||
    /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return true;
  }
  return false;
}

export function validateCustomProviderUrl(rawUrl: string): SsrfValidationResult {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    return { valid: false, reason: 'Provider base URL is required.' };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      reason: 'Custom provider endpoints must use HTTPS.',
    };
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      reason: 'Embedded URL credentials are not permitted.',
    };
  }

  if (isPrivateOrReservedHostname(parsed.hostname)) {
    return {
      valid: false,
      reason: 'Private, loopback, or metadata network addresses are blocked.',
    };
  }

  const normalizedPath = parsed.pathname.replace(/\/+$/, '');
  return {
    valid: true,
    normalizedUrl: `${parsed.origin}${normalizedPath}`,
  };
}

export const ENV_VAR_NAME_REGEX = /^[A-Z][A-Z0-9_]{1,63}$/;

export function isValidSecretEnvVarName(name: string): boolean {
  const clean = String(name || '').trim();
  return ENV_VAR_NAME_REGEX.test(clean);
}
