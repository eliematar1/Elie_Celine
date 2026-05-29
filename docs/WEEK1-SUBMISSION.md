# Week 1 Submission Checklist

**Project:** IT Help Desk & Ticketing Management System  
**Team:** Celine Mortada & Elie Matar  
**Repository:** https://github.com/eliematar1/Elie_Celine  
**Official spec:** *IT Help Desk.pdf* (12-page internship project document)

---

## PDF Week 1 Requirements → Our Repo

| PDF requirement (§5 Week 1) | Deliverable | Location |
|----------------------------|-------------|----------|
| Requirement analysis | Requirements doc | `docs/01-requirements-analysis.md` |
| Project planning | **Project proposal** | `docs/00-project-proposal.md` |
| UI wireframes | 9 pages + index | `wireframes/index.html` |
| ERD / database schema | ERD + SQL | `docs/04-database-erd.md`, `diagrams/erd.drawio`, `database/schema.sql` |
| Seed/sample data | Seed script | `database/seed-data.sql` |
| Wireframes, ERD, project proposal | All three | ✅ See table below |

---

## Deliverables Status

| Deliverable | Location | Status |
|-------------|----------|--------|
| **Project proposal** | `docs/00-project-proposal.md` | ✅ Complete |
| Workflow diagrams | `docs/02-system-workflows.md` | ✅ Complete |
| UI wireframes | `wireframes/` (open `index.html`) | ✅ Complete |
| Database schema & ERD | `database/schema.sql`, `docs/04-database-erd.md`, `diagrams/erd.drawio` | ✅ Complete |
| GitHub repository | https://github.com/eliematar1/Elie_Celine | ✅ Ready to push |
| Requirements analysis | `docs/01-requirements-analysis.md` | ✅ Complete |
| Application architecture | `docs/03-application-architecture.md` | ✅ Complete |
| Seed data script | `database/seed-data.sql` | ✅ Complete |

### PDF suggested tables (§4) — coverage

| PDF table | Our table(s) |
|-----------|----------------|
| Users | `AspNetUsers` |
| Roles | `AspNetRoles`, `AspNetUserRoles` |
| Tickets | `Tickets` |
| TicketComments | `TicketComments` |
| TicketAttachments | `TicketAttachments` |
| Notifications | `Notifications` |
| Categories | `TicketCategories` |
| Priorities | `TicketPriorities` |
| Statuses | `TicketStatuses` |
| ActivityLogs | `ActivityLogs` |

### PDF suggested pages (§4) — wireframes

Login/Register · Dashboard · Ticket List · Ticket Details · Create Ticket · Reports · Notifications · User Profile · Admin Settings — **all present** in `wireframes/`.

---

## How to Review Wireframes

1. Open `wireframes/index.html` in Chrome or Edge.
2. Navigate through all linked pages.
3. Take screenshots for your weekly progress report.

---

## How to Run Database Scripts (SSMS)

1. Install SQL Server Express + SSMS.
2. Open `database/schema.sql` → Execute (creates `ITHelpDesk` database).
3. Open `database/seed-data.sql` → Execute (lookup data + roles).

---

## How to View ERD

- **Mermaid (GitHub renders):** `docs/04-database-erd.md`
- **Draw.io:** Open `diagrams/erd.drawio` in [diagrams.net](https://app.diagrams.net) → Export PNG for report

---

## Suggested Screenshots for Report

1. ERD diagram (exported PNG)
2. Dashboard wireframe
3. Ticket detail wireframe
4. Workflow diagram (from `02-system-workflows.md`)
5. SSMS showing tables after schema run

---

## Week 2 Preview

- Initialize ASP.NET Core solution + React app
- ASP.NET Identity + JWT login/register
- Connect EF Core to `ITHelpDesk` database
