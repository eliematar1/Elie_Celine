# Project Proposal — IT Help Desk & Ticketing Management System

**Document:** Week 1 deliverable (aligned with official internship specification)  
**Team:** Celine Mortada & Elie Matar  
**Date:** May 2026  
**Repository:** https://github.com/eliematar1/Elie_Celine

---

## 1. Executive Summary

We will build an enterprise-style **IT Help Desk & Ticketing Management System** that lets employees submit support requests and lets IT agents and administrators manage the full ticket lifecycle through a centralized web dashboard. The project follows the official 8-week internship plan: planning and design in Week 1, then incremental delivery of auth, tickets, workflow, notifications, reporting, AI features, testing, and deployment.

---

## 2. Problem & Goals (from specification)

**Problem:** Technical support is fragmented across email and informal channels, with no prioritization, assignment tracking, or reporting.

**Goals by end of internship:**

- Full stack web application with RESTful APIs
- Responsive React UI with role-based access
- SQL Server relational database with audit trails
- Dashboards, exports (PDF/Excel), and AI-assisted ticket handling
- GitHub collaboration and deployable staging/demo environment

---

## 3. Selected Technology Stack

| Layer | Our choice | Spec alternative |
|-------|------------|------------------|
| Frontend | **React (JavaScript)**, Tailwind CSS, Shadcn UI | Next.js optional |
| Backend | **ASP.NET Core Web API (C#)** | Node Express optional |
| Database | **SQL Server Express** | PostgreSQL optional |
| Auth | **JWT** + **ASP.NET Identity** | Per spec |
| IDE / tools | VS Code, Visual Studio 2022, SSMS, Postman | — |
| Deployment (Week 8) | IIS or Azure App Service | Docker optional |
| AI (Week 6+) | OpenAI or Azure OpenAI API | Ollama optional local |

---

## 4. Users & Roles

| Role | Permissions (planned) |
|------|------------------------|
| **Admin** | Users, roles, categories, settings, all tickets, activity logs |
| **IT Support Agent** | Assigned queue, status updates, internal notes, resolve tickets |
| **Employee** | Create/view own tickets, comments, attachments, cancel open tickets |
| **Manager** | Team visibility, dashboards, reports (read-focused) |

---

## 5. Module Plan (mapped to specification §3)

| Module | Spec features | Week | Status |
|--------|---------------|------|--------|
| Auth & users | Login, register, reset password, profile, RBAC, activity log | 2 | Planned |
| Ticket management | CRUD, categories, priorities, statuses, ref #, search/filter | 3 | Planned |
| Assignment & workflow | Assign, auto-assign, escalate, reassign, internal notes, audit | 4 | Planned |
| Notifications | In-app, email, comments, @mentions | 5 | Planned |
| Dashboard & reporting | Widgets, charts, monthly/SLA reports, PDF/Excel export | 5–6 | Planned |
| File attachments | Upload/download, validation, secure storage | 5 | Planned |
| Admin panel | Users, roles, categories, settings, monitoring | 2, 5, 8 | Planned |
| Knowledge base | FAQ, articles, search, approval | Optional | Deferred |
| AI features | Categorization, priority, suggested replies, chat assistant | 6 | Planned |

### Ticket domain (per spec)

- **Categories:** Hardware, Software, Network, Email, Access Request, Other  
- **Priorities:** Low, Medium, High, Critical  
- **Statuses:** Open → In Progress → Pending → Resolved → Closed  

---

## 6. UI/UX Plan (spec §4)

**Required pages (wireframed in `wireframes/`):**

Login/Register · Dashboard · Ticket List · Ticket Details · Create Ticket · Reports · Notifications · User Profile · Admin Settings

**Design approach:**

- SaaS-style layout with **sidebar navigation**
- Responsive / mobile-friendly CSS
- Loading and error states in React (Week 2+)
- Dark/light mode — optional bonus

---

## 7. Database Design (spec database requirements)

**Required tables (spec):** Users, Roles, Tickets, TicketComments, TicketAttachments, Notifications, Categories, Priorities, Statuses, ActivityLogs

**Our implementation:** All of the above via `AspNetUsers` / `AspNetRoles` + domain tables in `database/schema.sql`, plus:

- `TicketAssignments` — assignment history (spec §3c)
- `TicketStatusHistory` — status audit trail (spec §3c)
- `PasswordResetTokens`, `SystemSettings`, `KnowledgeBaseArticles` (optional module)

**Week 1 artifacts:** ERD (`docs/04-database-erd.md`, `diagrams/erd.drawio`), `schema.sql`, `seed-data.sql`

---

## 8. Week 1 Completed Work (25 hrs target)

| Task | Output |
|------|--------|
| Requirement gathering | `docs/01-requirements-analysis.md` |
| System workflows | `docs/02-system-workflows.md` |
| Application architecture | `docs/03-application-architecture.md` |
| UI wireframes | `wireframes/*.html` |
| ERD + SQL schema | `docs/04-database-erd.md`, `database/*.sql` |
| GitHub repository | Structured repo + README |

---

## 9. Eight-Week Timeline (from specification §5)

| Week | Deliverable (spec) | Our plan |
|------|-------------------|----------|
| 1 | Wireframes, ERD, proposal | ✅ This repo |
| 2 | Login/Register, JWT | ASP.NET Identity + React auth |
| 3 | Ticket module functional | Ticket CRUD API + UI |
| 4 | Workflow implementation | Assignment, comments, statuses |
| 5 | Dashboard & notifications | SignalR optional; uploads |
| 6 | Reporting & AI prototype | Charts, export, OpenAI integration |
| 7 | Stable staging | Testing & responsive polish |
| 8 | Final deployment & demo | IIS/Azure, README, API docs, presentation |

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Scope creep | Follow weekly spec; defer Knowledge Base & bonus features |
| Auth complexity | Use ASP.NET Identity templates Week 2 |
| AI API cost | Use mock responses in dev; keys in env vars only |
| Team coordination | Git branches, PRs, weekly sync |

---

## 11. Final Deliverables Checklist (spec §6 — end of internship)

- [ ] Full source code  
- [ ] GitHub repository  
- [ ] README + setup instructions  
- [ ] Database ERD + SQL scripts  
- [ ] API documentation (Swagger)  
- [ ] Screenshots / demo video  
- [ ] Deployment link  
- [ ] Final presentation  

---

## 12. References

- Official project PDF: *IT Help Desk & Ticketing Management System — Full Stack Web Development Internship Project* (12 pages)
- Environment checklist: React, ASP.NET Core, SQL Server Express, Git/GitHub
- Internal: `docs/WEEK1-SUBMISSION.md`

---

**Approval / review**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Intern | Celine Mortada | | |
| Intern | Elie Matar | | |
| Supervisor | | | |
