# Luxo AI Firestore Security Specification (Phase 0 TDD & Red Team Audit)

## 1. Data Invariants & Master Sources of Truth
1. **Global Default-Deny Catch-All**: `match /{document=**} { allow read, write: if false; }` is the first block in `/databases/{database}/documents`.
2. **Verified Identity & Zero PII**:
   - Standard writes require `isVerifiedUser()` (`request.auth != null && request.auth.token.email_verified == true`).
   - **PII Split-Collection Strategy (Pillar 6)**: Private preferences live in `/users/{userId}` (owner-only `get`, zero `list`), whereas public social profiles live in `/publicProfiles/{userId}` with zero email, phone, or physical address fields (`keys().hasOnly(...)` blocks any shadow PII fields).
3. **Admin RBAC Invariant (`isAdmin()`)**:
   - Admin privileges require `isVerifiedUser()` AND either bootstrapped verified runtime owner email (`request.auth.token.email == 'luxoaiofficial@gmail.com'`) OR existence of `/admins/$(request.auth.uid)`.
   - Unverified email spoofing (`email_verified == false`) is unconditionally rejected.
   - `/admins/{adminId}` is read-only (`get` for self only) and never client-writable (`allow write: if false`), preventing privilege escalation.
4. **Events & Announcements RBAC (`/events/{eventId}`, `/announcements/{announcementId}`)**:
   - `create`, `update`, and `delete` are strictly restricted to `isAdmin()`.
   - `get` and `list` enforce `isSignedIn() && resource.data.status == 'published'` (no blanket reads; `allow list` enforces `resource.data.status == 'published'` with zero `get()`/`exists()` calls).
   - Terminal State Locking: Once `status == 'archived'`, non-admin updates are impossible and even admin updates require explicit action branches (`|| isAdmin()`).
5. **User Subcollections Master Gate (`/users/{userId}/chats/{chatId}`, `/users/{userId}/favorites/{favoriteId}`, `/users/{userId}/connections/{peerId}`)**:
   - Single-document operations (`get`, `create`, `update`, `delete`) verify `isValidId(...)`, `userId == request.auth.uid`, and Master Gate parent existence (`exists(/databases/$(database)/documents/users/$(userId)) && get(...).data.uid == request.auth.uid`).
   - `list` operations enforce `userId == request.auth.uid && resource.data.ownerId == request.auth.uid` with zero `get()`/`exists()` lookups.
6. **Public Social Profiles (`/publicProfiles/{userId}`)**:
   - `create` and `update` require `isVerifiedUser()`, `userId == request.auth.uid`, `isValidPublicSocialProfile(incoming())`, bounded `interests` (`size() <= 10`, element type guard), and server timestamps (`request.time`).
   - `list` requires `isSignedIn() && resource.data.visibility == 'public'`.
7. **Private Chat Rooms & Messages (`/privateRooms/{roomId}`, `/privateRooms/{roomId}/messages/{messageId}`)**:
   - `memberIds` is strictly bounded (`size() >= 1 && size() <= 10 && memberIds[0] is string`).
   - `get` and `list` on `/privateRooms/{roomId}` enforce `isSignedIn() && request.auth.uid in resource.data.memberIds`.
   - Subcollection `/privateRooms/{roomId}/messages/{messageId}` enforces the **Master Gate** on `get` and `create`: `exists(/databases/$(database)/documents/privateRooms/$(roomId))` AND `request.auth.uid in get(/databases/$(database)/documents/privateRooms/$(roomId)).data.memberIds`. Removing a user from `memberIds` immediately revokes single-doc read and message creation access.
   - `list` on `/privateRooms/{roomId}/messages` checks `isSignedIn() && request.auth.uid in resource.data.visibleToUids` (bounded `<= 10`, zero `get()` calls). Messages are immutable once created (`allow update, delete: if false`).
8. **Feedback Collection (`/feedback/{feedbackId}`)**:
   - Author-isolated reads/lists (`resource.data.authorId == request.auth.uid`) and terminal state lock when `status == 'archived'`.

## 2. The "Dirty Dozen" Adversarial Payloads (All Return `PERMISSION_DENIED`)
1. **Unauthenticated Profile Write**: `auth = null` creating `/users/user_1`.
2. **Unverified Admin Email Spoof**: `auth = { uid: 'spoof_1', email: 'luxoaiofficial@gmail.com', email_verified: false }` creating `/events/evt_1`.
3. **Identity Spoofing on Public Profile**: `auth.uid = 'attacker_1'` creating `/publicProfiles/victim_1` with `uid: 'victim_1'`.
4. **Shadow/Ghost Field PII Injection**: Creating `/publicProfiles/user_1` with `email: 'hidden@example.com'` or `isAdmin: true`.
5. **ID Poisoning Attack**: Creating `/users/user_1/favorites/bad..id$$$` (`!isValidId`).
6. **Orphaned Subcollection Write Without Parent User**: Creating `/users/user_1/connections/peer_2` when `/users/user_1` does not exist.
7. **Timestamp Forgery**: Creating `/publicProfiles/user_1` with `createdAt != request.time`.
8. **Immutable Field Mutation**: Updating `/users/user_1/chats/chat_1` mutating `ownerId` or `createdAt`.
9. **Value / Bounded-Array Poisoning**: Updating `/publicProfiles/user_1` with 15 `interests` (`> 10`) or `bio` > 280 chars.
10. **Non-Admin Event / Announcement Creation**: Verified regular member (`email != 'luxoaiofficial@gmail.com'`, not in `/admins`) creating `/events/evt_hack` or `/announcements/ann_hack`.
11. **Private Room Outsider Intrusion**: Verified user not in `memberIds` reading `/privateRooms/room_secret` or posting to `/privateRooms/room_secret/messages/msg_1`.
12. **Terminal State Bypass on Feedback**: Updating `/feedback/fb_1` after `status == 'archived'`.

## 3. Red Team Conflict Report
- **Identity Spoofing**: Blocked on every collection (`uid == request.auth.uid`, `ownerId == request.auth.uid`, `senderId == request.auth.uid`, `createdBy == request.auth.uid`).
- **State Shortcutting**: Blocked via explicit `status in [...]` checks and terminal state gates (`status != 'archived'`).
- **Resource / Value Poisoning**: Every string has `.size() <= MAX`, every ID has `isValidId()`, every array has `.size() <= 10`, and every `allow update` wraps `isValid[Entity](incoming())` first.
