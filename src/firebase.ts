import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseAuthUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ChatThread, LuxoModelId, LuxoUser } from './types/luxo';

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = (
  firebaseConfig as { firestoreDatabaseId?: string }
).firestoreDatabaseId;
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
] as const;

export const gmailGoogleProvider = new GoogleAuthProvider();
for (const scope of GMAIL_SCOPES) {
  gmailGoogleProvider.addScope(scope);
}
gmailGoogleProvider.setCustomParameters({
  prompt: 'consent select_account',
  include_granted_scopes: 'true',
});

// Strict in-memory token store only (never localStorage or sessionStorage)
let inMemoryGmailAccessToken: string | null = null;
let inMemoryGmailEmail: string | null = null;

onAuthStateChanged(auth, (fbUser) => {
  if (!fbUser) {
    inMemoryGmailAccessToken = null;
    inMemoryGmailEmail = null;
  }
});

export function getGmailAccessToken(): string | null {
  return inMemoryGmailAccessToken;
}

export function getGmailUserEmail(): string | null {
  return inMemoryGmailEmail || auth.currentUser?.email || null;
}

export function clearGmailAccessToken(): void {
  inMemoryGmailAccessToken = null;
  inMemoryGmailEmail = null;
}

export const BOOTSTRAPPED_ADMIN_EMAIL = 'luxoaiofficial@gmail.com';

export function isBootstrappedAdminEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
}

