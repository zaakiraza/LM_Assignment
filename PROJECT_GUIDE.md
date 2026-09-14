# Line Manager Assignment Project Guide

## 1. Project overview
This project manages employee records and line manager assignment requests.

Main responsibilities:
- employee roster management
- line manager recommendation and assignment request creation
- assignment confirmation/rejection flows
- manager assignee tracking
- basic employee edit/delete support

Frontend stack:
- React + Vite
- JavaScript/JSX
- Axios for API calls
- SCSS styling

Backend stack:
- Node.js + Express
- better-sqlite3 for local database usage
- CORS and JSON parsing

## 2. Important project structure

Frontend:
- client/src/App.jsx
- client/src/components/EmployeeList.jsx
- client/src/components/AssignLMModal.jsx
- client/src/components/AssignmentModal.jsx
- client/src/components/PendingAssignments.jsx
- client/src/components/ViewLMModal.jsx
- client/src/components/AddEmployeeModal.jsx
- client/src/components/EditEmployeeModal.jsx
- client/src/components/AssignmentCriteriaModal.jsx
- client/src/services/employeeService.js
- client/src/services/assignmentService.js
- client/src/styles/main.scss

Backend:
- server/app.js
- server/server.js
- server/controllers/employeeController.js
- server/controllers/assignmentController.js
- server/services/employeeService.js
- server/services/assignmentService.js
- server/routes/employeeRoutes.js
- server/routes/assignmentRoutes.js
- server/database/database.js
- server/middleware/excelUploadMiddleware.js

## 3. Core business rules

### Employee and manager logic
- A line manager must be one of:
  - Software Architect
  - Lead Software Engineer
- Employee cannot be their own line manager.
- Line manager must belong to the same department as the employee.

Assignment criteria are edited from the `Assignment settings` button in the UI and kept in `App` state. The default values are defined in `client/src/config/assignmentCriteria.js`; the active `maxManagedEmployees`, `allowedDesignations`, and `requireSameDepartment` values are sent with recommendation and assignment API calls.
- A manager cannot exceed 4 assigned employees.
- The manager capacity, eligible designations, and department rule are runtime criteria configured from the UI.
- Only active assignment records count toward employeeManaged.

### Assignment flow
- Create assignment request from employee to selected manager.
- Pending assignments are opened from the LM Assignment panel in a table modal.
- Excel imports use `POST /api/employees/import` with a multipart field named `file`. The first worksheet should contain `name`, `designation`, `experience`, `department`, and `skills` columns. Skills may be comma-separated.
- The UI previews Excel rows before saving. Row `Add` uses the normal employee create API, `Add All` uses `POST /api/employees/bulk`, and `Cancel` discards unsaved preview rows.
- Bulk actions use `PATCH /api/assignments/bulk-confirm` and `PATCH /api/assignments/bulk-reject`.
- Rejecting a request removes it from pending state.
- Confirming an assignment updates the employee assignment and increments the manager count.
- Changing a manager should decrease the old manager count and increase the new one.

### Assignee count rule
The “See Assignees” functionality is for actual line managers only.

It must show the employees assigned to the selected manager, not the current employee.

Rule:
- Employee card for manager -> fetch assignees for that manager id
- Employee card for non-manager -> no manager assignee button shown

## 4. Known important behavior

### Pending requests refresh
When a request is created, confirmed, rejected, or updated, the pending list should reload immediately.
Do not rely on a full page refresh.

### Employee edit flow
Employee edit is implemented through a modal, not browser prompts.

### Employee delete behavior
When deleting an employee:
- remove active assignment for that employee
- reduce the relevant manager employeeManaged count
- delete assignment rows where the employee was the manager or assigned employee
- remove the employee record itself

### Skills parsing
Employee skills may come in several formats:
- array
- JSON string
- comma-separated string

Frontend code must safely parse these without crashing.

## 5. Important bug/logic notes

### Assignee count bug
A previous bug caused the assignee count to be read from the wrong entity. The correct logic is:
- fetch assigned employees using the selected manager's employee id
- not the current employee's assignment or a guessed value

### Modal behavior
The Add LM modal should not include a See Assignees button.
The See Assignees button is meant for the manager-focused UI, not the assignment request modal.

### Request rejection
There must be a visible reject action in the pending LM assignment card.
This should call the assignment reject endpoint and immediately refresh the pending list.

## 6. Deployment reality
Important: the backend is currently built around local SQLite and is not fully Vercel-ready.

Current backend stack:
- better-sqlite3 is used in the project
- local file database persists in server/database/line-manager.db

This is good for local development, but not ideal for Vercel serverless hosting.

Recommended production setup:
- frontend: Vercel
- backend: Render / Railway / Fly.io / another Node host
- database: PostgreSQL or another managed service

Do not deploy the current SQLite-based backend directly to Vercel serverless as-is.

## 7. Critical files to read before editing
If an AI or developer is updating this project, these are the most important files to review first:

1. server/services/assignmentService.js
2. server/services/employeeService.js
3. client/src/components/EmployeeList.jsx
4. client/src/components/PendingAssignments.jsx
5. client/src/components/AssignLMModal.jsx
6. client/src/components/AssignmentModal.jsx
7. server/database/database.js
8. client/src/styles/main.scss

## 8. Local developer commands
Frontend:
- cd client
- npm install
- npm run dev

Backend:
- cd server
- npm install
- node server.js

## 9. Final reminder
Before making changes, check:
- assignment state and manager counts
- line manager capacity rules
- pending request refresh behavior
- no prompt-based editing should be used unless intentionally retained
- do not break employee skills parsing
- do not deploy the SQLite backend to Vercel as-is

This guide should be treated as the project’s working memory for future updates.
