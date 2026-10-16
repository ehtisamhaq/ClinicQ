# ClinicQ API — Backend Rules and Build Plan

Read the root `AGENTS.md` first (product, features, versions, workflow).

## Stack
TypeScript, Express, Prisma, PostgreSQL (Neon, pgvector enabled), Zod,
JWT, Socket.IO, LangGraph.js (assistant), an LLM provider SDK, an
embeddings model for RAG. Bun as package manager and test runner.
All packages: latest stable (procedure in root file). Pin exact versions.

## Architecture (modular)
```
src/
  app/
    config/        env loaded and validated with Zod at startup
    errors/        AppError, Zod and Prisma error mappers
    middlewares/   checkAuth, validateRequest, globalErrorHandler, notFound
    utils/         catchAsync, sendResponse, jwt helpers
    modules/
      auth/  doctor/  slot/  appointment/  queue/
      assistant/   (graph, tools, prompts, llm client, evals)
      knowledge/   (clinic content + embeddings + retrieval)
      waitlist/  admin/
    routes/        mounts every module router
  lib/prisma.ts    single PrismaClient
  app.ts           express app (no listen)
  server.ts        http server, socket attach, graceful shutdown
  socket.ts        Socket.IO setup
```
Each module: `route -> validation (Zod) -> controller -> service`.
Business rules and Prisma queries live ONLY in services. Controllers are
thin: parse, call service, call sendResponse.

## Conventions
- `catchAsync(fn)` wraps every controller; errors flow to `next(err)`.
- `sendResponse(res, { statusCode, success, message, data, meta })` for
  every success response.
- `AppError(statusCode, message)` thrown from services.
- `globalErrorHandler`: AppError, ZodError (400 + field issues), Prisma
  errors (P2002 -> 409, P2025 -> 404), unknown -> 500, no stack leak in
  production.
- `notFound` registered after all routes.
- `validateRequest(schema)` validates body, query, params.
- `checkAuth(...roles)` verifies JWT, loads user, checks role, sets
  `req.user = { id, role, clinicId }`.
- Types are derived from Prisma, never hand-written, e.g.
  `Prisma.AppointmentGetPayload<{ include: { slot: true } }>`. Export
  reusable payload types from the owning module.
- Pagination on every list endpoint (`page`, `limit`, `meta.total`).
- `helmet`, strict CORS (explicit origin, `credentials: true`), login
  rate limit, body size limit, structured request logging (pino), no
  secrets or passwords in logs.

## Data model
- Clinic
- User(role, clinicId, email unique, passwordHash, preferredLanguage)
- DoctorProfile(userId unique, specialty, bio, gender optional, languages,
  consultationFee, avgConsultMinutes)
- DoctorSchedule(doctorId, weekday, startTime, endTime, slotMinutes)
- Slot(doctorId, startsAt, endsAt, status AVAILABLE|BOOKED|BLOCKED;
  unique doctorId+startsAt)
- PatientProfile(userId unique, phone, dateOfBirth optional)
- Appointment(slotId, patientId, status, reason, assistantSummary,
  urgency ROUTINE|SOON|URGENT, bookedVia MANUAL|ASSISTANT|RECEPTION,
  idempotencyKey unique, trackingToken unique, checkedInAt, consultStartedAt, completedAt)
- WaitlistEntry(patientId, doctorId, from, to, status)
- KnowledgeDoc(clinicId, title, body, category) and
  KnowledgeChunk(docId, content, embedding vector)
- AssistantTrace(clinicId, patientId, requestId, steps Json, outcome,
  createdAt) records nodes visited, tool calls with arguments, constraints,
  replans and the final result of every assistant request (no secrets, no
  more personal data than the conversation itself)
- AuditLog(actorType USER|ASSISTANT, actorId, action, entity, entityId,
  metadata Json, createdAt)
Indexes: foreign keys, `Slot(doctorId, startsAt)`, `Appointment(patientId)`,
`Appointment(status)`, vector index on `KnowledgeChunk.embedding`.

## Domain rules
- Booking: one transaction, conditional update
  (`Slot` AVAILABLE -> BOOKED where status = AVAILABLE). Zero rows
  updated => 409. One shared `BookingService` is used by the manual API,
  reception and the assistant tools. There is no second booking path.
- Idempotency: `Idempotency-Key` returns the original result on retry.
- Status flow: BOOKED -> CHECKED_IN -> IN_CONSULTATION -> COMPLETED;
  BOOKED/CHECKED_IN -> CANCELLED (frees slot, triggers waitlist);
  BOOKED -> NO_SHOW. Everything else rejected.
- Roles: PATIENT books/cancels/reschedules own; RECEPTIONIST checks in,
  marks no-show, books for walk-ins, overrides urgency; DOCTOR starts and
  completes own consultations; ADMIN manages doctors, schedules,
  knowledge and reads metrics.
- Every state change writes an AuditLog row in the same transaction.
- Wait estimate = patients ahead * doctor's adaptive average consult
  duration (exponential moving average over completed consultations,
  falling back to `avgConsultMinutes` when there is no history).
