namespace ITHelpDesk.API.DTOs;

using ITHelpDesk.API.Services;

public record TicketListDto(
    int Id,
    string ReferenceNumber,
    string Title,
    string Category,
    string Priority,
    string Status,
    string? AssignedToName,
    string CreatedByName,
    DateTime CreatedAt
);

public record TicketDetailDto(
    int Id,
    string ReferenceNumber,
    string Title,
    string Description,
    string Category,
    int CategoryId,
    string Priority,
    int PriorityId,
    string Status,
    int StatusId,
    string CreatedByName,
    string? AssignedToName,
    string? AssignedToUserId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? ResolvedAt,
    DateTime? ClosedAt,
    double? ResolutionHours,
    int AgentsInvolved,
    IEnumerable<CommentDto> Comments,
    IEnumerable<AttachmentDto> Attachments,
    IEnumerable<StatusHistoryDto> StatusHistory,
    IEnumerable<AssignmentHistoryDto> AssignmentHistory,
    IEnumerable<TimelineEventDto> Timeline,
    TicketPermissionsDto Permissions
);

public record CommentDto(int Id, string AuthorName, string Body, bool IsInternal, DateTime CreatedAt);
public record AttachmentDto(int Id, string FileName, long FileSizeBytes, DateTime UploadedAt, string? UploadedByName);
public record StatusHistoryDto(string? FromStatus, string ToStatus, string ChangedByName, DateTime ChangedAt, string? Notes);
public record AssignmentHistoryDto(string AssignedToName, string AssignedByName, DateTime AssignedAt, bool IsEscalation, string? Notes);
public record TimelineEventDto(string Type, string Title, string Detail, string ActorName, DateTime At);

public record CreateTicketRequest(string Title, string Description, int CategoryId, int PriorityId);
public record UpdateTicketRequest(string? Title, string? Description, int? CategoryId, int? PriorityId, int? StatusId);
public record AssignTicketRequest(string AssignedToUserId, string? Notes, bool IsEscalation = false);
public record CreateCommentRequest(string Body, bool IsInternal);

public record DashboardDto(
    int Open, int InProgress, int Pending, int ResolvedMonth,
    IEnumerable<CategoryCountDto> ByCategory,
    IEnumerable<PriorityCountDto> ByPriority,
    IEnumerable<TicketListDto> RecentTickets
);

public record CategoryCountDto(string Category, int Count);
public record PriorityCountDto(string Priority, int Count);
public record StatusCountDto(string Status, int Count);
public record MonthlyTrendDto(string Month, int Created, int Resolved);

public record ReportDto(
    int TotalTickets,
    int ResolvedTickets,
    double AvgResolutionDays,
    IEnumerable<AgentPerformanceDto> AgentPerformance,
    IEnumerable<CategoryCountDto> ByCategory,
    IEnumerable<PriorityCountDto> ByPriority,
    IEnumerable<StatusCountDto> ByStatus,
    IEnumerable<MonthlyTrendDto> MonthlyTrend
);

public record AgentPerformanceDto(string AgentName, int Resolved, int Open, double AvgDays);

public record AiSuggestionDto(string? SuggestedCategory, string? SuggestedPriority, string? SuggestedReply);
