# Session Question Generation Context

This file is the single source of truth for how this project creates interview questions for each session.

It focuses on the active session-based flow, not just every question-related file in the repo.

## Executive Summary

The live session flow does **not** generate each next question dynamically after every answer.

Instead, it works like this:

1. The frontend collects setup choices: topic, experience, difficulty, and total question count.
2. The frontend calls `POST /api/session/start`.
3. The Next.js API route proxies that request to the Nest backend `POST /session/start`.
4. The backend creates a **full session question plan up front** using the `QuestionAssemblyService`.
5. That full plan is stored in persistence with per-question metadata.
6. The first planned question is returned immediately.
7. Later, `POST /session/progress` does **not** create a new question algorithmically. It simply returns the next question from the stored plan by index.
8. `POST /session/finish` evaluates answers against the stored question plan metadata.

So the core algorithm is: **assemble once at session start, then replay the stored plan during the session**.

## Main Files Involved

### Frontend entry and session wiring

- `components/InterviewSetup.tsx`
  - Collects topic, experience, difficulty, mode, and total question count.
  - Pushes those values into the `/interview` route as query params.
- `components/InterviewBox.tsx`
  - Starts the session by calling `/api/session/start`.
  - Calls `/api/session/progress` after each answer.
  - Calls `/api/session/finish` at the end.
  - Holds the current `sessionId`, `question`, `questionId`, and submitted answers in client state.
- `app/api/session/start/route.ts`
- `app/api/session/progress/route.ts`
- `app/api/session/finish/route.ts`
  - Thin proxy routes from Next.js to the backend service.

### Backend session pipeline

- `backend/src/modules/session/session.controller.ts`
  - Exposes `/session/start`, `/session/progress`, and `/session/finish`.
- `backend/src/modules/session/session.service.ts`
  - The main runtime service for session lifecycle.
  - Builds the session question plan at start.
  - Returns the next stored question during progress.
  - Aligns answers back to the plan during finish.

### Active question-generation engine

- `backend/src/modules/interview-brain/content/topic-pack.registry.ts`
  - Registers the per-topic content packs.
- `backend/src/modules/interview-brain/content/topic-pack.types.ts`
  - Defines the content model: concepts, hooks, constraints, rubrics, question families, topic packs.
- `backend/src/modules/interview-brain/domain/topic-routing.util.ts`
  - Maps display topic strings like `"System Design"` or `"Node.js"` to internal topic ids.
- `backend/src/modules/interview-brain/content/runtime/question-selection.util.ts`
  - Selects question families/hooks/constraints for a session.
  - Handles shuffle, difficulty filtering, archetype caps, and subtopic spread.
- `backend/src/modules/interview-brain/content/runtime/question-assembly.service.ts`
  - Orchestrates selection, rendering, validation, retry, and backfill.
  - Produces the final question instances used in sessions.
- `backend/src/modules/interview-brain/content/renderer/question-renderer.service.ts`
  - Converts a planned family + hook + constraints into final question text.
- `backend/src/modules/interview-brain/content/renderer/question-finalizer.util.ts`
  - Deduplicates fragments, clamps repeated keywords, and enforces word limits.
- `backend/src/modules/interview-brain/content/validator/question-validator.service.ts`
  - Rejects duplicate, bloated, repetitive, or overlong questions.
- `backend/src/modules/interview-brain/content/runtime/question-instance.types.ts`
  - Defines the generated question instance shape stored in the session plan.

### Topic content sources

- `backend/src/modules/interview-brain/content/packs/system-design.pack.ts`
- `backend/src/modules/interview-brain/content/packs/databases.pack.ts`
- `backend/src/modules/interview-brain/content/packs/caching.pack.ts`
- `backend/src/modules/interview-brain/content/packs/queues.pack.ts`
- `backend/src/modules/interview-brain/content/packs/apis.pack.ts`
- `backend/src/modules/interview-brain/content/packs/concurrency.pack.ts`
- `backend/src/modules/interview-brain/content/packs/javascript.pack.ts`
- `backend/src/modules/interview-brain/content/packs/nodejs.pack.ts`

