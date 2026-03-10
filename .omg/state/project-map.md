# Project Map - my-autonomous-app

## Module Responsibilities

| Module | Responsibility |
| :--- | :--- |
| `backend/` | Express server, IMAP/SMTP handling, simple auth. |
| `frontend/src/App.jsx` | Root state management for notes, tasks, theme, auth. |
| `frontend/src/components/Sidebar.jsx` | Note navigation, search, and sorting. |
| `frontend/src/components/Editor.jsx` | Markdown note editing with `react-markdown`. |
| `frontend/src/components/Planner.jsx` | Calendar view with `react-calendar`. |
| `frontend/src/components/Tasks.jsx` | To-do list management. |
| `frontend/src/components/Emails.jsx` | Email inbox interface. |
| `frontend/src/components/Auth.jsx` | Login and token entry. |

## Dependency Hotspots

- **`frontend/`**: `framer-motion` (UI), `lucide-react` & `font-awesome` (Icons), `react-calendar` (Planner).
- **`backend/`**: `imapflow` (IMAP), `nodemailer` (SMTP), `express`.

## Architecture Boundaries
- **API Boundary:** Frontend communicates with `/api` (proxied or hardcoded).
- **State Boundary:** Local storage used for `notebook_token`, `notebook_theme`, `notebook_accent`.
