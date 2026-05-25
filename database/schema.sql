-- =============================================================================
-- IT Help Desk & Ticketing Management System
-- Database Schema — SQL Server Express
-- Team: Celine Mortada & Elie Matar
-- Week 1 Deliverable — Reference script (EF Core migrations will mirror this)
-- =============================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ITHelpDesk')
    CREATE DATABASE ITHelpDesk;
GO

USE ITHelpDesk;
GO

-- =============================================================================
-- ASP.NET Identity Tables (simplified reference — scaffold via Identity in Week 2)
-- =============================================================================

CREATE TABLE AspNetRoles (
    Id              NVARCHAR(450) NOT NULL PRIMARY KEY,
    Name            NVARCHAR(256) NULL,
    NormalizedName  NVARCHAR(256) NULL,
    ConcurrencyStamp NVARCHAR(MAX) NULL
);

CREATE UNIQUE INDEX IX_AspNetRoles_NormalizedName ON AspNetRoles(NormalizedName) WHERE NormalizedName IS NOT NULL;

CREATE TABLE AspNetUsers (
    Id                   NVARCHAR(450) NOT NULL PRIMARY KEY,
    UserName             NVARCHAR(256) NULL,
    NormalizedUserName   NVARCHAR(256) NULL,
    Email                NVARCHAR(256) NULL,
    NormalizedEmail      NVARCHAR(256) NULL,
    EmailConfirmed       BIT NOT NULL DEFAULT 0,
    PasswordHash         NVARCHAR(MAX) NULL,
    SecurityStamp        NVARCHAR(MAX) NULL,
    ConcurrencyStamp     NVARCHAR(MAX) NULL,
    PhoneNumber          NVARCHAR(50) NULL,
    PhoneNumberConfirmed BIT NOT NULL DEFAULT 0,
    TwoFactorEnabled     BIT NOT NULL DEFAULT 0,
    LockoutEnd           DATETIMEOFFSET NULL,
    LockoutEnabled       BIT NOT NULL DEFAULT 1,
    AccessFailedCount    INT NOT NULL DEFAULT 0,
    -- Extended profile
    FirstName            NVARCHAR(100) NOT NULL DEFAULT '',
    LastName             NVARCHAR(100) NOT NULL DEFAULT '',
    Department           NVARCHAR(100) NULL,
    IsActive             BIT NOT NULL DEFAULT 1,
    CreatedAt            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    LastLoginAt          DATETIME2 NULL,
    AvatarUrl            NVARCHAR(500) NULL
);

CREATE TABLE AspNetUserRoles (
    UserId NVARCHAR(450) NOT NULL,
    RoleId NVARCHAR(450) NOT NULL,
    PRIMARY KEY (UserId, RoleId),
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    FOREIGN KEY (RoleId) REFERENCES AspNetRoles(Id) ON DELETE CASCADE
);

CREATE TABLE AspNetUserClaims (
    Id         INT IDENTITY(1,1) PRIMARY KEY,
    UserId     NVARCHAR(450) NOT NULL,
    ClaimType  NVARCHAR(MAX) NULL,
    ClaimValue NVARCHAR(MAX) NULL,
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE
);

CREATE TABLE AspNetRoleClaims (
    Id         INT IDENTITY(1,1) PRIMARY KEY,
    RoleId     NVARCHAR(450) NOT NULL,
    ClaimType  NVARCHAR(MAX) NULL,
    ClaimValue NVARCHAR(MAX) NULL,
    FOREIGN KEY (RoleId) REFERENCES AspNetRoles(Id) ON DELETE CASCADE
);

-- =============================================================================
-- Lookup Tables
-- =============================================================================

CREATE TABLE TicketCategories (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL,
    IsActive    BIT NOT NULL DEFAULT 1,
    SortOrder   INT NOT NULL DEFAULT 0
);

CREATE TABLE TicketPriorities (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(20) NOT NULL UNIQUE,
    Level       INT NOT NULL,  -- 1=Low, 4=Critical (for sorting)
    ColorHex    NVARCHAR(7) NULL,
    IsActive    BIT NOT NULL DEFAULT 1
);

CREATE TABLE TicketStatuses (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(30) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL,
    IsClosed    BIT NOT NULL DEFAULT 0,
    SortOrder   INT NOT NULL DEFAULT 0
);

-- =============================================================================
-- Tickets Core
-- =============================================================================

CREATE TABLE Tickets (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    ReferenceNumber NVARCHAR(20) NOT NULL UNIQUE,  -- TKT-2026-00001
    Title           NVARCHAR(200) NOT NULL,
    Description     NVARCHAR(MAX) NOT NULL,
    CategoryId      INT NOT NULL,
    PriorityId      INT NOT NULL,
    StatusId        INT NOT NULL,
    CreatedByUserId NVARCHAR(450) NOT NULL,
    AssignedToUserId NVARCHAR(450) NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ResolvedAt      DATETIME2 NULL,
    ClosedAt        DATETIME2 NULL,
    DueAt           DATETIME2 NULL,
    IsDeleted       BIT NOT NULL DEFAULT 0,
    DeletedAt       DATETIME2 NULL,
    -- AI metadata (optional)
    AiSuggestedCategoryId INT NULL,
    AiSuggestedPriorityId INT NULL,
    FOREIGN KEY (CategoryId) REFERENCES TicketCategories(Id),
    FOREIGN KEY (PriorityId) REFERENCES TicketPriorities(Id),
    FOREIGN KEY (StatusId) REFERENCES TicketStatuses(Id),
    FOREIGN KEY (CreatedByUserId) REFERENCES AspNetUsers(Id),
    FOREIGN KEY (AssignedToUserId) REFERENCES AspNetUsers(Id)
);

