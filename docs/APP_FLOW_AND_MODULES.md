# App Flow and Module Responsibilities

This document explains how the app works end-to-end and what each module is responsible for.

## 1) High-Level User Flow

1. User opens `/` and configures interview options in `InterviewSetup`.
2. User clicks **Start Interview** and is routed to `/interview?...queryParams`.
3. `InterviewBox` initializes a session by calling:
   - `POST /api/session/start` (create interview session document)
   - `POST /api/question` (generate first question, except follow-up shortcut path)
4. For each non-final question:
   - User submits answer.
   - `InterviewBox` calls `POST /api/session/progress` to persist answers so far.
   - `InterviewBox` calls `POST /api/question` for the next question.
5. On final question:
   - `InterviewBox` calls `POST /api/session/finish`.
   - Backend runs full-session AI analysis and stores final report in Firestore.
   - Frontend stores report in `sessionStorage` key `latest-interview-report` and routes to `/result`.
6. `/result` renders `InterviewReportCard` from sessionStorage report.
7. User can open `/dashboard`, which fetches recent interviews from Firestore and computes trend + skill insights.

## 2) Flow Variants

### Standard Interview Mode
- Questions are generated from selected topic/experience/difficulty.
- If topic exists in `data/questionBank.ts`, app uses a base bank question and asks model to enhance it.

### Resume-Based Interview Mode
- Setup requires PDF upload (max 2MB).
- PDF is converted to Data URL and stored in sessionStorage.
- `POST /api/question`:
  1. extracts text from PDF (`pdf-parse`)
  2. extracts skills with LLM
  3. filters to supported skills (`lib/interview-ai.ts`)
  4. generates one question tied to selected supported skill

### Follow-Up Shortcut
- `FollowUpQuestionCard` can route to `/interview` with `followUpQuestion` query param.
- When present, that question is used as the first question instead of generating one.

## 3) API Layer Responsibilities

### `POST /api/session/start`
File: `app/api/session/start/route.ts`
- Validates `topic`, `experience`, `difficulty`, `totalQuestions`.
- Creates Firestore `interviewSessions` record with empty answers and `in_progress` status.
- Returns `{ sessionId }`.

### `POST /api/question`
File: `app/api/question/route.ts`
- Validates setup payload.
- Handles standard mode and resume mode.
- Uses Groq (`llama-3.1-8b-instant`) with strict JSON output.
- Returns `{ question, skill, mode }`.

### `POST /api/session/progress`
File: `app/api/session/progress/route.ts`
- Persists current session answers to `interviewSessions`.
- Keeps `status: "in_progress"` and clears `report`.

### `POST /api/session/finish`
File: `app/api/session/finish/route.ts`
- Loads session by `sessionId`.
- Builds full transcript prompt.
- Runs final AI analysis (overall score, strengths, weak areas, feedback, improvement plan, dynamic skill breakdown).
- Updates `interviewSessions` to `status: "completed"` and stores `report`.
- Returns full completed session payload.

### `POST /api/evaluate` (Single-answer evaluation path)
File: `app/api/evaluate/route.ts`
- Evaluates one question+answer pair.
- Uses cache key (`sha256(question::answer)`) with Firestore `aiCache`.
- Saves final evaluation row in `interviews`.
- Returns score, strengths, missing concepts, follow-up, skill breakdown, resources, and cache flag.
- Current codebase has endpoint implemented, but interview UI path is primarily session-based (`/api/session/*`).

## 4) Frontend Module Responsibilities

## App Routes (`app/`)

- `app/page.tsx`
  - Landing page + link to dashboard.
  - Renders `InterviewSetup`.

- `app/interview/page.tsx`
  - Renders `InterviewBox` inside `Suspense`.
  - Shows loading shell while initializing.

- `app/result/page.tsx`
  - Reads result from sessionStorage.
  - Prefers `latest-interview-report` (session finish flow).
  - Falls back to `latest-interview-result` (single-answer path support).
  - Renders `InterviewReportCard` or `EvaluationCard`.

