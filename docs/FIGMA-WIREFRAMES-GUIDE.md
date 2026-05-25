# How to Create Wireframes in Figma for Submission

**Team:** Celine Mortada & Elie Matar  
**Tool:** [Figma](https://www.figma.com) (free for students)  
**Reference:** HTML wireframes in `wireframes/` folder

---

## Option A — Fastest: Screenshot → Figma (30–60 min)

Use your existing HTML wireframes as the base.

### Step 1 — Capture screens

1. Run the project: `npm start` → open http://localhost:8080/wireframes/index.html
2. Open each page (Login, Dashboard, Ticket List, etc.)
3. Screenshot each full page (**Win + Shift + S**)
4. Save as PNG: `01-login.png`, `02-dashboard.png`, …

### Step 2 — Create Figma file

1. Go to https://www.figma.com → **Sign up** (free)
2. **New design file** → name: `IT Help Desk — Wireframes`
3. Create pages (tabs at top):
   - `Cover`
   - `Wireframes`
   - `Flows` (optional)

### Step 3 — Import screenshots

1. On **Wireframes** page: **File → Place image** (or drag PNG onto canvas)
2. Place each screenshot in a row with labels:
   - Frame title: `Login`, `Register`, `Dashboard`, etc.
3. Add a **Cover** frame (1920×1080):
   - Title: IT Help Desk & Ticketing System
   - Subtitle: Celine Mortada & Elie Matar — Week 1 Wireframes
   - Date, GitHub link

### Step 4 — Export for transmission

| To send to instructor | How |
|----------------------|-----|
| **Figma link** | Share → Copy link → Anyone with link can view |
| **PDF** | File → Export → PDF (all frames) |
| **PNG pack** | Select frames → Export → PNG @2x |
| **.fig file** | File → Save (cloud) or duplicate to team |

**Recommended for submission:** Share link + PDF export.

---

## Option B — Proper Figma wireframes (2–4 hours, better grade)

Build low-fidelity frames in Figma (matches internship “Figma” requirement).

### Setup

1. **Frame size:** Desktop `1440 × 900` (main), Mobile `390 × 844` (optional)
2. **Layout grid:** 12 columns, margin 80, gutter 24
3. **Colors (wireframe only):**
   - Background: `#F5F5F5`
   - Boxes: `#E0E0E0`
   - Text: `#333333`
   - Primary button: `#90CDF4` (light blue)
   - Sidebar: `#2D3748`

### Components to create once (reuse)

| Component | Description |
|-----------|-------------|
| `Sidebar` | Logo + 6 nav items (Dashboard, Tickets, Create, Notifications, Reports, Admin) |
| `Topbar` | Search bar + bell + user dropdown |
| `Button/Primary` | Rounded rect + label |
| `Button/Secondary` | Gray outline |
| `Input` | Label + gray rectangle |
| `Card` | White/dashed border container |
| `Table Row` | 6 columns for ticket list |
| `Badge/Status` | Pill: Open, In Progress, etc. |
| `Badge/Priority` | Pill: Low, Medium, High, Critical |

**Tip:** Select element → right panel → **Create component** (Ctrl+Alt+K).

### Frames to build (9 required pages)

Copy structure from `wireframes/*.html`:

| # | Frame name | Key elements |
|---|------------|--------------|
| 1 | Login | Logo, email, password, Sign In, Forgot password, Register link |
| 2 | Register | First/last name, email, department, password, confirm |
| 3 | Dashboard | 4 stat cards, 2 chart placeholders, recent tickets table |
| 4 | Ticket List | Filters, New Ticket button, data table, pagination |
| 5 | Ticket Detail | Description, comments, attachments, sidebar details, timeline |
| 6 | Create Ticket | AI assistant box, title, description, category, priority, upload |
| 7 | Notifications | List of notification cards, Mark all read |
| 8 | User Profile | Avatar, profile fields, change password section |
| 9 | Reports | Date filters, Export PDF/Excel, charts, agent table |
| 10 | Admin Settings | Tabs: Users, Roles, Categories; user table, settings |

### Wireframe style rules

- Use **rectangles** and **text** only — no photos, no final branding
- Label placeholders: `[ Bar Chart ]`, `[ Search... ]`
- Font: **Inter** or **Roboto**, 12–14px body, 20–24px titles
- Use **dashed strokes** on cards (Stroke → Dashed) to show “mockup”

---

## Option C — Figma Community template (starter)

1. Figma → **Community** (left sidebar)
2. Search: `dashboard wireframe` or `SaaS wireframe kit`
3. **Duplicate** a free kit
4. Rename frames to match your pages (Login, Tickets, etc.)
5. Adjust sidebar labels to IT Help Desk nav

---

## User flow page (bonus for submission)

On **Flows** page, add simple connectors:

```
Login → Dashboard → Ticket List → Ticket Detail
Employee: Dashboard → Create Ticket → Ticket Detail
Admin: Admin Settings → User management
```

Use **FigJam** (Figma → New FigJam file) for flowcharts, or Mermaid export from `docs/02-system-workflows.md` as screenshot.

---

## What to transmit (email / Moodle / GitHub)

### Package checklist

- [ ] Figma share link (View access)
- [ ] `IT-HelpDesk-Wireframes.pdf` (exported)
- [ ] Optional: ZIP of PNGs @2x
- [ ] GitHub repo link: https://github.com/eliematar1/Elie_Celine
- [ ] Note: “Wireframes align with `wireframes/` HTML mockups in repo”

### Figma share steps

1. Click **Share** (top right)
2. Invite: instructor email **or** set “Anyone with the link” → **can view**
3. Copy link → paste in weekly report

### PDF export steps

1. Select **Wireframes** page (or all frames)
2. Right sidebar → **Export** section
3. Add format **PDF**
4. Click **Export Wireframes**

---

## Frame list template (copy into Figma)

```
IT Help Desk Wireframes
├── Cover
├── 01 - Login
├── 02 - Register
├── 03 - Dashboard
├── 04 - Ticket List
├── 05 - Ticket Detail
├── 06 - Create Ticket
├── 07 - Notifications
├── 08 - User Profile
├── 09 - Reports
├── 10 - Admin Settings
└── Mobile - Dashboard (optional)
```

---

## Match PDF / internship requirements

| Requirement | Figma coverage |
|-------------|----------------|
| Login/Register | Frames 01–02 |
| Dashboard | Frame 03 |
| Ticket List / Detail / Create | Frames 04–06 |
| Reports | Frame 09 |
| Notifications | Frame 07 |
| User Profile | Frame 08 |
| Admin Settings | Frame 10 |
| Responsive | Duplicate key frames at 390px width |
| Sidebar navigation | `Sidebar` component on all app pages |

---

## Free learning (from your assignment)

- [Figma UI Design Crash Course](https://www.youtube.com/results?search_query=figma+ui+design+crash+course) (YouTube)
- [Figma Wireframe tutorial](https://help.figma.com/hc/en-us/articles/360040328374)

---

## Quick reference — your HTML → Figma mapping

| HTML file | Figma frame |
|-----------|-------------|
| `wireframes/login.html` | 01 - Login |
| `wireframes/register.html` | 02 - Register |
| `wireframes/dashboard.html` | 03 - Dashboard |
| `wireframes/ticket-list.html` | 04 - Ticket List |
| `wireframes/ticket-detail.html` | 05 - Ticket Detail |
| `wireframes/create-ticket.html` | 06 - Create Ticket |
| `wireframes/notifications.html` | 07 - Notifications |
| `wireframes/profile.html` | 08 - User Profile |
| `wireframes/reports.html` | 09 - Reports |
| `wireframes/admin.html` | 10 - Admin Settings |

Open http://localhost:8080/wireframes/ side-by-side with Figma while building.
