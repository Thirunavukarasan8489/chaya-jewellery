---
name: security-audit
description: Full-codebase security audit of Chaya Jewellery — traces auth, authorization, injection, payment-integrity, secret-handling, and dependency risks end to end (not just the current diff), and reports findings as a severity-ranked table.
---

# Security audit

Use this when asked for a security review, audit, or "check for vulnerabilities" that should cover
the **whole codebase**, not just pending changes — that narrower case is the built-in `security-review`
skill instead.

## How to run it

1. Launch one background agent (`subagent_type: Explore`, `run_in_background: true`) with the checklist
   below, filled in with this repo's actual architecture (pull current specifics from CLAUDE.md/AGENTS.md
   rather than assuming the notes below haven't drifted — routes, action files, and model names can move).
   It's read-only research: no edits, just traced findings with file:line.
2. While it runs, do these checks yourself in parallel — they're fast and the agent has historically
   missed or under-verified them:
   - `npm audit --json` (or `npm audit` piped through node) for **real, current** CVE data. Don't let an
     agent eyeball `package.json` version numbers and call dependencies "no obviously outdated majors" —
     that's not verification, it's a guess. Cross-reference `npm audit`'s advisory list against which
     packages are actually imported/called in the source (a dependency with an advisory that's never
     imported outside its own dead code is a much lower priority than one wired into a live request path).
   - Read `proxy.ts` and the NextAuth config (`lib/authOptions.ts` or wherever session config lives) in
     full — these two files are the root of session/role trust and are worth reading yourself rather than
     trusting a summary.
   - Trace the checkout/payment price path end to end yourself: does the order total, and separately the
     payment-gateway amount, ever get recomputed from a database-looked-up price, or does client-submitted
     data flow untouched into either? This has been the single highest-severity finding in past runs of
     this audit — verify it doesn't regress.
3. Spot-check the agent's 2-3 most severe claims by reading the actual file yourself before including
   them in the report — agents can mis-trace line numbers or overstate exploitability. Only report
   something as Critical/High if you've personally confirmed the code path, not just because the agent
   said so.
4. Compile into one report (see "Report format" below).

## What to check (give this to the background agent, adapted to current file locations)

1. **Authentication & session security** — session strategy (JWT vs DB), cookie flags, JWT secret
   handling and any hardcoded fallback values (check whether the SAME fallback string is used by both the
   signer and the verifier — if so, a missing env var in production is a full auth bypass, not just a
   weak default), password hashing cost factor, and the password-reset flow (token strength, expiry,
   single-use, and whether it's actually implemented at all vs. a UI stub).
2. **Authorization (RBAC) coverage** — check every exported server action for a role-check call before
   any mutation, and flag any action missing it or weaker than its siblings in the same file. Cross-check
   route-level gating (middleware/proxy) against what each protected route actually needs — note that
   route-level protection typically does NOT cover `/api/*` route handlers under a different path prefix,
   so those need their own auth check.
3. **Input validation / injection** — any Mongoose (or other ODM) query built from raw, untyped request
   input without a schema/type check first (NoSQL operator injection via `{"$regex": ...}`-shaped JSON
   bodies is the concrete pattern to hunt for on any public POST/register/login endpoint), any place user
   input reaches `eval`/`Function()`/a shell command, and any mutation that skips its validation schema
   entirely (`data: any` straight into a DB write).
4. **Payment/webhook integrity** — for every payment provider webhook: does the code fail closed (throw)
   if the signing secret is unset, or does it fall back to a default/empty value that could make forged
   signatures trivial? Is the comparison constant-time? Does it verify the _amount_ paid against the
   order's canonical total, not just that some valid signature arrived? Is there replay protection?
5. **Secrets & env handling** — grep the source (not just `.env.example`) for hardcoded secrets/keys,
   confirm `.gitignore` actually excludes local env files, and check whether any hardcoded fallback secret
   is dangerous specifically because it's now public (checked into a repo, or documented in code comments).
6. **Security headers / CSP / CORS** — check the framework config and any middleware for CSP,
   X-Frame-Options, HSTS, Referrer-Policy. Their total absence is worth flagging once, not once per route.
7. **Rate limiting** — grep for any rate-limiting library or manual throttle. If none exists, flag every
   public-facing auth/form endpoint (login, register, password reset, public lead/contact forms) as one
   grouped finding rather than N duplicate findings.
8. **File upload security** — how uploads are authorized and signed; whether an unauthenticated or
   low-privileged user could reach the upload path.
9. **XSS** — every `dangerouslySetInnerHTML` (or equivalent) call site, and whether the content it
   renders is ever admin-authored rich text stored without server-side sanitization. If the same
   unsanitized content also renders inside the admin panel itself, that's a privilege-escalation chain
   (lower-privileged editor role → higher-privileged admin's session), not just visitor-facing XSS — call
   that chain out explicitly if it exists, it's a meaningfully worse finding than either half alone.
10. **Dependency vulnerabilities** — from `npm audit`, not guesswork (see step 2 above).

## Report format

Publish as an HTML artifact (see the loaded `artifact-design` skill for how) — this is a scannable
reference document, not prose: use tables, not narrative cards. One table per severity-grouped findings
section (Severity | Finding | What happens | Fix), a small "fix these first" table pulling out anything
Critical, a dependency table (Package | Severity | Advisory | Fix, with real GHSA links from npm audit),
and a compact "verified fine" table — an audit that only lists problems is missing half the picture, and
listing what held up builds trust in what didn't. Group by severity: Critical, High, Medium, Low. Every
finding needs a concrete file:line and a one-sentence real exploit scenario, never generic security
advice ("consider validating input" without saying which input, where, and what breaks if you don't).