export async function getVerifiedAuthBearerHeaders(): Promise<Record<string, string>> {
  const current = auth.currentUser;
  if (!current) return {};
  try {
    const token = await current.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function signInWithGmailOAuth(): Promise<{
  user: FirebaseAuthUser;
  accessToken: string;
}> {
  const result = await signInWithPopup(auth, gmailGoogleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken || '';
  if (!accessToken) {
    throw new Error('Google Workspace Gmail erişim belirteci alınamadı.');
  }
  inMemoryGmailAccessToken = accessToken;
  inMemoryGmailEmail = result.user.email || null;
  return { user: result.user, accessToken };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const VALID_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function sanitizeSafeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 && VALID_ID_PATTERN.test(cleaned)
    ? cleaned
    : `id_${Date.now()}`;
}

const USER_PROFILE_KEYS = [
  'uid',
  'displayName',
  'avatarText',
  'theme',
  'voiceName',
  'voiceRate',
  'customTone',
  'customInstructions',
  'workspaceType',
  'createdAt',
  'updatedAt',
] as const;

const CHAT_RECORD_KEYS = [
  'chatId',
  'ownerId',
  'title',
  'modelId',
  'lastUserPrompt',
  'lastAssistantReply',
  'messageCount',
  'createdAt',
  'updatedAt',
] as const;

function isFirestoreTimestamp(value: unknown): boolean {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  );
}

function isCompleteUserProfileDoc(
  data: Record<string, unknown> | undefined,
  uid: string
): boolean {
  if (!data) return false;
  const keys = Object.keys(data);
  if (
    keys.length !== USER_PROFILE_KEYS.length ||
    !USER_PROFILE_KEYS.every((k) => keys.includes(k))
  ) {
    return false;
  }
  return (
    data.uid === uid &&
    typeof data.displayName === 'string' &&
    data.displayName.length >= 1 &&
    data.displayName.length <= 80 &&
    typeof data.avatarText === 'string' &&
    data.avatarText.length >= 1 &&
    data.avatarText.length <= 4 &&
    (data.theme === 'system' || data.theme === 'light' || data.theme === 'dark') &&
    typeof data.voiceName === 'string' &&
    data.voiceName.length >= 1 &&
    data.voiceName.length <= 30 &&
    typeof data.voiceRate === 'number' &&
    Number.isFinite(data.voiceRate) &&
    data.voiceRate >= 0.5 &&
    data.voiceRate <= 2.0 &&
    typeof data.customTone === 'string' &&
    data.customTone.length >= 1 &&
    data.customTone.length <= 40 &&
    typeof data.customInstructions === 'string' &&
    data.customInstructions.length <= 1500 &&
    typeof data.workspaceType === 'string' &&
    data.workspaceType.length >= 1 &&
    data.workspaceType.length <= 40 &&
    isFirestoreTimestamp(data.createdAt) &&
    isFirestoreTimestamp(data.updatedAt)
  );
}

function isCompleteChatRecordDoc(
  data: Record<string, unknown> | undefined,
  uid: string,
  chatId: string
): boolean {
  if (!data) return false;
  const keys = Object.keys(data);
  if (
    keys.length !== CHAT_RECORD_KEYS.length ||
    !CHAT_RECORD_KEYS.every((k) => keys.includes(k))
  ) {
    return false;
  }
  return (
    data.ownerId === uid &&
    data.chatId === chatId &&
    typeof data.title === 'string' &&
    data.title.length >= 1 &&
    data.title.length <= 120 &&
    typeof data.modelId === 'string' &&
    /^[a-zA-Z0-9._:/-]{1,128}$/.test(data.modelId) &&
    typeof data.lastUserPrompt === 'string' &&
    data.lastUserPrompt.length <= 4000 &&
    typeof data.lastAssistantReply === 'string' &&
    data.lastAssistantReply.length <= 8000 &&
    typeof data.messageCount === 'number' &&
    Number.isFinite(data.messageCount) &&
    data.messageCount >= 0 &&
    data.messageCount <= 10000 &&
    isFirestoreTimestamp(data.createdAt) &&
    isFirestoreTimestamp(data.updatedAt)
  );
}

export function sanitizeDisplayName(rawName?: string | null): string {
  if (!rawName) return 'Luxo Kullanıcısı';
  const withoutDomain = rawName.includes('@')
    ? rawName.split('@')[0]
    : rawName;
  const cleaned = withoutDomain.replace(/[^\p{L}\p{N}\s._-]/gu, '').trim();
  return (cleaned || 'Luxo Kullanıcısı').slice(0, 80);
}

export function buildAvatarInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  return (initials || 'LX').slice(0, 4);
}

export async function signInWithGoogleFirebase(): Promise<FirebaseAuthUser> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutFirebase(): Promise<void> {
  clearGmailAccessToken();
  await signOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseAuthUser };

function clampVoiceRate(raw: unknown): number {
  return typeof raw === 'number' && Number.isFinite(raw)
    ? Math.min(2.0, Math.max(0.5, raw))
    : 1.0;
}

function safeBoundedStr(
  raw: unknown,
  fallback: string,
  maxLen: number
): string {
  const cleaned = typeof raw === 'string' ? raw.trim() : '';
  return (cleaned || fallback).slice(0, maxLen);
}

async function ensureParentUserDocReady(fbUser: FirebaseAuthUser): Promise<string> {
  const uid = sanitizeSafeId(fbUser.uid);
  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists() || !isCompleteUserProfileDoc(snap.data(), uid)) {
    if (fbUser.emailVerified) {
      const existing = snap.exists() ? snap.data() : {};
      if (snap.exists()) {
        await deleteDoc(userRef).catch(() => {});
      }
      const safeName = sanitizeDisplayName(
        typeof existing.displayName === 'string' && existing.displayName
          ? existing.displayName
          : fbUser.displayName
      );
      await setDoc(userRef, {
        uid,
        displayName: safeName,
        avatarText: buildAvatarInitials(safeName),
        theme:
          existing.theme === 'dark' || existing.theme === 'light'
            ? existing.theme
            : 'system',
        voiceName: safeBoundedStr(existing.voiceName, 'Breeze', 30),
        voiceRate: clampVoiceRate(existing.voiceRate),
        customTone: safeBoundedStr(existing.customTone, 'Varsayılan', 40),
        customInstructions: String(existing.customInstructions || '').slice(
          0,
          1500
        ),
        workspaceType: safeBoundedStr(existing.workspaceType, 'Kişisel', 40),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, path));
    }
  }
  return uid;
}

