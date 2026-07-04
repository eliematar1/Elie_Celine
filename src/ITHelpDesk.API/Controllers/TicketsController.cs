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
public class TicketsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TicketService _tickets;
    private readonly NotificationService _notifications;
    private readonly ActivityLogService _activity;
    private readonly AiService _ai;

    public TicketsController(
        ApplicationDbContext db, UserManager<ApplicationUser> userManager,
        TicketService tickets, NotificationService notifications,
        ActivityLogService activity, AiService ai)
    {
        _db = db;
        _userManager = userManager;
        _tickets = tickets;
        _notifications = notifications;
        _activity = activity;
        _ai = ai;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketListDto>>> List(
        [FromQuery] string? search, [FromQuery] int? statusId, [FromQuery] int? categoryId)
    {
        var (user, roles) = await GetUserAsync();
        var q = _tickets.QueryForUser(user, roles);

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(t => t.Title.Contains(search) || t.ReferenceNumber.Contains(search));
        if (statusId.HasValue) q = q.Where(t => t.StatusId == statusId);
        if (categoryId.HasValue) q = q.Where(t => t.CategoryId == categoryId);

        var list = await q.OrderByDescending(t => t.CreatedAt).Take(100).ToListAsync();
        return Ok(list.Select(MapList));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TicketDetailDto>> Get(int id)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await _tickets.QueryForUser(user, roles)
            .Include(t => t.Comments).ThenInclude(c => c.User)
            .Include(t => t.Attachments)
            .Include(t => t.StatusHistory).ThenInclude(h => h.ToStatus)
            .Include(t => t.StatusHistory).ThenInclude(h => h.FromStatus)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null) return NotFound();
        return Ok(MapDetail(ticket, roles));
    }

    [HttpPost]
    public async Task<ActionResult<TicketDetailDto>> Create([FromBody] CreateTicketRequest request)
    {
        var (user, roles) = await GetUserAsync();
        var openStatus = await _db.TicketStatuses.FirstAsync(s => s.Name == "Open");
        var (suggestedCat, suggestedPri) = _ai.Suggest(request.Title, request.Description);

        var ticket = new Ticket
        {
            ReferenceNumber = await _tickets.GenerateReferenceAsync(),
            Title = request.Title,
            Description = request.Description,
            CategoryId = request.CategoryId,
            PriorityId = request.PriorityId,
            StatusId = openStatus.Id,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync();

        await _tickets.LogStatusChangeAsync(ticket, null, openStatus.Id, user.Id, "Ticket created");
        await _db.SaveChangesAsync();

        var recipientIds = new List<string> { user.Id };
        foreach (var recipient in (await _userManager.GetUsersInRoleAsync(AppRoles.Admin)).Concat(await _userManager.GetUsersInRoleAsync(AppRoles.Manager)).Concat(await _userManager.GetUsersInRoleAsync(AppRoles.Agent)))
            if (recipient.Id != user.Id && !recipientIds.Contains(recipient.Id)) recipientIds.Add(recipient.Id);

        foreach (var recipientId in recipientIds)
            await _notifications.NotifyAsync(recipientId, "New ticket created", $"{ticket.ReferenceNumber} was created and is awaiting review.", "TicketCreated", ticket.Id);

        await _activity.LogAsync(user.Id, "TicketCreated", "Ticket", ticket.Id.ToString(), ticket.ReferenceNumber);

        return CreatedAtAction(nameof(Get), new { id = ticket.Id }, await GetDto(ticket.Id, user, roles));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TicketDetailDto>> Update(int id, [FromBody] UpdateTicketRequest request)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await _tickets.GetByIdForUserAsync(id, user, roles);
        if (ticket == null) return NotFound();

        if (request.Title != null) ticket.Title = request.Title;
        if (request.Description != null) ticket.Description = request.Description;
        if (request.CategoryId.HasValue) ticket.CategoryId = request.CategoryId.Value;
        if (request.PriorityId.HasValue) ticket.PriorityId = request.PriorityId.Value;

        if (request.StatusId.HasValue && request.StatusId != ticket.StatusId)
        {
            var fromId = ticket.StatusId;
            var toStatus = await _db.TicketStatuses.FindAsync(request.StatusId.Value);
            await _tickets.LogStatusChangeAsync(ticket, fromId, request.StatusId.Value, user.Id);

            var recipientIds = new List<string>();
            if (!string.IsNullOrWhiteSpace(ticket.CreatedByUserId) && ticket.CreatedByUserId != user.Id) recipientIds.Add(ticket.CreatedByUserId);
            if (!string.IsNullOrWhiteSpace(ticket.AssignedToUserId) && ticket.AssignedToUserId != user.Id) recipientIds.Add(ticket.AssignedToUserId);

            var title = toStatus?.Name is "Resolved" or "Closed" ? "Ticket completed" : "Status updated";
            var message = toStatus?.Name is "Resolved" or "Closed"
                ? $"{ticket.ReferenceNumber} has been marked {toStatus.Name}."
                : $"{ticket.ReferenceNumber} status changed to {toStatus?.Name ?? request.StatusId.Value.ToString()}.";

            foreach (var recipientId in recipientIds.Distinct())
                await _notifications.NotifyAsync(recipientId, title, message, "StatusChange", ticket.Id);
        }
        else ticket.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(await GetDto(id, user, roles));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Employee}")]
    public async Task<IActionResult> Delete(int id)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await _tickets.GetByIdForUserAsync(id, user, roles);
        if (ticket == null) return NotFound();
        if (!roles.Contains(AppRoles.Admin) && ticket.CreatedByUserId != user.Id) return Forbid();

        ticket.IsDeleted = true;
        ticket.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/assign")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Agent}")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignTicketRequest request)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await _tickets.GetByIdForUserAsync(id, user, roles);
        if (ticket == null) return NotFound();

        ticket.AssignedToUserId = request.AssignedToUserId;
        ticket.UpdatedAt = DateTime.UtcNow;
        _db.TicketAssignments.Add(new TicketAssignment
        {
            TicketId = id,
            AssignedToUserId = request.AssignedToUserId,
            AssignedByUserId = user.Id,
            Notes = request.Notes,
            IsEscalation = request.IsEscalation
        });
        await _db.SaveChangesAsync();
        await _notifications.NotifyAsync(request.AssignedToUserId, "Ticket assigned",
            $"You were assigned {ticket.ReferenceNumber}.", "Assignment", id);
        return Ok(new { message = "Ticket assigned." });
    }

    [HttpPost("{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentRequest request)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await _tickets.GetByIdForUserAsync(id, user, roles);
        if (ticket == null) return NotFound();
        if (request.IsInternal && !roles.Any(r => r is AppRoles.Admin or AppRoles.Agent))
            return Forbid();

        _db.TicketComments.Add(new TicketComment
        {
            TicketId = id,
            UserId = user.Id,
            Body = request.Body,
            IsInternal = request.IsInternal
        });
        await _db.SaveChangesAsync();

        var recipientIds = new List<string>();
        if (!string.IsNullOrWhiteSpace(ticket.CreatedByUserId) && ticket.CreatedByUserId != user.Id) recipientIds.Add(ticket.CreatedByUserId);
        if (!string.IsNullOrWhiteSpace(ticket.AssignedToUserId) && ticket.AssignedToUserId != user.Id) recipientIds.Add(ticket.AssignedToUserId);

        foreach (var recipientId in recipientIds.Distinct())
            await _notifications.NotifyAsync(recipientId, "New comment", $"New comment on {ticket.ReferenceNumber}.", "Comment", id);

        return Ok(new { message = "Comment added." });
    }

    [HttpPost("{id:int}/attachments")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> Upload(int id, IFormFile file)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await _tickets.GetByIdForUserAsync(id, user, roles);
        if (ticket == null) return NotFound();
        if (file.Length == 0) return BadRequest(new { message = "Empty file." });

        var allowed = new[] { ".png", ".jpg", ".jpeg", ".pdf", ".txt", ".log" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext)) return BadRequest(new { message = "File type not allowed." });

        var stored = $"{Guid.NewGuid()}{ext}";
        var path = Path.Combine("uploads", stored);
        Directory.CreateDirectory("uploads");
        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);

        _db.TicketAttachments.Add(new TicketAttachment
        {
            TicketId = id,
            UploadedByUserId = user.Id,
            FileName = file.FileName,
            StoredFileName = stored,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "File uploaded.", fileName = file.FileName });
    }

    [HttpGet("lookups")]
    [AllowAnonymous]
    public async Task<IActionResult> Lookups() => Ok(new
    {
        categories = await _db.TicketCategories.Where(c => c.IsActive).OrderBy(c => c.SortOrder).ToListAsync(),
        priorities = await _db.TicketPriorities.Where(p => p.IsActive).OrderBy(p => p.Level).ToListAsync(),
        statuses = await _db.TicketStatuses.OrderBy(s => s.SortOrder).ToListAsync()
    });

    private async Task<(ApplicationUser user, IList<string> roles)> GetUserAsync()
    {
        var user = (await _userManager.GetUserAsync(User))!;
        var roles = await _userManager.GetRolesAsync(user);
        return (user, roles);
    }

    private async Task<TicketDetailDto> GetDto(int id, ApplicationUser user, IList<string> roles)
    {
        var ticket = await _tickets.QueryForUser(user, roles)
            .Include(t => t.Comments).ThenInclude(c => c.User)
            .Include(t => t.Attachments)
            .Include(t => t.StatusHistory).ThenInclude(h => h.ToStatus)
            .Include(t => t.StatusHistory).ThenInclude(h => h.FromStatus)
            .FirstAsync(t => t.Id == id);
        return MapDetail(ticket, roles);
    }

    private static TicketListDto MapList(Ticket t) => new(
        t.Id, t.ReferenceNumber, t.Title,
        t.Category.Name, t.Priority.Name, t.Status.Name,
        t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : null,
        $"{t.CreatedBy.FirstName} {t.CreatedBy.LastName}",
        t.CreatedAt);

    private TicketDetailDto MapDetail(Ticket t, IList<string> roles) => new(
        t.Id, t.ReferenceNumber, t.Title, t.Description,
        t.Category.Name, t.CategoryId, t.Priority.Name, t.PriorityId,
        t.Status.Name, t.StatusId,
        $"{t.CreatedBy.FirstName} {t.CreatedBy.LastName}",
        t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : null,
        t.AssignedToUserId, t.CreatedAt, t.ResolvedAt,
        t.Comments.Where(c => !c.IsInternal || roles.Any(r => r is AppRoles.Admin or AppRoles.Agent))
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(c.Id, $"{c.User.FirstName} {c.User.LastName}", c.Body, c.IsInternal, c.CreatedAt)),
        t.Attachments.Select(a => new AttachmentDto(a.Id, a.FileName, a.FileSizeBytes, a.UploadedAt)),
        t.StatusHistory.OrderByDescending(h => h.ChangedAt)
            .Select(h => new StatusHistoryDto(h.FromStatus?.Name, h.ToStatus.Name, "", h.ChangedAt)));
}
