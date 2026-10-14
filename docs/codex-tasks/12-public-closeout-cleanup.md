# Task 12 — Combined public-port close-out, deferred-gate register and repository cleanup

**Owner decision — 14 October 2026:** Combine the final **(1) existing-frontend technical sanity check, (2) documented acceptance/deferred issues, and (3) migration-evidence cleanup** into **one branch/PR**. Then begin the approved admin-dashboard foundation next. **Mobile Lighthouse LCP ~3.54s is accepted as an interim development baseline; the ≤2.5s target is deferred, not passed.** Do not spend tokens optimising it further now.

**Source of truth:** \`thedanieldiya/nosee-new\` latest main including [Task 11 PR #11](https://github.com/thedanieldiya/nosee-new/pull/11) merge \`f48d5a691ada73c00f4df0e4a920089a3ad748fc\`; original Laravel read-only. Read targeted sections of \`AGENTS.md\`, \`docs/PRD.md\`, \`docs/FRONTEND-TRACKER.md\`, \`docs/PROGRESS.md\`, \`docs/admin-dashboard-trd.md\` and compact Task 11 results **once**, not raw historic evidence.

**Branch:** \`codex/task-12-public-closeout-cleanup\` from latest main. No application feature code, no refactors, no production/indexing changes, no admin implementation. This is one **owner-authorised cleanup task** and is the agreed exception to the earlier rule of separate review/cleanup milestones. Codex commits/pushes; **owner makes and merges the PR**, stop for review.

## Step 1 — One compact final technical check

- On clean dependencies, run \`node --test tests/*.test.mjs\`, \`npm run typecheck\`, \`npm run lint\`, \`npm run build\`, \`git diff --check\`. Verify the 110 tests (or current actual count); report deviations, not presumed passes.
- In a production build, minimally smoke test \`/\`, \`/about\`, \`/events\`, \`/events/archive\`, valid event detail, \`/events/icelli2026\` **302 exact Location**, invalid event/public routes **404**, source-consistent date-driven responses and noindex on unapproved content. Check homepage responsive variants and static URLs still load. Keep MingCute currentColor and the Task 11 no-JS/focus/contrast fixes intact.
- If possible, test the **actual deployed domain/preview** from an accessible browser. If forbidden/403/unknown, explicitly record **unverified**, not a pass. No obligation to fabricate inaccessible QA, change Vercel configuration or require production deployment to unblock admin development.
- Manual NVDA/JAWS/VoiceOver or human live-site/content verification **cannot be marked complete by automated keyboard/axe checks**. Provide an owner-facing very short checklist / status in permanent docs, but **do not prevent development of the admin dashboard** solely because these release gates remain deferred.

## Step 2 — Consolidate status before deleting artefacts

Summarise in **evergreen documentation** (prefer a concise \`docs/PUBLIC-SITE-STATUS.md\` or compact sections of \`docs/FRONTEND-TRACKER.md\` and \`docs/PROGRESS.md\`, not a new evidence directory):
- Existing Laravel public site port: **complete as a code migration**, 10 initial tasks and Task 11 merged, with owner-authorised MingCute/contrast/label/no-JS/image exceptions. Do **not** claim live launch/WCAG/manual AT/indexing approval.
- **Accepted for now:** normal-motion mobile Lighthouse median **3.535 s (~3.54 s)** from Task 11; homepage cold mobile image bodies **415,255 B** vs ~3.94 MB earlier. Original goal ≤2.5s is still outstanding for later.
- **Deferred release gates:** manual screen reader/voice/magnifier testing, live deployment/field performance and DNS/domain checks, organisation/person/news/event/DOI fixture approvals, currently noindex site content, critical unimplemented public pages and old AGM 404, newsletter provider/real delivery, indexing/SEO decision. Medium original issues: undersized hero/About carousel indicators, inherited Events 320px horizontal overflow, mixed scalar/array search query edge. Do not silently fix them now.
- **Disclosed technical deviations:** meeting 302 and source 404 work; invalid-uppercase event slug Laravel 500 → Next 404; image decode guard may wait on a cold first interaction; no-JS menu is now a native disclosure rather than original broken one.
- Clearly distinguish **“owner accepted interim development baseline and migration close-out”** from **“public site approved for launch”**. Scope and future decisions remain traceable via merged PR links, source code/tests and Git history.

## Step 3 — Remove ALL migration evidence and unnecessary completed-task documentation

The owner expressly requested a clean repository after the PHP port. Current main has **424 tracked files under \`docs/evidence/\` totalling roughly 99.5 MB** (verify actual number at execution); this is **temporary material**.

1. **Before deletion**, check for any functionality or important reusable test code inside \`docs/evidence/\`. Move only truly essential reusable code to \`tests/\` or \`scripts/\` with targeted tests. Never copy bulky oracle JSON/browser dumps, or screenshots into another tracked folder as a workaround.
2. \`git rm -r docs/evidence\` removes **every tracked artifact** (old screenshots, reports, JSON, generated logs/scripts) from the current tree. Do not leave \`docs/evidence/task-* /README.md\` stubs; no partial archive. Do not rewrite Git history.
3. The completed \`docs/codex-tasks/01-12\` briefs are **disposable migration work instructions**. After extracting any enduring implementation rules into \`AGENTS.md\`, \`docs/PRD.md\`, the Admin TRD or short status docs, remove the completed source-migration task briefs as part of the same owner-requested repository hygiene. **Do not delete the approved admin TRD or any future admin task brief.**
4. Update **README, AGENTS, PRD, PROGRESS, FRONTEND-TRACKER and any other retained Markdown references** so no broken links point at the removed \`docs/evidence/\` or completed \`docs/codex-tasks/\` paths. The tracker can reference historical merged PR numbers instead of vanished artifacts. Compress the old 70KB PROGRESS evidence ledger into a concise forward-looking status and requirements table; preserve blockers, key decisions and PR links rather than deleting accountability.
5. Keep *all* functioning public route code, generated responsive image assets, original fallback assets, existing reusable tests, the tests' runtime fixtures, package lock, shadcn/MingCute/brand rules, \`docs/admin-dashboard-trd.md\` v1.1, \`docs/PRD.md\`, important technical/ops docs and \`AGENTS.md\`. Do not remove tests or assets just to reduce Git size.
6. Validate \`git ls-files docs/evidence\` returns **zero files** and no retained Markdown references to removed paths remain. Rerun \`node --test tests/*.test.mjs\`, typecheck/lint/build **after** cleanup.
7. The Git diff will necessarily show **many deletions** (expected) but no new huge artifacts or duplicate evidence. Token-conscious: use file listings, \`git rm\`, and summary counts; **never paste file contents or full deletions into model context**.

## Handoff

- Commit/push \`codex/task-12-public-closeout-cleanup\`, report deletion count and approximate MB removed from **current tree**, test/build/HTTP results, preserved functional code, any links still unresolved, and a short deferred-release checklist. No new \`docs/evidence/task-12\` folder.
- **No automatic PR/merge, no deployment, no public relaunch and no admin work in Task 12. STOP for owner review.**
- **Immediately after the owner's Task 12 merge:** next engineering task is the secure, Shopify-inspired shadcn **Admin Dashboard foundation** specified by \`docs/admin-dashboard-trd.md\` v1.1. Its canonical brief is placed outside the removable migration-task folder: \`docs/admin/01-foundation.md\`.
