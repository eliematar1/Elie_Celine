using ITHelpDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ITHelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly AiService _ai;

    public AiController(AiService ai) => _ai = ai;

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
}

public record AiRequest(string Title, string Description);
public record ChatRequest(string Question);
