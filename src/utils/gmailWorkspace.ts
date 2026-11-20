export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  unread: boolean;
  starred: boolean;
  labelIds: string[];
}

export interface GmailMessageDetail extends GmailMessageSummary {
  bodyText: string;
}

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

function decodeBase64UrlUtf8(raw?: string): string {
  if (!raw) return '';
  try {
    const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLen);
    const binStr = atob(padded);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

function encodeBase64UrlUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binStr = '';
  for (let i = 0; i < bytes.length; i++) {
    binStr += String.fromCharCode(bytes[i]);
  }
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeMimeHeader(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${btoa(
    String.fromCharCode(...new TextEncoder().encode(value))
  )}?=`;
}

interface GmailPayloadPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayloadPart[];
}

function extractBodyText(payload?: GmailPayloadPart): string {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64UrlUtf8(payload.body.data);
  }
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const plain = extractBodyText(part);
      if (plain) return plain;
    }
  }
  if (payload.body?.data) {
    return decodeBase64UrlUtf8(payload.body.data)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return '';
}

function getHeaderValue(
  headers: { name?: string; value?: string }[] | undefined,
  headerName: string
): string {
  if (!Array.isArray(headers)) return '';
  const target = headerName.toLowerCase();
  return (
    headers.find((h) => (h.name || '').toLowerCase() === target)?.value || ''
  );
}

async function gmailFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('GMAIL_AUTH_REQUIRED');
  }
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(
      `Gmail API hatası (${response.status}): ${errText.slice(0, 140)}`
    );
  }
  return (await response.json()) as T;
}

export async function listGmailMessages(
  accessToken: string,
  options?: { query?: string; maxResults?: number; labelIds?: string[] }
): Promise<GmailMessageSummary[]> {
  const params = new URLSearchParams();
  params.set('maxResults', String(options?.maxResults ?? 12));
  if (options?.query?.trim()) {
    params.set('q', options.query.trim());
  }
  if (options?.labelIds && options.labelIds.length > 0) {
    for (const lbl of options.labelIds) {
      params.append('labelIds', lbl);
    }
  }

  const listData = await gmailFetch<{
    messages?: { id: string; threadId: string }[];
  }>(accessToken, `/messages?${params.toString()}`);

  const refs = listData.messages || [];
  if (refs.length === 0) return [];

  const details = await Promise.all(
    refs.slice(0, 12).map(async (ref) => {
      const msg = await gmailFetch<{
        id: string;
        threadId: string;
        snippet?: string;
        labelIds?: string[];
        payload?: { headers?: { name?: string; value?: string }[] };
      }>(
        accessToken,
        `/messages/${encodeURIComponent(
          ref.id
        )}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`
      );
      const headers = msg.payload?.headers;
      const labelIds = msg.labelIds || [];
      return {
        id: msg.id,
        threadId: msg.threadId,
        subject: getHeaderValue(headers, 'Subject') || '(Konusuz İleti)',
        from: getHeaderValue(headers, 'From') || 'Bilinmeyen Gönderen',
        to: getHeaderValue(headers, 'To') || '',
        date: getHeaderValue(headers, 'Date') || '',
        snippet: msg.snippet || '',
        unread: labelIds.includes('UNREAD'),
        starred: labelIds.includes('STARRED'),
        labelIds,
      };
    })
  );

  return details;
}

export async function getGmailMessageDetail(
  accessToken: string,
  messageId: string
): Promise<GmailMessageDetail> {
  const msg = await gmailFetch<{
    id: string;
    threadId: string;
    snippet?: string;
    labelIds?: string[];
    payload?: GmailPayloadPart & { headers?: { name?: string; value?: string }[] };
  }>(accessToken, `/messages/${encodeURIComponent(messageId)}?format=full`);

  const headers = msg.payload?.headers;
  const labelIds = msg.labelIds || [];
  const bodyText = extractBodyText(msg.payload) || msg.snippet || '';

  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: getHeaderValue(headers, 'Subject') || '(Konusuz İleti)',
    from: getHeaderValue(headers, 'From') || 'Bilinmeyen Gönderen',
    to: getHeaderValue(headers, 'To') || '',
    date: getHeaderValue(headers, 'Date') || '',
    snippet: msg.snippet || '',
    unread: labelIds.includes('UNREAD'),
    starred: labelIds.includes('STARRED'),
    labelIds,
    bodyText,
  };
}

export async function sendGmailMessage(
  accessToken: string,
  input: { to: string; subject: string; body: string }
): Promise<{ id: string; threadId: string }> {
  const toClean = input.to.trim();
  const subjectClean = input.subject.trim() || 'Luxo AI İletisi';
  const bodyClean = input.body.trim();

  const rawMime = [
    `To: ${toClean}`,
    `Subject: ${encodeMimeHeader(subjectClean)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    bodyClean,
  ].join('\r\n');

  const raw = encodeBase64UrlUtf8(rawMime);
  return gmailFetch<{ id: string; threadId: string }>(
    accessToken,
    '/messages/send',
    {
      method: 'POST',
      body: JSON.stringify({ raw }),
    }
  );
}

export async function trashGmailMessage(
  accessToken: string,
  messageId: string
): Promise<void> {
  await gmailFetch(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}/trash`,
    { method: 'POST' }
  );
}

export async function modifyGmailMessageLabels(
  accessToken: string,
  messageId: string,
  input: { addLabelIds?: string[]; removeLabelIds?: string[] }
): Promise<void> {
  await gmailFetch(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}/modify`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}
