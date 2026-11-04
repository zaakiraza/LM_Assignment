# Line Manager Assignment Project Guide

## 1. Project overview
This project manages employee records and line manager assignment requests with Google authentication and position-based access.

Main responsibilities:
- Google Continue-with-Google sign-in on the Employee model
- Unverified Google sign-ins wait until HR verifies and completes profile details
- employee roster management (HR)
- line manager recommendation and assignment request flows (HR)
- employee self-profile
- LM assignee visibility for Software Architect and Lead Software Engineer
- HR workforce chat assistant

Frontend stack:
- React + Vite
- JavaScript/JSX
- Axios for API calls
- `@react-oauth/google`
- SCSS styling

Backend stack:
- Node.js + Express
- MongoDB via Mongoose
- Google ID token verification + JWT
- CORS and JSON parsing
- optional Gemini AI via `@google/adk`

## 2. Auth and access model
- Single `Employee` model holds both Google identity and workforce profile.
- Fields: `email`, `googleId`, `avatar`, `isVerified`, plus position/department/skills/etc.
- Flow:
  1. Seed creates a verified HR employee for `HR_SEED_EMAIL`
  2. Google login finds employee by email or creates an **unverified** stub
  3. Unverified employees only see the awaiting-verification page
  4. HR opens **Verify Employees**, sets position/experience/department/skills, sets `isVerified: true`
  5. On next login, access follows `position`
- Access by position (verified only):
  - `HR` → employees, import, requests, settings, verify employees, HR chat
  - `Software Architect` / `Lead Software Engineer` → profile + assignees
  - other positions → profile only
- Only Architect and Lead may be line managers. Non-LM positions return empty assignee lists.

## 3. Important project structure

Frontend:
- client/src/App.jsx
- client/src/context/AuthContext.jsx
- client/src/pages/Login.jsx
- client/src/pages/Profile.jsx
- client/src/pages/Assignees.jsx
- client/src/pages/PendingUsers.jsx
- client/src/pages/Chat.jsx
- client/src/pages/Employees.jsx
- client/src/pages/AddEmployees.jsx
- client/src/pages/Requests.jsx
- client/src/pages/Settings.jsx
- client/src/services/*.js
- client/src/config/positions.js
- client/src/config/assignmentCriteria.js

Backend:
- server/server.js
- server/app.js
- server/database/database.js
- server/models/*.js
- server/middleware/authMiddleware.js
- server/controllers/*.js
- server/services/*.js
- server/routes/*.js
- server/seed.js

## 4. Core business rules
- Positions: HR, Software Architect, Lead Software Engineer, Senior Software Engineer, Software Engineer.
- Default eligible LM positions: Software Architect, Lead Software Engineer.
- Recommendation prefers a higher LM position than the employee. Same position only when the LM has more experience.
- Employee cannot be their own line manager.
- Same-department rule is configurable (default on).
- Assignment criteria persist in Mongo `AppSettings`.
- AI recommendations choose only from server-filtered eligible candidates.
- Only active assignment records count toward `employeeManaged`.

### Assignment flow
- HR creates pending LM requests from the employee roster (`lineManagerId` may be null).
- Requests page supports criteria or Gemini AI recommendation before confirm.
- Bulk confirm/reject supported; failures identify the affected employee/manager.
- Excel import uses client-side preview; columns: `name`, `position` (or `designation`), `experience`, `department`, `skills`, optional `email`.

## 5. Environment
Server (`server/.env`):
- `MONGODB_URI`
- `GOOGLE_CLIENT_ID`
- `JWT_SECRET`
- `HR_SEED_EMAIL`
- `HR_SEED_NAME`
- `CLIENT_URL`
- `GEMINI_API_KEY` (optional)
- `PORT`

Client (`client/.env`):
- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID` (same OAuth client ID as server)

Google Cloud Console: create an OAuth Web client, add authorized JavaScript origins for the Vite/dev and Docker URLs.

## 6. Local developer commands
Backend:
- cd server
- npm install
- copy `.env.example` → `.env` and fill values
- npm run seed
- npm start

Frontend:
- cd client
- npm install
- copy `.env.example` → `.env` and fill `VITE_GOOGLE_CLIENT_ID`
- npm run dev

## 7. Run with Docker
- Set `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `HR_SEED_EMAIL`, and optionally `GEMINI_API_KEY` in `server/.env`
- Set `VITE_GOOGLE_CLIENT_ID` in the shell or a root `.env` for Compose build args
- `docker compose up --build`
- open http://localhost:8080
- run seed against the Mongo service once API is up (`docker compose exec api npm run seed`)

Mongo data persists in the `mongo_data` volume.

## 8. Deployment notes
- Do not deploy SQLite; the app uses MongoDB.
- Frontend can stay on a static host; API needs a long-lived Node host with MongoDB Atlas or equivalent.
- Existing SQLite `line-manager.db` is not migrated automatically — re-seed Mongo.

## 9. Critical files before editing
1. server/services/assignmentService.js
2. server/services/employeeService.js
3. server/middleware/authMiddleware.js
4. server/services/chatService.js
5. client/src/context/AuthContext.jsx
6. client/src/App.jsx
7. client/src/components/EmployeeList.jsx
8. server/seed.js

## 10. Final reminder
- Never commit real Google or Gemini secrets
- Enforce auth on the server, not only the client nav
- Keep LM eligibility limited to Architect + Lead
- Pending Google users must be linked by HR before app access
