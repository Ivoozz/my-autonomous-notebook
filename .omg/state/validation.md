# Validation Protocol - my-autonomous-app

## Validation Commands

### Frontend
- **Build:** `npm run build` (within `frontend/`)
- **Lint:** `npm run lint` (within `frontend/`)
- **Dev:** `npm run dev` (within `frontend/`)

### Backend
- **Start:** `npm start` (within `backend/`)
- **Test:** `npm test` (placeholder only, currently errors).

## Constraints & Requirements
- **Node.js:** v18+ (common for current Express/Vite projects).
- **Environment:** Requires `.env` for `AUTH_PASSWORD`, `VALID_TOKEN`, and IMAP/SMTP credentials.
- **Styling:** Vanilla CSS (`App.css`, `index.css`).

## Acceptance Gate Checklist
- [ ] Frontend builds without errors.
- [ ] Backend starts and listens on `PORT`.
- [ ] No ESLint errors in `frontend/`.
- [ ] Auth middleware correctly validates `VALID_TOKEN`.
