# Week 2 Submission Checklist

**Project:** IT Help Desk & Ticketing Management System  
**Team:** Celine Mortada & Elie Matar  
**Week 2 deliverable (PDF):** Login/Register system, JWT auth  
**Repository:** https://github.com/eliematar1/Elie_Celine

---

## Objectives → Status

| PDF objective | Status | Evidence |
|---------------|--------|----------|
| Setup frontend/backend projects | ✅ Done | `client/it-helpdesk-web/`, `src/ITHelpDesk.API/` |
| Configure database connection | ✅ Done | `appsettings.json` — SQL Server + InMemory fallback |
| Implement authentication | ✅ Done | JWT + ASP.NET Identity, login/register API |
| Role-based authorization | ✅ Done | 4 roles, `[Authorize(Roles)]`, React `ProtectedRoute` |

---

## Tasks → Status

| Task | Status | Location |
|------|--------|----------|
| Setup React project | ✅ | Vite + React Router + Axios — `client/it-helpdesk-web/` |
| Setup ASP.NET Core API | ✅ | `src/ITHelpDesk.API/` + `ITHelpDesk.sln` |
| Configure SQL Server | ✅ | Connection string in `appsettings.json`; scripts in `database/` |
| Implement JWT authentication | ✅ | `JwtTokenService.cs`, `AuthController.cs`, Bearer in React |
| Create login/index pages | ✅ | `/`, `/login`, `/register`, `/dashboard` |

---

## Stack (your environment checklist)

| Layer | Choice |
|-------|--------|
| Frontend | React (JavaScript), Vite |
| Backend | ASP.NET Core 8 Web API (C#) |
| Database | SQL Server Express (scripts ready) |
| Auth | JWT + ASP.NET Identity |
| Dev fallback | `api-dev-server/` (Node) if .NET SDK not installed |

---

## What to run for demo / screenshots

```powershell
# Terminal 1 — API (preferred)
cd src\ITHelpDesk.API
dotnet restore
dotnet run

# If dotnet not installed — dev API:
cd api-dev-server
npm install
node server.js

# Terminal 2 — React
cd client\it-helpdesk-web
npm install
npm run dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | React app (login, dashboard, tickets UI) |
| http://localhost:5000/swagger | API documentation (ASP.NET) |
| http://localhost:5000/api/health | API health check |

**Demo login:** `admin@ithelpdesk.local` / `Admin@123`

---

## API endpoints (Week 2)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Create account + role |
| POST | `/api/auth/login` | Public | Returns JWT |
| GET | `/api/auth/me` | Bearer JWT | Current user profile |
| GET | `/api/auth/admin-only` | Admin, Manager | RBAC test endpoint |
| GET | `/api/health` | Public | Health check |

---

## Roles (RBAC)

| Role | React access | API |
|------|--------------|-----|
| Admin | Dashboard, Admin panel, all routes | Full + admin-only endpoint |
| IT Support Agent | Dashboard, tickets | Standard authenticated |
| Employee | Dashboard, create/view tickets | Standard authenticated |
| Manager | Dashboard, Admin panel, reports | Admin-only API endpoint |

---

## SQL Server setup (for instructor / production path)

1. Open SSMS → run `database/ITHelpDesk-COMPLETE.sql`
2. Edit `src/ITHelpDesk.API/appsettings.json`:
   ```json
   "UseInMemoryDatabase": false,
   "ConnectionStrings": {
     "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ITHelpDesk;Trusted_Connection=True;TrustServerCertificate=True"
   }
   ```
3. `dotnet ef migrations add InitialIdentity` (optional) → `dotnet ef database update`
4. Or let API run `EnsureCreated()` on first start (current setup)

---

## Screenshots for weekly report

1. Login page (`/login`)
2. Dashboard after login
3. Swagger with Auth endpoints
4. Postman: login response with JWT
5. Postman: `/api/auth/me` with Bearer token
6. SSMS showing `ITHelpDesk` database (if SQL Server used)

---

## Week 2 gaps (optional before Week 3)

| Item | Status | Planned |
|------|--------|---------|
| Forgot / reset password | Not yet | Week 2 bonus or Week 3 |
| Profile update API | UI only | Week 3 |
| Activity logging | SQL schema only | Week 5 |
| Ticket CRUD API | Not yet | **Week 3** |

---

## Documentation vs live app

| For instructor (repo only) | For published website |
|----------------------------|------------------------|
| `docs/`, `wireframes/`, `diagrams/`, `database/` | `client/it-helpdesk-web/` + API |

Do **not** embed Week 1 docs inside the production React app.

---

## Learning resources (from assignment)

- [ASP.NET Core Authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/)
- [JWT Introduction](https://jwt.io/introduction)
- [React + ASP.NET Core JWT tutorials](https://www.youtube.com/results?search_query=react+aspnet+core+jwt)

---

## Week 3 preview

- Ticket entity in EF Core
- Ticket CRUD API
- Connect React ticket pages to real API (replace mock data)
