# ClinicQ Web — Frontend Rules and Build Plan

Read the root `AGENTS.md` first (product, features, versions, workflow).
API behavior and contracts are defined in `apps/api/AGENTS.md`.

## Stack
- Next.js 16 (latest stable 16.x), App Router, React (the version Next 16
  requires), TypeScript strict, Turbopack.
- shadcn/ui (Radix + Tailwind CSS v4) for ALL UI. Add components with the
  shadcn CLI as needed: button, input, form, select, dialog, sheet,
  dropdown-menu, tabs, badge, skeleton, sonner (toasts), sidebar, card,
  table, chart, calendar, command, avatar, alert, separator, tooltip.
- TanStack Table (via shadcn Data Table pattern) for lists.
- shadcn Charts (Recharts based) for dashboard analytics; shadcn
  dashboard and sidebar blocks may be used as a starting layout, but
  every part must be understood and adapted.
- React Hook Form + Zod for forms.
- TanStack Query ONLY for live client-side data (queue board, assistant
  side panels, polling fallback). Server Components handle normal reads.
- socket.io-client for realtime.
- Bun as package manager. All packages latest stable (procedure in root
  file). Before using any Next.js 16 API, check the official docs for the
  installed version; do not rely on memory for caching APIs.

## Structure
```
src/
  app/
    (public)/track/[token]       public queue tracking page
    (auth)/login, register
    (patient)/assistant, book, appointments
    (reception)/queue, walk-in
    (doctor)/today
    (admin)/dashboard, doctors, schedules, knowledge, agent-traces
    api/                         route handlers (auth BFF, streaming proxy)
  components/
    ui/          shadcn components (generated)
    data-table/  reusable DataTable (columns, sorting, filters, pagination)
    shared/      layout, empty states, error states, status badges
  features/      assistant, booking, queue, appointments, admin
  lib/
    api/         api client (see below), endpoints, schemas, errors
    auth/        session helpers (cookies), role guards
    socket/      socket provider
  proxy.ts       Next 16 request proxy (replaces middleware.ts)
```

## Design principles
- Mobile first and fully responsive; patients mostly use phones.
- Every screen has loading (Skeleton), empty, success and error states,
  and a retry action on recoverable errors. Use `loading.tsx`,
  `error.tsx`, `not-found.tsx` and Suspense boundaries.
- Forms: shadcn Form + React Hook Form + Zod, inline errors, disabled
  submit while pending, toast on success/failure (sonner).
- Accessible: labels, focus states, keyboard support, contrast.
- UI text is English only (no i18n layer). The assistant still
  understands Bangla, English and mixed messages and replies in the
  language the patient writes in.
- Dates and times shown in the clinic's time zone.

## Auth and session (BFF pattern)
Because pages fetch on the server, tokens live on the web domain:
- Login/register go through Next Route Handlers or Server Actions that
  call the API, then store `accessToken` and `refreshToken` as httpOnly,
  Secure, SameSite=Lax cookies on the WEB domain. The browser JavaScript
  never sees tokens. This also avoids third-party cookie problems when
  web (Vercel) and api (Render) are on different domains.
- Server code reads the cookie with `cookies()` and sends
  `Authorization: Bearer <accessToken>` to the API.
- `proxy.ts` guards route groups by role and redirects unauthenticated
  users. The API remains the real authority.
- Token refresh: when the API client gets 401, call the API refresh
  endpoint with the refresh token, rewrite cookies, retry once; on
  failure clear cookies and redirect to login. Refresh logic is
  centralized, no duplicated retries.
- Socket token: client components get a short-lived socket token from
  `POST /api/auth/socket-token` (route handler that calls the API) and
  use it only for the Socket.IO handshake.

## API client (`lib/api`)
A small typed client built on the native `fetch` (Next.js extended
fetch), behaving like axios plus TanStack Query's ergonomics, with Next
caching built in. One client, used everywhere.

Requirements:
- `apiClient.get/post/put/patch/delete<T>(path, options)` returning typed
  data. Options: `query`, `body`, `schema` (Zod, validates the response),
  `auth` ("session" | "none"), `timeoutMs`, `retries`, `idempotencyKey`,
  and Next options `cache`, `revalidate`, `tags`.
- Base URL from `API_URL` (server) / `NEXT_PUBLIC_API_URL` (browser).
- Unwraps the API envelope (`success, message, data, meta`) and returns
  `{ data, meta }`.
- Typed `ApiError` (status, code, message, field issues) and helpers like
  `isApiError`, `isUnauthorized`. Network and timeout errors map to the
  same error type.
- Request hooks: inject Authorization from the session cookie, add
  `Idempotency-Key` on request.
- Response hooks: 401 -> single refresh + retry; 5xx and network errors on
  idempotent GET retried with exponential backoff (max 2).
- Timeouts through `AbortSignal.timeout`; support caller `AbortSignal`.
- Streaming helper for the assistant (SSE) that yields typed events.
- Server-only parts (cookies, tokens) live in files marked `server-only`.

### Caching and revalidation rules (Next.js 16 Cache Components)
- Enable `cacheComponents: true` in `next.config.ts`. Caching is explicit
  opt-in via `"use cache"`; everything else is dynamic.
