# academypro-auth-referrals

Backend reusable de **Auth (Google OAuth2) + JWT + Referrals** para proyectos tipo AcademyPro / GameHub.

**Stack:** Node/Express + TypeScript + Prisma + Postgres (Docker)

> Para trabajar con Codex: lee primero `CODEX.md`.

---

## Estado actual (confirmado)

API: `http://localhost:3000`

- `GET /api/health` → `{ "ok": true }`
- Google OAuth:
  - `GET /auth/google/start`
  - `GET /auth/google/callback`
  - Si `FRONTEND_BASE_URL` está vacío, el callback devuelve JSON: `{ ok:true, token, user }`
- JWT:
  - `GET /api/me` requiere `Authorization: Bearer <token>` y devuelve el usuario
- DB: Postgres en Docker con volumen persistente (NO se borra)

Detalles: ver `CONTEXT.md`.

---

## Requisitos

- Node >= 20
- Docker Desktop

---

## Setup rápido (Windows)

1) Instalar dependencias:
```bash
npm i
