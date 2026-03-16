# AI Backend Interview Gym

Minimal AI web app for practicing backend interview questions with a polished developer-tool style UI. The app uses Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, the Groq API, and Firestore persistence for completed interview sessions.

## Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- Groq API
- Firebase Firestore
- Vercel

## Features

- Animated setup flow with topic, experience level, and interview heat mode
- AI-generated backend interview questions using `llama-3.1-8b-instant` with compact prompts and capped output tokens
- AI answer evaluation with score, strengths, missing concepts, better explanation, and learning resources
- Reusable rotating loading states for interview generation and answer review
- Firestore storage for interview history metadata
- Vercel-ready App Router project structure

## Project Structure

```text
app/
  api/question/route.ts
  api/evaluate/route.ts
  interview/page.tsx
  result/page.tsx
  page.tsx
components/
  EvaluationCard.tsx
  InterviewBox.tsx
  InterviewSetup.tsx
  LoadingScreen.tsx
lib/
  firebase.ts
  groq.ts
  types.ts
```

## Environment Variables

Create `.env.local`:

```bash
GROQ_API_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

Note: the Firestore helper uses the Firestore REST API with the Firebase API key and project ID, so your Firestore security rules must allow writes from this server-side flow.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Firestore Collection

Create a Firestore collection named `interviews`. Each evaluation stores:

- `topic`
- `experience`
- `difficulty`
- `question`
- `answer`
- `score`
- `createdAt`

## Vercel Deployment

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables from `.env.local` in the Vercel project settings.
4. Deploy.

## API Endpoints

### `POST /api/question`

Generates one realistic backend interview question based on:

- `topic`
- `experience`
- `difficulty`

### `POST /api/evaluate`

Evaluates the candidate answer and returns:

- `score`
- `strengths`
- `missingConcepts`
- `explanationForUser`
- `followUpQuestion`
- `skillBreakdown`
- `learningResources`
