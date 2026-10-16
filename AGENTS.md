# ClinicQ — Root Rules

AI-assisted clinic appointment platform: a patient describes a health
problem in their own words (Bangla, English or mixed), an AI booking
assistant asks follow-up questions, finds the right doctor and a free
slot, and books it. Reception and doctors run the day from a live queue.

Read this file first, then the AGENTS.md of the app you are working in:
- `apps/api/AGENTS.md`  backend
- `apps/web/AGENTS.md`  frontend

## The problem we solve
Small and mid-size clinics lose time and patients because:
- Patients do not know which specialist they need, so they book the
  wrong doctor or call the reception for every question.
- Phone and walk-in booking causes double-booking and long waits with no
  information about the turn.
- Doctors see a patient with zero context; urgent cases wait in the
  same line as routine ones.
- Reception spends the day answering the same questions (timings, fees,
  which doctor treats what) instead of managing the queue.

ClinicQ fixes this end to end: conversational booking, safe slot
allocation, a live queue with honest wait estimates, and a doctor view
that arrives with a short summary of why the patient is there.

## Roles and journeys
- PATIENT: talks to the assistant (or uses the manual booking form),
  confirms a slot, sees/reschedules/cancels own appointments, sees live
  queue position and estimated wait on the day.
- RECEPTIONIST: checks patients in, manages the live queue, marks
  no-shows, books on behalf of walk-in patients, can override urgency.
- DOCTOR: sees today's list with the assistant's summary and urgency per
  patient, starts and completes consultations.
- ADMIN: manages doctors, schedules and clinic knowledge (services, fees,
  timings), reads operational metrics.
Multi-clinic: every record belongs to a clinic; every query is scoped by
`clinicId`.

## Feature set (all must be real, working features)
1. Auth with roles, refresh tokens, protected routes.
2. Doctor profiles, specialties, weekly schedule, generated slots.
3. Manual booking with guaranteed no double-booking
   (transactional, idempotent), cancel, reschedule.
4. Appointment lifecycle: BOOKED -> CHECKED_IN -> IN_CONSULTATION ->
   COMPLETED; CANCELLED; NO_SHOW. Role-restricted transitions, audit log.
5. Live queue (Socket.IO) per doctor with adaptive wait estimate based on
   that doctor's real consultation durations.
6. AI Booking Assistant (core AI feature): an adaptive, tool-using
   appointment agent. It understands the problem and the patient's
   constraints (fee cap, doctor gender, language, time window), asks
   clarifying questions, searches doctors and slots with real tools, and
   replans when blocked: it relaxes soft preferences itself (up to 3
   attempts, always telling the patient what changed) but asks before
   touching hard constraints such as budget. After the patient's explicit
   yes in chat it books through the same secure transactional backend
   used by manual booking. Also handles reschedule and cancel. Emergency
   symptoms are detected first and routed to urgent-care guidance
   instead of booking. Manual doctor browsing and booking keep working
   when the AI provider is down.
   Story for the review: the agent does not just recommend an
   appointment; it works toward completing the task, replans when
   blocked, and executes the booking through a transactional backend.
7. Clinic knowledge answers (RAG): doctors, services, fees, timings, FAQs
   answered from admin-managed clinic content stored in Postgres with
   pgvector.
8. Urgency and summary on every assistant-made booking, shown to
   reception and doctor.
9. Admin dashboard: appointments per day, no-show rate, average wait,
   doctor utilization, assistant booking success rate.
10. Waitlist: when a slot frees up, offer it to the next waiting patient.
11. Agent trace: every assistant request records its steps, tool calls,
    constraints and replans; admins can inspect any conversation as a
    timeline. Makes the agent explainable and debuggable.
12. Public queue tracking: after booking, the patient gets a link
    (`/track/<token>`, no login) showing live status, queue position and
    estimated wait.

## Tooling and versions
- Package manager and workspaces: Bun. Root `package.json` has
  `"workspaces": ["apps/*", "packages/*"]`. Use `bun install`, `bun add`,
  `bun run`, `bun test`. Do not mix other package managers.
- Frontend: Next.js 16 + shadcn/ui (details in `apps/web/AGENTS.md`).
- Layout: `apps/api`, `apps/web`, optional `packages/shared`
  (Zod schemas and shared types).
- EVERY package (dependencies and devDependencies, in every app) must be
  the LATEST STABLE release. Procedure:
  1. `bun add <pkg>@latest` (or `bun add -d`).
  2. Confirm the installed version is a stable release: no `-alpha`,
     `-beta`, `-rc`, `-canary`, `-next` suffix.
  3. Check the package's release notes and open issues. If the newest
     stable has a known critical bug or regression, pin the most recent
     version before it and write one line in README why.
  4. Pin exact versions (`bun add --exact`) and commit `bun.lock`.
  Never pick an old version out of habit or from memory.
- Runtime for api: Bun. If a dependency misbehaves under Bun (Prisma,
  Socket.IO, LangGraph), fall back to running the api with Node while
  keeping Bun as package manager, and note it in README.

## How we work
- One step at a time; after each step explain what changed and why, then
  wait for review.
- Code must stay readable and modular so the owner can explain and modify
  any part in a live review.
- Ask before adding a dependency not listed in the app's AGENTS.md.
- Secrets only in `.env`; keep `.env.example` complete.
- Git: small commits, meaningful messages
  (`feat(api): booking transaction`, `test(api): concurrent booking`).

## Definition of done (per feature)
- Works end to end with loading, success, empty and error states on the UI.
- Input validated with Zod on the server; consistent error responses.
- Critical rules covered by tests (booking concurrency, transitions,
  assistant tool safety).
- README updated if setup or environment changed.

## Submission checklist
- Git repo link, README with setup steps, `.env.example`, seeded demo
  credentials for each role, docker-compose for Postgres (with pgvector).
- README sections: problem, architecture diagram, database design, key
  APIs, assistant design (graph, tools, evaluation results, limitations),
  known limitations and next steps.
- Deployment: web on Vercel, api on Render (WebSocket capable), database
  on Neon. Local run must always work as the fallback.
