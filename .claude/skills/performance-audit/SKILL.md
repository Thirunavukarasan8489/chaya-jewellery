---
name: performance-audit
description: Full-codebase performance audit of Chaya Jewellery — traces N+1 queries, missing indexes/pagination, caching gaps, and unoptimized images/bundles end to end, sized to this app's actual scale, and reports findings as an impact-ranked table.
---

# Performance audit

Use this when asked for a performance review, audit, or "find slow spots" that should cover the **whole
codebase**, not a specific reported slowdown (investigate that directly instead — this skill is for a
broad sweep).

## How to run it

1. Launch one background agent (`subagent_type: Explore`, `run_in_background: true`) with the checklist
   below, adapted to this repo's current model/action file locations (check CLAUDE.md/AGENTS.md first —
   file names and the exact caching/pagination patterns already in use may have moved since this was
   written).
2. Explicitly size findings to this app's real scale: a jewellery retailer with hundreds to low-thousands
   of products/orders, not a hyperscale marketplace. Tell the agent this directly — otherwise it will
   flag micro-optimizations that only matter at a scale this app will never reach, which buries the
   findings that actually matter under noise.
3. Tell the agent to verify by reading the actual code path, not by pattern-matching function/variable
   names — a `for` loop with `.find()` inside it only matters if it's actually N+1 and actually runs on a
   hot path, not just because the shape looks suspicious.
4. Compile into one report (see "Report format" below).

## What to check (give this to the background agent, adapted to current file locations)

1. **N+1 / redundant DB queries** — any loop issuing one DB query per iteration instead of a single
   batched query (`$in`, or a `bulkWrite`). Pay closest attention to the checkout/order-creation path
   (inventory reservation, customer lookup) since that's the one hot path every real user hits, and to
   anything that runs _inside_ an open DB transaction — extra round trips there extend lock-hold time
   under concurrent load, which is a correctness/availability risk as much as a speed one, not just a
   latency number.
2. **Missing `.lean()`** (or the equivalent read-only-query optimization for whatever ORM is in use) —
   queries that only read data for display but hydrate full documents anyway. Check the main storefront
   listing query and every admin table/list page.
3. **Missing indexes** — read every schema definition and cross-check against fields actually
   filtered/sorted on elsewhere in the code. Only flag a field you can point to an actual query using —
   speculative "this might get queried someday" indexes aren't a finding.
4. **Pagination** — whether list views (storefront catalogue, every admin list page) paginate at the
   query layer (`.limit()`/`.skip()` or cursor-based) versus fetching everything and slicing in JS.
5. **Image optimization** — check the framework's image config, and grep for any raw `<img>` tag used for
   real content images instead of the project's optimized image component — especially on high-traffic or
   high-intent pages (product detail, homepage hero), where an inconsistency with an already-optimized
   sibling component (e.g. the grid thumbnail one click away) is worth calling out explicitly.
6. **Bundle size / client-server boundary** — large `"use client"` boundaries on page/layout files that
   could instead be a server component with a small interactive island, and heavy libraries (chart/rich
   text/date-picker packages) imported at module scope somewhere that renders on every page load via a
   shared layout, instead of only where actually used.
7. **Caching / revalidation** — whether storefront data fetches use the framework's caching primitives
   consistently. If most of a page's data fetches are cached and one sibling isn't, that's a much sharper
   finding than "add caching everywhere" — name the one that's missing it.
8. **Blocking/serial work in hot paths** — anything unnecessarily serial in checkout/order-creation or a
   webhook handler that could be `Promise.all`'d, and whether a DB transaction holds work open longer than
   the minimum needed for atomicity.
9. **Dashboard/aggregation queries** — admin dashboard KPI queries: independent counts/aggregates run
   serially instead of in parallel, or an aggregation that should be a single DB-side pipeline instead of
   several round trips combined in application code.

## Report format

Publish as an HTML artifact (see the loaded `artifact-design` skill for how) — tables, not narrative
cards, matching the security-audit skill's format so the two read as one consistent report if run
together. One table (Impact | Finding | Actual cost | Fix) grouped by High/Medium/Low, and a compact
"verified fine" table for patterns that already checked out (e.g. a caching layer or batching helper
that's already used correctly and consistently) — that's as much signal as the problems are. Every
finding needs a concrete file:line and the _actual_ cost in real terms (round trips, index-free scan,
uncapped payload size) — not a vague "this could be slow."
