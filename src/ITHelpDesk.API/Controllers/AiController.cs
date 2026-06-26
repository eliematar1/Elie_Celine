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

    [HttpPost("summary")]
    public IActionResult Summary([FromBody] SummaryRequest request)
    {
        var summary = _ai.GenerateSummary(request.Title, request.Description, request.StatusHistory ?? "");
        return Ok(new { summary });
    }

    [HttpPost("troubleshoot")]
    public IActionResult Troubleshoot([FromBody] TroubleshootRequest request)
    {
        var steps = _ai.GenerateTroubleshooting(request.Title, request.Description, request.Category);
        return Ok(new { steps });
    }
}

public record AiRequest(string Title, string Description);
public record ChatRequest(string Question);
public record SummaryRequest(string Title, string Description, string? StatusHistory);
public record TroubleshootRequest(string Title, string Description, string Category);