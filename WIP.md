# WIP

- Completed: replace tracked branding and package IDs, add the MIT license, remove Sentry reporting and credentials, document source builds and actual permissions.
- Verified: TypeScript, Expo lint, Expo config generation, JavaScript syntax, and `git diff --check`.
- Pending: add F-Droid metadata once the public source repository URL is known, then validate the recipe with fdroidserver and build an unsigned Android release from a clean generated project. The local ignored `android/` directory was left untouched.
- Security follow-up: a Sentry auth token remains in older Git history and should be revoked if still active.
