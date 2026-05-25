# How to Get ERD & SQL Pictures for Submission

## Files you submit (no screenshot needed)

| File | Path |
|------|------|
| Full SQL (schema + seed) | `database/ITHelpDesk-COMPLETE.sql` |
| Schema only | `database/schema.sql` |
| Seed data | `database/seed-data.sql` |
| Draw.io ERD (edit/export) | `diagrams/erd.drawio` |
| ERD documentation | `docs/04-database-erd.md` |

---

## Pictures (screenshot these)

### Option A — ERD diagram (fastest)

1. Open in browser:
   ```
   diagrams/erd-visual.html
   ```
2. Press **Win + Shift + S** → capture full diagram.
3. Save as `ERD-Diagram.png`.

### Option B — Database schema overview

1. Open:
   ```
   diagrams/database-tables-visual.html
   ```
2. Screenshot → save as `Database-Schema.png`.

### Option C — Draw.io (instructor-preferred tool)

1. Go to https://app.diagrams.net
2. **File → Open** → select `diagrams/erd.drawio`
3. **File → Export as → PNG** (300 DPI) → `ERD-Diagram.png`

### Option D — SSMS screenshot (proves SQL works)

1. Open **SQL Server Management Studio**.
2. Run `database/ITHelpDesk-COMPLETE.sql`.
3. Expand **ITHelpDesk → Tables**.
4. Screenshot the table list → `SQL-Tables-SSMS.png`.

---

## Quick open (Windows)

```powershell
start "" "d:\.Download\ITHELPDESK\Elie_Celine\diagrams\erd-visual.html"
start "" "d:\.Download\ITHELPDESK\Elie_Celine\diagrams\database-tables-visual.html"
```

---

## GitHub link

https://github.com/eliematar1/Elie_Celine

Upload: SQL files + PNG screenshots + link in weekly report.
