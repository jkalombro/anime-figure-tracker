# Figdex Security Specification

## Data Invariants
1. A user can only manage their own Action Figures, Preorders, and Equipments.
2. A user can create their own profile, which is publicly readable.
3. Makers and Anime are globally readable, but can only be added by authenticated users. Once added, they are immutable to users (only admins or global maintenance can change them, but for this app we allow anyone to add).

## The "Dirty Dozen" Payloads (Testing Identity, Integrity, State)

1. **Identity Spoofing**: Attempting to create an Action Figure for another `userId`.
2. **Resource Poisoning**: Document IDs with malicious/oversized strings.
3. **Ghost Fields**: Adding `isVerified: true` to a user profile.
4. **Illegal Scale**: Using `scale: "1/3"` (not in enum).
5. **Negative Price**: Setting `totalPrice: -100`.
6. **Self-Promotion**: Authenticated user trying to make themselves an admin (if we had admins).
7. **Unauthorized Update**: User A trying to edit User B's figure.
8. **Unauthorized Delete**: User A trying to delete User B's equipment.
9. **Blanket Read Breach**: Trying to list all `preorders` without a `userId` filter (if rules didn't enforce it).
10. **Orphaned Record**: Creating a figure with a non-existent anime (we'll check `exists()`).
11. **Timestamp Forgery**: Providing a manual `createdAt` instead of `request.time`.
12. **Public PII Leak**: Accessing private user data (though profiles here are mostly public).

## Test Runner (TDD)
I will implement `firestore.rules` and verify against these invariants.
