using ITHelpDesk.API.Data;
using ITHelpDesk.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.API.Services;

public class TicketService
{
    private readonly ApplicationDbContext _db;
    private readonly NotificationService _notifications;
    private readonly ActivityLogService _activity;

    public TicketService(ApplicationDbContext db, NotificationService notifications, ActivityLogService activity)
    {
        _db = db;
        _notifications = notifications;
        _activity = activity;
    }

    public async Task<string> GenerateReferenceAsync()
    {
        var year = DateTime.UtcNow.Year;
        var count = await _db.Tickets.CountAsync(t => t.CreatedAt.Year == year) + 1;
        return $"TKT-{year}-{count:D5}";
    }

    public IQueryable<Ticket> QueryForUser(ApplicationUser user, IList<string> roles)
    {
        var q = _db.Tickets
            .Include(t => t.Category).Include(t => t.Priority).Include(t => t.Status)
            .Include(t => t.CreatedBy).Include(t => t.AssignedTo)
            .Where(t => !t.IsDeleted);

        if (roles.Contains(AppRoles.Admin) || roles.Contains(AppRoles.Manager))
            return q;

        if (roles.Contains(AppRoles.Agent))
            return q.Where(t => t.AssignedToUserId == user.Id || t.AssignedToUserId == null);

        return q.Where(t => t.CreatedByUserId == user.Id);
    }

    public async Task<Ticket?> GetByIdForUserAsync(int id, ApplicationUser user, IList<string> roles)
    {
        return await QueryForUser(user, roles).FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task LogStatusChangeAsync(Ticket ticket, int? fromId, int toId, string userId, string? notes = null)
    {
        _db.TicketStatusHistory.Add(new TicketStatusHistory
        {
            TicketId = ticket.Id,
            FromStatusId = fromId,
            ToStatusId = toId,
            ChangedByUserId = userId,
            Notes = notes
        });
        var toStatus = await _db.TicketStatuses.FindAsync(toId);
        if (toStatus?.Name == "Resolved") ticket.ResolvedAt = DateTime.UtcNow;
        if (toStatus?.IsClosed == true) ticket.ClosedAt = DateTime.UtcNow;
        ticket.StatusId = toId;
        ticket.UpdatedAt = DateTime.UtcNow;
    }
}
