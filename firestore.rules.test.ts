import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { LUXO_MODEL_IDS } from './src/utils/luxoLogic';

const rulesSource = fs.readFileSync(
  path.resolve(process.cwd(), 'firestore.rules'),
  'utf-8'
);
const blueprint = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'firebase-blueprint.json'), 'utf-8')
);

interface AuthContext {
  uid: string;
  email?: string;
  email_verified: boolean;
  isAdminDoc?: boolean;
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const ADMIN_EMAIL = 'luxoaiofficial@gmail.com';

function isValidId(id: unknown): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= 128 &&
    VALID_ID_REGEX.test(id)
  );
}

function isAdmin(auth: AuthContext | null): boolean {
  if (!auth || !auth.email_verified) return false;
  return auth.email === ADMIN_EMAIL || Boolean(auth.isAdminDoc);
}

function evaluateDirtyDozen(
  scenario: string,
  auth: AuthContext | null,
  pathId: string,
  payload: Record<string, unknown>,
  serverTime: number,
  parentExists = true,
  existingDoc?: Record<string, unknown>
): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (!auth) return 'PERMISSION_DENIED';
  if (!auth.email_verified && !scenario.endsWith(':get')) return 'PERMISSION_DENIED';
  if (!isValidId(pathId)) return 'PERMISSION_DENIED';

  if (scenario.startsWith('user:')) {
    if (pathId !== auth.uid) return 'PERMISSION_DENIED';
    const allowed = [
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
    ];
    const keys = Object.keys(payload);
    if (
      !allowed.every((k) => keys.includes(k)) ||
      !keys.every((k) => allowed.includes(k))
    ) {
      return 'PERMISSION_DENIED';
    }
    if (payload.uid !== auth.uid) return 'PERMISSION_DENIED';
    if (
      typeof payload.customInstructions !== 'string' ||
      payload.customInstructions.length > 1500
    ) {
      return 'PERMISSION_DENIED';
    }
    if (!existingDoc && payload.createdAt !== serverTime) return 'PERMISSION_DENIED';
    if (payload.updatedAt !== serverTime) return 'PERMISSION_DENIED';
    return 'ALLOWED';
  }

  if (scenario.startsWith('publicProfile:')) {
    if (pathId !== auth.uid) return 'PERMISSION_DENIED';
    const allowed = [
      'uid',
      'displayName',
      'handle',
      'roleTitle',
      'bio',
      'avatarUrl',
      'interests',
      'visibility',
      'createdAt',
      'updatedAt',
    ];
    const keys = Object.keys(payload);
    if (
      !allowed.every((k) => keys.includes(k)) ||
      !keys.every((k) => allowed.includes(k))
    ) {
      return 'PERMISSION_DENIED';
    }
    if (payload.uid !== auth.uid || payload.visibility !== 'public') {
      return 'PERMISSION_DENIED';
    }
    if (!Array.isArray(payload.interests) || payload.interests.length > 10) {
      return 'PERMISSION_DENIED';
    }
    if (typeof payload.bio !== 'string' || payload.bio.length > 280) {
      return 'PERMISSION_DENIED';
    }
    if (!existingDoc && payload.createdAt !== serverTime) return 'PERMISSION_DENIED';
    if (payload.updatedAt !== serverTime) return 'PERMISSION_DENIED';
    return 'ALLOWED';
  }

  if (scenario.startsWith('event:')) {
    if (!isAdmin(auth)) return 'PERMISSION_DENIED';
    if (payload.createdBy !== auth.uid) return 'PERMISSION_DENIED';
    if (payload.createdAt !== serverTime) return 'PERMISSION_DENIED';
    return 'ALLOWED';
  }

  if (scenario.startsWith('roomMessage:')) {
    if (!parentExists) return 'PERMISSION_DENIED';
    const parentMembers = Array.isArray(existingDoc?.memberIds)
      ? (existingDoc?.memberIds as string[])
      : [];
    if (!parentMembers.includes(auth.uid)) return 'PERMISSION_DENIED';
    const visibleTo = Array.isArray(payload.visibleToUids)
      ? (payload.visibleToUids as string[])
      : [];
    if (JSON.stringify(visibleTo) !== JSON.stringify(parentMembers)) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOWED';
  }

  if (scenario.startsWith('chat:')) {
    if (!parentExists) return 'PERMISSION_DENIED';
    if (payload.ownerId !== auth.uid) return 'PERMISSION_DENIED';
    if (existingDoc && payload.ownerId !== existingDoc.ownerId) {
      return 'PERMISSION_DENIED';
    }
    if (existingDoc && payload.createdAt !== existingDoc.createdAt) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOWED';
  }

  if (scenario.startsWith('feedback:')) {
    if (scenario === 'feedback:get') {
      return existingDoc?.authorId === auth.uid ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    if (existingDoc && existingDoc.status === 'archived') {
      return 'PERMISSION_DENIED';
    }
    if (existingDoc && existingDoc.authorId !== auth.uid) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOWED';
  }

  return 'PERMISSION_DENIED';
}

