# NestJS Backend Wrapper

Backend wrapper for the Next.js AI interview app.

## Run

```bash
cp .env.example .env
npm install
npm run start:dev
```

Server defaults:
- `http://127.0.0.1:3001`
- CORS origin: `http://localhost:3000`

## Environment

```env
PORT=3001
HOST=127.0.0.1
CORS_ORIGIN=http://localhost:3000
XAI_API_KEY=
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
```

## Endpoints

The backend accepts both plain and `/api`-prefixed routes for compatibility.

- `POST /interview/question` or `POST /api/interview/question`
- `POST /interview/evaluate` or `POST /api/interview/evaluate`
- `POST /session/start` or `POST /api/session/start`
- `POST /session/progress` or `POST /api/session/progress`
- `POST /session/finish` or `POST /api/session/finish`
- `GET /dashboard/interviews?limit=20` or `GET /api/dashboard/interviews?limit=20`

If xAI fails or keys are missing, schema-safe fallback responses are returned.
