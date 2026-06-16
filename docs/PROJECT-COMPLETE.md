# IT Help Desk — Project Complete

**Team:** Celine Mortada & Elie Matar  
**Stack:** React + ASP.NET Core 8 + SQL Server + JWT

---

## Implemented modules (Weeks 1–6)

| Week | Module | Status |
|------|--------|--------|
| 1 | Planning, wireframes, ERD, SQL | ✅ `docs/`, `wireframes/`, `database/` |
| 2 | Auth, JWT, RBAC, login/register | ✅ |
| 3 | Ticket CRUD, categories, priorities | ✅ |
| 4 | Assignment, comments, status workflow | ✅ |
| 5 | Notifications, uploads, dashboard API | ✅ |
| 6 | Reports, CSV export, AI basics | ✅ |

---

## Run the full application

```powershell
# 1. API (ASP.NET — requires .NET 8 SDK)
cd src\ITHelpDesk.API
dotnet run

# OR Node fallback (same API routes):
cd api-dev-server
npm install
npm start

# 2. React
cd client\it-helpdesk-web
npm install
npm run dev
```

| URL | Service |
|-----|---------|
| http://localhost:5173 | React app |
| http://localhost:5000/swagger | API docs |

---

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| admin@ithelpdesk.local | Admin@123 | Admin |
| agent@ithelpdesk.local | Agent@123 | IT Support Agent |
| employee@ithelpdesk.local | Employee@123 | Employee |
| manager@ithelpdesk.local | Manager@123 | Manager |

---

## API endpoints (full list)

### Auth
`POST /api/auth/login` · `POST /api/auth/register` · `GET /api/auth/me`  
`PUT /api/auth/profile` · `POST /api/auth/change-password`

### Tickets
`GET/POST /api/tickets` · `GET/PUT/DELETE /api/tickets/{id}`  
`POST /api/tickets/{id}/assign` · `POST /api/tickets/{id}/comments`  
`POST /api/tickets/{id}/attachments` · `GET /api/tickets/lookups`

### Dashboard & Reports
`GET /api/dashboard` · `GET /api/notifications`  
`GET /api/reports` · `GET /api/reports/export/csv`

### AI
`POST /api/ai/suggest` · `POST /api/ai/chat`

### Admin
`GET /api/users` · `GET /api/users/roles`

---

## Database

- **Scripts:** `database/ITHelpDesk-COMPLETE.sql`
- **Dev (no SQL):** `UseInMemoryDatabase: true` in `appsettings.Development.json`
- **Production:** `UseInMemoryDatabase: false` + SQL Server connection string

---

## Project structure

```
client/it-helpdesk-web/     ← React production app
src/ITHelpDesk.API/         ← ASP.NET Core API
api-dev-server/             ← Node fallback (no .NET SDK needed)
database/                   ← SQL scripts (submission)
docs/                       ← Documentation (submission)
wireframes/                 ← Week 1 wireframes (submission)
diagrams/                   ← ERD (submission)
```

**Documentation is separate from the published website.**

---

## Deployment (Week 8)

1. Publish API: `dotnet publish -c Release`
2. Build React: `npm run build` → deploy `dist/` to IIS/Azure static hosting
3. Configure SQL Server on Azure/AWS
4. Set environment variables: JWT key, connection string, CORS origin

---

## GitHub

https://github.com/eliematar1/Elie_Celine