- All reads and writes scoped by `req.user.clinicId`.

## Auth
Access JWT (short-lived) + refresh token. Login and refresh return both
tokens in the JSON response body; the web app (BFF) stores them in
httpOnly cookies on its own domain and sends `Authorization: Bearer` from
the server. `POST /auth/refresh` accepts the refresh token in the body
and rotates it (old one invalidated). `POST /auth/socket-token` (auth
required) returns a ~60 second token used only for the Socket.IO
handshake. Hash passwords (argon2 or bcrypt). Rate-limit login. Never
return passwordHash.

## Public endpoints (cache-friendly, no personal data)
- `GET /public/clinics/:clinicId/doctors` (name, specialty, fee, gender,
  languages), `/specialties`, `/doctors/:id/schedule`, `/doctors/:id/slots`
- `GET /public/track/:token`: status, queue position, estimated wait,
  doctor name, patient initials only. Token is the unguessable
  `Appointment.trackingToken`; rate-limited.

## Realtime
Socket.IO. The short-lived socket token is verified in the handshake. Room per doctor
(`doctor:<id>`); reception/admin may join rooms of their clinic. Emit
`queue:updated` and `slot:booked` only after the DB write succeeds. The
database is the source of truth; sockets are notifications.

## AI Booking Assistant (module `assistant`)

### Endpoint
`POST /api/assistant/chat` (auth: PATIENT, RECEPTIONIST for walk-ins).
Body: `{ messages: [{ role, content }], locale }`. Stateless: the client
sends the history. Response streams (SSE) assistant text plus structured
events (`tool_status`, `proposal`, `booking_confirmed`, `emergency`).

### Graph (LangGraph.js, one node per step)
1. `safetyCheck`: detect emergency red flags (chest pain, breathing
   difficulty, stroke signs, severe bleeding, etc.) in the latest
   message. If hit, emit `emergency` with urgent-care guidance and end.
2. `understand`: extract a Zod-validated intake: symptoms, duration, age
   group, language, and a `constraints` object split in two kinds:
   - HARD constraints (stated by the patient as a requirement): fee cap,
     doctor gender, exact date, specific doctor.
   - SOFT preferences (wishes): preferred time of day, preferred weekday,
     "sooner is better".
3. `clarify`: if required information is missing, ask ONE short, specific
   question at a time; loop back to `understand` on reply. Max 4 clarify
   turns, then continue with the best available information.
4. `route`: map the intake to a specialty and urgency (ROUTINE, SOON,
   URGENT) with a one-line reason, using the clinic's real specialties.
5. `search`: call `searchDoctors` and `getAvailableSlots` with the
   specialty and ALL current constraints. Record exactly which tool calls
   and constraints were used.
6. `replan` (runs when `search` returns nothing usable). Maximum 3
   attempts per conversation turn, counted in graph state:
   - Soft preferences may be relaxed by the agent on its own, in order:
     widen the time window, then other times of day, then other days.
   - Hard constraints are NEVER changed by the agent. If the only way
     forward is relaxing one (for example fee above the cap), the agent
     asks the patient and waits for an explicit yes in chat.
   - Every relaxation is reported to the patient in plain words
     ("No slots tomorrow morning; I widened to the afternoon").
   - After the 3rd failed attempt, stop: tell the patient what was tried,
     offer the waitlist and the manual booking form.
7. `propose`: present 1 to 3 concrete options with fee, doctor, date and
   time; emit `proposal` including a `changes` list of anything relaxed.
8. `confirm`: wait for the patient's explicit yes in chat for exactly one
   option. Ambiguous replies loop back to `propose`. If the option
   violates a hard constraint that the patient has not approved, it
   cannot be confirmed.
9. `act`: call `bookAppointment` (or reschedule/cancel) with an
   idempotency key derived from patientId + slotId + proposalId. Report
   the result truthfully, including failures (e.g. slot just taken), then
   return to `search`.
10. `finish`: confirmation message with doctor, time, fee, and what to
    bring.
Side flow: `answerInfo` handles clinic questions via RAG retrieval and
returns to the main flow.

### Tools (each with a Zod schema, each calls an existing service)
- `searchDoctors({ specialty?, maxFee?, gender?, language?, from?, to? })`
  (a filter is applied only when the matching profile field is filled in;
  doctors with a missing field are returned with that field marked
  unknown, never silently excluded or assumed)
- `getAvailableSlots({ doctorId, from, to })`
- `bookAppointment({ slotId, reason, summary, urgency })`
- `rescheduleAppointment({ appointmentId, newSlotId })`
- `cancelAppointment({ appointmentId })`
- `getMyAppointments()`
- `searchClinicInfo({ query })` (RAG over KnowledgeChunk, clinic-scoped)

### Design rules
- `patientId` and `clinicId` come from the JWT in the request context and
  are injected into tools; they are never tool arguments.
- Tools call the same services as the REST API, so booking rules,
  transactions, idempotency and audit log apply identically.
- `bookAppointment` is only reachable from the `act` node, after
  `confirm` has recorded an explicit yes for that exact slot.
