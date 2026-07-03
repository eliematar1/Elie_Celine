using ITHelpDesk.API.Models;

namespace ITHelpDesk.API.Services;

public class TicketWorkflowService
{
    private static readonly HashSet<string> WorkingStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "In Progress", "Pending"
    };

    public static TicketState GetState(TicketStatus? status) => new(
        status?.Name ?? "",
        status?.IsClosed == true || status?.Name is "Resolved" or "Closed",
        status != null && WorkingStatuses.Contains(status.Name),
        status?.Name == "Open"
    );

    public static TicketPermissionsDto GetPermissions(
        Ticket ticket, TicketState state, ApplicationUser user, IList<string> roles)
    {
        var isAdmin = roles.Contains(AppRoles.Admin);
        var isAgent = roles.Contains(AppRoles.Agent);
        var isManager = roles.Contains(AppRoles.Manager);
        var isStaff = isAdmin || isAgent;
        var isUnassigned = string.IsNullOrEmpty(ticket.AssignedToUserId);
        var isOwner = ticket.CreatedByUserId == user.Id;

        if (isManager && !isAdmin)
        {
            if (state.IsClosed)
            {
                return new TicketPermissionsDto(
                    IsReadOnly: true,
                    CanEditDetails: false,
                    CanDelete: false,
                    CanAssign: false,
                    CanComment: false,
                    CanUpload: false,
                    CanChangeStatus: false,
                    CanReopen: false,
                    CanDuplicate: false,
                    CanEscalate: false
                );
            }

            return new TicketPermissionsDto(
                IsReadOnly: false,
                CanEditDetails: false,
                CanDelete: false,
                CanAssign: true,
                CanComment: true,
                CanUpload: false,
                CanChangeStatus: false,
                CanReopen: false,
                CanDuplicate: false,
                CanEscalate: false
            );
        }

        if (state.IsClosed)
        {
            return new TicketPermissionsDto(
                IsReadOnly: true,
                CanEditDetails: false,
                CanDelete: false,
                CanAssign: false,
                CanComment: false,
                CanUpload: false,
                CanChangeStatus: false,
                CanReopen: isStaff,
                CanDuplicate: true,
                CanEscalate: false
            );
        }

        if (state.IsWorking)
        {
            var canEditAsOwner = isOwner && state.StatusName.Equals("Pending", StringComparison.OrdinalIgnoreCase);
            return new TicketPermissionsDto(
                IsReadOnly: false,
                CanEditDetails: canEditAsOwner,
                CanDelete: false,
                CanAssign: isStaff || (isManager && !isAdmin),
                CanComment: true,
                CanUpload: true,
                CanChangeStatus: isStaff,
                CanReopen: false,
                CanDuplicate: true,
                CanEscalate: isAdmin
            );
        }

        return new TicketPermissionsDto(
            IsReadOnly: false,
            CanEditDetails: isAdmin || isOwner,
            CanDelete: isAdmin && isUnassigned && state.IsOpen,
            CanAssign: isStaff || (isManager && !isAdmin),
            CanComment: true,
            CanUpload: true,
            CanChangeStatus: isStaff,
            CanReopen: false,
            CanDuplicate: true,
            CanEscalate: false
        );
    }

    public static void ValidateDetailUpdate(TicketPermissionsDto permissions)
    {
        if (!permissions.CanEditDetails)
            throw new InvalidOperationException("Ticket details cannot be edited while in progress or closed.");
    }

    public static void ValidateDelete(TicketPermissionsDto permissions)
    {
        if (!permissions.CanDelete)
            throw new InvalidOperationException("Only unassigned open tickets can be deleted.");
    }
}

public record TicketState(string StatusName, bool IsClosed, bool IsWorking, bool IsOpen);

public record TicketPermissionsDto(
    bool IsReadOnly,
    bool CanEditDetails,
    bool CanDelete,
    bool CanAssign,
    bool CanComment,
    bool CanUpload,
    bool CanChangeStatus,
    bool CanReopen,
    bool CanDuplicate,
    bool CanEscalate
);
