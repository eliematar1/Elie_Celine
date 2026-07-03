# IT Help Desk & Ticketing Management System

**Full Stack — React + ASP.NET Core + SQL Server + JWT**  
**Team:** Celine Mortada & Elie Matar · https://github.com/eliematar1/Elie_Celine

## Quick start

```powershell
cd api-dev-server && npm start          # API (port 5000)
cd client\it-helpdesk-web && npm run dev  # React (port 5173)
```

**Login:** `admin@ithelpdesk.local` / `Admin@123` → http://localhost:5173

**Full documentation:** [docs/PROJECT-COMPLETE.md](docs/PROJECT-COMPLETE.md) · [Submission checklist](docs/SUBMISSION-CHECKLIST.md)

---

## Project Overview

A modern web-based IT Help Desk system for employees to submit support requests and for IT agents and administrators to manage, prioritize, assign, and resolve tickets through a centralized dashboard.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (JavaScript), Tailwind CSS, Shadcn UI |
| Backend | ASP.NET Core Web API (C#) |
| Database | SQL Server Express |
| Auth | JWT + ASP.NET Identity |
| Tools | VS Code, Visual Studio 2022, SSMS, Postman, Git/GitHub |

## User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full system access (includes creating tickets) |
| IT Support Agent | Manage and resolve tickets (no ticket creation) |
| Employee | Create, edit, and track own tickets |
| Manager | Monitor team tickets, assign agents, and view reports |

---

## Week 2 Deliverables

Login/Register, JWT auth, RBAC — see [docs/WEEK2-SUBMISSION.md](docs/WEEK2-SUBMISSION.md) and [docs/WEEK2-SETUP.md](docs/WEEK2-SETUP.md).

| Item | Path |
|------|------|
| ASP.NET Core API | `src/ITHelpDesk.API/` |
| React app | `client/it-helpdesk-web/` |
| Run script | `scripts/run-now.ps1` |

## Week 1 Deliverables

Aligned with the official **IT Help Desk.pdf** internship specification (Week 1: wireframes, ERD, project proposal).

| Item | Path |
|------|------|
| **Project proposal** | [docs/00-project-proposal.md](docs/00-project-proposal.md) |
| Week 1 submission checklist | [docs/WEEK1-SUBMISSION.md](docs/WEEK1-SUBMISSION.md) |
| Requirements analysis | [docs/01-requirements-analysis.md](docs/01-requirements-analysis.md) |
| System workflows | [docs/02-system-workflows.md](docs/02-system-workflows.md) |
| Application architecture | [docs/03-application-architecture.md](docs/03-application-architecture.md) |
| ERD documentation | [docs/04-database-erd.md](docs/04-database-erd.md) |
| SQL schema | [database/schema.sql](database/schema.sql) |
| Seed data | [database/seed-data.sql](database/seed-data.sql) |
| Draw.io ERD | [diagrams/erd.drawio](diagrams/erd.drawio) |
| UI wireframes | [wireframes/index.html](wireframes/index.html) |
| Submission checklist | [docs/WEEK1-SUBMISSION.md](docs/WEEK1-SUBMISSION.md) |

---

## Repository layout

| Folder | Purpose |
|--------|---------|
| `client/it-helpdesk-web/` | **Production React app** (what users see when published) |
| `src/ITHelpDesk.API/` | ASP.NET Core API |
| `docs/`, `wireframes/`, `diagrams/`, `database/` | **Internship documentation only** — submit to instructor, not part of the live site |

## Quick Start — Week 2 (Auth + API + React)

**Requires:** .NET 8 SDK + Node.js

```powershell
# Terminal 1 — API
cd src\ITHelpDesk.API
dotnet restore
dotnet run

# Terminal 2 — React
cd client\it-helpdesk-web
npm install
npm run dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | React app (login, register, dashboard) |
| http://localhost:5000/swagger | API docs |

**Demo login:** `admin@ithelpdesk.local` / `Admin@123`

Full guide: [docs/WEEK2-SETUP.md](docs/WEEK2-SETUP.md)

---

## Quick Start — Run locally (Week 1 preview)

```powershell
cd Elie_Celine
npm start
# or: node server.js
# or: .\run.ps1
```

Then open **http://localhost:8080** (project hub with links to wireframes, ERD, SQL).

> **Note:** Week 1 is wireframes + database design. ASP.NET API + React app require .NET 8 SDK (Week 2).

## Quick Start — Wireframes (file only)

```
wireframes/index.html
```

## Quick Start — Database (SSMS)

1. Execute `database/schema.sql` to create the `ITHelpDesk` database and tables.
2. Execute `database/seed-data.sql` for categories, priorities, statuses, and roles.

---

## Repository Structure

```
Elie_Celine/
├── docs/           # Requirements, workflows, architecture, ERD
├── database/       # SQL schema and seed scripts
├── diagrams/       # Draw.io ERD and workflow files
├── wireframes/     # HTML low-fidelity UI mockups
└── README.md
```

---

## 8-Week Roadmap (Summary)

| Week | Focus |
|------|-------|
| 1 | Planning, wireframes, ERD ✅ |
| 2 | Auth + JWT + roles |
| 3 | Ticket CRUD |
| 4 | Assignment workflow + comments |
| 5 | Notifications, uploads, dashboard |
| 6 | Reports, exports, AI features |
| 7 | Testing & UI polish |
| 8 | Deployment & documentation |

---

## Learning Resources

- [Database Design Tutorial](https://www.youtube.com/results?search_query=database+design+tutorial)
- [Figma UI Crash Course](https://www.youtube.com/results?search_query=figma+ui+design+crash+course)
- [SQL Database Design Basics](https://www.w3schools.com/sql/)

## AI Tools Used in Planning

- ChatGPT — Database and architecture ideas
- Cursor AI — Documentation and wireframe scaffolding

---

## License

Academic / internship project — Celine Mortada & Elie Matar.
