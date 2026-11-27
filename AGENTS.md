# AGENTS — Between U & Me

Short map for AI agents. Project rules live in [`.cursor/rules/`](.cursor/rules/) (`project.mdc` always on; `i18n.mdc` when editing i18n).

## Layout

| Path | Role |
|------|------|
| `frontend/` | Angular 22 app (games UI, i18n, room client) |
| `backend/` | Express + Socket.IO rooms API + Dockerfile |
| `README.md` | Human docs (EN + ES); **ask before changing** if code diverges |

## Key app paths

- Routes: `frontend/src/app/app.routes.ts`
- i18n: `frontend/src/app/core/i18n/i18n.ts` (update **es + en** together)
- Rooms client: `frontend/src/app/core/room/`
- Room UI: `frontend/src/app/pages/room/`
- Games: `frontend/src/app/pages/neverHaveIEver/`, `impostor/`, `whoAmI/`
- Prod API URL: `frontend/src/environments/environment.prod.ts` → `https://between-u-and-me.onrender.com`

## Deploy

- **Netlify**: base `frontend`, publish `dist/between-u-and-me/browser`
- **Render**: live API `https://between-u-and-me.onrender.com` (`/api/health`). Docker root `backend`, Dockerfile `Dockerfile`, env `CORS_ORIGIN=https://between-u-and-me.netlify.app`
- Do **not** use the old `i-aint-ur-fan` or `between-u-and-me-api.onrender.com` hostnames

## Agent musts

1. **i18n**: ES and EN in the same change.
2. **Docs**: if code contradicts or outgrows README/docs, warn and get confirmation before editing docs.
3. Prefer small, reversible edits; no secrets; no push unless asked.
4. **Tone**: explain what you did at a high level (what/why). Not just “Hecho” + file bullets; more detail only if asked.