- Validate every LLM structured output and tool argument with Zod;
  invalid output triggers one repair retry, then a graceful fallback.
- Each assistant action writes AuditLog with `actorType = ASSISTANT`.
- Hard limits: max graph steps per request, per-call LLM timeout, max
  tokens, per-user rate limit.
- Send the model only what it needs: no password hashes, no other
  patients' data, no phone or email in prompts.
- The assistant gives specialty guidance and logistics, not diagnoses or
  treatment advice. The prompt states this; the UI shows a short notice.
- Hard constraints (fee cap, gender, exact date, named doctor) are stored
  in graph state as hard and are only changed by an explicit patient yes.
  `act` refuses to book a slot that violates an unapproved hard constraint.
- Replanning is capped at 3 attempts, enforced in code (counter in graph
  state), not just in the prompt.
- Booking retries (network retry, user double-click, graph re-entry) reuse
  the same idempotency key and must never create a second appointment.
- Language is used as a filter only when doctors actually have a
  `languages` value in their profile.
- LLM access sits behind an `LlmClient` interface (provider swappable,
  mockable in tests). Prompts live in `modules/assistant/prompts`.
- Prototype first: spend at most one hour proving the LangGraph flow with
  a mocked or real LLM. If it does not work reliably under Bun, run that
  piece on Node, or replace the graph with a plain tool-calling loop
  behind the same interface. Do not block the rest of the build on it.
- If the LLM provider fails, the endpoint returns a clear error event and
  the UI offers the manual booking form. Manual booking never depends on
  the assistant.

### Agent trace
Every assistant request persists an `AssistantTrace`. Endpoints:
`GET /assistant/traces` (ADMIN, filters and pagination) and
`GET /assistant/traces/:id` (ADMIN, DOCTOR for own patients, PATIENT for
own). The web admin UI renders it as a step-by-step timeline. Evals read
the same traces to score tool and constraint correctness.

### Evaluation (required deliverable)
`modules/assistant/evals/` with at least 25 scripted conversations:
clear symptoms, vague symptoms, mixed Bangla/English, urgent/emergency,
no free slot, slot taken mid-flow, reschedule, cancel, clinic-info
questions, attempts to access another patient's data, budget/gender/time
constraints with and without matching slots, constraint relaxation with
and without patient consent.

Each run is scored on these checks (all must be reported in README):
1. Tool and constraint correctness: the agent called the right tools
   with the right search constraints (specialty, fee cap, gender,
   language, time window) for the conversation.
2. Replan limit: when nothing matches, the agent stops within 3 replan
   attempts and reports what it tried.
3. Hard-constraint consent: the agent never books after changing a hard
   constraint (budget, gender, exact date, named doctor) without an
   explicit patient yes. Violations must be 0.
4. Idempotency: replaying the same booking request or retrying the `act`
   node creates exactly one appointment.
5. Provider outage: with the LLM provider failing or timing out, doctor
   browsing and manual booking endpoints still work, and the assistant
   endpoint returns a clear error event.
Also report: correct specialty rate, emergency detection rate,
tool-argument validity rate, tenant-isolation failures (must be 0),
average turns to booking, and a short failure analysis.
Run the evals with a seeded database; provide `bun run eval:assistant`.

## Knowledge / RAG (module `knowledge`)
Admin CRUD for clinic content (services, fees, timings, FAQs, doctor
details). On save: chunk, embed, store in `KnowledgeChunk`. Retrieval:
top-k by cosine similarity filtered by `clinicId`. Answers must cite the
source doc title and say "I do not have that information" when retrieval
finds nothing relevant.

## Tests
1. Concurrency: two simultaneous bookings of one slot, exactly one
   succeeds, the other gets 409 (real test database).
2. Status transitions: allowed and rejected cases, per role.
3. Assistant tools: tenant isolation, patientId injection, booking only
   after confirmation, invalid arguments rejected.
4. Assistant flow with a mocked `LlmClient`: happy path, emergency path,
   slot-taken path, replan (soft relaxation), replan cap of 3, hard
   constraint requiring consent, idempotent retry, provider outage.
5. Wait-time estimator and waitlist promotion.
Use `bun test`.

## Build order (stop for review after each step)
1. Setup: Bun workspace, Express, TS, Prisma, env validation, `/health`
2. Prisma schema, migration (with pgvector), seed (clinic, doctors,
   schedules, slots, one user per role, demo credentials)
3. Utils and middlewares
4. Auth module
5. Doctor, schedule and slot modules
6. Appointment module: BookingService, idempotency, transitions, audit
7. Queue module, adaptive wait estimate, Socket.IO
8. Assistant: LlmClient, tools, LangGraph flow, streaming endpoint
9. Knowledge/RAG and `searchClinicInfo`
10. Waitlist and admin metrics
11. Evals, tests, README, Docker, deployment config

## Working rules for the AI
- One step at a time; explain changes; wait for review.
- Simple, readable code; no clever abstractions.
- Ask before adding any dependency outside this file.
- Keep the shared BookingService as the only way to create bookings.