export async function ensureAndSyncUserProfile(
  fbUser: FirebaseAuthUser,
  currentPrefs: Partial<LuxoUser>
): Promise<Partial<LuxoUser>> {
  const uid = sanitizeSafeId(fbUser.uid);
  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    const safeName = sanitizeDisplayName(
      currentPrefs.name && currentPrefs.name !== 'Misafir Kullanıcı'
        ? currentPrefs.name
        : fbUser.displayName
    );
    const avatarText = buildAvatarInitials(safeName);

    if (!snap.exists() || !isCompleteUserProfileDoc(snap.data(), uid)) {
      const existing = snap.exists() ? snap.data() : {};
      const resolvedName = sanitizeDisplayName(
        typeof existing.displayName === 'string' && existing.displayName
          ? existing.displayName
          : safeName
      );
      const resolvedAvatar = buildAvatarInitials(resolvedName);
      const resolvedTheme =
        existing.theme === 'dark' || existing.theme === 'light'
          ? existing.theme
          : currentPrefs.theme === 'dark' || currentPrefs.theme === 'light'
          ? currentPrefs.theme
          : 'system';
      const resolvedVoice = safeBoundedStr(
        existing.voiceName || currentPrefs.voiceName,
        'Breeze',
        30
      );
      const resolvedRate = clampVoiceRate(
        typeof existing.voiceRate === 'number' && Number.isFinite(existing.voiceRate)
          ? existing.voiceRate
          : currentPrefs.voiceRate
      );
      const resolvedTone = safeBoundedStr(
        existing.customTone || currentPrefs.customTone,
        'Varsayılan',
        40
      );
      const resolvedInstructions = String(
        existing.customInstructions ?? currentPrefs.customInstructions ?? ''
      ).slice(0, 1500);
      const resolvedWorkspace = safeBoundedStr(
        existing.workspaceType || currentPrefs.workspaceType,
        'Kişisel',
        40
      );

      if (fbUser.emailVerified) {
        const createOrMigratePayload = {
          uid,
          displayName: resolvedName,
          avatarText: resolvedAvatar,
          theme: resolvedTheme,
          voiceName: resolvedVoice,
          voiceRate: resolvedRate,
          customTone: resolvedTone,
          customInstructions: resolvedInstructions,
          workspaceType: resolvedWorkspace,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        try {
          if (snap.exists()) {
            await deleteDoc(userRef).catch(() => {});
          }
          await setDoc(userRef, createOrMigratePayload);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
      return {
        id: uid,
        name: resolvedName,
        avatarText: resolvedAvatar,
        avatarUrl: fbUser.photoURL || undefined,
        theme: resolvedTheme,
        voiceName: resolvedVoice,
        voiceRate: resolvedRate,
        customTone: resolvedTone,
        customInstructions: resolvedInstructions,
        workspaceType: resolvedWorkspace,
      };
    }

    const data = snap.data();
    return {
      id: uid,
      name: sanitizeDisplayName(data.displayName || safeName),
      avatarText: (data.avatarText || avatarText).slice(0, 4),
      avatarUrl: fbUser.photoURL || undefined,
      theme: data.theme || 'system',
      voiceName: data.voiceName || 'Breeze',
      voiceRate: typeof data.voiceRate === 'number' ? data.voiceRate : 1.0,
      customTone: data.customTone || 'Varsayılan',
      customInstructions: data.customInstructions || '',
      workspaceType: data.workspaceType || 'Kişisel',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateUserProfileInFirestore(
  user: LuxoUser
): Promise<void> {
  if (user.isGuest || !auth.currentUser || !auth.currentUser.emailVerified) {
    return;
  }
  const uid = sanitizeSafeId(auth.currentUser.uid);
  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    const safeName = sanitizeDisplayName(user.name);
    const avatarText = buildAvatarInitials(safeName);
    const theme =
      user.theme === 'dark' || user.theme === 'light' ? user.theme : 'system';
    const voiceName = safeBoundedStr(user.voiceName, 'Breeze', 30);
    const voiceRate = clampVoiceRate(user.voiceRate);
    const customTone = safeBoundedStr(user.customTone, 'Varsayılan', 40);
    const customInstructions = String(user.customInstructions || '').slice(0, 1500);
    const workspaceType = safeBoundedStr(user.workspaceType, 'Kişisel', 40);

    const mutableFields = {
      displayName: safeName,
      avatarText,
      theme,
      voiceName,
      voiceRate,
      customTone,
      customInstructions,
      workspaceType,
    };

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid,
        ...mutableFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (!isCompleteUserProfileDoc(snap.data(), uid)) {
      await deleteDoc(userRef).catch(() => {});
      await setDoc(userRef, {
        uid,
        ...mutableFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        ...mutableFields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveChatToFirestore(chat: ChatThread): Promise<boolean> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return false;
  const uid = await ensureParentUserDocReady(auth.currentUser);
  const chatId = sanitizeSafeId(chat.id);
  const path = `users/${uid}/chats/${chatId}`;
  const chatRef = doc(db, 'users', uid, 'chats', chatId);

  const lastUserMsg =
    [...chat.messages].reverse().find((m) => m.role === 'user')?.content || '';
  const lastAssistantObj = [...chat.messages]
    .reverse()
    .find((m) => m.role === 'assistant');
  const lastAssistantMsg =
    lastAssistantObj?.content ||
    (lastAssistantObj?.comparisonResponses
      ? lastAssistantObj.comparisonResponses
          .map((cr) => `[${cr.modelId}]: ${cr.content}`)
          .join('\n\n---\n\n')
      : '');

  const rawModelId = String(chat.modelId || 'gemini-4-argon').slice(0, 128);
  const modelId: string = /^[a-zA-Z0-9._:/-]{1,128}$/.test(rawModelId)
    ? rawModelId
    : 'gemini-4-argon';

  try {
    const snap = await getDoc(chatRef);
    const title = (chat.title?.trim() || 'Yeni Sohbet').slice(0, 120);
    const lastUserPrompt = lastUserMsg.slice(0, 4000);
    const lastAssistantReply = lastAssistantMsg.slice(0, 8000);
    const messageCount = Math.min(10000, Math.max(0, chat.messages.length));

    if (!snap.exists() || !isCompleteChatRecordDoc(snap.data(), uid, chatId)) {
      if (snap.exists()) {
        await deleteDoc(chatRef).catch(() => {});
      }
      await setDoc(chatRef, {
        chatId,
        ownerId: uid,
        title,
        modelId,
        lastUserPrompt,
        lastAssistantReply,
        messageCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(chatRef, {
        title,
        modelId,
        lastUserPrompt,
        lastAssistantReply,
        messageCount,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeChatFromFirestore(chatIdRaw: string): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const uid = await ensureParentUserDocReady(auth.currentUser);
  const chatId = sanitizeSafeId(chatIdRaw);
  const path = `users/${uid}/chats/${chatId}`;
  const chatRef = doc(db, 'users', uid, 'chats', chatId);

  try {
    const snap = await getDoc(chatRef);
    if (snap.exists()) {
      await deleteDoc(chatRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserChats(
  uidRaw: string,
  onReceive: (synced: ChatThread[]) => void
): () => void {
  const current = auth.currentUser;
  if (!current || !uidRaw) {
    return () => {};
  }
  const uid = sanitizeSafeId(current.uid);
  if (sanitizeSafeId(uidRaw) !== uid) {
    return () => {};
  }

  const path = `users/${uid}/chats`;
  const chatsCol = collection(db, 'users', uid, 'chats');
  // Explicitly filter by ownerId == uid to satisfy Pillar 8 (resource.data.ownerId == request.auth.uid)
  const chatsQuery = query(chatsCol, where('ownerId', '==', uid));

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const loaded: ChatThread[] = snapshot.docs.map((d) => {
        const data = d.data();
        const messages = [];
        if (data.lastUserPrompt) {
          messages.push({
            id: `${d.id}-u`,
            role: 'user' as const,
            content: String(data.lastUserPrompt),
            timestamp: Date.now() - 1000,
          });
        }
        if (data.lastAssistantReply) {
          messages.push({
            id: `${d.id}-a`,
            role: 'assistant' as const,
            content: String(data.lastAssistantReply),
            modelId: (data.modelId as LuxoModelId) || 'luxo-flash',
            timestamp: Date.now(),
          });
        }
        return {
          id: data.chatId || d.id,
          userId: data.ownerId,
          title: data.title || 'Kayıtlı Sohbet',
          modelId: (data.modelId as LuxoModelId) || 'luxo-flash',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages,
        };
      });
      onReceive(loaded);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function registerWithEmailPassword(
  email: string,
  pass: string,
  displayName: string
): Promise<{ user: FirebaseAuthUser; verificationSent: boolean }> {
  const cleanEmail = email.trim();
  const cleanPass = pass.trim();
  const safeName = sanitizeDisplayName(displayName.trim() || 'Luxo Kullanıcısı');
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
  await updateProfile(userCredential.user, { displayName: safeName }).catch(() => {});
  let verificationSent = false;
  try {
    await sendEmailVerification(userCredential.user);
    verificationSent = true;
  } catch {
    // handled gracefully
  }
  return { user: userCredential.user, verificationSent };
}

export async function loginWithEmailPassword(
  email: string,
  pass: string
): Promise<FirebaseAuthUser> {
  const cleanEmail = email.trim();
  const cleanPass = pass.trim();
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
  return cred.user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim();
  await sendPasswordResetEmail(auth, cleanEmail);
}

export async function resendVerificationEmail(): Promise<boolean> {
  if (!auth.currentUser) return false;
  await sendEmailVerification(auth.currentUser);
  return true;
}

export async function refreshCurrentUserVerification(): Promise<boolean> {
  if (!auth.currentUser) return false;
  await auth.currentUser.reload();
  return Boolean(auth.currentUser.emailVerified);
}

export async function submitFeedbackToFirestore(
  category: 'Hata Bildirimi' | 'Özellik Önerisi' | 'Genel Geri Bildirim',
  subject: string,
  message: string,
  details?: {
    errorType?: string;
    screenshotUrl?: string;
    deviceInfo?: string;
    modelId?: string;
    rating?: number;
  }
): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const uid = await ensureParentUserDocReady(auth.currentUser);
  const feedbackId = `fb_${Date.now()}`;
  const path = `feedback/${feedbackId}`;
  const safeSubject = (subject.trim() || `${category} - Luxo AI`).slice(0, 120);
  const safeMessage = (message.trim() || safeSubject).slice(0, 2000);

  const payload: Record<string, unknown> = {
    feedbackId,
    authorId: uid,
    category,
    subject: safeSubject,
    message: safeMessage,
    status: 'submitted',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (details?.errorType) payload.errorType = details.errorType.slice(0, 60);
  if (details?.screenshotUrl) payload.screenshotUrl = details.screenshotUrl.slice(0, 500000);
  if (details?.deviceInfo) payload.deviceInfo = details.deviceInfo.slice(0, 500);
  if (details?.modelId) payload.modelId = details.modelId.slice(0, 80);
  if (typeof details?.rating === 'number') payload.rating = Math.round(details.rating);

  try {
    await setDoc(doc(db, 'feedback', feedbackId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function isVerifiedFirebaseAdmin(): boolean {
  const cur = auth.currentUser;
  return Boolean(cur && cur.emailVerified && cur.email === BOOTSTRAPPED_ADMIN_EMAIL);
}

export async function syncPublicSocialProfileToFirestore(input: {
  displayName: string;
  handle: string;
  roleTitle: string;
  bio: string;
  avatarUrl: string;
  interests: string[];
}): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const uid = sanitizeSafeId(auth.currentUser.uid);
  const path = `publicProfiles/${uid}`;
  const profileRef = doc(db, 'publicProfiles', uid);

  const safeHandle = input.handle
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 28);
  const normalizedHandle = safeHandle.length >= 3 ? safeHandle : `uye_${uid.slice(0, 8)}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const safeInterests = (input.interests || [])
    .map((t) => String(t).trim().slice(0, 32))
    .filter((t) => t.length >= 2)
    .slice(0, 10);

  try {
    const snap = await getDoc(profileRef);
    const baseFields = {
      displayName: sanitizeDisplayName(input.displayName).slice(0, 80),
      handle: normalizedHandle,
      roleTitle: (input.roleTitle.trim() || 'Topluluk Üyesi').slice(0, 80),
      bio: input.bio.trim().slice(0, 280),
      avatarUrl: (input.avatarUrl.trim() || 'preset:selin').slice(0, 500),
      interests: safeInterests,
      updatedAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(profileRef, {
        uid,
        ...baseFields,
        visibility: 'public',
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(profileRef, baseFields);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncUserFavoriteToFirestore(
  targetType: 'event' | 'announcement',
  targetIdRaw: string,
  favorited: boolean
): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const uid = await ensureParentUserDocReady(auth.currentUser);
  const targetId = sanitizeSafeId(targetIdRaw);
  const favoriteId = sanitizeSafeId(`${targetType}_${targetId}`);
  const path = `users/${uid}/favorites/${favoriteId}`;
  const favRef = doc(db, 'users', uid, 'favorites', favoriteId);

  try {
    const snap = await getDoc(favRef);
    if (favorited && !snap.exists()) {
      await setDoc(favRef, {
        favoriteId,
        ownerId: uid,
        targetType,
        targetId,
        createdAt: serverTimestamp(),
      });
    } else if (!favorited && snap.exists()) {
      await deleteDoc(favRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncSocialConnectionToFirestore(
  peerIdRaw: string,
  relationType: 'following' | 'friend' | 'both' | 'none'
): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const uid = await ensureParentUserDocReady(auth.currentUser);
  const peerId = sanitizeSafeId(peerIdRaw);
  if (peerId === uid) return;
  const path = `users/${uid}/connections/${peerId}`;
  const connRef = doc(db, 'users', uid, 'connections', peerId);

  try {
    const snap = await getDoc(connRef);
    if (relationType === 'none') {
      if (snap.exists()) {
        await deleteDoc(connRef);
      }
      return;
    }
    if (!snap.exists()) {
      await setDoc(connRef, {
        peerId,
        ownerId: uid,
        relationType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(connRef, {
        relationType,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createEventInFirestore(event: {
  id: string;
  title: string;
  description: string;
  category:
    | 'Konferans & Zirve'
    | 'Atölye (Workshop)'
    | 'Topluluk Buluşması'
    | 'Canlı Yayın & Lansman';
  dateIso: string;
  startTime: string;
  endTime: string;
  location: string;
  speakerName: string;
  capacity: number;
}): Promise<void> {
  if (!isVerifiedFirebaseAdmin() || !auth.currentUser) return;
  const uid = sanitizeSafeId(auth.currentUser.uid);
  const eventId = sanitizeSafeId(event.id);
  const path = `events/${eventId}`;

  try {
    await setDoc(doc(db, 'events', eventId), {
      eventId,
      title: event.title.trim().slice(0, 120),
      description: event.description.trim().slice(0, 1500),
      category: event.category,
      dateIso: event.dateIso.slice(0, 10),
      startTime: event.startTime.slice(0, 5),
      endTime: event.endTime.slice(0, 5),
      location: event.location.trim().slice(0, 140),
      speakerName: event.speakerName.trim().slice(0, 80),
      capacity: Math.min(10000, Math.max(10, Math.round(event.capacity))),
      createdBy: uid,
      status: 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createAnnouncementInFirestore(ann: {
  id: string;
  title: string;
  summary: string;
  priority: 'Önemli' | 'Güncelleme' | 'Topluluk';
  tag: string;
  pinned: boolean;
}): Promise<void> {
  if (!isVerifiedFirebaseAdmin() || !auth.currentUser) return;
  const uid = sanitizeSafeId(auth.currentUser.uid);
  const announcementId = sanitizeSafeId(ann.id);
  const path = `announcements/${announcementId}`;

  try {
    await setDoc(doc(db, 'announcements', announcementId), {
      announcementId,
      title: ann.title.trim().slice(0, 120),
      summary: ann.summary.trim().slice(0, 1500),
      priority: ann.priority,
      tag: (ann.tag.trim() || 'Genel Duyuru').slice(0, 40),
      pinned: Boolean(ann.pinned),
      createdBy: uid,
      status: 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncPrivateRoomToFirestore(room: {
  id: string;
  name: string;
  topic: string;
  roomType: 'direct' | 'private-room';
  memberUids: string[];
}): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const uid = sanitizeSafeId(auth.currentUser.uid);
  const roomId = sanitizeSafeId(room.id);
  const path = `privateRooms/${roomId}`;
  const roomRef = doc(db, 'privateRooms', roomId);
  const memberIds = Array.from(
    new Set([uid, ...room.memberUids.map((m) => sanitizeSafeId(m))])
  ).slice(0, 10);

  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
      await setDoc(roomRef, {
        roomId,
        name: room.name.trim().slice(0, 80),
        topic: room.topic.trim().slice(0, 200),
        roomType: room.roomType,
        ownerId: uid,
        memberIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncRoomMessageToFirestore(input: {
  roomId: string;
  messageId: string;
  senderName: string;
  content: string;
  visibleToUids: string[];
}): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const uid = sanitizeSafeId(auth.currentUser.uid);
  const roomId = sanitizeSafeId(input.roomId);
  const messageId = sanitizeSafeId(input.messageId);
  const path = `privateRooms/${roomId}/messages/${messageId}`;
  const parentRef = doc(db, 'privateRooms', roomId);

  try {
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) return;
    const parentMembers = Array.isArray(parentSnap.data()?.memberIds)
      ? (parentSnap.data()?.memberIds as string[])
      : [uid];
    if (!parentMembers.includes(uid)) return;

    await setDoc(doc(db, 'privateRooms', roomId, 'messages', messageId), {
      messageId,
      roomId,
      senderId: uid,
      senderName: sanitizeDisplayName(input.senderName).slice(0, 80),
      content: input.content.trim().slice(0, 2000),
      visibleToUids: parentMembers,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function verifyFirestoreServerHealth(): Promise<{
  ok: boolean;
  latencyMs: number;
  projectId: string;
  databaseId: string;
  authenticatedUid: string | null;
  errorMessage?: string;
}> {
  const startedAt = Date.now();
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return {
      ok: true,
      latencyMs: Math.max(1, Date.now() - startedAt),
      projectId: firebaseConfig.projectId,
      databaseId: firestoreDatabaseId || '(default)',
      authenticatedUid: auth.currentUser?.uid || null,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.max(1, Date.now() - startedAt),
      projectId: firebaseConfig.projectId,
      databaseId: firestoreDatabaseId || '(default)',
      authenticatedUid: auth.currentUser?.uid || null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

export interface SyncedLangdockFirestoreRecord {
  id: string;
  itemType: 'assistant' | 'prompt' | 'knowledge' | 'workflow' | 'integration';
  title: string;
  category: string;
  modelId: string;
  content: string;
  isEnabled: boolean;
  updatedAtMs: number;
}

export async function syncLangdockItemToFirestore(input: {
  id: string;
  itemType: 'assistant' | 'prompt' | 'knowledge' | 'workflow' | 'integration';
  title: string;
  category: string;
  modelId: string;
  content: string;
  isEnabled: boolean;
}): Promise<boolean> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return false;
  const uid = await ensureParentUserDocReady(auth.currentUser);
  const itemId = sanitizeSafeId(input.id);
  const path = `users/${uid}/workspaceItems/${itemId}`;
  const itemRef = doc(db, 'users', uid, 'workspaceItems', itemId);

  const safeTitle = safeBoundedStr(input.title, 'Langdock Öğesi', 120);
  const safeCategory = safeBoundedStr(input.category, 'Genel', 60);
  const safeModelId = safeBoundedStr(input.modelId, 'gemini-4-hydrogen', 40);
  const safeContent = String(input.content || '').slice(0, 4000);

  try {
    const snap = await getDoc(itemRef);
    if (!snap.exists()) {
      await setDoc(itemRef, {
        itemId,
        ownerId: uid,
        itemType: input.itemType,
        title: safeTitle,
        category: safeCategory,
        modelId: safeModelId,
        content: safeContent,
        isEnabled: Boolean(input.isEnabled),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(itemRef, {
        title: safeTitle,
        category: safeCategory,
        modelId: safeModelId,
        content: safeContent,
        isEnabled: Boolean(input.isEnabled),
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLangdockItemFromFirestore(
  itemIdRaw: string
): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const uid = await ensureParentUserDocReady(auth.currentUser);
  const itemId = sanitizeSafeId(itemIdRaw);
  const path = `users/${uid}/workspaceItems/${itemId}`;
  const itemRef = doc(db, 'users', uid, 'workspaceItems', itemId);

  try {
    const snap = await getDoc(itemRef);
    if (snap.exists()) {
      await deleteDoc(itemRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeLangdockWorkspaceItems(
  uidRaw: string,
  onReceive: (items: SyncedLangdockFirestoreRecord[]) => void
): () => void {
  const current = auth.currentUser;
  if (!current || !uidRaw) return () => {};
  const uid = sanitizeSafeId(current.uid);
  if (sanitizeSafeId(uidRaw) !== uid) return () => {};

  const path = `users/${uid}/workspaceItems`;
  const colRef = collection(db, 'users', uid, 'workspaceItems');
  const q = query(colRef, where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SyncedLangdockFirestoreRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.itemId || d.id),
          itemType: (data.itemType as SyncedLangdockFirestoreRecord['itemType']) || 'assistant',
          title: String(data.title || 'Öğe'),
          category: String(data.category || 'Genel'),
          modelId: String(data.modelId || 'gemini-4-hydrogen'),
          content: String(data.content || ''),
          isEnabled: Boolean(data.isEnabled),
          updatedAtMs: Date.now(),
        };
      });
      onReceive(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncProjectV2ToFirestore(input: {
  id: string;
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  color: string;
}): Promise<boolean> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return false;
  const uid = await ensureParentUserDocReady(auth.currentUser);
  const projectId = sanitizeSafeId(input.id);
  const path = `users/${uid}/projects/${projectId}`;
  const ref = doc(db, 'users', uid, 'projects', projectId);

  const safeName = safeBoundedStr(input.name, 'Luxo Projesi', 120);
  const safeDesc = String(input.description || '').slice(0, 500);
  const safeCategory = safeBoundedStr(input.category, 'Genel', 60);
  const safePrompt = String(input.systemPrompt || '').slice(0, 4000);
  const safeColor = safeBoundedStr(input.color, '#7c3aed', 24);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        projectId,
        ownerId: uid,
        name: safeName,
        description: safeDesc,
        category: safeCategory,
        systemPrompt: safePrompt,
        color: safeColor,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        name: safeName,
        description: safeDesc,
        category: safeCategory,
        systemPrompt: safePrompt,
        color: safeColor,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncArenaHistoryToFirestore(input: {
  id: string;
  prompt: string;
  modelIds: string[];
  winnerModelId?: string;
  summaryText: string;
}): Promise<boolean> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return false;
  const uid = await ensureParentUserDocReady(auth.currentUser);
  const arenaId = sanitizeSafeId(input.id);
  const path = `users/${uid}/arenaHistory/${arenaId}`;
  const ref = doc(db, 'users', uid, 'arenaHistory', arenaId);
  const safePrompt = safeBoundedStr(input.prompt, 'Model Arena Prompt', 4000);
  const cleanModelIds = input.modelIds
    .map((m) => String(m || '').slice(0, 128))
    .filter((m) => /^[a-zA-Z0-9._:/-]{1,128}$/.test(m))
    .slice(0, 4);
  if (cleanModelIds.length < 2) return false;
  const safeSummary = String(input.summaryText || '').slice(0, 6000);
  const validWinner =
    input.winnerModelId && /^[a-zA-Z0-9._:/-]{1,128}$/.test(input.winnerModelId)
      ? input.winnerModelId
      : undefined;

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        arenaId,
        ownerId: uid,
        prompt: safePrompt,
        modelIds: cleanModelIds,
        ...(validWinner ? { winnerModelId: validWinner } : {}),
        summaryText: safeSummary,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (validWinner) {
      await updateDoc(ref, {
        winnerModelId: validWinner,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}


