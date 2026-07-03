namespace ITHelpDesk.API.Services;

public class AiService
{
    private static readonly Dictionary<string, string> CategoryKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        ["outlook"] = "Software", ["email"] = "Email", ["vpn"] = "Network",
        ["wifi"] = "Network", ["laptop"] = "Hardware", ["printer"] = "Hardware",
        ["password"] = "Access Request", ["access"] = "Access Request"
    };

    public (string Category, string Priority) Suggest(string title, string description)
    {
        var text = $"{title} {description}".ToLowerInvariant();
        var category = "Other";
        foreach (var kv in CategoryKeywords)
            if (text.Contains(kv.Key)) { category = kv.Value; break; }

        var priority = text.Contains("critical") || text.Contains("server down") || text.Contains("offline")
            ? "Critical"
            : text.Contains("urgent") || text.Contains("cannot work")
                ? "High"
                : "Medium";

        return (category, priority);
    }

    public string SuggestReply(string title, string description) =>
        $"Thank you for reporting \"{title}\". Please try: 1) Restart the application 2) Check network connection 3) Contact IT if issue persists.";

    public string ChatAnswer(string question)
    {
        var q = question.ToLowerInvariant();
        if (q.Contains("vpn")) return "VPN setup: Open Cisco AnyConnect, enter vpn.company.com, use your AD credentials.";
        if (q.Contains("password")) return "Reset password via https://password.company.com or contact IT help desk.";
        if (q.Contains("wifi")) return "Connect to CORP-WIFI using your employee credentials.";
        return "I can help with VPN, password reset, and Wi-Fi. For other issues, please create a support ticket.";
    }

    public AiParsedTicket? ParseTicketShortcut(string shortcut)
    {
        var text = shortcut?.Trim() ?? "";
        if (string.IsNullOrEmpty(text)) return null;

        var remaining = text;
        string? category = null;
        string? priority = null;
        var dueNote = "";

        var categoryNames = new[] { "Hardware", "Software", "Network", "Email", "Access Request", "Other" };
        foreach (var name in categoryNames)
        {
            if (remaining.StartsWith(name, StringComparison.OrdinalIgnoreCase))
            {
                category = name;
                remaining = remaining[name.Length..].TrimStart();
                break;
            }
        }

        var priorityNames = new[] { "Critical", "High", "Medium", "Low" };
        foreach (var name in priorityNames)
        {
            if (remaining.StartsWith(name, StringComparison.OrdinalIgnoreCase))
            {
                priority = name;
                remaining = remaining[name.Length..].TrimStart();
                break;
            }
        }

        priority ??= System.Text.RegularExpressions.Regex.IsMatch(text, @"\b(critical|emergency|server down|outage)\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase) ? "Critical"
            : System.Text.RegularExpressions.Regex.IsMatch(text, @"\b(urgent|asap|high priority|cannot work)\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase) ? "High"
            : System.Text.RegularExpressions.Regex.IsMatch(text, @"\b(low|minor|when possible)\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase) ? "Low"
            : "Medium";

        var dateLead = System.Text.RegularExpressions.Regex.Match(remaining,
            @"^(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (dateLead.Success)
        {
            dueNote = $"\n\nRequested deadline: {dateLead.Groups[1].Value}";
            remaining = remaining[dateLead.Length..].TrimStart();
        }

        var dueMatch = System.Text.RegularExpressions.Regex.Match(text, @"\b(by|before|due)\s+([^.!?\n]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (dueMatch.Success) dueNote = $"\n\nRequested deadline: {dueMatch.Groups[2].Value.Trim()}";

        category ??= Suggest(remaining.Length > 0 ? remaining : text, text).Category;

        var issue = (remaining.Length > 0 ? remaining : text).Trim();
        var firstLine = issue.Split('.', '!', '?', '\n')[0].Trim();
        var title = firstLine.Length > 100 ? firstLine[..97] + "..." : firstLine;
        if (string.IsNullOrEmpty(title)) title = "Support request";

        return new AiParsedTicket(title, text + dueNote, category, priority);
    }

    public AiHelpChatResponse HelpChat(string question)
    {
        var q = question.ToLowerInvariant();
        if (q.Contains("vpn"))
            return new AiHelpChatResponse(
                "For VPN issues, verify Cisco AnyConnect is installed and you are on a stable internet connection.",
                new[] { "Open Cisco AnyConnect and enter vpn.company.com", "Sign in with AD credentials", "Note the exact error if it fails", "Try reconnecting Wi-Fi" },
                q.Contains("still") || q.Contains("not work"));

        if (q.Contains("password") || q.Contains("login"))
            return new AiHelpChatResponse(
                "Password issues are usually fixed via self-service reset or IT unlock.",
                new[] { "Go to https://password.company.com", "Wait 5 minutes after reset", "Check Caps Lock", "Contact IT if locked out" },
                q.Contains("locked") || q.Contains("still"));

        return new AiHelpChatResponse(
            "I am your IT Help Desk assistant. I can guide you through common fixes before opening a ticket.",
            new[] { "Describe when the problem started", "Check if others have the same issue", "Try restarting the app or PC", "Create a ticket if unresolved" },
            true);
    }
}

public record AiParsedTicket(string Title, string Description, string Category, string Priority);
public record AiHelpChatResponse(string Answer, string[] NextSteps, bool SuggestCreateTicket);
