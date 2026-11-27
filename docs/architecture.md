# Application Boundaries

The project is a single Next.js repository, but browser code and trusted server code have separate ownership boundaries.

```text
src/
  app/                         Pages, layouts and thin API route adapters
    api/auth/[action]/         Auth request validation/HTTP response adapter
    api/documents/[id]/        Document access HTTP adapter
  components/                  Reusable presentation and browser interactions
  backend/
    auth/                       Auth workflows and session callback logic
    services/                   Authorization and business workflows
    repositories/               Database and Storage queries
    infrastructure/supabase/    Server-only Supabase client
  middleware.ts                Supabase session refresh only
supabase/
  migrations/                   PostgreSQL schema, constraints and RLS
```

## Request Flow

1. A browser component sends a same-origin request to an App Router API endpoint. It never imports Supabase or accesses database tables directly.
2. The route adapter validates the request shape, calls a backend service, and maps the service result to an HTTP response.
3. The backend service performs authentication and authorization, then calls repositories for database or private Storage operations.
4. PostgreSQL RLS remains the final data-access boundary, including when a route has already checked a user's session or role.

## Sensitive Workflows

- **Authentication:** `/api/auth/*` delegates to `backend/auth/auth-service.ts`; Supabase cookies and the server client are handled in `backend/infrastructure`.
- **Admin authorization:** `backend/services/dashboard-service.ts` verifies the signed-in user and role using a repository. The database independently limits privileged reads and writes with RLS.
- **Private PDFs:** `/api/documents/[id]` delegates to `backend/services/document-access-service.ts`; the repository uses the authenticated server client and a private bucket to issue a short-lived URL only when RLS permits access.
- **Payments and purchases:** not implemented. Add order creation, signature/webhook verification, idempotency and enrollment grants to backend payment services and API adapters. Razorpay secrets must remain server-only; never trust a browser success callback.
- **Test evaluation:** not implemented. Scoring, attempt limits and final submission must run in backend services or trusted database functions; do not accept client-computed marks as authoritative.

## Change Rules

- Keep React components presentation-focused. They may manage local form state and call an API, but must not import `backend`, Supabase SDKs, service-role credentials or repository code.
- Keep `app/api` handlers small. Put validation and HTTP mapping at the edge; put business rules in `backend/services` and query details in `backend/repositories`.
- Mark backend modules with `server-only` and use RLS for row-level defense in depth.
- Store only public Supabase URL/key configuration in `NEXT_PUBLIC_*`. Service-role and payment secrets are server environment variables only.