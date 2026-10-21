# Security Specification - Abdulrahman's Portfolio

## Data Invariants
1. Only authenticated users with their UID in the `admins` collection can write to any document.
2. The `admins` collection is immutable from the client-side.
3. All documents must have valid IDs.

## The Dirty Dozen Payloads (Target: Denied)
1. Write to `profile/main` without auth.
2. Write to `experiences/new_exp` as a non-admin authenticated user.
3. Update `admins/some_uid` to add yourself as admin.
4. Delete a project without being logged in.
5. Create a skill with a 2MB string name (size limit check).
6. Update a certificate to point its image to a malicious site (schema validation needed).
7. Create an experience with a non-alphanumeric ID (ID poisoning).
8. List `admins` collection as a visitor.
9. Get a private admin profile as a visitor.
10. Update the `order` of a project to -9999 (integrity check).
11. Inject a "Ghost Field" (e.g., `isVerified: true`) into a project document.
12. Bulk delete everything via a wildcard query.

## Test Runner (Simplified)
All these operations will return `PERMISSION_DENIED` unless `request.auth.uid` matches an entry in `/admins/`.
