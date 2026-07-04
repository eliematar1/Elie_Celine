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
    public string GenerateSummary(string title, string description, string statusHistory)
{
    var prompt = $"Summarize this IT support ticket in 2-3 sentences:\nTitle: {title}\nDescription: {description}\nStatus: {statusHistory}";
    
    var response = ChatAnswer($"Summarize: {title} - {description}");
    
    if (string.IsNullOrEmpty(response) || response.Contains("I can help with"))
    {
        return $"Ticket: {title}\nIssue: {description.Substring(0, Math.Min(100, description.Length))}...\nStatus: {statusHistory}";
    }
    
    return response;
}

public string GenerateTroubleshooting(string title, string description, string category)
{
    var prompt = $"Provide 3 troubleshooting steps for this issue:\nCategory: {category}\nTitle: {title}\nDescription: {description}";
    
    var response = ChatAnswer($"How to fix: {title} {category}");
    
    if (string.IsNullOrEmpty(response) || response.Contains("I can help with"))
    {
        return $"1. Restart the application\n2. Check your internet connection\n3. Contact IT support if the issue persists";
    }
    
    return response;
}
}
