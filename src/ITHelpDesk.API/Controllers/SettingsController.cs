using ITHelpDesk.API.DTOs;
using ITHelpDesk.API.Models;
using ITHelpDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.API.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly SystemSettingsService _settings;

    public SettingsController(SystemSettingsService settings) => _settings = settings;

    [HttpGet]
    public async Task<ActionResult<SystemSettingsDto>> Get() => Ok(await _settings.GetAsync());

    [HttpPut]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<SystemSettingsDto>> Update([FromBody] UpdateSystemSettingsRequest request)
    {
        if (request.MaxAttachmentSizeMb < 1 || request.MaxAttachmentSizeMb > 50)
            return BadRequest(new { message = "Max attachment size must be between 1 and 50 MB." });

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? "";
        return Ok(await _settings.UpdateAsync(request, userId));
    }
}
