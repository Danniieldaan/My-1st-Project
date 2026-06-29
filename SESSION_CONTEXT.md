# FrameERP — Session Context

## Project
Single-file HTML/JS ERP system for a Nigerian picture framing business.
- **File**: `FrameERP.html`
- **Location**: `C:\framing-erp\`
- **Git**: https://github.com/Danniieldaan/My-1st-Project

## Current State (Session 1 — Complete)

### Architecture
- Single HTML file, no backend, all data in-memory (`DB` object)
- Navigation via sidebar (`SBs`), pages rendered via `set()` into `#content`
- Currency: `₦` with Nigerian locale formatting

### Pages Implemented
- **Dashboard/Quick View**: KPIs (revenue, outstanding, payroll, active jobs) + 8 quick-action tiles
- **Customers**: List with search, add/edit forms with credit limit, balance, sales rep
- **Quotes List**: Table with search, dark `#1e293b` header, Actions dropdown (right-aligned, smart flip up/down, viewport-safe)
- **Quote Form**: 3-column card layout (Customer Details, Quote Details, Delivery Address), items table with row-level +/− buttons, starts with 1 blank row, Terms/Message + Summary card, Status footer
- **Receipt List**: Table with search
- **Receipt Form**: 65/35 split (Customer & Receipt Details / Payment Method radio buttons), Unpaid Invoices table with checkboxes, 5 action buttons (Process, Process & New, Process & Print, Process & Email, Cancel)
- **Production**: Active jobs with stage assign/complete, completed jobs log, stage overview
- **Payroll**: Weekly view per artisan with date override for split-week pay
- **Settings**: Sales rep management, commission rate editing
- **Commission**: Reference matrix

### Frame Types (3 only)
- Stretched Canvas (3 stages: WoodCut, WoodJoin, Stretch)
- Floating Frame (5 stages: WoodCut, WoodJoin, FrameCut, FrameJoin, Assembly)
- Glass Frame (all 7 stages + Stretch, GlassCut)

### Quote Status Lifecycle
- `Quoted` → `In Progress` (via "Send to Production" in modal) → `Completed` (auto when receipt covers balance)

### Key Design Decisions
- Actions dropdown: text-only flat list (Quick View, Edit, Delete, Add Quote, Print), right-aligned, `right: 0`, smart vertical flip at 180px threshold, viewport horizontal guard
- Items table: neutral grey +/− buttons (`.bd`), proper column order (Unit Price before Disc), `.qi` CSS class for uniform inline inputs
- Customer selector: search input with magnifier icon + dropdown
- Receipt: radio buttons for payment method (Cash default), checkboxes to allocate invoices
- `</script>` in JS template literals must use `</s${'cript'}>`
- Delete cascades: removes quote, linked items, and orphaned tracker entries

### Sales Reps & Commission
- Default reps: Oyindamola, Kunle, Seun, Tunde, Bello, Chidi, Yemi
- Oyindamola is pre-selected on new quote forms
- Commission splits evenly among artisans on a stage
- Size tiers: Small (<60×90), Medium (60-70×90-140), Large (≥80×160)

### Data Seed
- 3 customers (Adaeze, Emeka, Fatima), 3 quotes (1 In Progress, 1 Quoted, 1 Completed), 4 items, 7 tracker entries, 0 receipts

### Pending / Known Issues
- No localStorage persistence — data resets on refresh
- No partial payment allocation per invoice
- User may have screenshots/Excel for production page refinements

### How to Resume
Start a new opencode session with:
```
cd C:\framing-erp
opencode
```
Then say: "Read SESSION_CONTEXT.md and FrameERP.html to pick up where we left off."
