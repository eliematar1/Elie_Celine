-- =============================================================================
-- IT Help Desk — Seed / Sample Data
-- Run after schema.sql
-- =============================================================================

USE ITHelpDesk;
GO

-- Roles
INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp) VALUES
('role-admin',   'Admin',           'ADMIN',           NEWID()),
('role-agent',   'IT Support Agent','IT SUPPORT AGENT', NEWID()),
('role-employee','Employee',        'EMPLOYEE',        NEWID()),
('role-manager', 'Manager',         'MANAGER',         NEWID());

-- Categories
INSERT INTO TicketCategories (Name, Description, SortOrder) VALUES
('Hardware',      'Laptops, printers, peripherals', 1),
('Software',      'Applications and OS issues', 2),
('Network',       'Wi-Fi, VPN, connectivity', 3),
('Email',         'Outlook and mailbox issues', 4),
('Access Request','Permissions and accounts', 5),
('Other',         'General requests', 6);

-- Priorities
INSERT INTO TicketPriorities (Name, Level, ColorHex) VALUES
('Low',      1, '#22c55e'),
('Medium',   2, '#eab308'),
('High',     3, '#f97316'),
('Critical', 4, '#ef4444');

-- Statuses
INSERT INTO TicketStatuses (Name, Description, IsClosed, SortOrder) VALUES
('Open',        'New ticket awaiting action', 0, 1),
('In Progress', 'Agent is working on the ticket', 0, 2),
('Pending',     'Waiting for employee or third party', 0, 3),
('Resolved',    'Fix delivered, pending confirmation', 0, 4),
('Closed',      'Ticket completed', 1, 5);

-- System settings
INSERT INTO SystemSettings (SettingKey, SettingValue) VALUES
('AutoAssignEnabled', 'false'),
('MaxAttachmentSizeMb', '10'),
('TicketReferencePrefix', 'TKT'),
('SmtpEnabled', 'false');

GO

-- Note: Users and tickets will be seeded via ASP.NET Identity in Week 2-3
-- Sample ticket insert (requires user IDs after Identity seed):

/*
DECLARE @empId NVARCHAR(450) = '...';
DECLARE @agentId NVARCHAR(450) = '...';

INSERT INTO Tickets (ReferenceNumber, Title, Description, CategoryId, PriorityId, StatusId, CreatedByUserId, AssignedToUserId)
VALUES
('TKT-2026-00001', 'Outlook not syncing', 'Emails stuck in outbox since morning.', 4, 2, 1, @empId, NULL),
('TKT-2026-00002', 'VPN connection failed', 'Cannot connect to corporate VPN from home.', 3, 3, 2, @empId, @agentId);
*/