These pack files are the actual source material for the active session question pipeline.

### Persistence and evaluation coupling

- `backend/src/modules/storage/storage.service.ts`
  - Stores the session and the full `questionPlan`.
- `backend/src/modules/session/session-evaluation.service.ts`
  - Uses stored question metadata during final evaluation.

## Step-by-Step Runtime Flow

## 1. User chooses interview setup

In `components/InterviewSetup.tsx`, the user selects:

- topic
- experience
- difficulty
- totalQuestions
- mode

Then the app navigates to `/interview` with query params.

Important normalization:

- `"Mid-Level"` becomes `"Mid"` in the session client.
- `"On Call"` becomes `"Medium"`.
- `"Incident Mode"` becomes `"Hard"`.

That normalization happens in `components/InterviewBox.tsx` before the backend call.

## 2. Frontend starts a session

`components/InterviewBox.tsx` sends:

```json
{
  "topic": "...",
  "experience": "...",
  "difficulty": "...",
  "totalQuestions": 5
}
```

to `POST /api/session/start`.

`app/api/session/start/route.ts` simply forwards that body to the backend `POST /session/start`.

## 3. Backend validates the start payload

`backend/src/modules/session/dto/start-session.dto.ts` validates:

- `topic` must be one of the supported display values
- `experience` must be one of `Junior | Mid | Senior`
- `difficulty` must be one of `Warm Up | Medium | Hard | Epic`
- `totalQuestions` must be an integer from `1` to `10`

Note:

- The frontend offers `5`, `10`, and `15`, but the backend DTO currently caps this at `10`.
- That means a frontend selection of `15` conflicts with the backend contract.

## 4. SessionService builds a full plan up front

`backend/src/modules/session/session.service.ts` calls its private `buildPlan(...)`.

That method:

1. Converts the display topic into an internal `topicId` using `toTopicId(...)`.
2. Calls `questionAssembly.assemble(...)`.
3. Converts the returned question instances into a storable `questionPlan`.
4. Persists the session with that full plan.

The stored plan item contains:

- `questionId`
- `topicId`
- `familyKey`
- `archetype`
- `hookId`
- `concepts`
- `subtopic`
- `rubricId`
- `constraintSnapshot`
- `renderedQuestion`

This is important because the system stores more than just raw question text. It stores enough metadata to keep evaluation aligned with the exact question that was asked.

## 5. Topic packs are the source material

`getTopicPack(topicId)` returns a topic pack from `topic-pack.registry.ts`.

Each topic pack contains:

- `concepts`
- `scenarioHooks`
- `constraintTemplates`
- `rubricTemplates`
- `questionFamilies`
- `learningResources`

The active algorithm does **not** pull session questions from `data/questionBank.ts`.

For the live session flow, the primary source of question content is the backend topic pack files.

## 6. Question selection algorithm

The first algorithmic stage lives in `question-selection.util.ts`.

### What it does

`planQuestionsFromPack(pack, total, maxPerArchetype, options)` creates a list of planned questions using pack data.

### Core mechanics

- Shuffles `scenarioHooks` and `questionFamilies` using Fisher-Yates shuffle.
- Applies optional exclusions for:
  - family keys
  - hook ids
  - question texts
- Filters by difficulty when tagged families exist for that difficulty.
- Prefers previously unseen subtopics first.
- Prevents overusing the same archetype through `maxPerArchetype`.
- Avoids reusing the same hook within the same planned set when possible.
- Falls back gracefully if exclusions empty the pool.

### Important note

`excludeQuestionTexts` is passed in from `SessionService`, but in the current `planQuestionsFromPack(...)` implementation it is not actually used in the selection logic. Family and hook exclusions are supported in code; question-text exclusion is currently just carried in the options object.