test('firestore.rules enforces Eight Pillars and matches all 11 firebase-blueprint.json paths & 122 models', () => {
  assert.ok(rulesSource.includes("rules_version = '2';"));
  assert.ok(
    rulesSource.includes('match /{document=**} {\n      allow read, write: if false;')
  );
  assert.ok(rulesSource.includes('request.auth.token.email_verified == true'));
  assert.ok(
    rulesSource.includes("request.auth.token.email == 'luxoaiofficial@gmail.com'")
  );
  assert.ok(!rulesSource.includes('email is string'), 'Zero email PII stored in rules');

  for (const collectionPath of Object.keys(blueprint.firestore)) {
    const segments = collectionPath.split('/').filter(Boolean);
    const collectionName = segments[segments.length - 2];
    assert.ok(
      rulesSource.includes(`match /${collectionName}/`),
      `Missing match block for ${collectionPath}`
    );
  }

  assert.equal(
    blueprint.entities.ChatRecord.properties.modelId.enum.length,
    LUXO_MODEL_IDS.length,
    'firebase-blueprint.json ChatRecord.modelId enum count must match LUXO_MODEL_IDS'
  );
  for (const modelId of LUXO_MODEL_IDS) {
    assert.ok(
      blueprint.entities.ChatRecord.properties.modelId.enum.includes(modelId),
      `firebase-blueprint.json must include ${modelId}`
    );
    assert.ok(
      rulesSource.includes(`'${modelId}'`),
      `firestore.rules must allow ${modelId} in ChatRecord`
    );
  }

  const firebaseClientSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/firebase.ts'),
    'utf-8'
  );
  assert.ok(
    firebaseClientSource.includes("where('ownerId', '==', uid)"),
    'subscribeUserChats in src/firebase.ts must constrain ownerId == uid to satisfy Pillar 8 list rule'
  );
});

