# Dairy Learning Academy — implementation audit

**Audit date:** 2026-11-26  
**Scope:** Current workspace files: Next.js frontend and route handlers, backend services/repositories, Supabase configuration and initial migration, environment example, and PWA assets.

## Confidence and verification limits

- This is a static source/configuration review. No Supabase project credentials or live database were available, so the migration, RLS behavior, Auth redirects, Storage permissions, and Razorpay configuration were not exercised against a deployed service.
- VS Code reported no workspace diagnostics. It discovered no test controller, so no tests ran.
- `npm run typecheck`, `npm run lint`, and `npm run build` could not be run because the available shell runner is unavailable. Therefore the application’s successful build and runtime startup are **not verified**.
- No confirmed error in the inspected source proves that the app cannot start. Public pages are designed to render without Supabase credentials; authenticated and data-backed behavior requires configuration.

## 1. Implemented in code (not equivalent to live-service verification)

- **Public presentation:** Responsive home page, navigation, and static content shells for courses, PYQ, MCQ/question bank, package, mock tests, about, and contact.
- **Authentication workflow:** Server-side Supabase Auth handlers for password login, student registration, password-reset email, password update, signout, and auth callback. Server-side validation is present; public admin registration is absent. See `src/backend/auth/auth-service.ts` and `src/app/api/auth/[action]/route.ts`.
- **Role-checked dashboard reads:** Student/admin route checks and aggregate count queries exist. Admin page is an overview only, not a management console. See `src/backend/services/dashboard-service.ts` and `src/backend/repositories/dashboard-repository.ts`.
- **Private PDF delivery path:** A server route checks the signed-in user, loads a document row through the authenticated Supabase client, then requests a 60-second signed URL. The migration defines a private `study-materials` bucket and Storage policies. This is the download-authorization path only; upload, listing, and live entitlement behavior are unverified.
- **Database foundation:** The initial migration defines profiles, products/packages, inclusions, enrollments, payment records, subjects/chapters/topics, questions and separate answers, documents, mock tests/questions, attempts/responses, and bookmarks. It enables RLS and seeds five subjects. See `supabase/migrations/202611260001_initial_schema.sql`.
- **PWA shell:** A service worker is registered and caches the public home page and manifest, with network-first behavior for other same-origin GETs. It is not an offline learning app; registration/runtime behavior was not tested.

## 2. UI present without corresponding learning/payment backend

- **Courses/catalog/package:** Routes are descriptive static content; no database-backed catalog, pricing display, enrollment flow, or course content delivery is connected.
- **PYQ:** The route describes year/subject filters, answer explanations, and saving questions, but there is no question query, filter UI, answer endpoint/client, or bookmark workflow.
- **MCQ question bank:** The route describes chapter/topic filters and learning/practice modes, but there is no question-bank UI, data query, practice state, scoring, or bookmark API/UI. The answer-reveal SQL function is not called by an application route or component.
- **Mock tests:** The route lists timed tests, palettes, automatic submission, and reports, but no test-taking UI, attempt orchestration, timer, submit/scoring service, or score report exists.
- **Payments:** Razorpay is a declared dependency and server environment variables are listed, but no Razorpay import, order endpoint, signature verification, webhook, or enrollment grant implementation exists.
- **Administration:** The dashboard shows database counts and explicitly says management screens are a future stage. There are no admin CRUD screens or routes for products, content, PDFs, questions, tests, users, enrollments, or transactions.
- **Contact and progress:** Contact is informational only; there is no contact submission flow. Student “learning progress” is a placeholder `null` metric.

## 3. Incomplete behavior and operational gaps

- Auth and the document endpoint require configured Supabase URL/key. The reset flow additionally requires `NEXT_PUBLIC_APP_URL` and matching Supabase redirect allow-list configuration.
- The database migration is a single initial migration; there is no application workflow to create content or administer it.
- The database models payment and attempt states, but no trusted services transition those states or create enrollments from verified payments.
- Database repository errors are not consistently surfaced: dashboard count errors become zero/null-looking metrics, and profile lookup errors are indistinguishable from a missing/non-admin profile. Add server logging and explicit handling before relying on these metrics for operations.
- `updated_at` columns exist on profiles/products and answers, but this migration defines no trigger to maintain them on updates.
- The current workspace has no dependency lockfile in its listed root files, so dependency resolution is not pinned.

## 4. Database tables/configuration

- **Core entities are present** for the listed learning, payment, document, and test concepts; no missing core table was identified from the requested feature set.
- **Not present:** a durable provider-webhook/event ledger with a unique event key for replay/idempotency handling. Add one (or an equivalently safe idempotency design) before implementing payments. An administrative audit log is also absent and should be considered for privileged changes.
- Supabase local configuration and a private PDF bucket are declared. Actual project credentials, migration application, production Auth redirect URLs, and hosted bucket/policy state were not verified.
- The `products`, `payments`, and `enrollments` schema is a foundation, not a working checkout integration.

## 5. Security findings

### High priority before exam content is published

