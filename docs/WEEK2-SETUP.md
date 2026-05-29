# Week 2 — Auth & Project Setup

## What was built

| Component | Path |
|-----------|------|
| ASP.NET Core API | `src/ITHelpDesk.API/` |
| React (Vite) | `client/it-helpdesk-web/` |
| JWT + Identity | `Program.cs`, `AuthController.cs` |
| Roles | Admin, IT Support Agent, Employee, Manager |

## Prerequisites

1. [.NET 8 SDK](https://dotnet.microsoft.com/download) — restart terminal after install
2. Node.js 18+
3. (Optional) SQL Server Express — or use **InMemory** DB (default)

## Configure database

**Option A — InMemory (default, no SQL install):**

`appsettings.json` → `"UseInMemoryDatabase": true`

**Option B — SQL Server:**

1. Run `database/ITHelpDesk-COMPLETE.sql` in SSMS
2. Set `"UseInMemoryDatabase": false`
3. Update connection string in `src/ITHelpDesk.API/appsettings.json`

## Run the project

### Terminal 1 — API

```powershell
cd d:\.Download\ITHELPDESK\Elie_Celine\src\ITHelpDesk.API
dotnet restore
dotnet run
```

Swagger: http://localhost:5000/swagger

### Terminal 2 — React

```powershell
cd d:\.Download\ITHELPDESK\Elie_Celine\client\it-helpdesk-web
npm install
npm run dev
```

App: http://localhost:5173

### Or use script

```powershell
.\scripts\run-week2.ps1
```

## Demo accounts (seeded on startup)

| Email | Password | Role |
|-------|----------|------|
| admin@ithelpdesk.local | Admin@123 | Admin |
| employee@ithelpdesk.local | Employee@123 | Employee |

## API endpoints

| Method | URL | Auth |
|--------|-----|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | JWT |
| GET | `/api/auth/admin-only` | Admin, Manager |
| GET | `/api/health` | Public |

## JWT test (Postman)

1. POST `http://localhost:5000/api/auth/login`  
   Body: `{ "email": "admin@ithelpdesk.local", "password": "Admin@123" }`
2. Copy `token` from response
3. GET `http://localhost:5000/api/auth/me`  
   Header: `Authorization: Bearer {token}`

## Switch to SQL Server

```json
// appsettings.Development.json
{
  "UseInMemoryDatabase": false,
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ITHelpDesk;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

Then:

```powershell
cd src/ITHelpDesk.API
dotnet ef migrations add InitialIdentity
dotnet ef database update
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `dotnet` not found | Install SDK, restart VS Code / terminal |
| npm SSL error | `npm config set strict-ssl false` (corporate proxy) |
| CORS error | API must run on :5000, React on :5173 |
| 401 on /me | Token expired — login again |
