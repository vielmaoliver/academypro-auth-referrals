# Codex Boot

## 1) Read first
- RULES.md
- CONTEXT.md
- TASKS.md

## 2) Project quick facts
- Backend: Node/Express + TS (tsx watch)
- Auth: Google OAuth2 -> userinfo -> upsert user -> JWT
- DB: Postgres + Prisma
- Endpoints:
  - GET /api/health -> {ok:true}
  - GET /api/me -> requires Authorization: Bearer <JWT>
  - GET /auth/google/start -> redirects to Google
  - GET /auth/google/callback -> returns JSON if FRONTEND_BASE_URL not set, otherwise redirects

## 3) Non-negotiables
- Do not commit secrets. .env stays local. .env.example only placeholders.
- Do not break existing endpoints and flows.
- Make minimal changes; prefer additive commits.

## 4) How to run
- npm i
- docker compose up -d
- npm run dev
