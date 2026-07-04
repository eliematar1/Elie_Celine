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
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly JwtTokenService _jwt;
    private readonly ActivityLogService _activityLog;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        JwtTokenService jwt,
        ActivityLogService activityLog)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwt = jwt;
        _activityLog = activityLog;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
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
            Department = request.Department
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = "Registration failed.", errors = result.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(user, request.Role);
        await _activityLog.LogAsync(user.Id, "UserRegistered", "User", user.Id, $"Role: {request.Role}");

        return await BuildAuthResponse(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !user.IsActive)
            return Unauthorized(new { message = "Invalid email or password." });

        var check = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!check.Succeeded)
            return Unauthorized(new { message = "Invalid email or password." });

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
        await _activityLog.LogAsync(user.Id, "UserLogin", "User", user.Id);

        return await BuildAuthResponse(user);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();
        return Ok(await ToProfile(user));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Department = request.Department;
        await _userManager.UpdateAsync(user);
        await _activityLog.LogAsync(user.Id, "ProfileUpdated", "User", user.Id);

        return Ok(await ToProfile(user));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { message = "Password change failed.", errors = result.Errors.Select(e => e.Description) });

        await _activityLog.LogAsync(user.Id, "PasswordChanged", "User", user.Id);
        return Ok(new { message = "Password updated successfully." });
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpGet("activity-logs")]
    public async Task<IActionResult> ActivityLogs([FromServices] ApplicationDbContext db)
    {
        var logs = db.ActivityLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(50)
            .Select(l => new { l.Id, l.UserId, l.Action, l.Details, l.CreatedAt })
            .ToList();
        return Ok(logs);
    }

    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Manager}")]
    [HttpGet("admin-only")]
    public IActionResult AdminOnly() =>
        Ok(new { message = "You have Admin or Manager access." });

    [Authorize(Roles = AppRoles.Agent)]
    [HttpGet("agent-only")]
    public IActionResult AgentOnly() =>
        Ok(new { message = "You have IT Support Agent access." });

    private async Task<ActionResult<AuthResponse>> BuildAuthResponse(ApplicationUser user)
    {
        var (token, expires) = await _jwt.CreateTokenAsync(user, _userManager);
        var profile = await ToProfile(user);
        return Ok(new AuthResponse(token, expires, profile));
    }

    private async Task<UserProfileDto> ToProfile(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new UserProfileDto(
            user.Id,
            user.Email ?? "",
            user.FirstName,
            user.LastName,
            user.Department,
            roles.ToList());
    }
}
