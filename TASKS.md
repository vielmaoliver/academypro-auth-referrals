# TASKS (Next)

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
