using ITHelpDesk.API.Data;
using ITHelpDesk.API.DTOs;
using ITHelpDesk.API.Models;
using ITHelpDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ActivityLogService _activityLog;
    private readonly ApplicationDbContext _db;

    public UsersController(
        UserManager<ApplicationUser> userManager,
        ActivityLogService activityLog,
        ApplicationDbContext db)
    {
        _userManager = userManager;
        _activityLog = activityLog;
        _db = db;
    }

    [HttpGet]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> List()
    {
        var users = _userManager.Users.OrderBy(u => u.Email).ToList();
        var result = new List<object>();
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            result.Add(new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Department,
                u.IsActive,
                Roles = roles,
                u.LastLoginAt
            });
        }
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Create([FromBody] AdminCreateUserRequest request)
    {
        if (!AppRoles.All.Contains(request.Role))
            return BadRequest(new { message = "Invalid role." });

        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing != null)
            return BadRequest(new { message = "Email already registered." });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Department = request.Department,
            IsActive = true,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = "User creation failed.", errors = result.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(user, request.Role);

        var adminId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (adminId != null)
            await _activityLog.LogAsync(adminId, "UserCreated", "User", user.Id, $"Role: {request.Role}");

        var roles = await _userManager.GetRolesAsync(user);
        return CreatedAtAction(nameof(List), new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Department,
            user.IsActive,
            Roles = roles,
            user.LastLoginAt,
        });
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateUserStatusRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found." });

        var adminId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (adminId == id && !request.IsActive)
            return BadRequest(new { message = "You cannot deactivate your own account." });

        user.IsActive = request.IsActive;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to update user status.", errors = result.Errors.Select(e => e.Description) });

        if (adminId != null)
        {
            var action = request.IsActive ? "UserActivated" : "UserDeactivated";
            await _activityLog.LogAsync(adminId, action, "User", user.Id);
        }

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Department,
            user.IsActive,
            Roles = roles,
            user.LastLoginAt,
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Delete(string id)
    {
        var adminId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (adminId == id)
            return BadRequest(new { message = "You cannot delete your own account." });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found." });

        var hasHistory = user.LastLoginAt != null || await HasUserActivityAsync(user.Id);

        if (hasHistory)
            return BadRequest(new { message = "User has activity history. Deactivate the account instead of deleting." });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to delete user.", errors = result.Errors.Select(e => e.Description) });

        if (adminId != null)
            await _activityLog.LogAsync(adminId, "UserDeleted", "User", user.Id);

        return NoContent();
    }

    private Task<bool> HasUserActivityAsync(string userId) =>
        Task.FromResult(
            _db.Tickets.Any(t => t.CreatedByUserId == userId || t.AssignedToUserId == userId)
            || _db.TicketComments.Any(c => c.UserId == userId)
            || _db.TicketAssignments.Any(a => a.AssignedToUserId == userId || a.AssignedByUserId == userId));

    [HttpGet("roles")]
    [Authorize(Roles = AppRoles.Admin)]
    public IActionResult Roles() => Ok(AppRoles.All);

    [HttpGet("agents")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Agent}")]
    public async Task<IActionResult> Agents()
    {
        var agents = await _userManager.GetUsersInRoleAsync(AppRoles.Agent);
        return Ok(agents.Where(a => a.IsActive).Select(a => new { a.Id, a.FirstName, a.LastName, a.Email }));
    }
}
