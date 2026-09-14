# Line Manager Assignment Project Guide

## 1. Project overview
This project manages employee records and line manager assignment requests.

Main responsibilities:
- employee roster management
- line manager recommendation and assignment request creation
- assignment confirmation/rejection flows
- manager assignee tracking
- basic employee edit/delete support

 - The sidebar has a collapse/expand control. In collapsed mode it becomes an icon rail; navigation links retain tooltips through their `title` attributes.
 - A pending employee request can be cancelled from the employee action menu with `Undo request`. This calls `PATCH /api/assignments/:assignmentId/cancel` and does not affect confirmed assignments.
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
- client/src/components/ExcelPreviewModal.jsx
- client/src/components/LMAssignment.jsx
- client/src/components/Sidebar.jsx
- client/src/pages/Employees.jsx
- client/src/pages/AddEmployees.jsx
- client/src/pages/Requests.jsx
- client/src/pages/Settings.jsx
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
- server/services/aiRecommendationService.js
- server/routes/employeeRoutes.js
- server/routes/assignmentRoutes.js
- server/database/database.js
- server/middleware/excelUploadMiddleware.js

## 3. Core business rules

### Employee and manager logic
- The default eligible line manager designations are:
  - Software Architect
  - Lead Software Engineer
- Employee cannot be their own line manager.
- The default rule requires the line manager and employee to belong to the same department.

Assignment criteria are edited from the `Assignment settings` button in the UI and kept in `App` state. The default values are defined in `client/src/config/assignmentCriteria.js`; the active `maxManagedEmployees`, `allowedDesignations`, and `requireSameDepartment` values are sent with recommendation and assignment API calls.
- The manager capacity, eligible designations, and department rule are runtime criteria configured from the UI. The default maximum is 4, but it can be changed without editing backend code.
- The employee roster has a department filter with an `All departments` option. Filtering is client-side after the employee list is loaded and does not change assignment data.
- The employee roster displays 10 employees per page. Pagination applies after department filtering and resets to page 1 when the department changes.
- The `Recommendation method` setting lets the user choose deterministic criteria recommendations or Gemini AI recommendations.
- AI recommendations are generated on the backend using Google ADK (`@google/adk`) and `GEMINI_API_KEY` from the server environment. AI can choose only from candidates that already pass department, designation, and capacity constraints.
- AI returns one recommended LM and a short rationale. The user still confirms the recommendation, and confirmation follows the existing pending-request approval flow.
- Only active assignment records count toward employeeManaged.

### Assignment flow
- Create assignment request from employee to selected manager.
- From an employee card, `Request LM` creates a pending request without selecting an LM.
- LM selection happens on the Requests page, where the user can choose a criteria-based recommendation or a Gemini AI recommendation before approval.
- Pending assignments are opened from the compact `View requests` button in the top bar. The old right-side request panel has been removed, so the employee roster uses the full page width.
- URL routes are `/employees`, `/add-employee`, `/requests`, and `/settings`, navigated through the sidebar.
- The request modal shows a table with employee, department, requested LM, designation, and row-level Assign/Reject actions.
- The request modal also provides Assign All and Reject All actions. Bulk assignment failures include the employee name, LM name, and reason, while remaining requests stay available for individual action.
- A newly created request shows `Not selected yet` until a manager is chosen on the Requests page.
- Excel selection does not save immediately. The client parses the first worksheet with the `xlsx` package and opens `ExcelPreviewModal`.
- The first worksheet should contain `name`, `designation`, `experience`, `department`, and `skills` columns. An optional `id` column is supported. Skills may be comma-separated.
- Preview row `Add` saves one employee through `POST /api/employees`; `Add All` saves remaining rows transactionally through `POST /api/employees/bulk`; `Cancel` discards unsaved rows.
- The legacy multipart endpoint `POST /api/employees/import` remains available, but the current UI uses client-side preview before saving.
- Bulk actions use `PATCH /api/assignments/bulk-confirm` and `PATCH /api/assignments/bulk-reject`.
- AI recommendations use `POST /api/employees/:employeeId/ai-recommendation` with the active criteria in the request body.
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

### Employee card actions
Employee cards use a three-dot action menu instead of displaying all action buttons at once. The menu contains Add LM or View LM, Edit, Delete, and See Assignees for eligible managers.

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
The request table must provide a visible row-level Reject action and a Reject All action. These should call the assignment reject endpoints and immediately refresh the pending list.

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
7. client/src/components/ExcelPreviewModal.jsx
8. client/src/App.jsx
9. server/services/aiRecommendationService.js
10. server/database/database.js
11. client/src/styles/main.scss

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
- staged Excel preview must not write to the database until Add or Add All is clicked
- bulk assignment failures must identify the affected employee and manager
- AI recommendation mode requires `server/.env` with `GEMINI_API_KEY`; never commit the real key
- AI recommendations must remain limited to server-filtered eligible candidates
- keep request controls compact in the top bar; do not restore the removed right-side panel
- keep employee actions inside the three-dot menu
- no prompt-based editing should be used unless intentionally retained
- do not break employee skills parsing
- do not deploy the SQLite backend to Vercel as-is

This guide should be treated as the project’s working memory for future updates.

