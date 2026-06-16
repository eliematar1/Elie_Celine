# Week 2 — COMPLETE ✅

All PDF Week 2 objectives and tasks are implemented in this repository.

---

## Objectives checklist

| Objective | ✅ | Implementation |
|-----------|---|----------------|
| Setup frontend/backend projects | Yes | `client/it-helpdesk-web/` + `src/ITHelpDesk.API/` |
| Configure database connection | Yes | SQL Server in `appsettings.json`; InMemory for local dev |
| Implement authentication | Yes | JWT + ASP.NET Identity, login/register |
| Role-based authorization | Yes | 4 roles, policies, `[Authorize]`, React guards |

## Tasks checklist

| Task | ✅ | Details |
|------|---|---------|
| Setup React project | Yes | Vite, React Router, Axios, auth context |
| Setup ASP.NET Core API | Yes | .NET 8 Web API, Swagger, CORS |
| Configure SQL Server | Yes | Connection string + `database/ITHelpDesk-COMPLETE.sql` |
| Implement JWT authentication | Yes | Bearer tokens, 60 min expiry |
| Create login/index pages | Yes | `/`, `/login`, `/register`, `/dashboard` |

---

## Demo accounts (all roles)

| Email | Password | Role |
|-------|----------|------|
| admin@ithelpdesk.local | Admin@123 | Admin |
| agent@ithelpdesk.local | Agent@123 | IT Support Agent |
| employee@ithelpdesk.local | Employee@123 | Employee |
| manager@ithelpdesk.local | Manager@123 | Manager |

---

## API endpoints (Week 2)

| Method | URL | Auth | RBAC |
|--------|-----|------|------|
| POST | `/api/auth/register` | Public | — |
| POST | `/api/auth/login` | Public | — |
| GET | `/api/auth/me` | JWT | Any user |
| PUT | `/api/auth/profile` | JWT | Any user |
| POST | `/api/auth/change-password` | JWT | Any user |
| GET | `/api/auth/admin-only` | JWT | Admin, Manager |
| GET | `/api/auth/agent-only` | JWT | Admin, Agent |
| GET | `/api/auth/activity-logs` | JWT | Admin |
| GET | `/api/users` | JWT | Admin |
| GET | `/api/users/roles` | JWT | Admin |
| GET | `/api/health` | Public | — |

---

## Database configuration

**Production / SQL Server** (`appsettings.json`):
```json
"UseInMemoryDatabase": false,
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ITHelpDesk;..."
}
```

**Local dev without SQL** (`appsettings.Development.json`):
```json
"UseInMemoryDatabase": true
```

Run `database/ITHelpDesk-COMPLETE.sql` in SSMS for full schema (tickets tables for Week 3+).

---

## How to run

```powershell
# 1. Install .NET 8 SDK: https://dotnet.microsoft.com/download

# 2. API
cd src\ITHelpDesk.API
dotnet restore
dotnet run

# Fallback if no SDK:
cd api-dev-server && npm install && node server.js

# 3. React
cd client\it-helpdesk-web
npm install
npm run dev
```

- React: http://localhost:5173  
- Swagger: http://localhost:5000/swagger  

---

## Verify Week 2 (Postman)

1. `POST /api/auth/login` → get `token`
2. `GET /api/auth/me` with `Authorization: Bearer {token}`
3. `GET /api/auth/admin-only` as Admin → 200
4. `GET /api/auth/admin-only` as Employee → 403
5. `GET /api/users` as Admin → user list

---

## File map

```
src/ITHelpDesk.API/
  Controllers/AuthController.cs    ← JWT auth + profile
  Controllers/UsersController.cs     ← Admin RBAC
  Services/JwtTokenService.cs
  Services/ActivityLogService.cs
  Services/DbInitializer.cs
  Data/ApplicationDbContext.cs
  Models/ApplicationUser.cs, ActivityLog.cs, AppRoles.cs

client/it-helpdesk-web/
  src/pages/Login.jsx, Register.jsx, Home.jsx
  src/pages/Profile.jsx              ← API-connected
  src/pages/Admin.jsx                ← loads users from API
  src/context/AuthContext.jsx
  src/components/ProtectedRoute.jsx
```

---

## What is NOT Week 2 (Week 3+)

- Ticket CRUD API (Week 3)
- Real ticket data in React (currently demo UI)
- Deployment (Week 8)

Week 2 scope is **complete**.