- `app/dashboard/page.tsx`
  - Server-side fetch of last 20 interviews (`getRecentInterviews`).
  - Builds dashboard aggregates (`buildDashboardData`).
  - Renders `DashboardClient`.

## Key UI Components (`components/`)

- `InterviewSetup.tsx`
  - Captures mode, topic, experience, difficulty, question count.
  - Handles resume file validation + Data URL storage.
  - Routes to interview page with query params.

- `InterviewBox.tsx`
  - Orchestrates full multi-question interview lifecycle.
  - Handles start/progress/next/finish API calls.
  - Stores final report in sessionStorage for result page.

- `InterviewReportCard.tsx`
  - Displays final multi-question session analysis.

- `EvaluationCard.tsx`
  - Displays single-question evaluation shape.
  - Includes follow-up question CTA.

- `DashboardClient.tsx`
  - Renders skill averages, trend chart, interview history cards, and summary insight text.

- Supporting visual/presentation modules
  - `LoadingScreen.tsx`, `SkillProgress.tsx`, `ScoreTrendChart.tsx`, `SkillBreakdownChart.tsx`, `LearningResourceCard.tsx`.

## 5) Shared Library Responsibilities (`lib/`)

- `lib/interview-ai.ts`
  - Prompt builders for question generation, answer evaluation, and final session analysis.
  - Resume skill filtering and topic helpers.
  - JSON parsing + normalization + fallback defaults for model outputs.
  - Resource fallback mapping from weak areas.

- `lib/firebase.ts`
  - Firestore REST client helpers (no Firebase SDK usage in this module).
  - CRUD for:
    - `interviews` (single evaluation history)
    - `aiCache` (question+answer evaluation cache)
    - `interviewSessions` (multi-question session lifecycle)
  - Data shape conversion between TS types and Firestore field format.

- `lib/dashboard.ts`
  - Computes skill averages, strongest/weakest insight, and chart series.

- `lib/groq.ts`
  - Groq client initialization.
  - API key guard.

- `lib/types.ts` and `lib/view-types.ts`
  - Core type contracts for setup, evaluations, skill breakdowns, session answers, final reports, dashboard data.

## 6) Data Modules (`data/`)

- `data/questionBank.ts`
  - Static seed questions by topic.
  - Topic normalization helpers.

- `data/learningResources.ts`
  - Topic/concept -> learning resource mapping.
  - Missing concept -> top resource matching.

- `data/skillMapping.ts`
  - Topic-specific metric definitions and keyword maps.
  - Builds topic-aware skill breakdown from generic breakdown + missing concepts.

## 7) Persistence Model

## Firestore Collections

- `interviewSessions`
  - Multi-question session state (`in_progress`/`completed`), answers array, final report, timestamps.

- `interviews`
  - Single evaluation records with score, strengths, missing concepts, follow-up, resources, and metadata.
  - Used by dashboard query.

- `aiCache`
  - Cached evaluation by deterministic hash key.

## Browser Storage

- `sessionStorage["interview-resume-data-url"]`
  - Resume PDF data URL for resume mode question generation.

- `sessionStorage["latest-interview-report"]`
  - Final session analysis displayed in result page.

- `sessionStorage["latest-interview-result"]`
  - Legacy/alternate single-evaluation result shape.

## 8) Dependency and Runtime Notes

- Frontend has no secret env dependencies.
- Backend owns AI and Firestore integration.
- Required backend env:
  - `XAI_API_KEY`
  - `FIREBASE_API_KEY`
  - `FIREBASE_PROJECT_ID`
- Frontend env:
  - `BACKEND_API_URL`
- Missing backend config returns fallback-safe responses to avoid frontend breakage.

## 9) Quick Responsibility Matrix

- Interview orchestration: `components/InterviewBox.tsx`
- Question generation: `app/api/question/route.ts` -> backend `/interview/question`
- Session persistence: `app/api/session/*` -> backend `/session/*`
- Final report generation: backend `SessionService` + `AiService`
- Single-answer evaluation: `app/api/evaluate/route.ts` -> backend `/interview/evaluate`
- Dashboard analytics: `app/dashboard/page.tsx` via backend `/dashboard/interviews`
- Static data maps: `data/*`