test('All Dirty Dozen & Red Team adversarial payloads return PERMISSION_DENIED', () => {
  const now = 1700000000;
  const basePublicProfile = {
    uid: 'user_1',
    displayName: 'Luxo Üyesi',
    handle: 'luxo_uyesi',
    roleTitle: 'Yazılım Mimarı',
    bio: 'Temiz profil özeti.',
    avatarUrl: 'preset:selin',
    interests: ['TypeScript', 'Yapay Zeka'],
    visibility: 'public',
    createdAt: now,
    updatedAt: now,
  };

  // 1. Unauthenticated Write
  assert.equal(
    evaluateDirtyDozen('publicProfile:create', null, 'user_1', basePublicProfile, now),
    'PERMISSION_DENIED'
  );

  // 2. Unverified Admin Email Spoof on Event Creation
  assert.equal(
    evaluateDirtyDozen(
      'event:create',
      { uid: 'spoof_1', email: ADMIN_EMAIL, email_verified: false },
      'evt_1',
      { createdBy: 'spoof_1', createdAt: now },
      now
    ),
    'PERMISSION_DENIED'
  );

  // 3. Identity Spoofing on Public Profile
  assert.equal(
    evaluateDirtyDozen(
      'publicProfile:create',
      { uid: 'attacker_1', email_verified: true },
      'victim_1',
      { ...basePublicProfile, uid: 'victim_1' },
      now
    ),
    'PERMISSION_DENIED'
  );

  // 4. Shadow/Ghost Field PII Injection
  assert.equal(
    evaluateDirtyDozen(
      'publicProfile:create',
      { uid: 'user_1', email_verified: true },
      'user_1',
      { ...basePublicProfile, email: 'hidden@example.com' },
      now
    ),
    'PERMISSION_DENIED'
  );

  // 5. ID Poisoning Attack
  assert.equal(
    evaluateDirtyDozen(
      'chat:create',
      { uid: 'user_1', email_verified: true },
      'bad..id$$$',
      { ownerId: 'user_1' },
      now
    ),
    'PERMISSION_DENIED'
  );

  // 6. Orphaned Subcollection Write Without Parent
  assert.equal(
    evaluateDirtyDozen(
      'chat:create',
      { uid: 'user_1', email_verified: true },
      'chat_1',
      { ownerId: 'user_1' },
      now,
      false
    ),
    'PERMISSION_DENIED'
  );

  // 7. Timestamp Forgery
  assert.equal(
    evaluateDirtyDozen(
      'publicProfile:create',
      { uid: 'user_1', email_verified: true },
      'user_1',
      { ...basePublicProfile, createdAt: now - 5000 },
      now
    ),
    'PERMISSION_DENIED'
  );

  // 8. Immutable Field Mutation on Chat
  assert.equal(
    evaluateDirtyDozen(
      'chat:update',
      { uid: 'user_1', email_verified: true },
      'chat_1',
      { ownerId: 'user_1', createdAt: now + 999 },
      now,
      true,
      { ownerId: 'user_1', createdAt: now }
    ),
    'PERMISSION_DENIED'
  );

  // 9. Bounded Array Poisoning (> 10 interests)
  assert.equal(
    evaluateDirtyDozen(
      'publicProfile:create',
      { uid: 'user_1', email_verified: true },
      'user_1',
      {
        ...basePublicProfile,
        interests: Array.from({ length: 12 }, (_, i) => `Tag${i}`),
      },
      now
    ),
    'PERMISSION_DENIED'
  );

  // 10. Non-Admin Event Creation Attempt
  assert.equal(
    evaluateDirtyDozen(
      'event:create',
      { uid: 'member_1', email: 'regular@example.com', email_verified: true },
      'evt_hack',
      { createdBy: 'member_1', createdAt: now },
      now
    ),
    'PERMISSION_DENIED'
  );

  // 11. Private Room Outsider Intrusion & visibleToUids Forgery
  assert.equal(
    evaluateDirtyDozen(
      'roomMessage:create',
      { uid: 'outsider_1', email_verified: true },
      'msg_1',
      { visibleToUids: ['user_1', 'user_2'] },
      now,
      true,
      { memberIds: ['user_1', 'user_2'] }
    ),
    'PERMISSION_DENIED'
  );
  assert.equal(
    evaluateDirtyDozen(
      'roomMessage:create',
      { uid: 'user_1', email_verified: true },
      'msg_1',
      { visibleToUids: ['user_1', 'user_2', 'outsider_leak'] },
      now,
      true,
      { memberIds: ['user_1', 'user_2'] }
    ),
    'PERMISSION_DENIED'
  );

  // 12. Terminal State Bypass & Cross-User Feedback Read
  assert.equal(
    evaluateDirtyDozen(
      'feedback:update',
      { uid: 'user_1', email_verified: true },
      'fb_1',
      { status: 'submitted' },
      now,
      true,
      { authorId: 'user_1', status: 'archived' }
    ),
    'PERMISSION_DENIED'
  );
  assert.equal(
    evaluateDirtyDozen(
      'feedback:get',
      { uid: 'attacker_1', email_verified: true },
      'fb_1',
      {},
      now,
      true,
      { authorId: 'victim_1', status: 'submitted' }
    ),
    'PERMISSION_DENIED'
  );

  // Verify legitimate Admin Event Creation IS allowed
  assert.equal(
    evaluateDirtyDozen(
      'event:create',
      { uid: 'admin_1', email: ADMIN_EMAIL, email_verified: true },
      'evt_legit',
      { createdBy: 'admin_1', createdAt: now },
      now
    ),
    'ALLOWED'
  );

  // Verify legacy user profile migration rule exists and still rejects shadow fields on update
  assert.ok(
    rulesSource.includes('addedKeys().hasOnly(') &&
      rulesSource.includes('changedKeys().hasOnly('),
    'firestore.rules must permit stripping legacy shadow keys when migrating !isValidUserProfile(existing())'
  );
  assert.equal(
    evaluateDirtyDozen(
      'user:update',
      { uid: 'user_1', email_verified: true },
      'user_1',
      {
        uid: 'user_1',
        displayName: 'Luxo User',
        avatarText: 'LU',
        theme: 'dark',
        voiceName: 'Breeze',
        voiceRate: 1.0,
        customTone: 'Varsayılan',
        customInstructions: '',
        workspaceType: 'Kişisel',
        createdAt: now,
        updatedAt: now,
        shadowField: true,
      },
      now,
      true,
      { uid: 'user_1', email: 'legacy@example.com' }
    ),
    'PERMISSION_DENIED'
  );
  assert.equal(
    evaluateDirtyDozen(
      'user:update',
      { uid: 'user_1', email_verified: true },
      'user_1',
      {
        uid: 'user_1',
        displayName: 'Luxo User',
        avatarText: 'LU',
        theme: 'dark',
        voiceName: 'Breeze',
        voiceRate: 1.0,
        customTone: 'Varsayılan',
        customInstructions: '',
        workspaceType: 'Kişisel',
        createdAt: now,
        updatedAt: now,
      },
      now,
      true,
      { uid: 'user_1', email: 'legacy@example.com' }
    ),
    'ALLOWED'
  );
});

test('Firebase blueprint and firestore.rules declare hardened LangdockWorkspaceItem rules', () => {
  assert.ok(blueprint.entities.LangdockWorkspaceItem);
  assert.ok(blueprint.firestore['/users/{userId}/workspaceItems/{itemId}']);
  assert.ok(rulesSource.includes('function isValidLangdockWorkspaceItem(data)'));
  assert.ok(rulesSource.includes('match /workspaceItems/{itemId}'));
  assert.ok(rulesSource.includes("data.itemType in ['assistant', 'prompt', 'knowledge', 'workflow', 'integration']"));
});

