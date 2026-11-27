# Agent Docs Foundation Implementation Plan

> This document records the original setup. The current agent instructions are in [AGENTS.md](../../../AGENTS.md), the technical overview and quality gates are in the [README](../../../README.md), and the [content guide](../../../content/README.md#content-model) holds the content model. Historical commands and filenames below describe the original setup.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the empty `Portfolio` folder into a git repo whose agent and human docs (`CLAUDE.md`, `README.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `content/` templates) and repo-level Hallmark skill let future sessions build the portfolio site without re-asking decisions or inventing content.

**Architecture:** Approach B from the spec: a short `CLAUDE.md` with hard rules and pointers; product detail in `docs/PRD.md`; the technical overview in `docs/ARCHITECTURE.md`; every personal fact lives in `content/` as `TODO` placeholders the owner fills in. Work happens on `docs/agent-docs-foundation` and lands on `main` by a local squash merge after owner review.

**Tech Stack:** git 2.43, Markdown, YAML, MDX frontmatter, `npx skills` (Hallmark installer), Node v24 via nvm, PyYAML 6 (verification only).

**Spec:** `docs/superpowers/specs/2026-11-27-agent-docs-foundation-design.md`

## Global Constraints

- Every file written in the repo is in **English**. No Vietnamese text anywhere (the owner chats in Vietnamese; nothing from the chat is pasted verbatim).
- **Never invent personal facts** (names, companies, dates, roles, metrics, URLs, languages). Every personal value is the literal string `TODO` or `null`.
- No secrets, phone numbers, home addresses, or client-confidential details.
- Commit messages: `type: message` (Conventional Commits, English, lowercase subject, no trailing period). Every commit message ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- The only commit made directly on `main` before the final merge is `chore: initialize repository` (just `.gitignore`). All other work is on `docs/agent-docs-foundation`.
- Do **not**: push, create a GitHub repo, create `package.json`, install packages other than Hallmark (repo) and `puppeteer-core` (global), or edit anything inside `.claude/skills/hallmark/`.
- `CLAUDE.md` is **≤ 100 lines**.
- Do **not** merge into `main` until the owner has reviewed the branch and said to merge (Task 8).

## Review Focus

1. **Hallmark installed as a symlink or outside the repo.** `npx skills` may install to `~/.claude/skills` or to `.agents/skills` with a symlink in `.claude/skills`; a clone of the public repo would then get a dangling link or nothing. Expected: real files committed under `.claude/skills/hallmark/`. Test: Task 5 Step 4.
2. **Vietnamese text leaking into repo files.** Expected: zero Vietnamese characters outside `.git/` and `.claude/skills/`. Test: Task 8 Step 1 (and each doc task's check).
3. **Bootstrap commit sweeping in `docs/`.** The spec and this plan exist before `git init`; a careless `git add .` puts them on `main` directly. Expected: the first commit contains only `.gitignore`. Test: Task 1 Step 4.
4. **Invented placeholder values in templates or README.** Expected: every string leaf in `content/*.yaml` and the MDX frontmatter is `TODO` or a structural label. Test: Task 2 Step 3.
5. **`_template.mdx` later rendered as a real project page.** Expected: the rule "files starting with `_` are templates and are ignored by the content pipeline" is written in both `content/README.md` and `docs/ARCHITECTURE.md`, so the scaffold implements it. Test: Task 2 Step 3 and Task 4 Step 2.

---

### Task 1: Repo bootstrap

**Files:**
- Create: `.gitignore`

**Interfaces:**
- Produces: git repo with branch `main` (1 commit) and checked-out branch `docs/agent-docs-foundation` containing the spec and this plan.

- [ ] **Step 1: Initialize the repo**

Run: `git init -b main` in `/home/dat/Documents/Code/self/Portfolio`
Expected: `Initialized empty Git repository`

- [ ] **Step 2: Write `.gitignore`**

Must contain (grouped with short `#` comments): `node_modules/`, `.next/`, `out/`, `build/`, `coverage/`, `*.tsbuildinfo`, `next-env.d.ts`, `.env*`, `!.env.example`, `.vercel/`, `.claude/settings.local.json`, `npm-debug.log*`, `yarn-debug.log*`, `yarn-error.log*`, `pnpm-debug.log*`, `.DS_Store`, `Thumbs.db`, `.idea/`, `.vscode/*` with `!.vscode/extensions.json`. Must **not** ignore `.claude/` or `.claude/skills/`.

- [ ] **Step 3: Verify ignore rules**

Run:
```bash
for p in node_modules/x .next/x .env .env.local .vercel/x .claude/settings.local.json; do git check-ignore -q "$p" || echo "NOT IGNORED: $p"; done
for p in .env.example .claude/skills/hallmark/SKILL.md .claude/settings.json CLAUDE.md content/profile.yaml; do git check-ignore -q "$p" && echo "WRONGLY IGNORED: $p"; done; echo done
```
Expected: only `done`.

- [ ] **Step 4: Bootstrap commit on `main` with only `.gitignore`**

```bash
git add .gitignore
git commit -m "chore: initialize repository" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git show --stat --format= HEAD
```
Expected: the stat lists exactly one file, `.gitignore`.

- [ ] **Step 5: Branch and commit the spec and plan**

```bash
git checkout -b docs/agent-docs-foundation
git add docs/superpowers
git commit -m "docs: add agent docs foundation spec and plan" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git log --oneline main && git status --porcelain
```
Expected: `main` has 1 commit; status output is empty.

---

### Task 2: `content/` templates

**Files:**
- Create: `content/README.md`, `content/profile.yaml`, `content/experience.yaml`, `content/company-projects.yaml`, `content/projects/_template.mdx`

**Interfaces:**
- Produces (field names Task 4 documents verbatim):
  - `profile.yaml`: `name`, `role`, `intro`, `careerStart` (`YYYY-MM`; years of experience are computed from it so they never go stale), `languages[]` {`language`, `level`}, `links` {`github`, `linkedin`, `email`}, `stack[]` {`group`, `items[]`} with groups `Frontend`, `Backend`, `Tools`.
  - `experience.yaml`: list, newest first, of {`company`, `role`, `start` (`YYYY-MM`), `end` (`YYYY-MM` or `present`), `summary`, `stack[]`}.
  - `company-projects.yaml`: list of {`name`, `niche`, `role`, `stack[]`, `start`, `end`, `url` (`null` when no working live link)}.
  - `projects/<slug>.mdx` frontmatter: `title`, `summary`, `stack[]`, `repo`, `demo` (`null` if none), `order` (integer, ascending on the home page). Slug = file name. Body headings, in order: `## Problem`, `## What I built`, `## Challenges & solutions`, `## Results`, `## Links`.
  - Rule: files whose name starts with `_` are templates and are never rendered.

- [ ] **Step 1: Write the four data files and the MDX template**

Every value is `TODO` (strings, and one-item `[TODO]` lists), `null` (`url`, `demo`), or `1` (`order`). Format hints go in `#` comments (e.g. `# YYYY-MM`) and never contain a realistic personal value. Each MDX body section holds one sentence telling the owner what to write there.

- [ ] **Step 2: Write `content/README.md`**

Short: what each file holds, that `_`-prefixed files are templates (copy `_template.mdx` to `<slug>.mdx`), company projects are cards only and must never include source code, internal names, metrics, or client details, and the public-repo rule (no phone/address; CV goes to `public/cv.pdf` without them).

- [ ] **Step 3: Verify templates parse and contain no invented values**

Run:
```bash
python3 -I - content <<'PY'
import sys, pathlib, yaml
root = pathlib.Path(sys.argv[1]); docs = {}
for f in root.glob("*.yaml"): docs[f.name] = yaml.safe_load(f.read_text())
mdx = (root / "projects/_template.mdx").read_text().split("---")
docs["_template.mdx"] = yaml.safe_load(mdx[1])
allowed = {"TODO", "Frontend", "Backend", "Tools"}
def leaves(x):
    if isinstance(x, dict):
        for v in x.values(): yield from leaves(v)
    elif isinstance(x, list):
        for v in x: yield from leaves(v)
    else:
        yield x
bad = [(n, v) for n, d in docs.items() for v in leaves(d) if isinstance(v, str) and v not in allowed]
heads = ["## Problem", "## What I built", "## Challenges & solutions", "## Results", "## Links"]
missing = [h for h in heads if h not in mdx[2]]
print(sorted(docs), "BAD:", bad, "MISSING HEADINGS:", missing)
PY
grep -qF '_template.mdx' content/README.md && grep -qF 'public/cv.pdf' content/README.md && echo readme-ok
```
Expected: `['_template.mdx', 'company-projects.yaml', 'experience.yaml', 'profile.yaml'] BAD: [] MISSING HEADINGS: []` then `readme-ok`.

- [ ] **Step 4: Commit**

```bash
git add content
git commit -m "docs: add content templates" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `docs/PRD.md`

**Files:**
- Create: `docs/PRD.md`

**Interfaces:**
- Consumes: spec §2 (product decisions), §3 (non-goals), §6.4 (structure and success criteria).

- [ ] **Step 1: Write the PRD**

Sections, in order: `## Problem & goal`, `## Audience` (HR: what they scan for; tech lead: what convinces them), `## User journeys` (HR: land → hero facts → contact or CV; tech lead: land → personal project card → detail page → GitHub repo), `## Pages & sections` (home sections 1–5 and `/projects/[slug]` exactly as spec §2), `## Content rules` (company vs personal projects, no invented facts, contact by `mailto:` link only, CV at `public/cv.pdf` without phone/address), `## Non-goals` (blog, `/admin`, contact form, i18n), `## Success criteria` (the five bullets of spec §6.4 with their exact values: `1366×768`, `WCAG 2.1 AA`, `Lighthouse` `≥ 90`, Open Graph preview, every personal project linked to a detail page and its repo). It contains no personal facts; it refers to `content/` for them.

- [ ] **Step 2: Verify**

Run:
```bash
for p in "## Problem & goal" "## Audience" "## User journeys" "## Pages & sections" "## Content rules" "## Non-goals" "## Success criteria" "/projects/[slug]" "1366×768" "WCAG 2.1 AA" "≥ 90" "Open Graph" "mailto" "contact form" "/admin" "i18n" "cv.pdf"; do grep -qF -- "$p" docs/PRD.md || echo "MISSING: $p"; done
LC_ALL=C.UTF-8 grep -nP '[\x{0102}\x{0103}\x{0110}\x{0111}\x{01A0}\x{01A1}\x{01AF}\x{01B0}\x{1EA0}-\x{1EF9}]' docs/PRD.md; echo checked
```
Expected: only `checked`.

- [ ] **Step 3: Commit**

```bash
git add docs/PRD.md
git commit -m "docs: add product requirements" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `docs/ARCHITECTURE.md`

**Files:**
- Create: `docs/ARCHITECTURE.md`

**Interfaces:**
- Consumes: Task 2 field names (verbatim), spec §2 repo standards, §6.5, §6.7 exclusion note, §8.

- [ ] **Step 1: Write the architecture doc**

Sections: `## Overview` (static Next.js site, TypeScript strict, Vercel, no backend/database, content read from `content/` at build time), `## Content model` (Task 2 fields per file, the `_` template rule, `careerStart` rationale, YAML-vs-MDX rationale, build-time schema validation coming in the scaffold), `## Quality gates` (Husky `pre-commit`: lint-staged, `tsc --noEmit`, unit tests; `commit-msg`: commitlint; e2e later in `pre-push`; no CI, Vercel build is the final gate; `.claude/` excluded from ESLint, Prettier, lint-staged, TypeScript, Vitest), `## Open decisions` (package manager, MDX/content pipeline library, styling approach, test setup, OG image generation, custom domain, analytics; each "decided in the scaffold spec" or "design phase").

- [ ] **Step 2: Verify**

Run:
```bash
for p in "## Overview" "## Content model" "## Quality gates" "## Open decisions" careerStart languages linkedin company-projects.yaml niche "url" "demo" "order" "_template.mdx" "tsc --noEmit" commitlint "pre-push" ".claude/" "tsconfig" "Vitest"; do grep -qF -- "$p" docs/ARCHITECTURE.md || echo "MISSING: $p"; done
LC_ALL=C.UTF-8 grep -nP '[\x{0102}\x{0103}\x{0110}\x{0111}\x{01A0}\x{01A1}\x{01AF}\x{01B0}\x{1EA0}-\x{1EF9}]' docs/ARCHITECTURE.md; echo checked
```
Expected: only `checked`.

- [ ] **Step 3: Commit**

```bash
git add docs/ARCHITECTURE.md
git commit -m "docs: add architecture overview" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Install Hallmark in the repo

**Files:**
- Create (by installer): `.claude/skills/hallmark/**` (expected 187 files, ~7 MB, includes `LICENSE` and `SKILL.md`), plus any lock/manifest file the installer writes.

**Interfaces:**
- Produces for Tasks 6–7: the actual install path (expected `.claude/skills/hallmark/`), the exact install/update command that worked, and the name of any lock file.

- [ ] **Step 1: Find the non-interactive flags**

Run: `npx --yes skills add --help`
Expected: help text. Note the flag for skipping prompts (e.g. `-y`/`--yes`) and confirm `--agent` exists. If the help shows that project scope is not the default without `-g`, stop and report.

- [ ] **Step 2: Install into the project**

Run from the repo root: `npx --yes skills add nutlope/hallmark --agent claude-code` plus the skip-prompt flag from Step 1 (no `-g`).
Expected: success message naming a path inside the repo.

- [ ] **Step 3: Install the browser-check dependency**

Run: `npm i -g puppeteer-core` (npm prefix is nvm's, so no sudo).
Expected: `added N packages`. Note in the report that it's tied to the current nvm Node version (v24.22.2).

- [ ] **Step 4: Verify real files inside the repo**

Run:
```bash
test -f .claude/skills/hallmark/SKILL.md && test -f .claude/skills/hallmark/LICENSE && echo files-ok
find .claude/skills -type l -printf 'SYMLINK %p -> %l\n'
ls -d ~/.claude/skills/hallmark 2>/dev/null && echo "ALSO INSTALLED GLOBALLY"
git status --porcelain --untracked-files=all | grep -v '^?? .claude/skills/hallmark/' ; echo end
find .claude/skills/hallmark -type f | wc -l; du -sh .claude/skills/hallmark
```
Expected: `files-ok`; no `SYMLINK` lines; no `ALSO INSTALLED GLOBALLY`; the status filter prints only lock/manifest files the installer created (or nothing) then `end`; roughly 187 files and ~7 MB. If a symlink appears, replace it with a real copy of its target inside `.claude/skills/hallmark/` and remove any out-of-repo target the installer created, then re-run this step. If files landed only outside the repo, stop and report.

- [ ] **Step 5: Smoke-test the linter**

Run:
```bash
mkdir -p /tmp/claude-1000/-home-dat-Documents-Code-self-Portfolio/8ee8d6a5-e16b-447f-89f5-ee4e26e93f31/scratchpad/hallmark-smoke
printf '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>t</title></head><body><main><h1>Test</h1></main></body></html>' > /tmp/claude-1000/-home-dat-Documents-Code-self-Portfolio/8ee8d6a5-e16b-447f-89f5-ee4e26e93f31/scratchpad/hallmark-smoke/index.html
node .claude/skills/hallmark/scripts/sloplint.mjs /tmp/claude-1000/-home-dat-Documents-Code-self-Portfolio/8ee8d6a5-e16b-447f-89f5-ee4e26e93f31/scratchpad/hallmark-smoke/index.html --render; echo "exit $?"
```
Expected: the linter runs and prints its report (FAIL lines about the page's design are fine); no error saying `puppeteer-core` or Chrome is missing. If it cannot find Chrome, rerun with the env var or flag its error message names, pointing at `/usr/bin/google-chrome`, and record that in the report for Task 6.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/hallmark <lock/manifest file from Step 4, if any>
git commit -m "chore: add hallmark design skill" -m "Installed with: <exact command from Step 2>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git status --porcelain; echo clean-check
```
Expected: only `clean-check`.

---

### Task 6: `CLAUDE.md`

**Files:**
- Create: `CLAUDE.md`

**Interfaces:**
- Consumes: Task 5 install path, install/update command, any Chrome flag needed.

- [ ] **Step 1: Write `CLAUDE.md`**

Sections in the order of spec §6.2: `## Project`, `## Read before you work`, `## Workflow`, `## Hard rules`, `## Git workflow`, `## Commands`. Content per spec §6.2 and §2 (git rules, verbatim values: never commit on `main`, branch names `feat/<slug>` `fix/<slug>` `refactor/<slug>` `docs/<slug>` `chore/<slug>`, allowed types, `git rebase main`, `--force-with-lease`, squash-merged PR with a `type: message` title and a description linking its spec and plan, owner checks the Vercel preview, agent never merges unless told, `git branch -D` after merge, GitHub settings commands from spec §6.8). Hard rules also name Hallmark's path, its update command (re-run Task 5's command, commit as `chore: update hallmark skill`), "never edit files inside `.claude/skills/hallmark/`", and the requirement to update `docs/PRD.md` when scope changes. `## Commands` holds only: `Added when the Next.js app is scaffolded.` Imperative bullets, no prose paragraphs except the one-paragraph `## Project`.

- [ ] **Step 2: Verify**

Run:
```bash
test "$(wc -l < CLAUDE.md)" -le 100 && echo "lines-ok ($(wc -l < CLAUDE.md))"
for p in docs/PRD.md docs/ARCHITECTURE.md content/ docs/superpowers/specs docs/superpowers/plans OpenSpec TODO '--no-verify' '`any`' Hallmark .claude/skills/hallmark impeccable 'feat/<slug>' 'fix/<slug>' 'docs/<slug>' refactor chore revert 'git rebase main' '--force-with-lease' squash 'gh pr create' 'git branch -D' preview 'enable-squash-merge' 'squash_merge_commit_title' 'Added when the Next.js app is scaffolded'; do grep -qF -- "$p" CLAUDE.md || echo "MISSING: $p"; done
LC_ALL=C.UTF-8 grep -nP '[\x{0102}\x{0103}\x{0110}\x{0111}\x{01A0}\x{01A1}\x{01AF}\x{01B0}\x{1EA0}-\x{1EF9}]' CLAUDE.md; echo checked
```
Expected: `lines-ok (N)` with N ≤ 100, then only `checked`.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add agent rules in CLAUDE.md" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `README.md`

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: final file list from Tasks 1–6; Task 5 Hallmark path.

- [ ] **Step 1: Write the README**

Sections per spec §6.3: title + one-line owner intro with `TODO` for name, role, live-site URL, GitHub, LinkedIn; `## About this repo` (what it is; stack Next.js, TypeScript, Vercel with "details coming with the scaffold"); `## Repo map` (`CLAUDE.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/superpowers/`, `content/`, `.claude/skills/hallmark/` labeled third-party, MIT, by Together AI); `## How I work with AI` (first person, 4–6 lines: Claude Code, superpowers spec → plan → implement, Hallmark for UI, Husky quality gates, PR + squash merge; factual, no hype words); `## Run locally` (`TODO: added with the scaffold`); `## License` (no license; all rights reserved; Hallmark keeps its own MIT license).

- [ ] **Step 2: Verify**

Run:
```bash
for p in "## About this repo" "## Repo map" "## How I work with AI" "## Run locally" "## License" CLAUDE.md docs/PRD.md docs/ARCHITECTURE.md docs/superpowers content/ .claude/skills/hallmark MIT superpowers Hallmark Husky squash TODO; do grep -qF -- "$p" README.md || echo "MISSING: $p"; done
grep -niE 'seamless|cutting-edge|passionate|leverag|robust|world-class' README.md; echo slop-checked
LC_ALL=C.UTF-8 grep -nP '[\x{0102}\x{0103}\x{0110}\x{0111}\x{01A0}\x{01A1}\x{01AF}\x{01B0}\x{1EA0}-\x{1EF9}]' README.md; echo checked
```
Expected: only `slop-checked` and `checked`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Final check, owner review, local squash merge

**Files:** none new.

- [ ] **Step 1: Whole-branch checks**

Run:
```bash
git status --porcelain; echo status-checked
LC_ALL=C.UTF-8 grep -rnP --exclude-dir=.git --exclude-dir=.claude '[\x{0102}\x{0103}\x{0110}\x{0111}\x{01A0}\x{01A1}\x{01AF}\x{01B0}\x{1EA0}-\x{1EF9}]' . ; echo vi-checked
git ls-files | grep -v '^.claude/skills/hallmark/'
git log --oneline main..docs/agent-docs-foundation
```
Expected: `status-checked`, `vi-checked` with nothing before them; tracked files outside Hallmark are exactly `.gitignore`, `CLAUDE.md`, `README.md`, `content/README.md`, `content/company-projects.yaml`, `content/experience.yaml`, `content/profile.yaml`, `content/projects/_template.mdx`, `docs/ARCHITECTURE.md`, `docs/PRD.md`, the spec, this plan (+ any Hallmark lock file); 7 branch commits.

- [ ] **Step 2: Owner review checkpoint**

Stop. Tell the owner (in Vietnamese) which files to read and that `content/` is theirs to fill. Wait until they say to merge. Apply any requested edits as new `docs:`/`fix:` commits on the branch and re-run Step 1.

- [ ] **Step 3: Local squash merge**

```bash
git checkout main
git merge --squash docs/agent-docs-foundation
git commit -m "docs: add agent docs foundation" -m "- CLAUDE.md agent rules and git workflow
- README, PRD, and architecture overview
- content templates for profile, experience and projects
- Hallmark design skill installed in the repo
- spec and plan under docs/superpowers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Verify and clean up**

Run:
```bash
git log --oneline main
git diff --stat main docs/agent-docs-foundation; echo diff-checked
git branch -D docs/agent-docs-foundation && git branch
```
Expected: `main` shows 2 commits (`docs: add agent docs foundation`, `chore: initialize repository`); nothing before `diff-checked`; only `* main` remains.
