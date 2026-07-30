# Akademate Next Build Checklist
Last updated: 2026-07-30

## Isolation

- [x] Branch/worktree created from accepted CEP MVP baseline.
- [ ] Dedicated database.
- [x] Dedicated Redis namespace defined in isolated Compose.
- [ ] Dedicated object storage namespace.
- [ ] Dedicated secrets.
- [x] Dedicated Compose project and images defined.
- [ ] Dedicated staging hostname.
- [x] CEP identifiers denied by static isolation guard.
- [ ] Synthetic demo data only.
- [ ] No runtime API bridge to CEP.

## Genericization

- [ ] Tenant identity configuration.
- [ ] Legal identity configuration.
- [ ] Branding and domains.
- [ ] Navigation and footer.
- [ ] Locale, timezone and currency.
- [ ] Course types and academic taxonomy.
- [ ] Enrollment policy configuration.
- [ ] Provider integration configuration.
- [ ] CEP content/importers moved to legacy adapters.
- [ ] CEP legal text, contacts and claims absent from defaults.

## Platform security

- [ ] Verified principal.
- [ ] Tenant derived from identity, never trusted from request body.
- [ ] Handler-local authorization.
- [ ] Payload collection ACLs.
- [ ] Database tenant defense.
- [ ] Signed sessions and rotation.
- [ ] MFA for privileged roles.
- [ ] Audit logs.
- [ ] API key scopes and rotation.
- [ ] Webhook signatures, idempotency and SSRF defense.

## Academy operations

- [ ] CRM and admissions.
- [ ] Students and responsible contacts.
- [ ] Courses, cycles and programmes.
- [ ] Course runs and enrolments.
- [ ] Campuses, classrooms and resources.
- [ ] Teacher identities, assignments and availability.
- [ ] Scheduling and conflict prevention.
- [ ] Attendance and justified absences.
- [ ] Public tenant catalogue and checkout.
- [ ] Operational notifications and tasks.

## Academic finance

- [ ] Price lists and taxes.
- [ ] Invoices and lines.
- [ ] Instalments and due dates.
- [ ] Discounts, scholarships and credits.
- [ ] Payments, refunds and credit notes.
- [ ] Dunning and payment reminders.
- [ ] Stripe/SEPA integration.
- [ ] Reconciliation.
- [ ] Accounting exports/adapters.
- [ ] Entity-scoped financial access.

## Campus

- [ ] Canonical student campus.
- [~] Teacher workspace architecture and membership capabilities defined; shell pending.
- [x] Administrative, teacher and student experience boundary accepted in ADR 0007.
- [ ] Teacher course preparation and content authoring.
- [ ] Teacher attendance, assignment and grade workflows.
- [ ] Modules, lessons and materials.
- [ ] Live class links.
- [ ] Assignments and submissions.
- [ ] Quizzes, rubric-based grading and gradebook.
- [ ] Student feedback and grade publication controls.
- [ ] Progress rules.
- [ ] Certificates and verification.
- [ ] Announcements and support.
- [ ] Mobile/PWA experience.

## Internal communication

- [~] Tenant-scoped conversation authorization implemented; persistence pending.
- [x] Course-run learning membership enforced in the domain access contract.
- [x] Explicit conversation participant required in addition to academic membership.
- [ ] Course channels, announcements and assignment discussions.
- [ ] Message attachments in tenant-namespaced storage.
- [ ] Read receipts, notification preferences and unread counts.
- [ ] Moderation, reporting, retention and audit events.
- [ ] Block deleted, suspended or cross-tenant users fail-closed.
- [ ] Realtime transport with durable persistence and retry.
- [ ] Mobile-accessible composer, history and attachment UX.

## Integrations

- [ ] Resend/SMTP.
- [ ] SMS/WhatsApp.
- [ ] Google Calendar.
- [ ] Microsoft Calendar.
- [ ] Zoom/Meet/Teams.
- [ ] Moodle/LTI.
- [ ] Holded/Sage.
- [ ] Xero/QuickBooks.
- [ ] OpenAPI and TypeScript SDK.
- [ ] Signed webhooks and sync ledger.

## SaaS and Enterprise

- [ ] Tenant onboarding.
- [ ] Business plan.
- [ ] Enterprise dedicated deployment.
- [ ] Usage and limits.
- [ ] Feature flags.
- [ ] SaaS billing separated from student billing.
- [ ] SSO/OIDC/SAML.
- [ ] Private cloud/on-premise packaging.
- [ ] Backup/restore and DR.
- [ ] Upgrade and rollback automation.

## Optional AI add-on

- [ ] Off by default.
- [ ] Provider-neutral interface.
- [ ] Permission-aware.
- [ ] Human review.
- [ ] Logged usage and transparency.
- [ ] No automatic admission, grading, billing or permission decisions.
