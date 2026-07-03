using ITHelpDesk.API.Data;
using ITHelpDesk.API.DTOs;
using ITHelpDesk.API.Models;
using ITHelpDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace ITHelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Manager}")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly TicketService _tickets;
    private readonly UserManager<ApplicationUser> _userManager;

    public ReportsController(ApplicationDbContext db, TicketService tickets, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _tickets = tickets;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<ReportDto>> Get()
    {
        var user = await _userManager.GetUserAsync(User);
        var roles = await _userManager.GetRolesAsync(user!);
        var q = _tickets.QueryForUser(user!, roles);

        var total = await q.CountAsync();
        var resolved = await q.CountAsync(t => t.ResolvedAt != null);
        var resolvedTickets = await q.Where(t => t.ResolvedAt != null).ToListAsync();
        var avgDays = resolvedTickets.Count > 0
            ? resolvedTickets.Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalDays)
            : 0;

        var agents = await _userManager.GetUsersInRoleAsync(AppRoles.Agent);
        var perf = new List<AgentPerformanceDto>();
        foreach (var agent in agents)
        {
            var agentTickets = await q.Where(t => t.AssignedToUserId == agent.Id).ToListAsync();
            var res = agentTickets.Count(t => t.ResolvedAt != null);
            var open = agentTickets.Count(t => t.ResolvedAt == null);
            var avg = agentTickets.Where(t => t.ResolvedAt != null)
                .Select(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalDays).DefaultIfEmpty(0).Average();
            perf.Add(new AgentPerformanceDto($"{agent.FirstName} {agent.LastName}", res, open, Math.Round(avg, 1)));
        }

        var tickets = await q.ToListAsync();
        var byCategory = tickets
            .GroupBy(t => t.Category.Name)
            .Select(g => new CategoryCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();
        var byPriority = tickets
            .GroupBy(t => t.Priority.Name)
            .Select(g => new PriorityCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();
        var byStatus = tickets
            .GroupBy(t => t.Status.Name)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var monthlyTrend = new List<MonthlyTrendDto>();
        for (var i = 5; i >= 0; i--)
        {
            var month = DateTime.UtcNow.AddMonths(-i);
            var monthStart = new DateTime(month.Year, month.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthEnd = monthStart.AddMonths(1);
            var label = monthStart.ToString("MMM yyyy");
            var created = tickets.Count(t => t.CreatedAt >= monthStart && t.CreatedAt < monthEnd);
            var resolved = tickets.Count(t => t.ResolvedAt >= monthStart && t.ResolvedAt < monthEnd);
            monthlyTrend.Add(new MonthlyTrendDto(label, created, resolved));
        }

        return Ok(new ReportDto(
            total,
            resolved,
            Math.Round(avgDays, 1),
            perf,
            byCategory,
            byPriority,
            byStatus,
            monthlyTrend));
    }

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv()
    {
        var user = await _userManager.GetUserAsync(User);
        var roles = await _userManager.GetRolesAsync(user!);
        var tickets = await _tickets.QueryForUser(user!, roles)
            .OrderByDescending(t => t.CreatedAt).Take(500).ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Reference,Title,Category,Priority,Status,Created");
        foreach (var t in tickets)
            sb.AppendLine($"{t.ReferenceNumber},{t.Title},{t.Category.Name},{t.Priority.Name},{t.Status.Name},{t.CreatedAt:yyyy-MM-dd}");

        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", "tickets-report.csv");
    }
}
