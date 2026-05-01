# Security Spec

## Data Invariants
1. A Message or MemoryEntry cannot exist without a valid `userId` that strictly matches the authenticated user requesting the write.
2. Users can only read, write, update, and delete their own messages and memories.
3. No cross-user access is allowed whatsoever.

## The "Dirty Dozen" Payloads
1. **Identity Spoofing (Create Message)**: Payload with `userId` = "admin" but requested by "user1".
2. **Missing Field (Create Message)**: Payload missing `role`.
3. **Invalid Role (Create Message)**: Payload with `role` = "hacker".
4. **Invalid Type (Create Message)**: Payload with `content` as an Object `{ hack: true }`.
5. **Denial of Wallet (Create Message)**: Payload with `content` string size > 500,000.
6. **No Timestamp (Create Memory)**: Payload missing `timestamp`.
7. **Cross-User Delete (Delete Message)**: Request to delete `users/victim/messages/123` by `attacker`.
8. **Shadow Field (Create Memory)**: Payload with an extra `isAdmin` field.
9. **Update Hijacking (Update Message)**: `affectedKeys().hasOnly(['content'])` but size check bypassed for large string.
10. **Unauthenticated Read (List Messages)**: Unauthenticated user trying to read `users/user1/messages`.
11. **Client Query Delegation (List Messages)**: Authenticated user `user1` querying `/users/user2/messages` where `userId` == `user1` (fails path check).
12. **ID Poisoning (Create Message)**: User tries to create document with 10KB junk ID.

## The Test Runner
A test file will verify these.