- Shared, non-personal catalog data (doctors, specialties, schedules,
  clinic knowledge, public clinic info) is read through public API
  endpoints inside functions marked `"use cache"` with `cacheLife(...)`
  and `cacheTag(...)` (e.g. `doctors`, `doctor-<id>`, `slots-<doctorId>`).
- Personal or role-protected data (my appointments, queue, doctor today,
  admin dashboard) is NOT cached with `"use cache"`: cookies/headers
  cannot be read inside a cached scope and tokens must never become part
  of a cache key. Fetch it dynamically (`cache: "no-store"`) inside a
  Suspense boundary.
- Mutations are Server Actions that call the API, then invalidate:
  `updateTag(tag)` when the user must immediately see their own change
  (booking, cancel), `revalidateTag(tag, <profile>)` for background
  freshness of shared data. Slot availability tags are invalidated on
  booking, cancel and schedule edits.
- Dynamic parts of a page are wrapped in `<Suspense>` with a skeleton so
  the static shell renders instantly.
- Never cache anything containing patient data, and never create JSX
  inside a cached function to pass to a client component; pass data.
- Document every tag and lifetime in one file (`lib/api/cache-tags.ts`).

## Screens and behavior

### Public
- **Track (`/track/[token]`):** no login. Shows doctor, status, queue
  position, estimated wait, live updates through a polling or socket
  fallback. Only minimal data (first name or initials).

### Patient
- **Assistant (patient home):** chat interface built from shadcn
  components. Streams assistant text, shows tool activity ("Checking
  Dr. X's availability..."), renders `proposal` events as option cards
  (doctor, specialty, fee, date, time) with a clear "what changed from
  your request" note when anything was relaxed, and the patient confirms
  by replying in chat (quick-reply chips "Yes, book it" / "Show other
  times"). Shows an emergency banner on `emergency` events, a
  booking-confirmed card on `booking_confirmed`, and a short notice that
  the assistant gives guidance, not diagnosis. Stream errors show a
  clear message and a button to the manual form.
- **Manual booking (fallback and power users):** specialty -> doctor
  (filters: fee, gender, language, shown only when data exists) -> date
  -> slot, with live availability (a slot booked by someone else
  disappears; a 409 shows "just taken, pick another").
- **My appointments:** DataTable of upcoming and past, cancel,
  reschedule, live queue position and estimated wait on the day.

### Reception
- **Live queue board:** per-doctor columns, real-time via Socket.IO,
  check-in, mark no-show, urgency badge and assistant summary per
  patient, connection indicator with polling fallback.
- **Walk-in booking:** search or create patient, then book manually or
  through the assistant on the patient's behalf.

### Doctor
- **Today:** ordered list with urgency badge, assistant summary and
  reason, Start consultation and Complete buttons, live updates.

### Admin
- **Dashboard:** shadcn cards and charts: appointments per day, no-show
  rate, average wait, doctor utilization, assistant booking success rate,
  replan rate. Date range filter.
- **Data tables (TanStack Table + shadcn):** appointments, doctors,
  patients with server-side pagination, sorting, column filters,
  column visibility, row actions, CSV export.
- **Doctors and schedules:** CRUD, weekly schedule editor, block slots.
- **Knowledge:** CRUD for clinic content used by the assistant.
- **Agent traces:** list of assistant conversations; a detail drawer
  shows the step-by-step trace (nodes visited, tool calls, constraints,
  replans, final booking), so decisions are explainable.

## Realtime
One socket instance after login (short-lived socket token in handshake),
rooms by role. On `queue:updated` and `slot:booked` invalidate the
relevant TanStack Query keys (live client data) and call `router.refresh()`
where Server Components display the data. Show a "Live" / "Reconnecting"
indicator.

## Environment
`API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`,
`SESSION_COOKIE_NAME`. Keep `.env.example` current. Deployed on Vercel
(root directory `apps/web` if monorepo).

## Quality
- Strict TypeScript; no `any` without a comment.
- API response types inferred from Zod schemas, not hand-copied.
- Component/integration tests only for critical flows: assistant
  proposal -> confirm, booking conflict handling, role guards, API client
  (401 refresh-and-retry, error mapping, retries).
- Lint and type-check pass before each commit.

## Build order (stop for review after each step)
1. Setup: Next.js 16, Tailwind v4, shadcn init, `cacheComponents`,
   layout with sidebar
2. API client, error types, cache-tags file, session cookies, `proxy.ts`
3. Auth screens and role guards
4. Manual booking with cached catalog and Server Actions
5. My appointments (DataTable)
6. Reception live queue and socket layer
7. Doctor today view
8. Assistant chat UI (streaming, proposals, emergency, confirmation)
9. Admin dashboard, data tables, doctors/schedules, knowledge
10. Agent traces, public tracking page
11. Polish: states, responsiveness, accessibility, README screenshots

## Working rules for the AI
- One step at a time; explain changes; wait for review.
- Simple, readable components; no clever abstractions.
- Ask before adding any dependency outside this file.
