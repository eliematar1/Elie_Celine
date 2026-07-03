# Database ERD — IT Help Desk System

**Database:** SQL Server Express (`ITHelpDesk`)  
**Files:** `database/schema.sql`, `database/seed-data.sql`, `diagrams/erd.drawio`

---

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    AspNetUsers ||--o{ AspNetUserRoles : has
    AspNetRoles ||--o{ AspNetUserRoles : has
    AspNetUsers ||--o{ Tickets : creates
    AspNetUsers ||--o{ Tickets : "assigned to"
    AspNetUsers ||--o{ TicketComments : writes
    AspNetUsers ||--o{ TicketAttachments : uploads
    AspNetUsers ||--o{ TicketAssignments : "assigned to"
    AspNetUsers ||--o{ TicketAssignments : "assigned by"
    AspNetUsers ||--o{ Notifications : receives
    AspNetUsers ||--o{ ActivityLogs : performs
    AspNetUsers ||--o{ KnowledgeBaseArticles : authors

    TicketCategories ||--o{ Tickets : categorizes
    TicketPriorities ||--o{ Tickets : prioritizes
    TicketStatuses ||--o{ Tickets : "current status"
    TicketStatuses ||--o{ TicketStatusHistory : "from/to"

    Tickets ||--o{ TicketComments : has
    Tickets ||--o{ TicketAttachments : has
    Tickets ||--o{ TicketAssignments : has
    Tickets ||--o{ TicketStatusHistory : has
    Tickets ||--o{ Notifications : triggers

    TicketCategories ||--o{ KnowledgeBaseArticles : optional

    AspNetUsers {
        nvarchar Id PK
        nvarchar Email
        nvarchar FirstName
        nvarchar LastName
        nvarchar Department
        bit IsActive
        datetime2 CreatedAt
    }

    Tickets {
        int Id PK
        nvarchar ReferenceNumber UK
        nvarchar Title
        nvarchar Description
        int CategoryId FK
        int PriorityId FK
        int StatusId FK
        nvarchar CreatedByUserId FK
        nvarchar AssignedToUserId FK
        datetime2 CreatedAt
        datetime2 ResolvedAt
        bit IsDeleted
    }

    TicketCategories {
        int Id PK
        nvarchar Name UK
    }

    TicketPriorities {
        int Id PK
        nvarchar Name UK
        int Level
    }

    TicketStatuses {
        int Id PK
        nvarchar Name UK
        bit IsClosed
    }

    TicketComments {
        int Id PK
        int TicketId FK
        nvarchar UserId FK
        bit IsInternal
    }

    TicketAttachments {
        int Id PK
        int TicketId FK
        nvarchar FileName
        bigint FileSizeBytes
    }

    TicketAssignments {
        int Id PK
        int TicketId FK
        nvarchar AssignedToUserId FK
        bit IsEscalation
    }

    TicketStatusHistory {
        int Id PK
        int TicketId FK
        int ToStatusId FK
    }

    Notifications {
        int Id PK
        nvarchar UserId FK
        int TicketId FK
        bit IsRead
    }

    ActivityLogs {
        int Id PK
        nvarchar UserId FK
        nvarchar Action
    }
```

---

## Table Summary

| Table | Purpose | Key relationships |
|-------|---------|-------------------|
| `AspNetUsers` | Identity + profile | Central user entity |
| `AspNetRoles` / `AspNetUserRoles` | RBAC | Admin, Agent, Employee, Manager |
| `TicketCategories` | Hardware, Software, … | → Tickets |
| `TicketPriorities` | Low → Critical | → Tickets |
| `TicketStatuses` | Workflow states | → Tickets, StatusHistory |
| `Tickets` | Core entity | Users, lookups |
| `TicketAssignments` | Assignment audit | Ticket, Agents |
| `TicketComments` | Public + internal notes | Ticket, User |
| `TicketAttachments` | Files | Ticket, User |
| `TicketStatusHistory` | Status audit trail | Ticket, Statuses |
| `Notifications` | In-app alerts | User, Ticket |
| `ActivityLogs` | Security audit | User |
| `PasswordResetTokens` | Reset flow | User |
| `SystemSettings` | Config key-value | — |
| `KnowledgeBaseArticles` | Optional KB | Category, Author |

---

## Reference Number Generation (Logic)

```
Format: {Prefix}-{Year}-{Sequence:00000}
Example: TKT-2026-00042

SQL Server sequence or MAX(Id)+1 per year in application service.
```

---

## Indexes (Performance)

- `Tickets`: StatusId, AssignedToUserId, CreatedAt
- `Notifications`: UserId + IsRead
- `ActivityLogs`: CreatedAt DESC

---

## How to Open ERD in Draw.io

1. Open [diagrams.net](https://app.diagrams.net) or VS Code Draw.io extension.
2. File → Open → `diagrams/erd.drawio`.
3. Export as PNG/SVG for your Week 1 submission.
