namespace ITHelpDesk.API.Models;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Agent = "IT Support Agent";
    public const string Employee = "Employee";
    public const string Manager = "Manager";

    public static readonly string[] All = { Admin, Agent, Employee, Manager };
}
