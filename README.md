# AI Backend Interview Gym

Next.js frontend + NestJS backend for AI interview practice.

## Architecture

- Frontend (`/`) only calls internal Next routes (`/api/*`) and never holds AI/Firestore secrets.
- Next routes now act as proxy adapters to backend.
- Backend (`/backend`) owns all sensitive integrations:
  - xAI/Grok API key
  - Firestore API key/project configuration

## Run Locally

### 1) Backend

```bash
cd backend
cp .env.example .env
# fill XAI_API_KEY, FIREBASE_API_KEY, FIREBASE_PROJECT_ID
npm install
npm run start:dev
```

Backend default: `http://127.0.0.1:3001`

### 2) Frontend

```bash
cd ..
npm install
npm run dev
```

Frontend env (`.env.local`):

```bash
BACKEND_API_URL=http://127.0.0.1:3001
```

No frontend secret env vars are required.

## API Compatibility

Frontend contracts are unchanged:

- `POST /api/question`
- `POST /api/evaluate`
- `POST /api/session/start`
- `POST /api/session/progress`
- `POST /api/session/finish`
- `GET /api/dashboard/interviews`

These are proxied to backend endpoints with matching payload/response shapes.
