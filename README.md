# Task Manager Workflow

A full-stack, role-based project management dashboard featuring an asynchronous bidding workflow, real-time updates, and a premium enterprise-grade UI, built entirely on Next.js App Router.

---

## The Architecture: The 2x2 Async Workflow
Unlike standard Kanban boards that rely on manual assignment, this platform utilizes a scalable, asynchronous proposal system:

1. **Open Tasks (The Pool):** Admins create tasks. Members view open tasks matching their expertise and submit approach proposals (Bids).
2. **Staging (The Review Arena):** Admins review multiple proposals for a single task and accept the winning approach.
3. **Assigned (Execution):** The winning member executes the work and submits it with completion remarks.
4. **Completed (Hall of Fame):** Admins approve the final work, triggering a global broadcast banner to celebrate the team member.

---

## Tech Stack
* **Framework:** Next.js (App Router, Unified Full-Stack Layout)
* **Frontend:** React, Tailwind CSS (v4), Lucide Icons, `@dnd-kit` (Drag and Drop)
* **Database & ORM:** PostgreSQL (Neon DB), Prisma ORM
* **Authentication:** JSON Web Tokens (JWT) & bcrypt
* **Deployment:** Vercel (Unified Serverless Hosting)

---

## Key Features
* **Role-Based Access Control (RBAC):** Distinct `ADMIN` and `MEMBER` views and endpoint permissions.
* **Smart Drag-and-Drop Order Persistence:** Drag-and-drop column reordering is instantly synced to the database. Sorts primarily by custom manual order, falling back to priority weights.
* **Relational Proposal Model:** Staging proposals are tracked inside a dedicated database table (`Proposal`), eliminating polymorphic JSON data parsing.
* **Real-time State Syncing:** Background polling syncs task states and notifications across active client tabs.
* **Broadcast Banner:** Real-time completed task notifications with dismissible client states.

---

## Local Setup

### 1. Clone & Install Dependencies
Install all package dependencies in the project root:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and add your PostgreSQL database credentials and JWT secret:
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
JWT_SECRET="your-jwt-signing-secret"
```

### 3. Sync Database Schema
Push the Prisma schema to your PostgreSQL database instance:
```bash
npx prisma db push
```

### 4. Seed the Database
Seed the database with a default Admin account and tasks:
```bash
node prisma/seed.js
```
*Creates default admin credentials:*
* **Email:** `admin@gmail.com`
* **Password:** `admin1234`

### 5. Start Development Server
Start the unified Next.js development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---