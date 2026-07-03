using ITHelpDesk.API.Data;
using ITHelpDesk.API.DTOs;
using ITHelpDesk.API.Models;
using ITHelpDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TicketService _tickets;

    public DashboardController(ApplicationDbContext db, UserManager<ApplicationUser> userManager, TicketService tickets)
    {
        _db = db;
        _userManager = userManager;
        _tickets = tickets;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get()
    {
        var user = await _userManager.GetUserAsync(User);
        var roles = await _userManager.GetRolesAsync(user!);
        var q = _tickets.QueryForUser(user!, roles);

        var open = await q.CountAsync(t => t.Status.Name == "Open");
        var inProg = await q.CountAsync(t => t.Status.Name == "In Progress");
        var pending = await q.CountAsync(t => t.Status.Name == "Pending");
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var resolved = await q.CountAsync(t => t.ResolvedAt >= monthStart);

        var byCat = await q.GroupBy(t => t.Category.Name)
            .Select(g => new CategoryCountDto(g.Key, g.Count())).ToListAsync();
        var byPri = await q.GroupBy(t => t.Priority.Name)
            .Select(g => new PriorityCountDto(g.Key, g.Count())).ToListAsync();

        var recent = await q.OrderByDescending(t => t.CreatedAt).Take(5).ToListAsync();
        var recentDtos = recent.Select(t => new TicketListDto(
            t.Id, t.ReferenceNumber, t.Title, t.Category.Name, t.Priority.Name, t.Status.Name,
            t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : null,
            $"{t.CreatedBy.FirstName} {t.CreatedBy.LastName}", t.CreatedAt));

        return Ok(new DashboardDto(open, inProg, pending, resolved, byCat, byPri, recentDtos));
    }
}
