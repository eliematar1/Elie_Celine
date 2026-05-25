# Requirements Analysis — IT Help Desk & Ticketing System

**Team:** Celine Mortada & Elie Matar  
**Week:** 1 — Requirement Analysis & Planning  
**Stack:** React (JS) · ASP.NET Core Web API · SQL Server Express · JWT

---

## 1. Problem Statement

Organizations need a centralized system for employees to submit IT support requests and for IT staff to track, assign, prioritize, and resolve issues efficiently. Spreadsheets and email threads do not scale and lack audit trails, reporting, or role-based access.

## 2. Project Scope

### In Scope (MVP — 8 Weeks)

| Area | Features |
|------|----------|
| **Auth** | Register, login, JWT, forgot/reset password, profile, RBAC (Admin, IT Agent, Employee, Manager) |
| **Tickets** | CRUD, categories, priorities, statuses, reference numbers, search/filter, history |
| **Workflow** | Assign/reassign, escalation, internal notes, assignment audit trail |
| **Communication** | Comments, in-app notifications, email alerts (basic) |
| **Dashboard** | Widgets, charts, agent performance |
| **Reports** | Monthly stats, resolution time, export PDF/Excel |
| **Attachments** | Upload/download with validation |
| **Admin** | Users, roles, categories, settings, activity logs |
| **AI (Week 6+)** | Category suggestion, priority suggestion, agent reply hints, employee chat assistant |

### Out of Scope (Initial Release — Optional Bonus)

- Real-time chat (SignalR) — planned as optional enhancement
- SLA timers, Teams integration, email-to-ticket, mobile app, CI/CD
- Full Knowledge Base module — optional advanced module

## 3. Stakeholders & User Roles

| Role | Primary Goals |
|------|----------------|
| **Employee** | Submit tickets, track status, attach files, receive updates |
| **IT Support Agent** | View assigned queue, update status, comment, resolve tickets |
| **Manager** | Monitor team workload, view reports, no ticket assignment unless granted |
| **Admin** | Full user/role/system configuration, all tickets, audit logs |

## 4. Functional Requirements Summary

### Authentication & Users (FR-AUTH)

- FR-AUTH-01: Users authenticate with email/username and password; API returns JWT.
- FR-AUTH-02: Passwords hashed (ASP.NET Identity / PBKDF2).
- FR-AUTH-03: Password reset via secure token with expiry.
- FR-AUTH-04: Profile update (name, phone, avatar optional).
- FR-AUTH-05: API routes enforce role claims on JWT.

### Tickets (FR-TKT)

- FR-TKT-01: Employee creates ticket with title, description, category, priority (default Medium).
- FR-TKT-02: System generates unique reference (e.g. `TKT-2026-00042`).
- FR-TKT-03: Status lifecycle: Open → In Progress → Pending → Resolved → Closed.
- FR-TKT-04: Search by reference, title, status, category, date range.
- FR-TKT-05: Ticket history records every status/assignment change.

### Assignment & Workflow (FR-WF)

- FR-WF-01: Admin/Agent assigns ticket to agent; history stored.
- FR-WF-02: Optional auto-assignment (round-robin or least-loaded).
- FR-WF-03: Escalation increases priority or reassigns to senior agent.
- FR-WF-04: Internal notes visible only to IT/Admin roles.

### Notifications (FR-NOT)

- FR-NOT-01: In-app notification on assignment, status change, new comment.
- FR-NOT-02: Email notification for critical events (configurable).

### Dashboard & Reports (FR-RPT)

- FR-RPT-01: Role-specific dashboard widgets.
- FR-RPT-02: Export reports to PDF and Excel.

### Admin (FR-ADM)

- FR-ADM-01: CRUD users and assign roles.
- FR-ADM-02: Manage categories, priorities (lookup tables).
- FR-ADM-03: View activity logs.

## 5. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Responsive UI (mobile, tablet, desktop) |
| NFR-02 | API response &lt; 500ms for list endpoints under normal load |
| NFR-03 | HTTPS in production; JWT expiry & refresh strategy |
| NFR-04 | File upload max 10 MB; allowed types: images, PDF, txt, log |
| NFR-05 | SQL Server referential integrity; soft-delete users optional |
| NFR-06 | Activity logging for security-sensitive actions |

## 6. Assumptions & Constraints

- Single organization (multi-tenant not required for internship).
- English UI only in MVP.
- Deployment target: IIS or Azure App Service; database on SQL Server Express locally.
- AI features use OpenAI or Azure OpenAI API with keys in environment variables.

## 7. Success Criteria (Week 8)

- All four roles can complete primary workflows end-to-end.
- GitHub repository with README, schema scripts, API docs.
- Deployed staging/demo URL or local demo video.
- Week 1 deliverables: workflows, wireframes, ERD, schema SQL, repo link.
