using ITHelpDesk.API.Data;
using ITHelpDesk.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public NotificationsController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var user = await _userManager.GetUserAsync(User);
        var items = await _db.Notifications
            .Where(n => n.UserId == user!.Id)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new { n.Id, n.Title, n.Message, n.Type, n.TicketId, n.IsRead, n.CreatedAt })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllRead()
    {
        var user = await _userManager.GetUserAsync(User);
        var unread = await _db.Notifications.Where(n => n.UserId == user!.Id && !n.IsRead).ToListAsync();
        foreach (var n in unread) { n.IsRead = true; n.ReadAt = DateTime.UtcNow; }
        await _db.SaveChangesAsync();
        return Ok(new { message = "All marked as read." });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var user = await _userManager.GetUserAsync(User);
        var count = await _db.Notifications.CountAsync(n => n.UserId == user!.Id && !n.IsRead);
        return Ok(new { count });
    }
}
