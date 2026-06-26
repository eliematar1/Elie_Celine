using System.ComponentModel.DataAnnotations;
using ITHelpDesk.API.Models;

namespace ITHelpDesk.API.DTOs;

public record RegisterRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    [Required] string FirstName,
    [Required] string LastName,
    string? Department,
    string Role = AppRoles.Employee
);

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    UserProfileDto User
);

public record UserProfileDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    string? Department,
    IReadOnlyList<string> Roles
);

public record UpdateProfileRequest(
    [Required] string FirstName,
    [Required] string LastName,
    string? Department
);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required][MinLength(6)] string NewPassword
);
