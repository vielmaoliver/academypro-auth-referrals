# TASKS (Next)

## SMOKE TEST (PowerShell) — antes y después de cada cambio
1) Invoke-RestMethod http://localhost:3000/api/health
2) Login Google -> obtener token
3) $TOKEN="..."
4) Invoke-RestMethod -Uri "http://localhost:3000/api/me" -Headers @{ Authorization = "Bearer $TOKEN" }

## 1) Referrals API (sin migraciones peligrosas)
- Crear rutas:
  - `GET /api/referrals` -> listar mis referidos (users con referredByUserId = mi id)
  - `POST /api/referrals/apply` body: { code } -> aplicar referralCode a mi cuenta
    Reglas:
    - si ya tengo referredByUserId => error (no permitir cambiar)
    - no self-referral
    - code debe existir
- Reutilizar el auth actual (req.user o userId) sin romper nada.

## 2) Validación y hardening (después)
- Validar input con Zod
- Rate limit a auth/referrals
- Logging limpio
