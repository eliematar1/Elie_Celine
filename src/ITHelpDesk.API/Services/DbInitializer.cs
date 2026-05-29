using ITHelpDesk.API.Models;
using Microsoft.AspNetCore.Identity;

namespace ITHelpDesk.API.Services;

public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        foreach (var role in AppRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        const string adminEmail = "admin@ithelpdesk.local";
        if (await userManager.FindByEmailAsync(adminEmail) == null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FirstName = "System",
                LastName = "Admin",
                Department = "IT"
            };
            var result = await userManager.CreateAsync(admin, "Admin@123");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, AppRoles.Admin);
        }

        const string employeeEmail = "employee@ithelpdesk.local";
        if (await userManager.FindByEmailAsync(employeeEmail) == null)
        {
            var emp = new ApplicationUser
            {
                UserName = employeeEmail,
                Email = employeeEmail,
                EmailConfirmed = true,
                FirstName = "Demo",
                LastName = "Employee",
                Department = "Sales"
            };
            var result = await userManager.CreateAsync(emp, "Employee@123");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(emp, AppRoles.Employee);
        }
    }
}
