using ITHelpDesk.API.Data;
using ITHelpDesk.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.API.Services;

public class NotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public NotificationService(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task NotifyAsync(string userId, string title, string message, string type, int? ticketId = null)
    {
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            TicketId = ticketId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    public async Task NotifyTicketInvolvedAsync(int ticketId, string title, string message, string type, string? excludeUserId = null)
    {
        var ids = await GetInvolvedUserIdsAsync(ticketId);
        foreach (var uid in ids.Where(id => id != excludeUserId))
            await NotifyAsync(uid, title, message, type, ticketId);
    }

    public async Task NotifyStaffNewTicketAsync(Ticket ticket, string excludeUserId)
    {
        var admins = await _userManager.GetUsersInRoleAsync(AppRoles.Admin);
        var agents = await _userManager.GetUsersInRoleAsync(AppRoles.Agent);
        foreach (var u in admins.Concat(agents).Where(u => u.IsActive && u.Id != excludeUserId).DistinctBy(u => u.Id))
            await NotifyAsync(u.Id, "New ticket", $"{ticket.ReferenceNumber}: {ticket.Title}", "TicketCreated", ticket.Id);
    }

    private async Task<List<string>> GetInvolvedUserIdsAsync(int ticketId)
    {
        var ticket = await _db.Tickets.AsNoTracking().FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket == null) return [];

        var ids = new HashSet<string>();
        if (!string.IsNullOrEmpty(ticket.CreatedByUserId)) ids.Add(ticket.CreatedByUserId);
        if (!string.IsNullOrEmpty(ticket.AssignedToUserId)) ids.Add(ticket.AssignedToUserId!);

        var assignmentUsers = await _db.TicketAssignments
            .Where(a => a.TicketId == ticketId)
            .Select(a => new { a.AssignedToUserId, a.AssignedByUserId })
            .ToListAsync();
        foreach (var a in assignmentUsers)
        {
            ids.Add(a.AssignedToUserId);
            ids.Add(a.AssignedByUserId);
        }

        var commenters = await _db.TicketComments
            .Where(c => c.TicketId == ticketId)
            .Select(c => c.UserId)
            .ToListAsync();
        foreach (var c in commenters) ids.Add(c);

        return ids.ToList();
    }
}
