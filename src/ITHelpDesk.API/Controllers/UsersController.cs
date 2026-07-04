using ITHelpDesk.API.Models;
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

    public UsersController(UserManager<ApplicationUser> userManager) => _userManager = userManager;

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

    [HttpGet("roles")]
    public IActionResult Roles() => Ok(AppRoles.All);

    [HttpGet("agents")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Agent},{AppRoles.Manager}")]
    public async Task<IActionResult> Agents()
    {
        var agents = await _userManager.GetUsersInRoleAsync(AppRoles.Agent);
        var result = agents
            .Where(u => u.IsActive)
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .Select(u => new
            {
                u.Id,
                Name = string.Join(' ', new[] { u.FirstName, u.LastName }.Where(x => !string.IsNullOrWhiteSpace(x))),
                u.Email,
                u.Department
            });

        return Ok(result);
    }
}
