# RULES (Codex)

1) NO ejecutes comandos. Solo crea/edita archivos. Si necesitas un comando, escríbelo y yo lo corro.
2) NO borrar datos: NO usar `prisma migrate reset`, NO `docker volume rm`, NO tocar volúmenes.
3) Mantener compatibilidad: no romper endpoints existentes (/api/health, /api/me, /auth/google/*).
4) Mantener portabilidad: cambios deben funcionar en una PC nueva con:
   - docker compose up -d
   - npm i
   - npx prisma generate
   - npx prisma migrate dev
   - npm run dev
5) Si no estás seguro de un archivo/ruta/import, pide el archivo o revisa el repo antes de cambiar.
