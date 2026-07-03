using ITHelpDesk.API.Data;
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
public class AiController : ControllerBase
{
    private readonly AiService _ai;
    private readonly ApplicationDbContext _db;
    private readonly TicketService _tickets;
    private readonly NotificationService _notifications;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SystemSettingsService _settings;

    public AiController(
        AiService ai, ApplicationDbContext db, TicketService tickets,
        NotificationService notifications, UserManager<ApplicationUser> userManager,
        SystemSettingsService settings)
    {
        _ai = ai;
        _db = db;
        _tickets = tickets;
        _notifications = notifications;
        _userManager = userManager;
        _settings = settings;
    }

    [HttpPost("suggest")]
    public IActionResult Suggest([FromBody] AiRequest request)
    {
        var (cat, pri) = _ai.Suggest(request.Title, request.Description);
        var reply = _ai.SuggestReply(request.Title, request.Description);
        return Ok(new { suggestedCategory = cat, suggestedPriority = pri, suggestedReply = reply });
    }

    [HttpPost("chat")]
    public IActionResult Chat([FromBody] ChatRequest request) =>
        Ok(new { answer = _ai.ChatAnswer(request.Question) });

    [HttpPost("help-chat")]
    public IActionResult HelpChat([FromBody] ChatRequest request) =>
        Ok(_ai.HelpChat(request.Question));

    [HttpPost("parse-ticket")]
    public async Task<IActionResult> ParseTicket([FromBody] ShortcutRequest request)
    {
        var parsed = _ai.ParseTicketShortcut(request.Shortcut);
        if (parsed == null) return BadRequest(new { message = "Describe your issue in the shortcut field." });

        var cat = await _db.TicketCategories.FirstOrDefaultAsync(c => c.Name == parsed.Category);
        var pri = await _db.TicketPriorities.FirstOrDefaultAsync(p => p.Name == parsed.Priority);
        return Ok(new
        {
            parsed.Title,
            parsed.Description,
            category = parsed.Category,
            priority = parsed.Priority,
            categoryId = cat?.Id ?? 1,
            priorityId = pri?.Id ?? 2,
        });
    }

    [HttpPost("create-ticket")]
    public async Task<IActionResult> CreateTicketFromAi([FromBody] ShortcutRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        var parsed = _ai.ParseTicketShortcut(request.Shortcut);
        if (parsed == null) return BadRequest(new { message = "Describe your issue in the shortcut field." });

        var cat = await _db.TicketCategories.FirstOrDefaultAsync(c => c.Name == parsed.Category)
            ?? await _db.TicketCategories.FirstAsync();
        var pri = await _db.TicketPriorities.FirstOrDefaultAsync(p => p.Name == parsed.Priority)
            ?? await _db.TicketPriorities.FirstAsync(p => p.Name == "Medium");
        var openStatus = await _db.TicketStatuses.FirstAsync(s => s.Name == "Open");

        var ticket = new Ticket
        {
            ReferenceNumber = await _tickets.GenerateReferenceAsync(),
            Title = parsed.Title,
            Description = parsed.Description,
            CategoryId = cat.Id,
            PriorityId = pri.Id,
            StatusId = openStatus.Id,
            CreatedByUserId = user!.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync();

        await _tickets.LogStatusChangeAsync(ticket, null, openStatus.Id, user.Id, "Ticket created via AI");
        await _settings.ApplyAutoAssignAsync(ticket, user!.Id, _tickets);
        await _db.SaveChangesAsync();

        await _notifications.NotifyAsync(user.Id, "Ticket created", $"AI created {ticket.ReferenceNumber} for you.", "TicketCreated", ticket.Id);
        if (ticket.AssignedToUserId != null)
            await _notifications.NotifyTicketInvolvedAsync(ticket.Id, "Ticket assigned",
                $"{ticket.ReferenceNumber} was auto-assigned.", "Assignment", user.Id);
        else
            await _notifications.NotifyStaffNewTicketAsync(ticket, user.Id);

        return Created($"/api/tickets/{ticket.Id}", new
        {
            ticket = new { ticket.Id, ticket.ReferenceNumber, ticket.Title },
            parsed = new { parsed.Title, parsed.Description, category = parsed.Category, priority = parsed.Priority, categoryId = cat.Id, priorityId = pri.Id },
        });
    }
}

public record AiRequest(string Title, string Description);
public record ChatRequest(string Question);
public record ShortcutRequest(string Shortcut);
