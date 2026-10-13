# NOSEE — Next.js rebuild

Project repository for the Network of Space–Earth Environmentalists (NOSEE) website.

This repository is separate from the [existing Laravel implementation](https://github.com/thedanieldiya/nosee), which remains untouched.

## Intended application

- Public, accessible, low-bandwidth website for NOSEE's research, news, events, publications, and monitoring resources.
- Admin-only dashboard to publish content, manage leadership and featured researchers, and review membership applications.
- Public membership application form **without applicant login**. Applicants receive submission confirmations; admins are notified and can approve/reject applicants with email notifications.
- Member records are private by default. Only deliberately published executive/researcher profiles appear on the public website.

**Status:** Project-local agent skills and migration requirements are ready. The Next.js application has **not** yet been scaffolded or implemented.

## Delivery documents

- [Migration and admin PRD](docs/PRD.md) — product requirements, route scope, acceptance conditions, design parity, backend/security and performance targets.
- [Codex progress tracker](docs/PROGRESS.md) — live milestone and requirement statuses with evidence and blockers.
- [Codex Task 01](docs/codex-tasks/01-discovery-and-baseline.md) — first task: audit the legacy source and produce a visual/migration baseline **without changing application code**.

## Performance is a product requirement

The public website must remain useful on slow mobile connections and lower-powered devices. Prefer server-rendered/prerendered content, small HTML/CSS, little or no client JavaScript on information pages, properly sized images, no unnecessary third-party scripts, and no dependence on JavaScript for primary reading/navigation. Set measurable bundle, image, and Core Web Vitals budgets during the first implementation milestone; validate with throttled mobile tests and real-user data where available.

See [AGENTS.md](AGENTS.md) for the detailed engineering rules and [the project-local skills](.agents/skills/) for coding-agent guidance. Files in `.agents/` are **developer tooling, not runtime dependencies**.

## Third-party development guidance

- [Ponytail](https://github.com/DietrichGebert/ponytail) — lean implementation and review skills.
- [Agency Agents](https://github.com/msitarzewski/agency-agents) — selected engineering, security, accessibility, and performance specialist profiles.

The source licenses and attribution are retained in [third-party notices](.agents/THIRD_PARTY_NOTICES.md).
