# CONTEXT — academypro-auth-referrals

## Objetivo
Backend reusable de Auth + Referrals (AcademyPro, GameHub, etc.) con Node/Express + TS + Prisma + Postgres (Docker). Debe ser portable y no romperse en otras PCs.

## Estado actual (confirmado)
- Postgres corre con: `docker compose -p academypro-auth-referrals up -d`
- Volumen persistente: `academypro-auth-referrals_pgdata` (no se borra)
- API: http://localhost:3000
- `GET /api/health` -> { ok: true }

## Auth (funciona)
- Google OAuth:
  - `GET /auth/google/start`
  - `GET /auth/google/callback`
  - Si `FRONTEND_BASE_URL` está vacío, el callback devuelve JSON: { ok:true, token, user }
- JWT:
  - `GET /api/me` acepta `Authorization: Bearer <token>` y devuelve el usuario
  - El middleware legacy por headers (x-user-sub/x-user-email/x-user-name) puede existir y no debe romperse.

## Modelo User (referencias)
Campos actuales incluyen:
- id, email, name, pictureUrl, provider, providerSub, referralCode, referredByUserId, createdAt, updatedAt

## Nota
No hay frontend. No depende de localhost:5173.
