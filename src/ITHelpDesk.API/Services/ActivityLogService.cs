using ITHelpDesk.API.Data;
using ITHelpDesk.API.Models;

namespace ITHelpDesk.API.Services;

public class ActivityLogService
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;

    public ActivityLogService(ApplicationDbContext db, IHttpContextAccessor http)
    {
        _db = db;
        _http = http;
    }

    public async Task LogAsync(string? userId, string action, string? entityType = null, string? entityId = null, string? details = null)
    {
        _db.ActivityLogs.Add(new ActivityLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            IpAddress = _http.HttpContext?.Connection.RemoteIpAddress?.ToString(),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }
}