1. **Scheduled mock-test prompts can be reachable through the general questions policy.** The `questions` SELECT policy exposes any published question that is free (`product_id is null`) or otherwise entitled; it does not exclude questions assigned to a future/unavailable mock test. The separate `mock_test_questions` policy checks the test availability window, but that does not constrain direct reads from `questions`. A signed-in user able to query the table may retrieve prompts/options before a scheduled test. See migration lines 302–307 and 320–340. Separate test-only content or make question visibility account for every associated test’s availability.
2. **Auth callback destination validation can be bypassed with backslashes.** `completeAuthCallback` accepts any `next` beginning with `/` except `//` (lines 80–82), then the route resolves it with `new URL(...)` (callback route line 6). WHATWG URL parsing treats backslashes as separators for HTTPS URLs, so a value such as `/\attacker.example` can resolve off-site. Restrict destinations to a fixed local-path allow-list or validate the resolved URL’s origin before redirecting. This is an open-redirect risk; no account-takeover impact was established by this static review.

### Additional authorization and abuse-control checks

- **Attempt creation omits availability and attempt-limit checks.** The `test_attempts` insert policy checks ownership, unpublished submission/score fields, publication, and product access, but not `available_from`, `available_until`, or `maximum_attempts` (migration lines 346–350). It permits out-of-window/extra attempt rows if a test ID is known. Enforce all constraints in a trusted attempt-creation service or database function and align the RLS policy.
- **Free document rows are broadly readable by signed-in users.** The document and Storage policies allow access when `product_id is null` (migration lines 315–316 and 385–391). Treat null-product PDFs as intentionally available to every authenticated user; require a product/enrollment for paid or restricted files.
- **Publication flags are not consistently hierarchical.** Published chapters/topics are independently readable without checking their parent subject/chapter; published questions likewise do not require their subject/chapter/topic to be published (migration lines 289–307). If a parent is unpublished to hide its content, child rows may remain visible. Add parent-publication predicates or enforce publication consistency.
- Auth routes have no app-level throttling or abuse telemetry. Confirm Supabase Auth rate limits and add appropriate monitoring/throttling before public launch.
- No credentials or service-role key values were found in the inspected source/config files. `.env.example` contains blank values, and the server client uses the public anon key. Continue to keep service-role and Razorpay secrets server-only.

## 6. Startup/build blockers

- **No confirmed source-level startup blocker found.** Supabase variables are intentionally blank in `.env.example`; the public shell is designed to work unconfigured, while protected/data-backed flows return setup errors.
- **Build/lint/typecheck status remains unknown:** the configured npm scripts were not executable in this session. A clean VS Code diagnostics result is not a substitute for those commands.
- **No tests were discovered** by the available VS Code test runner.
- The database migration has not been applied or validated against a live Supabase project in this audit.

## Prioritized completion checklist

### P1 — Required before a public paid/exam launch

- [ ] Fix direct question reads so prompts assigned to scheduled mock tests cannot be queried before the test is available; verify with anon, student, entitled student, and admin roles.
- [ ] Replace callback `next` prefix checks with a same-origin/local-path allow-list; add tests for `//host`, `/\host`, encoded separators, and ordinary local destinations.
- [ ] Configure a Supabase project, apply the migration, set production Auth site/redirect URLs, and exercise registration, confirmation, login, reset, role checks, RLS, and signed PDF downloads.
- [ ] Build backend Razorpay order creation, trusted signature verification, webhook verification, replay/idempotency handling, payment status transitions, and enrollment grants. Do not expose checkout until these are verified.
- [ ] Implement the database-backed catalog and admin CRUD for products/content/questions/documents/tests, with admin-only authorization and auditability.
- [ ] Implement trusted mock-test attempt creation, time/attempt-limit enforcement, response persistence, final submission, server-side scoring, and result review; do not treat client-computed scores as authoritative.
- [ ] Run and resolve `npm run typecheck`, `npm run lint`, and `npm run build`; add automated tests for auth boundaries, RLS assumptions, payment verification, PDF entitlements, and test scoring.

### P2 — Complete advertised student workflows

- [ ] Connect course/package pages to published database products, real prices, and enrollment status.
- [ ] Implement PYQ listing/filtering, authorized answer/explanation reveal, and bookmarking.
- [ ] Implement MCQ browsing/practice modes, filters, answer explanations, bookmarks, and retry behavior using the existing schema.
- [ ] Implement mock-test listing and the student test-taking/review UI.
- [ ] Add PDF/document listing and admin upload/replace/delete flows; verify MIME/size constraints and that null-product files are intentionally free.
- [ ] Replace placeholder dashboard metrics with real progress data and surface repository failures rather than presenting them as empty counts.
- [ ] Add an actual contact channel/form and server-side handling.

### P3 — Reliability and maintainability

- [ ] Add webhook event/idempotency storage (unless an equivalent verified mechanism is chosen), and an admin audit trail for role, enrollment, content, and payment changes.
- [ ] Add `updated_at` triggers where those fields are intended to reflect modifications.
- [ ] Add structured server-side error logging and operational alerts for auth, storage, database, and payment failures without logging secrets or sensitive payloads.
- [ ] Pin dependencies with a lockfile and add CI that runs lint, typecheck, build, and the focused security/authorization tests.
- [ ] Verify production headers, CSP, external image availability/privacy, and PWA behavior on supported browsers.
