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
    private const int MaxAttachmentsPerTicket = 5;
    private const long MaxAttachmentBytes = 5_242_880; // 5 MB

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
        var ticket = await LoadTicketDetail(id, user, roles);
        if (ticket == null) return NotFound();
        return Ok(MapDetail(ticket, user, roles));
    }

    [HttpPost]
    public async Task<ActionResult<TicketDetailDto>> Create([FromBody] CreateTicketRequest request)
    {
        var (user, roles) = await GetUserAsync();
        var openStatus = await _db.TicketStatuses.FirstAsync(s => s.Name == "Open");

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
        await _activity.LogAsync(user.Id, "TicketCreated", "Ticket", ticket.Id.ToString(), ticket.ReferenceNumber);
        await _notifications.NotifyAsync(user.Id, "Ticket created", $"Your ticket {ticket.ReferenceNumber} was submitted.", "TicketCreated", ticket.Id);
        await _notifications.NotifyStaffNewTicketAsync(ticket, user.Id);

        return CreatedAtAction(nameof(Get), new { id = ticket.Id }, await GetDto(ticket.Id, user, roles));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TicketDetailDto>> Update(int id, [FromBody] UpdateTicketRequest request)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await LoadTicketDetail(id, user, roles);
        if (ticket == null) return NotFound();

        var state = TicketWorkflowService.GetState(ticket.Status);
        var permissions = TicketWorkflowService.GetPermissions(ticket, state, user, roles);

        if (request.StatusId.HasValue && request.StatusId != ticket.StatusId)
        {
            if (!permissions.CanChangeStatus)
                return BadRequest(new { message = "Status cannot be changed for this ticket." });
            var fromId = ticket.StatusId;
            await _tickets.LogStatusChangeAsync(ticket, fromId, request.StatusId.Value, user.Id);
            await _notifications.NotifyTicketInvolvedAsync(ticket.Id, "Status updated",
                $"{ticket.ReferenceNumber} status changed.", "StatusChange", user.Id);
        }
        else
        {
            if (!permissions.CanEditDetails)
                return BadRequest(new { message = "Ticket details cannot be edited while in progress or closed." });

            if (request.Title != null) ticket.Title = request.Title;
            if (request.Description != null) ticket.Description = request.Description;
            if (request.CategoryId.HasValue) ticket.CategoryId = request.CategoryId.Value;
            if (request.PriorityId.HasValue) ticket.PriorityId = request.PriorityId.Value;
            ticket.UpdatedAt = DateTime.UtcNow;
            await _notifications.NotifyTicketInvolvedAsync(ticket.Id, "Ticket updated",
                $"{ticket.ReferenceNumber} details were updated.", "TicketUpdated", user.Id);
        }

        await _db.SaveChangesAsync();
        return Ok(await GetDto(id, user, roles));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await LoadTicketDetail(id, user, roles);
        if (ticket == null) return NotFound();

        var permissions = TicketWorkflowService.GetPermissions(
            ticket, TicketWorkflowService.GetState(ticket.Status), user, roles);
        if (!permissions.CanDelete)
            return BadRequest(new { message = "Only unassigned open tickets can be deleted." });

        ticket.IsDeleted = true;
        ticket.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/reopen")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Agent}")]
    public async Task<ActionResult<TicketDetailDto>> Reopen(int id)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await LoadTicketDetail(id, user, roles);
        if (ticket == null) return NotFound();

        var permissions = TicketWorkflowService.GetPermissions(
            ticket, TicketWorkflowService.GetState(ticket.Status), user, roles);
        if (!permissions.CanReopen)
            return BadRequest(new { message = "This ticket cannot be reopened." });

        var openStatus = await _db.TicketStatuses.FirstAsync(s => s.Name == "Open");
        await _tickets.LogStatusChangeAsync(ticket, ticket.StatusId, openStatus.Id, user.Id, "Ticket reopened");
        ticket.ResolvedAt = null;
        ticket.ClosedAt = null;
        await _db.SaveChangesAsync();
        return Ok(await GetDto(id, user, roles));
    }

    [HttpPost("{id:int}/duplicate")]
    public async Task<ActionResult<TicketDetailDto>> Duplicate(int id)
    {
        var (user, roles) = await GetUserAsync();
        var source = await LoadTicketDetail(id, user, roles);
        if (source == null) return NotFound();

        var openStatus = await _db.TicketStatuses.FirstAsync(s => s.Name == "Open");
        var ticket = new Ticket
        {
            ReferenceNumber = await _tickets.GenerateReferenceAsync(),
            Title = $"Copy: {source.Title}",
            Description = source.Description,
            CategoryId = source.CategoryId,
            PriorityId = source.PriorityId,
            StatusId = openStatus.Id,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync();
        await _tickets.LogStatusChangeAsync(ticket, null, openStatus.Id, user.Id, $"Duplicated from {source.ReferenceNumber}");
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = ticket.Id }, await GetDto(ticket.Id, user, roles));
    }

    [HttpPost("{id:int}/assign")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Agent}")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignTicketRequest request)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await LoadTicketDetail(id, user, roles);
        if (ticket == null) return NotFound();

        var permissions = TicketWorkflowService.GetPermissions(
            ticket, TicketWorkflowService.GetState(ticket.Status), user, roles);
        if (!permissions.CanAssign)
            return BadRequest(new { message = "Assignment is not allowed for this ticket." });

        if (request.IsEscalation && !permissions.CanEscalate)
            return BadRequest(new { message = "Only admins can escalate tickets." });

        ticket.AssignedToUserId = request.AssignedToUserId;
        ticket.UpdatedAt = DateTime.UtcNow;

        if (ticket.Status.Name == "Open")
        {
            var inProgress = await _db.TicketStatuses.FirstAsync(s => s.Name == "In Progress");
            await _tickets.LogStatusChangeAsync(ticket, ticket.StatusId, inProgress.Id, user.Id, "Assigned to agent");
        }

        _db.TicketAssignments.Add(new TicketAssignment
        {
            TicketId = id,
            AssignedToUserId = request.AssignedToUserId,
            AssignedByUserId = user.Id,
            Notes = request.Notes,
            IsEscalation = request.IsEscalation
        });
        await _db.SaveChangesAsync();

        var title = request.IsEscalation ? "Ticket escalated" : "Ticket assigned";
        await _notifications.NotifyTicketInvolvedAsync(id, title,
            $"{ticket.ReferenceNumber} was assigned.", "Assignment", user.Id);
        return Ok(new { message = request.IsEscalation ? "Ticket escalated." : "Ticket assigned." });
    }

    [HttpPost("{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentRequest request)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await LoadTicketDetail(id, user, roles);
        if (ticket == null) return NotFound();

        var permissions = TicketWorkflowService.GetPermissions(
            ticket, TicketWorkflowService.GetState(ticket.Status), user, roles);
        if (!permissions.CanComment)
            return BadRequest(new { message = "Comments are not allowed on closed tickets." });

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
        await _notifications.NotifyTicketInvolvedAsync(id, "New comment",
            $"New comment on {ticket.ReferenceNumber}.", "Comment", user.Id);
        return Ok(new { message = "Comment added." });
    }

    [HttpPost("{id:int}/attachments")]
    [RequestSizeLimit(MaxAttachmentBytes)]
    public async Task<IActionResult> Upload(int id, IFormFile file)
    {
        var (user, roles) = await GetUserAsync();
        var ticket = await LoadTicketDetail(id, user, roles);
        if (ticket == null) return NotFound();

        var permissions = TicketWorkflowService.GetPermissions(
            ticket, TicketWorkflowService.GetState(ticket.Status), user, roles);
        if (!permissions.CanUpload)
            return BadRequest(new { message = "Attachments are not allowed on closed tickets." });

        if (file.Length == 0) return BadRequest(new { message = "Empty file." });
        if (file.Length > MaxAttachmentBytes)
            return BadRequest(new { message = "File exceeds 5 MB limit." });

        var count = await _db.TicketAttachments.CountAsync(a => a.TicketId == id);
        if (count >= MaxAttachmentsPerTicket)
            return BadRequest(new { message = $"Maximum {MaxAttachmentsPerTicket} attachments per ticket." });

        var allowed = new[] { ".png", ".jpg", ".jpeg", ".webp", ".pdf", ".txt", ".log" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest(new { message = "Allowed: PNG, JPG, WEBP, PDF, TXT, LOG (max 5 MB)." });

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
        await _notifications.NotifyTicketInvolvedAsync(id, "Attachment added",
            $"File uploaded on {ticket.ReferenceNumber}: {file.FileName}", "Attachment", user.Id);
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

    private async Task<Ticket?> LoadTicketDetail(int id, ApplicationUser user, IList<string> roles) =>
        await _tickets.QueryForUser(user, roles)
            .Include(t => t.Category).Include(t => t.Priority).Include(t => t.Status)
            .Include(t => t.CreatedBy).Include(t => t.AssignedTo)
            .Include(t => t.Comments).ThenInclude(c => c.User)
            .Include(t => t.Attachments)
            .Include(t => t.Assignments).ThenInclude(a => a.AssignedTo)
            .Include(t => t.Assignments).ThenInclude(a => a.AssignedBy)
            .Include(t => t.StatusHistory).ThenInclude(h => h.ToStatus)
            .Include(t => t.StatusHistory).ThenInclude(h => h.FromStatus)
            .Include(t => t.StatusHistory).ThenInclude(h => h.ChangedByUserId)
            .FirstOrDefaultAsync(t => t.Id == id);

    private async Task<TicketDetailDto> GetDto(int id, ApplicationUser user, IList<string> roles)
    {
        var ticket = await LoadTicketDetail(id, user, roles);
        return MapDetail(ticket!, user, roles);
    }

    private static TicketListDto MapList(Ticket t) => new(
        t.Id, t.ReferenceNumber, t.Title,
        t.Category.Name, t.Priority.Name, t.Status.Name,
        t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : null,
        $"{t.CreatedBy.FirstName} {t.CreatedBy.LastName}",
        t.CreatedAt);

    private TicketDetailDto MapDetail(Ticket t, ApplicationUser user, IList<string> roles)
    {
        var state = TicketWorkflowService.GetState(t.Status);
        var permissions = TicketWorkflowService.GetPermissions(t, state, user, roles);
        var end = t.ClosedAt ?? t.ResolvedAt;
        var resolutionHours = end.HasValue ? Math.Round((end.Value - t.CreatedAt).TotalHours, 1) : (double?)null;
        var agentsInvolved = t.Assignments.Select(a => a.AssignedToUserId).Distinct().Count();

        var comments = t.Comments
            .Where(c => !c.IsInternal || roles.Any(r => r is AppRoles.Admin or AppRoles.Agent))
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(c.Id, $"{c.User.FirstName} {c.User.LastName}", c.Body, c.IsInternal, c.CreatedAt))
            .ToList();

        var attachmentDtos = t.Attachments
            .OrderBy(a => a.UploadedAt)
            .Select(a => new AttachmentDto(a.Id, a.FileName, a.FileSizeBytes, a.UploadedAt, null))
            .ToList();

        var statusHistory = t.StatusHistory
            .OrderByDescending(h => h.ChangedAt)
            .Select(h => new StatusHistoryDto(
                h.FromStatus?.Name,
                h.ToStatus.Name,
                "",
                h.ChangedAt,
                h.Notes))
            .ToList();

        var assignmentHistory = t.Assignments
            .OrderByDescending(a => a.AssignedAt)
            .Select(a => new AssignmentHistoryDto(
                $"{a.AssignedTo.FirstName} {a.AssignedTo.LastName}",
                $"{a.AssignedBy.FirstName} {a.AssignedBy.LastName}",
                a.AssignedAt,
                a.IsEscalation,
                a.Notes))
            .ToList();

        var timeline = new List<TimelineEventDto>();
        foreach (var h in t.StatusHistory.OrderBy(h => h.ChangedAt))
        {
            var from = h.FromStatus?.Name ?? "—";
            timeline.Add(new TimelineEventDto(
                "status",
                $"Status: {from} → {h.ToStatus.Name}",
                h.Notes ?? "",
                "",
                h.ChangedAt));
        }
        foreach (var a in t.Assignments.OrderBy(a => a.AssignedAt))
        {
            timeline.Add(new TimelineEventDto(
                "assignment",
                a.IsEscalation ? "Escalated" : "Assigned",
                $"To {a.AssignedTo.FirstName} {a.AssignedTo.LastName}",
                $"{a.AssignedBy.FirstName} {a.AssignedBy.LastName}",
                a.AssignedAt));
        }
        foreach (var c in comments)
        {
            timeline.Add(new TimelineEventDto(
                "comment",
                c.IsInternal ? "Internal note" : "Comment",
                c.Body,
                c.AuthorName,
                c.CreatedAt));
        }
        foreach (var a in t.Attachments.OrderBy(x => x.UploadedAt))
        {
            timeline.Add(new TimelineEventDto(
                "attachment",
                "Attachment added",
                a.FileName,
                "",
                a.UploadedAt));
        }
        timeline = timeline.OrderBy(e => e.At).ToList();

        return new TicketDetailDto(
            t.Id, t.ReferenceNumber, t.Title, t.Description,
            t.Category.Name, t.CategoryId, t.Priority.Name, t.PriorityId,
            t.Status.Name, t.StatusId,
            $"{t.CreatedBy.FirstName} {t.CreatedBy.LastName}",
            t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : null,
            t.AssignedToUserId,
            t.CreatedAt, t.UpdatedAt, t.ResolvedAt, t.ClosedAt,
            resolutionHours, agentsInvolved,
            comments, attachmentDtos, statusHistory, assignmentHistory, timeline, permissions);
    }
}
