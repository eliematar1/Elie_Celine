namespace ITHelpDesk.API.DTOs;

public record SystemSettingsDto(bool AutoAssignEnabled, int MaxAttachmentSizeMb);

public record UpdateSystemSettingsRequest(bool AutoAssignEnabled, int MaxAttachmentSizeMb);
