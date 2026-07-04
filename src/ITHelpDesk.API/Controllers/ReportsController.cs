using ITHelpDesk.API.Data;
using ITHelpDesk.API.DTOs;
using ITHelpDesk.API.Models;
using ITHelpDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using OfficeOpenXml;
using ClosedXML.Excel;
namespace ITHelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Manager}")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly TicketService _tickets;
    private readonly UserManager<ApplicationUser> _userManager;

    public ReportsController(ApplicationDbContext db, TicketService tickets, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _tickets = tickets;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<ReportDto>> Get()
    {
        var user = await _userManager.GetUserAsync(User);
        var roles = await _userManager.GetRolesAsync(user!);
        var q = _tickets.QueryForUser(user!, roles);

        var total = await q.CountAsync();
        var resolved = await q.CountAsync(t => t.ResolvedAt != null);
        var resolvedTickets = await q.Where(t => t.ResolvedAt != null).ToListAsync();
        var avgDays = resolvedTickets.Count > 0
            ? resolvedTickets.Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalDays)
            : 0;

        var agents = await _userManager.GetUsersInRoleAsync(AppRoles.Agent);
        var perf = new List<AgentPerformanceDto>();
        foreach (var agent in agents)
        {
            var agentTickets = await q.Where(t => t.AssignedToUserId == agent.Id).ToListAsync();
            var res = agentTickets.Count(t => t.ResolvedAt != null);
            var open = agentTickets.Count(t => t.ResolvedAt == null);
            var avg = agentTickets.Where(t => t.ResolvedAt != null)
                .Select(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalDays).DefaultIfEmpty(0).Average();
            perf.Add(new AgentPerformanceDto($"{agent.FirstName} {agent.LastName}", res, open, Math.Round(avg, 1)));
        }

        return Ok(new ReportDto(total, resolved, Math.Round(avgDays, 1), perf));
    }

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv()
    {
        var user = await _userManager.GetUserAsync(User);
        var roles = await _userManager.GetRolesAsync(user!);
        var tickets = await _tickets.QueryForUser(user!, roles)
            .OrderByDescending(t => t.CreatedAt).Take(500).ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Reference,Title,Category,Priority,Status,Created,Assigned To,Created By");
        foreach (var t in tickets)
        {
            var assigned = t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : "";
            var created = $"{t.CreatedBy.FirstName} {t.CreatedBy.LastName}";
            sb.AppendLine($"{t.ReferenceNumber},{t.Title},{t.Category.Name},{t.Priority.Name},{t.Status.Name},{t.CreatedAt:yyyy-MM-dd},{assigned},{created}");
        }

        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", "tickets-report.csv");
    }

    [HttpGet("export/pdf")]
    public async Task<IActionResult> ExportPdf()
    {
        var user = await _userManager.GetUserAsync(User);
        var roles = await _userManager.GetRolesAsync(user!);
        var tickets = await _tickets.QueryForUser(user!, roles)
            .OrderByDescending(t => t.CreatedAt).Take(500).ToListAsync();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);

                page.Header().Text("IT Help Desk - Ticket Report")
                    .FontSize(18).Bold().FontColor(Colors.Blue.Darken2);

                page.Content().Column(column =>
                {
                    column.Item().Text($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC")
                        .FontSize(10).FontColor(Colors.Grey.Medium);

                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Text("Ref").Bold();
                            header.Cell().Text("Title").Bold();
                            header.Cell().Text("Category").Bold();
                            header.Cell().Text("Priority").Bold();
                            header.Cell().Text("Status").Bold();
                            header.Cell().Text("Created").Bold();
                            header.Cell().Text("Assigned").Bold();
                        });

                        foreach (var t in tickets.Take(50))
                        {
                            var assigned = t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : "-";
                            table.Cell().Text(t.ReferenceNumber).FontSize(8);
                            table.Cell().Text(t.Title).FontSize(8);
                            table.Cell().Text(t.Category.Name).FontSize(8);
                            table.Cell().Text(t.Priority.Name).FontSize(8);
                            table.Cell().Text(t.Status.Name).FontSize(8);
                            table.Cell().Text(t.CreatedAt.ToString("yyyy-MM-dd")).FontSize(8);
                            table.Cell().Text(assigned).FontSize(8);
                        }
                    });

                    if (tickets.Count > 50)
                    {
                        column.Item().Text($"Showing first 50 of {tickets.Count} tickets")
                            .FontSize(9).FontColor(Colors.Grey.Medium);
                    }
                });

                page.Footer().Text(text =>
                {
                    text.Span("Page ").FontSize(10);
                    text.CurrentPageNumber().FontSize(10);
                });
            });
        });

        var pdfBytes = document.GeneratePdf();
        return File(pdfBytes, "application/pdf", "tickets-report.pdf");
    }
   [HttpGet("export/excel")]
public async Task<IActionResult> ExportExcel()
{
    var user = await _userManager.GetUserAsync(User);
    var roles = await _userManager.GetRolesAsync(user!);
    var tickets = await _tickets.QueryForUser(user!, roles)
        .OrderByDescending(t => t.CreatedAt).Take(500).ToListAsync();

    using var workbook = new ClosedXML.Excel.XLWorkbook();
    var worksheet = workbook.Worksheets.Add("Tickets");

    worksheet.Cell(1, 1).Value = "Reference";
    worksheet.Cell(1, 2).Value = "Title";
    worksheet.Cell(1, 3).Value = "Category";
    worksheet.Cell(1, 4).Value = "Priority";
    worksheet.Cell(1, 5).Value = "Status";
    worksheet.Cell(1, 6).Value = "Created";
    worksheet.Cell(1, 7).Value = "Assigned To";
    worksheet.Cell(1, 8).Value = "Created By";

    int row = 2;
    foreach (var t in tickets)
    {
        var assigned = t.AssignedTo != null ? $"{t.AssignedTo.FirstName} {t.AssignedTo.LastName}" : "";
        var created = $"{t.CreatedBy.FirstName} {t.CreatedBy.LastName}";
        worksheet.Cell(row, 1).Value = t.ReferenceNumber;
        worksheet.Cell(row, 2).Value = t.Title;
        worksheet.Cell(row, 3).Value = t.Category.Name;
        worksheet.Cell(row, 4).Value = t.Priority.Name;
        worksheet.Cell(row, 5).Value = t.Status.Name;
        worksheet.Cell(row, 6).Value = t.CreatedAt.ToString("yyyy-MM-dd");
        worksheet.Cell(row, 7).Value = assigned;
        worksheet.Cell(row, 8).Value = created;
        row++;
    }

    worksheet.Columns().AdjustToContents();

    using var stream = new MemoryStream();
    workbook.SaveAs(stream);
    var bytes = stream.ToArray();
    
    return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "tickets-report.xlsx");
}
}