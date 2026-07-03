using ITHelpDesk.API.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ITHelpDesk.API.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<TicketCategory> TicketCategories => Set<TicketCategory>();
    public DbSet<TicketPriority> TicketPriorities => Set<TicketPriority>();
    public DbSet<TicketStatus> TicketStatuses => Set<TicketStatus>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketComment> TicketComments => Set<TicketComment>();
    public DbSet<TicketAttachment> TicketAttachments => Set<TicketAttachment>();
    public DbSet<TicketAssignment> TicketAssignments => Set<TicketAssignment>();
    public DbSet<TicketStatusHistory> TicketStatusHistory => Set<TicketStatusHistory>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<ApplicationUser>(e =>
        {
            e.Property(u => u.FirstName).HasMaxLength(100);
            e.Property(u => u.LastName).HasMaxLength(100);
            e.Property(u => u.Department).HasMaxLength(100);
        });
        builder.Entity<Ticket>(e =>
        {
            e.HasIndex(t => t.ReferenceNumber).IsUnique();
            e.HasOne(t => t.Category).WithMany().HasForeignKey(t => t.CategoryId);
            e.HasOne(t => t.Priority).WithMany().HasForeignKey(t => t.PriorityId);
            e.HasOne(t => t.Status).WithMany().HasForeignKey(t => t.StatusId);
            e.HasOne(t => t.CreatedBy).WithMany().HasForeignKey(t => t.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(t => t.AssignedTo).WithMany().HasForeignKey(t => t.AssignedToUserId).OnDelete(DeleteBehavior.SetNull);
        });
        builder.Entity<TicketComment>().HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Notification>().HasIndex(n => new { n.UserId, n.IsRead });
        builder.Entity<SystemSetting>(e =>
        {
            e.HasIndex(s => s.SettingKey).IsUnique();
            e.Property(s => s.SettingKey).HasMaxLength(100);
        });
    }
}