CREATE INDEX IX_Tickets_StatusId ON Tickets(StatusId);
CREATE INDEX IX_Tickets_AssignedToUserId ON Tickets(AssignedToUserId);
CREATE INDEX IX_Tickets_CreatedByUserId ON Tickets(CreatedByUserId);
CREATE INDEX IX_Tickets_CreatedAt ON Tickets(CreatedAt DESC);

-- =============================================================================
-- Assignment History
-- =============================================================================

CREATE TABLE TicketAssignments (
    Id               INT IDENTITY(1,1) PRIMARY KEY,
    TicketId         INT NOT NULL,
    AssignedToUserId NVARCHAR(450) NOT NULL,
    AssignedByUserId NVARCHAR(450) NOT NULL,
    AssignedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UnassignedAt     DATETIME2 NULL,
    Notes            NVARCHAR(500) NULL,
    IsEscalation     BIT NOT NULL DEFAULT 0,
    FOREIGN KEY (TicketId) REFERENCES Tickets(Id) ON DELETE CASCADE,
    FOREIGN KEY (AssignedToUserId) REFERENCES AspNetUsers(Id),
    FOREIGN KEY (AssignedByUserId) REFERENCES AspNetUsers(Id)
);

-- =============================================================================
-- Comments & Attachments
-- =============================================================================

CREATE TABLE TicketComments (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    TicketId    INT NOT NULL,
    UserId      NVARCHAR(450) NOT NULL,
    Body        NVARCHAR(MAX) NOT NULL,
    IsInternal  BIT NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2 NULL,
    FOREIGN KEY (TicketId) REFERENCES Tickets(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id)
);

CREATE TABLE TicketAttachments (
    Id           INT IDENTITY(1,1) PRIMARY KEY,
    TicketId     INT NOT NULL,
    UploadedByUserId NVARCHAR(450) NOT NULL,
    FileName     NVARCHAR(255) NOT NULL,
    StoredFileName NVARCHAR(255) NOT NULL,
    ContentType  NVARCHAR(100) NOT NULL,
    FileSizeBytes BIGINT NOT NULL,
    UploadedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (TicketId) REFERENCES Tickets(Id) ON DELETE CASCADE,
    FOREIGN KEY (UploadedByUserId) REFERENCES AspNetUsers(Id)
);

-- =============================================================================
-- Ticket Status History (audit trail)
-- =============================================================================

CREATE TABLE TicketStatusHistory (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TicketId        INT NOT NULL,
    FromStatusId    INT NULL,
    ToStatusId      INT NOT NULL,
    ChangedByUserId NVARCHAR(450) NOT NULL,
    ChangedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Notes           NVARCHAR(500) NULL,
    FOREIGN KEY (TicketId) REFERENCES Tickets(Id) ON DELETE CASCADE,
    FOREIGN KEY (FromStatusId) REFERENCES TicketStatuses(Id),
    FOREIGN KEY (ToStatusId) REFERENCES TicketStatuses(Id),
    FOREIGN KEY (ChangedByUserId) REFERENCES AspNetUsers(Id)
);

-- =============================================================================
-- Notifications
-- =============================================================================

CREATE TABLE Notifications (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    UserId      NVARCHAR(450) NOT NULL,
    Title       NVARCHAR(200) NOT NULL,
    Message     NVARCHAR(500) NOT NULL,
    Type        NVARCHAR(50) NOT NULL,  -- Assignment, StatusChange, Comment, System
    TicketId    INT NULL,
    IsRead      BIT NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ReadAt      DATETIME2 NULL,
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    FOREIGN KEY (TicketId) REFERENCES Tickets(Id)
);

CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(UserId, IsRead);

-- =============================================================================
-- Activity Logs (system-wide audit)
-- =============================================================================

CREATE TABLE ActivityLogs (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    UserId      NVARCHAR(450) NULL,
    Action      NVARCHAR(100) NOT NULL,
    EntityType  NVARCHAR(50) NULL,
    EntityId    NVARCHAR(50) NULL,
    Details     NVARCHAR(MAX) NULL,
    IpAddress   NVARCHAR(45) NULL,
    CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id)
);

CREATE INDEX IX_ActivityLogs_CreatedAt ON ActivityLogs(CreatedAt DESC);

-- =============================================================================
-- Password Reset Tokens
-- =============================================================================

CREATE TABLE PasswordResetTokens (
    Id        INT IDENTITY(1,1) PRIMARY KEY,
    UserId    NVARCHAR(450) NOT NULL,
    Token     NVARCHAR(256) NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    UsedAt    DATETIME2 NULL,
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE
);

-- =============================================================================
-- System Settings
-- =============================================================================

CREATE TABLE SystemSettings (
    Id           INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey   NVARCHAR(100) NOT NULL UNIQUE,
    SettingValue NVARCHAR(MAX) NOT NULL,
    UpdatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedByUserId NVARCHAR(450) NULL
);

-- =============================================================================
-- Knowledge Base (Optional Module)
-- =============================================================================

CREATE TABLE KnowledgeBaseArticles (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Title           NVARCHAR(200) NOT NULL,
    Slug            NVARCHAR(200) NOT NULL UNIQUE,
    Content         NVARCHAR(MAX) NOT NULL,
    CategoryId      INT NULL,
    AuthorUserId    NVARCHAR(450) NOT NULL,
    IsPublished     BIT NOT NULL DEFAULT 0,
    IsApproved      BIT NOT NULL DEFAULT 0,
    ApprovedByUserId NVARCHAR(450) NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (CategoryId) REFERENCES TicketCategories(Id),
    FOREIGN KEY (AuthorUserId) REFERENCES AspNetUsers(Id)
);

GO
