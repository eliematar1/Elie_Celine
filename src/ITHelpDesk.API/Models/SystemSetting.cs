namespace ITHelpDesk.API.Models;

public class SystemSetting
{
    public int Id { get; set; }
    public string SettingKey { get; set; } = "";
    public string SettingValue { get; set; } = "";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
}

public static class SystemSettingKeys
{
    public const string AutoAssignEnabled = "AutoAssignEnabled";
    public const string MaxAttachmentSizeMb = "MaxAttachmentSizeMb";
}
