using ITHelpDesk.API.Data;
using ITHelpDesk.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.API.Services;

public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        foreach (var role in AppRoles.All)
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));

        await SeedUser(userManager, "admin@ithelpdesk.local", "Admin@123", "System", "Admin", "IT", AppRoles.Admin);
        await SeedUser(userManager, "employee@ithelpdesk.local", "Employee@123", "Demo", "Employee", "Sales", AppRoles.Employee);
        await SeedUser(userManager, "agent@ithelpdesk.local", "Agent@123", "IT", "Agent", "IT Support", AppRoles.Agent);
        await SeedUser(userManager, "manager@ithelpdesk.local", "Manager@123", "Team", "Manager", "Operations", AppRoles.Manager);

        if (!await db.TicketCategories.AnyAsync())
        {
            db.TicketCategories.AddRange(
                new TicketCategory { Name = "Hardware", SortOrder = 1 },
                new TicketCategory { Name = "Software", SortOrder = 2 },
                new TicketCategory { Name = "Network", SortOrder = 3 },
                new TicketCategory { Name = "Email", SortOrder = 4 },
                new TicketCategory { Name = "Access Request", SortOrder = 5 },
                new TicketCategory { Name = "Other", SortOrder = 6 });
            await db.SaveChangesAsync();
        }

        if (!await db.TicketPriorities.AnyAsync())
        {
            db.TicketPriorities.AddRange(
                new TicketPriority { Name = "Low", Level = 1, ColorHex = "#22c55e" },
                new TicketPriority { Name = "Medium", Level = 2, ColorHex = "#eab308" },
                new TicketPriority { Name = "High", Level = 3, ColorHex = "#f97316" },
                new TicketPriority { Name = "Critical", Level = 4, ColorHex = "#ef4444" });
            await db.SaveChangesAsync();
        }

        if (!await db.TicketStatuses.AnyAsync())
        {
            db.TicketStatuses.AddRange(
                new TicketStatus { Name = "Open", SortOrder = 1 },
                new TicketStatus { Name = "In Progress", SortOrder = 2 },
                new TicketStatus { Name = "Pending", SortOrder = 3 },
                new TicketStatus { Name = "Resolved", SortOrder = 4 },
                new TicketStatus { Name = "Closed", IsClosed = true, SortOrder = 5 });
            await db.SaveChangesAsync();
        }

        if (!await db.SystemSettings.AnyAsync())
        {
            db.SystemSettings.AddRange(
                new SystemSetting { SettingKey = SystemSettingKeys.AutoAssignEnabled, SettingValue = "false" },
                new SystemSetting { SettingKey = SystemSettingKeys.MaxAttachmentSizeMb, SettingValue = "10" });
            await db.SaveChangesAsync();
        }

        if (!await db.Tickets.AnyAsync())
        {
            var emp = await userManager.FindByEmailAsync("employee@ithelpdesk.local");
            var agent = await userManager.FindByEmailAsync("agent@ithelpdesk.local");
            if (emp != null && agent != null)
            {
                var emailCat = await db.TicketCategories.FirstAsync(c => c.Name == "Email");
                var netCat = await db.TicketCategories.FirstAsync(c => c.Name == "Network");
                var med = await db.TicketPriorities.FirstAsync(p => p.Name == "Medium");
                var high = await db.TicketPriorities.FirstAsync(p => p.Name == "High");
                var open = await db.TicketStatuses.FirstAsync(s => s.Name == "Open");
                var prog = await db.TicketStatuses.FirstAsync(s => s.Name == "In Progress");

                db.Tickets.AddRange(
                    new Ticket
                    {
                        ReferenceNumber = $"TKT-{DateTime.UtcNow.Year}-00001",
                        Title = "Outlook not syncing",
                        Description = "Emails stuck in outbox since morning.",
                        CategoryId = emailCat.Id, PriorityId = med.Id, StatusId = open.Id,
                        CreatedByUserId = emp.Id, CreatedAt = DateTime.UtcNow.AddDays(-1)
                    },
                    new Ticket
                    {
                        ReferenceNumber = $"TKT-{DateTime.UtcNow.Year}-00002",
                        Title = "VPN connection failed",
                        Description = "Cannot connect to corporate VPN from home.",
                        CategoryId = netCat.Id, PriorityId = high.Id, StatusId = prog.Id,
                        CreatedByUserId = emp.Id, AssignedToUserId = agent.Id,
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    });
                await db.SaveChangesAsync();
            }
        }
    }

    private static async Task SeedUser(
        UserManager<ApplicationUser> userManager,
        string email, string password,
        string firstName, string lastName, string department, string role)
    {
        if (await userManager.FindByEmailAsync(email) != null) return;
        var user = new ApplicationUser
        {
            UserName = email, Email = email, EmailConfirmed = true,
            FirstName = firstName, LastName = lastName, Department = department
        };
        if ((await userManager.CreateAsync(user, password)).Succeeded)
            await userManager.AddToRoleAsync(user, role);
    }
}