## 7. Question assembly algorithm

The second algorithmic stage lives in `question-assembly.service.ts`.

For each planned item, it:

1. Renders question text from the chosen family/hook/constraints.
2. Validates the rendered question.
3. If validation fails, tries:
   - an alternate hook for the same family
   - then an alternate family for the same hook
4. Tracks what has already been used in this session:
   - exact question texts
   - family keys
   - skeletons
   - hook ids
   - numeric scales
5. If the total still comes up short, it runs a backfill pass.
6. Returns the final question instances plus a `deficit` count.

This is the main active question-creation engine.

## 8. Rendering algorithm

`question-renderer.service.ts` turns structured content into human-readable question text.

It:

1. Picks the `QuestionFamily`
2. Picks the `ScenarioHook`
3. Picks the `ConstraintTemplate[]`
4. Builds:
   - a scenario line
   - a primary ask
   - a constraint line
5. Joins them into raw text
6. Passes that raw text to `finalizeQuestionText(...)`

The renderer is rule-based, not LLM-based.

For some JavaScript family keys, it uses custom hardcoded phrasing so questions feel more specific and less generic.

## 9. Final text cleanup algorithm

`question-finalizer.util.ts` performs the last cleanup pass.

It:

- splits the raw question into fragments
- removes duplicate fragments
- reduces repeated keyword families like event-loop or promise wording
- enforces a maximum word count

The default word limit comes from `QUESTION_WORD_LIMIT`, validated in `backend/src/config/env.config.ts`, and defaults to `45`.

## 10. Validation algorithm

`question-validator.service.ts` rejects poor generated questions.

It can reject for:

- duplicate question text
- reused family key
- reused skeleton
- reused hook
- repeated `"10,000 concurrent users"` style phrasing
- reused numeric scale
- word count over 45
- too much concept keyword repetition
- multi-ask questions
- duplicated fragments
- bloated metadata-like concatenation

This validator is what keeps the session set diverse and concise.

## 11. Session storage model

After assembly, `SessionService.start(...)` stores the session via `StorageService.createInterviewSession(...)`.

The session record includes:

- topic
- experience
- difficulty
- totalQuestions
- questionDeficit
- answers
- questionPlan
- status
- report
- userId

The key design decision is that `questionPlan` is stored immediately when the session starts.

## 12. How next questions are chosen during the session

This is a very important behavior detail:

`SessionService.progress(...)` does **not** run the question generation algorithm again.

Instead it:

1. Loads the stored session.
2. Loads the stored `questionPlan`.
3. Saves the submitted answers aligned against that plan.
4. Returns `questionPlan[input.answers.length]`.

That means the next question is determined entirely by the plan created at session start.

There is no adaptive mid-session branching in the active session flow.

## 13. How finish uses the plan

`SessionService.finish(...)`:

1. Loads the stored session.
2. Loads the stored `questionPlan`.
3. Re-binds submitted answers to plan items.
4. Verifies submitted question text against stored question text.
5. Sends answers plus plan metadata into `SessionEvaluationService`.

So question-generation metadata is not just for display. It is part of the evaluation contract too.

## What Is Active vs Not Active

## Active for live session creation

- `components/InterviewSetup.tsx`
- `components/InterviewBox.tsx`
- `app/api/session/start/route.ts`
- `app/api/session/progress/route.ts`
- `app/api/session/finish/route.ts`
- `backend/src/modules/session/session.service.ts`
- `backend/src/modules/interview-brain/content/topic-pack.registry.ts`
- `backend/src/modules/interview-brain/content/runtime/question-selection.util.ts`
- `backend/src/modules/interview-brain/content/runtime/question-assembly.service.ts`
- `backend/src/modules/interview-brain/content/renderer/question-renderer.service.ts`
- `backend/src/modules/interview-brain/content/renderer/question-finalizer.util.ts`
- `backend/src/modules/interview-brain/content/validator/question-validator.service.ts`
- topic pack files under `backend/src/modules/interview-brain/content/packs/`
- `backend/src/modules/storage/storage.service.ts`

