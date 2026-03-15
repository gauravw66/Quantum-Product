# Quantum Cloud Runner --- Frontend Quickstart Guide

## Stack

**Framework** - React

**Styling** - TailwindCSS - shadcn/ui component library

**State Management** - TanStack React Query

**Forms** - React Hook Form + Zod

**Charts** - Recharts

**Code Editor** - Monaco Editor

**Icons** - Lucide Icons

**Backend** - Node.js API running on http://localhost:5000

------------------------------------------------------------------------

# UI Design Principles

The interface should feel similar to:

-   IBM Quantum dashboard
-   Vercel developer dashboard

Principles:

-   Minimal design
-   Dark mode first
-   Developer-focused UI
-   Data-heavy layout

### Color Theme

  Element      Color
  ------------ ---------
  Background   #0F172A
  Cards        #1E293B
  Accent       #6366F1
  Success      #10B981
  Error        #EF4444

------------------------------------------------------------------------

# Project Structure

    frontend/

    src/
      app/
        layout.tsx
        page.tsx

        login/
        signup/
        dashboard/
        modules/
        jobs/
        ai/
        settings/

      components/
        ui/
        layout/
        charts/
        quantum/

      hooks/
        useAuth.ts
        useJobs.ts
        useModules.ts

      lib/
        api.ts

      types/
        api.ts

------------------------------------------------------------------------

# Layout System

Use a persistent sidebar layout.

    +------------------------------------+
    | Sidebar |                          |
    |         |        Content           |
    |         |                          |
    |         |                          |
    +------------------------------------+

### Sidebar Menu

-   Dashboard
-   Modules
-   AI Builder
-   Jobs
-   Settings

------------------------------------------------------------------------

# Authentication Pages

## Login Page

Fields:

-   Email
-   Password

API:

POST /auth/login

Flow:

User login → Receive JWT → Store token → Redirect to /dashboard

------------------------------------------------------------------------

## Signup Page

API:

POST /auth/signup

------------------------------------------------------------------------

# Dashboard Page

Route:

/dashboard

### Components

**Stats Cards**

-   Total Jobs
-   Successful Jobs
-   Failed Jobs
-   Connected Backend

**Recent Jobs Table**

| Job \| Backend \| Status \| Time \|

API:

GET /jobs

------------------------------------------------------------------------

# Modules Page

Route:

/modules

Displays prebuilt circuits.

Example:

Bell State\
Create entanglement circuit

Buttons:

Run Module

API:

GET /modules

Run module:

POST /jobs/run

Example body:

    {
     moduleId: "...",
     backend: "ibmq_qasm_simulator"
    }

Backend dropdown:

GET /quantum/backends

------------------------------------------------------------------------

# AI Builder Page

Route:

/ai

Layout:

Prompt input

Example:

Create a 3 qubit GHZ state

Button:

Generate Code

Generated code section using Monaco Editor.

Run button:

Run on Simulator

API:

POST /ai/generate-circuit

Response:

    {
     code: "...qiskit code..."
    }

------------------------------------------------------------------------

# Jobs Page

Route:

/jobs

Table:

| Job \| Backend \| Status \| Created \|

API:

GET /jobs

------------------------------------------------------------------------

# Job Details Page

Route:

/jobs/:id

Sections:

-   Job metadata
-   Circuit visualization
-   Result histogram
-   Raw JSON output

Example metadata:

Backend: ibmq_qasm_simulator\
Shots: 1024\
Execution time: 2.3s

Charts built using Recharts.

------------------------------------------------------------------------

# Settings Page

Route:

/settings

Purpose:

Connect IBM Quantum account.

UI:

IBM Quantum API Key field

Connect button

API:

POST /quantum/connect

------------------------------------------------------------------------

# API Client

Create centralized API client.

File:

src/lib/api.ts

Example:

``` javascript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000"
});

export default api;
```

------------------------------------------------------------------------

# Auth Hook

src/hooks/useAuth.ts

Example:

``` javascript
import { useState } from "react";
import api from "../lib/api";

export function useAuth() {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
  };

  return { user, login };
}
```

------------------------------------------------------------------------

# Reusable Components

Recommended components:

-   Button
-   Card
-   Table
-   CodeEditor
-   Sidebar
-   Navbar
-   JobStatusBadge
-   ModuleCard

Example:

    <JobStatusBadge status="completed" />

Status colors:

  Status      Color
  ----------- --------
  running     yellow
  completed   green
  failed      red

------------------------------------------------------------------------

# Circuit Visualization

Options:

-   quantum-circuit-js
-   Qiskit circuit diagram rendering

Example:

    q0 —H—■—
           |
    q1 ——X——

------------------------------------------------------------------------

# Charts for Results

Example histogram data:

  State   Probability
  ------- -------------
  00      0.49
  11      0.51

Library:

Recharts

------------------------------------------------------------------------

# Loading States

Show loading UI during job execution.

Example:

Running quantum job...

Spinner component.

------------------------------------------------------------------------

# Error Handling

Examples:

-   Invalid IBM API Key
-   Failed to connect IBM Quantum
-   Job execution failed

Show toast or alert messages.

------------------------------------------------------------------------

# Dark Mode

Default theme:

dark

Tailwind config:

    darkMode: "class"

------------------------------------------------------------------------

# MVP UI Pages

Required pages:

-   Login
-   Signup
-   Dashboard
-   Modules
-   AI Builder
-   Jobs
-   Job Details
-   Settings

Total: 8 pages

------------------------------------------------------------------------

# Development Setup

Create project:

    npx create-next-app quantum-ui

Install dependencies:

    npm install axios @tanstack/react-query tailwindcss lucide-react recharts

Run dev server:

    npm run dev

Frontend:

http://localhost:3000

Backend:

http://localhost:5000

------------------------------------------------------------------------

# Future UI Improvements

Possible future features:

-   Drag-and-drop quantum circuit builder
-   Hardware backend selector
-   Cost estimation for quantum runs
-   Real-time job status updates
-   Team collaboration
