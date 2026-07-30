# Design System and Screen Audit Program
Last updated: 2026-07-30

Preset: `saas-dashboard`

## Objective

Audit every rendered product screen and converge the platform on a centralized,
accessible Shadcn system without destabilizing the live CEP workflow.

## Scoring rubric

Each screen receives integer scores from 1–5 for:

1. Dashboard ergonomics.
2. Layout and composition.
3. Interaction design.
4. Accessibility.
5. Frontend implementation.
6. Production polish.
7. Design-system consistency.

Every score requires desktop and mobile evidence. A screen cannot be accepted
from source inspection alone when it can be rendered.

## Required states per screen

- [ ] Normal data.
- [ ] Empty.
- [ ] Loading.
- [ ] Error.
- [ ] Long text and large values.
- [ ] Permission-limited.
- [ ] Keyboard focus.
- [ ] Mobile width.
- [ ] Desktop width.
- [ ] Console and failed-network check.

## Canonical Shadcn authority

`packages/ui` will own:

- Tokens: OKLCH colour, typography, spacing, radius, elevation and motion.
- Primitives: button, input, select, dialog, sheet, tabs, badge, table and toast.
- Layout: `AppShell`, `Sidebar`, `Topbar`, `PageHeader`, `Breadcrumbs`.
- Data: `DataTable`, filters, pagination, selection and bulk actions.
- Records: `RecordHeader`, `RecordSheet`, metadata, tabs and activity timeline.
- Forms: `FormSection`, field rows, validation summary and destructive confirmation.
- States: loading, empty, error, unavailable, restricted and coming-soon.
- Feedback: alert, toast, progress, success and retry.

Applications may compose these components but may not fork them without an ADR.

## Component rules

- [ ] Two or three type sizes/weights per screen.
- [ ] Four-pixel spacing scale.
- [ ] Theme tokens instead of hardcoded product colours.
- [ ] Three elevation levels only.
- [ ] Motion limited to 200–300 ms and meaningful feedback.
- [ ] WCAG AA contrast.
- [ ] Visible focus equivalent to hover intent.
- [ ] Semantic headings, labels and landmarks.
- [ ] Mobile-first layout.
- [ ] Tenant branding via CSS variables, not component forks.

## Audit waves

### Wave 1 — Navigation and shells

- [ ] Tenant sidebar.
- [ ] Tenant topbar.
- [ ] Mobile navigation.
- [ ] SaaS admin sidebar/topbar.
- [ ] Ops sidebar/topbar.
- [ ] Campus navigation.
- [ ] Public tenant header/footer.

### Wave 2 — Lists and operational tables

- [ ] Courses and cycles.
- [ ] Course runs and programming.
- [ ] Students and staff.
- [ ] Leads, enrolments and waiting list.
- [ ] Campaigns and appointments.
- [ ] Finance lists.
- [ ] Content and media lists.

### Wave 3 — Record sheets and detail pages

- [ ] Course sheet.
- [ ] Course-run sheet.
- [ ] Student sheet.
- [ ] Teacher/staff sheet.
- [ ] Lead sheet.
- [ ] Enrolment sheet.
- [ ] Campus/classroom sheet.
- [ ] Invoice/payment sheet.

### Wave 4 — Editors and workflows

- [ ] Course/run editors.
- [ ] Scheduling and planner.
- [ ] Enrolment flow.
- [ ] Lead conversion.
- [ ] CMS editors.
- [ ] Configuration and integrations.
- [ ] LMS content and grading.

### Wave 5 — Dashboards

- [ ] Academy dashboard.
- [ ] CRM dashboard.
- [ ] Academic dashboard.
- [ ] Finance dashboard.
- [ ] Campus dashboard.
- [ ] SaaS control-plane dashboard.
- [ ] Ops/health dashboard.

## Migration method

1. Audit and score a family.
2. Select the canonical pattern.
3. Add or strengthen the `packages/ui` primitive.
4. Migrate one representative screen.
5. Verify desktop, mobile, keyboard and states.
6. Add lint/test guardrails against local forks and hardcoded colours.
7. Migrate the remaining family.
8. Re-audit and record score delta.

CEP adopts only compatible component improvements after Next proves the pattern.
The live tenant is never the experimentation surface.
