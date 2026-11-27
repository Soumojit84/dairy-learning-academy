# Dairy Learning Academy

A responsive learning platform foundation for Dairy Science and Dairy Technology preparation.

## Architecture

- `src/app` contains page composition and thin route handlers; `src/components` contains reusable presentation and browser interaction only.
- `src/backend/auth` and `src/backend/services` own authentication, authorization and business workflows. `src/backend/repositories` owns database/storage queries; `src/backend/infrastructure` owns server-only Supabase clients.
- Browser components call same-origin `/api/*` endpoints and do not import Supabase clients or database modules. API handlers validate requests and delegate to backend services.
- Backend modules import `server-only`; do not move payment secrets, database queries, access checks or scoring into `src/components` or browser code. Payment order/webhook flows and mock-test evaluation are not implemented yet and must be added as backend services with thin `/api/*` route adapters before enabling those features.
- Supabase Auth and PostgreSQL provide identity and learning data. Row-level policies distinguish student access from owner-managed administration.
- Supabase Storage uses a private `study-materials` bucket. Document access is checked against the signed-in student's enrollment before issuing a 60-second signed URL.
- Razorpay is reserved for server-side order creation, signature and webhook verification, and enrollment grants. Checkout remains unavailable until those handlers and account credentials are configured.
- A minimal PWA shell caches only the public home page and manifest; authenticated pages and API responses are never cached.

## Local setup

Install Node.js 20.9 or newer, then from the repository root:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Copy the values from the Supabase project's API settings into `.env.local`:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PROJECT_PUBLISHABLE_OR_ANON_KEY
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` accepts the public publishable/anon key only. Never use a service-role key here. Apply `supabase/migrations/202611260001_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI. Do not commit `.env.local`.

In Supabase Authentication settings, enable student signups and email confirmations, set the local Site URL to `http://localhost:3000`, and add `http://localhost:3000/**` to the redirect URL allow list. For deployment, set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS site origin and add its `/auth/callback` URL (or a suitable same-origin wildcard) to that allow list. The signup and password recovery email links return through `/auth/callback`; the database migration's `on_auth_user_created` trigger creates each student's `profiles` row with the `student` role.

The home page and public section routes work without credentials. Authentication, dashboards and private document delivery require a configured Supabase project. Payment processing, full admin CRUD screens, question authoring/import, test attempt orchestration and score reports remain subsequent implementation stages; no fake payment or question data is seeded.

## First administrator

There is no public admin registration. Enable student registration in Supabase Auth, create the owner's account through Supabase Auth, verify the email, then promote that exact user from the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where email = 'owner@example.com' and email_confirmed_at is not null
);
```

Confirm exactly one row was updated. The admin route checks the database role on the server, and row-level policies enforce admin-only writes. Never put the Supabase service-role key or Razorpay secret in a `NEXT_PUBLIC_` variable.

## Checks

```powershell
npm run typecheck
npm run lint
npm run build
```

## Current service boundary

The schema includes profiles, products/packages, enrollments, payment records, subjects/chapters/topics, protected question answers, private documents, mock tests/attempts, responses and bookmarks. Student content reads are gated by publication and enrollment. Correct-answer material is stored separately from question prompts and exposed only through an entitlement-checked database function. The first UI slice is present; remaining product-management and examination workflows must be implemented against these database policies before enabling sales.