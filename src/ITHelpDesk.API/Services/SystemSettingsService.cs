using ITHelpDesk.API.Data;
using ITHelpDesk.API.DTOs;
using ITHelpDesk.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.API.Services;

public class SystemSettingsService
{
    private const int MinAttachmentMb = 1;
    private const int MaxAttachmentMb = 50;

    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public SystemSettingsService(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<SystemSettingsDto> GetAsync()
    {
        await EnsureDefaultsAsync();
        return new SystemSettingsDto(
            await GetBoolAsync(SystemSettingKeys.AutoAssignEnabled),
            await GetIntAsync(SystemSettingKeys.MaxAttachmentSizeMb, 10));
    }

    public async Task<SystemSettingsDto> UpdateAsync(UpdateSystemSettingsRequest request, string userId)
    {
        var mb = Math.Clamp(request.MaxAttachmentSizeMb, MinAttachmentMb, MaxAttachmentMb);
        await SetAsync(SystemSettingKeys.AutoAssignEnabled, request.AutoAssignEnabled ? "true" : "false", userId);
        await SetAsync(SystemSettingKeys.MaxAttachmentSizeMb, mb.ToString(), userId);
        return new SystemSettingsDto(request.AutoAssignEnabled, mb);
    }

    public async Task<long> GetMaxAttachmentBytesAsync()
    {
        var mb = await GetIntAsync(SystemSettingKeys.MaxAttachmentSizeMb, 10);
        mb = Math.Clamp(mb, MinAttachmentMb, MaxAttachmentMb);
        return (long)mb * 1024 * 1024;
    }

    public async Task ApplyAutoAssignAsync(Ticket ticket, string actorUserId, TicketService tickets)
    {
        if (!await GetBoolAsync(SystemSettingKeys.AutoAssignEnabled)) return;

        var agentId = await PickLeastLoadedAgentAsync();
        if (agentId == null) return;

        ticket.AssignedToUserId = agentId;
        ticket.UpdatedAt = DateTime.UtcNow;

        var openStatus = await _db.TicketStatuses.FirstAsync(s => s.Name == "Open");
        if (ticket.StatusId == openStatus.Id)
        {
            var inProgress = await _db.TicketStatuses.FirstAsync(s => s.Name == "In Progress");
            await tickets.LogStatusChangeAsync(ticket, openStatus.Id, inProgress.Id, actorUserId, "Auto-assigned to agent");
        }

        _db.TicketAssignments.Add(new TicketAssignment
        {
            TicketId = ticket.Id,
            AssignedToUserId = agentId,
            AssignedByUserId = actorUserId,
            AssignedAt = DateTime.UtcNow,
            Notes = "Auto-assigned by system",
            IsEscalation = false
        });
    }

    private async Task<string?> PickLeastLoadedAgentAsync()
    {
        var agents = await _userManager.GetUsersInRoleAsync(AppRoles.Agent);
        var activeAgents = agents.Where(a => a.IsActive).ToList();
        if (activeAgents.Count == 0) return null;

        var closedStatusIds = await _db.TicketStatuses
            .Where(s => s.IsClosed)
            .Select(s => s.Id)
            .ToListAsync();

        string? bestId = null;
        var bestCount = int.MaxValue;

        foreach (var agent in activeAgents)
        {
            var count = await _db.Tickets.CountAsync(t =>
                !t.IsDeleted &&
                t.AssignedToUserId == agent.Id &&
                !closedStatusIds.Contains(t.StatusId));

            if (count < bestCount)
            {
                bestCount = count;
                bestId = agent.Id;
            }
        }

        return bestId;
    }

    private async Task EnsureDefaultsAsync()
    {
        if (await _db.SystemSettings.AnyAsync()) return;

        _db.SystemSettings.AddRange(
            new SystemSetting { SettingKey = SystemSettingKeys.AutoAssignEnabled, SettingValue = "false" },
            new SystemSetting { SettingKey = SystemSettingKeys.MaxAttachmentSizeMb, SettingValue = "10" });
        await _db.SaveChangesAsync();
    }

    private async Task<bool> GetBoolAsync(string key)
    {
        await EnsureDefaultsAsync();
        var value = await _db.SystemSettings
            .Where(s => s.SettingKey == key)
            .Select(s => s.SettingValue)
            .FirstOrDefaultAsync();
        return string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);
    }

    private async Task<int> GetIntAsync(string key, int fallback)
    {
        await EnsureDefaultsAsync();
        var value = await _db.SystemSettings
            .Where(s => s.SettingKey == key)
            .Select(s => s.SettingValue)
            .FirstOrDefaultAsync();
        return int.TryParse(value, out var n) ? n : fallback;
    }

    private async Task SetAsync(string key, string value, string userId)
    {
        await EnsureDefaultsAsync();
        var row = await _db.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == key);
        if (row == null)
        {
            _db.SystemSettings.Add(new SystemSetting
            {
                SettingKey = key,
                SettingValue = value,
                UpdatedByUserId = userId
            });
        }
        else
        {
            row.SettingValue = value;
            row.UpdatedAt = DateTime.UtcNow;
            row.UpdatedByUserId = userId;
        }
        await _db.SaveChangesAsync();
    }
}
