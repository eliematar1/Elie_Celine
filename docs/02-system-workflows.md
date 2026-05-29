# System Workflows & Diagrams

Use these diagrams in presentations, Draw.io exports, or documentation. Equivalent **Draw.io** source: `diagrams/workflows.drawio`.

---

## 1. High-Level System Context

```mermaid
flowchart TB
    subgraph Clients
        EMP[Employee Browser]
        AGT[IT Agent Browser]
        MGR[Manager Browser]
        ADM[Admin Browser]
    end

    subgraph Frontend
        REACT[React SPA<br/>Tailwind / Shadcn]
    end

    subgraph Backend
        API[ASP.NET Core Web API<br/>JWT + RBAC]
        AI[AI Service<br/>OpenAI / Azure OpenAI]
    end

    subgraph Data
        DB[(SQL Server Express)]
        FS[File Storage<br/>wwwroot/uploads]
    end

    subgraph External
        SMTP[Email SMTP]
    end

    EMP --> REACT
    AGT --> REACT
    MGR --> REACT
    ADM --> REACT
    REACT -->|REST + JWT| API
    API --> DB
    API --> FS
    API --> SMTP
    API --> AI
```

---

## 2. User Registration & Login Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as React App
    participant API as Auth API
    participant DB as SQL Server

    User->>UI: Enter credentials
    UI->>API: POST /api/auth/login
    API->>DB: Validate user + password hash
    alt Valid
        DB-->>API: User + Roles
        API-->>UI: JWT + refresh token + user profile
        UI->>UI: Store token, redirect to Dashboard
    else Invalid
        API-->>UI: 401 Unauthorized
        UI->>User: Show error message
    end
```

---

## 3. Create Ticket Flow (Employee)

```mermaid
flowchart TD
    A[Employee opens Create Ticket] --> B{Optional: AI Chat Assistant}
    B -->|Gets answer| Z[Resolve without ticket]
    B -->|Still needs help| C[Fill form: title, description, category, priority, attachments]
    C --> D[Client validation]
    D -->|Invalid| C
    D -->|Valid| E[POST /api/tickets]
    E --> F[Generate TKT-YYYY-#####]
    F --> G[Status = Open]
    G --> H[Optional: AI suggests category/priority]
    H --> I[Save ticket + activity log]
    I --> J[Notify IT queue / auto-assign]
    J --> K[Show confirmation + ticket detail]
```

---

## 4. Ticket Lifecycle & Status Workflow

```mermaid
stateDiagram-v2
    [*] --> Open: Created
    Open --> InProgress: Agent starts work
    InProgress --> Pending: Waiting on user/vendor
    Pending --> InProgress: User responds
    InProgress --> Resolved: Fix applied
    Resolved --> Closed: Confirmed / auto-close
    Resolved --> InProgress: Reopened
    Open --> Closed: Cancelled by user/admin
    Pending --> Closed: Cancelled
```

---

## 5. Assignment & Escalation Workflow

```mermaid
flowchart LR
    subgraph Triggers
        T1[New ticket Open]
        T2[Manual assign by Admin/Lead]
        T3[Agent requests escalation]
        T4[SLA risk - optional]
    end

    subgraph Assignment
        A1{Auto-assign enabled?}
        A2[Round-robin / least open tickets]
        A3[Manual pick agent]
    end

    subgraph Actions
        R1[Insert TicketAssignment record]
        R2[Activity log: Assigned]
        R3[Notify assigned agent]
        R4[Escalate: raise priority + reassign]
    end

    T1 --> A1
    A1 -->|Yes| A2
    A1 -->|No| T2
    T2 --> A3
    A2 --> R1
    A3 --> R1
    R1 --> R2 --> R3
    T3 --> R4
```

---

## 6. Comment & Notification Flow

```mermaid
sequenceDiagram
    actor Agent
    participant UI as Ticket Detail
    participant API as Tickets API
    participant DB as Database
    participant NC as Notification Service

    Agent->>UI: Add comment (public or internal)
    UI->>API: POST /api/tickets/{id}/comments
    API->>API: Check role (internal → IT/Admin only)
    API->>DB: Insert TicketComment
    API->>DB: Insert ActivityLog
    API->>NC: Create notifications
    NC->>DB: Insert Notifications
    NC-->>Agent: Optional email via SMTP
    API-->>UI: Updated thread
    UI->>UI: Refresh notification bell
```

---

## 7. Role-Based Access Overview

```mermaid
flowchart TB
    subgraph Employee
        E1[Create ticket]
        E2[View own tickets]
        E3[Comment on own tickets]
        E4[Cancel own open tickets]
    end

    subgraph IT_Agent
        A1[View assigned + unassigned queue]
        A2[Update status / resolve]
        A3[Internal notes]
        A4[Assign if permitted]
    end

    subgraph Manager
        M1[View team/department tickets]
        M2[Dashboard & reports]
    end

    subgraph Admin
        D1[All ticket operations]
        D2[User & role management]
        D3[System settings]
        D4[Activity logs]
    end
```

---

## 8. Report Generation Flow

```mermaid
flowchart TD
    R[User opens Reports] --> F[Select filters: date range, category, agent]
    F --> Q[GET /api/reports/...]
    Q --> DB[(Aggregate queries)]
    DB --> CH[Chart JSON + table data]
    CH --> UI[Render charts in React]
    UI --> X{Export?}
    X -->|PDF| P[GET /api/reports/export/pdf]
    X -->|Excel| E[GET /api/reports/export/excel]
```

---

## 9. AI Integration Flow (Week 6+)

```mermaid
flowchart LR
    T[Ticket description] --> C[AI Categorization]
    T --> P[AI Priority suggestion]
    AG[Agent views ticket] --> S[AI Suggested replies]
    EMP[Employee pre-ticket] --> CH[AI Chat Assistant]
    C --> API[OpenAI API]
    P --> API
    S --> API
    CH --> API
```

---

## 10. Deployment Architecture (Target)

```mermaid
flowchart TB
    subgraph Production
        IIS[IIS / Azure App Service]
        API2[ASP.NET Core API]
        SPA[React static build]
        SQL[(Azure SQL or SQL Server)]
        BLOB[File storage / Azure Blob]
    end

    User[Users HTTPS] --> IIS
    IIS --> SPA
    IIS --> API2
    API2 --> SQL
    API2 --> BLOB
```
