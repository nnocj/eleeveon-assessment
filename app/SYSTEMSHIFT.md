app/lib/websites/types.ts
app/lib/websites/data/normalizeWebsiteDataset.ts
app/lib/websites/api.ts
app/lib/websites/WebsiteRenderer.tsx
app/lib/websites/WebsiteTemplateRouter.tsx
app/lib/websites/sections/WebsiteSectionRenderer.tsx
app/lib/websites/templates/bold-campus/index.tsx
app/lib/websites/templates/classic-school/index.tsx
app/lib/websites/templates/modern-academy/index.tsx
app/sites/[slug]/[[...path]]/page.tsx


src/auth/auth.service.ts
src/auth/strategies/jwt.strategy.ts
src/common/auth-user.ts
src/memberships/memberships.service.ts


Your website builder already recognises these dynamic source types:

Schools and branches
Programmes
Subjects
Organisations
Teachers
Announcements
Calendar events
Portal highlights
Media gallery


What I think is still missing before you can compete with the very best

This is where I would focus over the next few years:

Excellent onboarding and setup.
Automatic backups and disaster recovery.
Rich analytics and dashboards.
A well-documented API for integrations.
Mobile apps that feel as polished as the web experience.
High-quality documentation and customer support.
Strong security, permissions, and audit logs.
Integrations with accounting, payments, and communication tools.

The biggest competitors have spent years refining not just features, but reliability, support, and the overall customer experience.

One idea I think could make Eleeveon stand out

Since you're already planning separate Owner, School Admin, Branch Admin, Teacher, Parent, and Student portals, let each user choose their own language.

For example:

Headteacher → English
French teacher → French
Parent → French
ICT administrator → English

Everyone uses the same database, but each person sees the interface in the language they're most comfortable with.

That level of flexibility is valuable in multilingual schools and for expansion across West Africa, and it fits naturally with the role-based architecture you've already built.


My recommendation

When you implement multilingual support, don't stop at translating menus.

Design Eleeveon so that everything is localizable:

Interface
Report cards
PDF templates
Emails
SMS
Notifications
Help pages
Error messages
Parent portal
Teacher portal
Student portal

Then adding a new language—French today, Portuguese later—becomes largely a matter of providing translation files rather than rewriting the application.

Given your goal of serving Ghana first and then expanding into Francophone West Africa, I think this investment would have a much larger payoff than treating multilingual support as a later feature.