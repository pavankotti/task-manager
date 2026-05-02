# Task Manager Workflow

A full-stack, role-based project management dashboard featuring an asynchronous bidding workflow, real-time polling, and an enterprise-grade UI. 

## The Architecture: The 2x2 Async Workflow
Unlike standard Kanban boards that rely on manual assignment, this platform utilizes a scalable, asynchronous proposal system:

1. **Open Tasks (The Pool):** Admins create tasks. Members view all open tasks and submit approach proposals (Bids).
2. **Staging (The Review Arena):** Admins review multiple proposals for a single task and accept the winning approach.
3. **Assigned (Execution):** The winning member executes the work and submits it with completion remarks.
4. **Completed (Hall of Fame):** Admins approve the final work, triggering a global broadcast to celebrate the team member.

## Tech Stack
* **Frontend:** React.js, Vite, Tailwind CSS, shadcn/ui design principles, @dnd-kit (Drag and Drop)
* **Backend:** Node.js, Express.js, JSON Web Tokens (RBAC)
* **Database:** PostgreSQL (Neon DB), Prisma ORM
* **Deployment:** Vercel (Frontend), Railway (Backend)

## Key Features
* **Role-Based Access Control (RBAC):** Distinct `ADMIN` and `MEMBER` views and permissions.
* **Smart Filtering & Sorting:** Tasks automatically sort by High/Medium/Low priority. Views are scoped so members only see relevant data.
* **Real-time State Syncing:** Automated 3-second background polling ensures users are always looking at live data without manual refreshes.
* **Data Persistence:** Drag-and-drop column reordering is instantly synced to the PostgreSQL database.

## Local Setup
1. Clone the repository.
2. Install dependencies in both folders using `npm install`.
3. Create a `.env` file in the backend with `DATABASE_URL` and `JWT_SECRET`.
4. Run `npx prisma db push` and `npx prisma generate` in the backend.
5. Run `node seed.js` to create the default Admin account.
6. Run `npm run dev` in the frontend and `node src/index.js` in the backend.