## Present in repo, but not the main live session algorithm path

### `data/questionBank.ts`

This is a static frontend question bank with `randomQuestionForTopic(...)`.

It is useful background and may reflect an older/simple flow, but it is **not** the active source of truth for session creation in the current session-based backend pipeline.

### `lib/interview-ai.ts`

This file contains prompt builders and frontend-side helper logic for AI question/evaluation flows.

It is not the primary active engine for session question planning.

### `backend/src/modules/interview/interview.service.ts`

This supports single-question generation through `/interview/question`.

It can use `QuestionAssemblyService` for one-off generation and then fall back to `AiService`, but it is separate from the multi-question session lifecycle handled by `SessionService`.

### `backend/src/modules/ai/ai.service.ts`

This is an AI-backed fallback/service for single question generation and evaluation.

For the session flow documented here, question creation is currently pack-driven and rule-driven through `QuestionAssemblyService`.

### `backend/src/modules/interview-brain/planner/planner.service.ts`

This file contains richer planning concepts like mastery and history filtering.

However, the current live session start path in `SessionService.buildPlan(...)` calls `questionAssembly.assemble(...)` directly, and the current `QuestionAssemblyService` internally calls `planQuestionsFromPack(...)` directly.

So:

- `PlannerService` exists
- mastery/history filter infrastructure exists
- but this richer planner is **not** the active runtime path for session generation right now

## Practical Source-of-Truth Answer

If someone asks, "How are session questions created in this project?" the shortest correct answer is:

Session questions are created on the backend at session start by `SessionService`, which uses `QuestionAssemblyService` to build a full plan from topic packs. The assembly pipeline selects question families/hooks/constraints, renders text, validates uniqueness/quality, stores the full question plan, and later `progress` simply returns the next planned question from storage.

## Known Gaps and Important Observations

1. `PlannerService` and mastery/history filter services are present, but they are not on the active session generation path.
2. `excludeQuestionTexts` is passed into assembly options, but the current selection utility does not actively use it.
3. The frontend offers a `15` question option, while `StartSessionDto` currently caps `totalQuestions` at `10`.
4. There are legacy or adjacent question-generation paths in `data/questionBank.ts`, `lib/interview-ai.ts`, `InterviewService`, and `AiService`, but they are not the core source of truth for live session creation.

## Recommended Reading Order

If a new developer wants to understand the pipeline quickly, read files in this order:

1. `components/InterviewSetup.tsx`
2. `components/InterviewBox.tsx`
3. `app/api/session/start/route.ts`
4. `backend/src/modules/session/session.controller.ts`
5. `backend/src/modules/session/session.service.ts`
6. `backend/src/modules/interview-brain/domain/topic-routing.util.ts`
7. `backend/src/modules/interview-brain/content/topic-pack.types.ts`
8. `backend/src/modules/interview-brain/content/topic-pack.registry.ts`
9. `backend/src/modules/interview-brain/content/runtime/question-selection.util.ts`
10. `backend/src/modules/interview-brain/content/runtime/question-assembly.service.ts`
11. `backend/src/modules/interview-brain/content/renderer/question-renderer.service.ts`
12. `backend/src/modules/interview-brain/content/validator/question-validator.service.ts`
13. one or two topic pack files, especially `system-design.pack.ts` and `javascript.pack.ts`
14. `backend/src/modules/storage/storage.service.ts`
15. `backend/src/modules/session/session-evaluation.service.ts`

## Bottom Line

The current session question system is a **structured content assembly pipeline**, not a simple random bank picker and not a per-question live LLM generation loop.

The sequence is:

setup -> start session -> map topic -> assemble full plan from topic packs -> render -> validate -> store plan -> serve first question -> serve next stored questions by index -> evaluate against stored metadata
