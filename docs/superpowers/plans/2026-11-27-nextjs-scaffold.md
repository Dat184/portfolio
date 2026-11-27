# Next.js Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the repo on GitHub and land a Next.js 16 app that loads and validates `content/` at build time, renders it as raw HTML, and enforces the repo's quality gates with Husky.

**Architecture:** A small content loader (`src/lib/content/`) reads YAML/MDX with `yaml`, validates with `zod`, applies the `_`-skip and `TODO` rules, and is unit-tested against fixture folders. App Router pages call a cached `getContent()` and render semantic, undesigned HTML; MDX bodies compile with `next-mdx-remote`'s RSC API. Tooling (ESLint, Prettier, TypeScript, Vitest, Tailwind) is scoped so `.claude/` is never touched.

**Tech Stack:** Next.js 16, React 19, TypeScript (version create-next-app installs), Tailwind CSS v4, zod 4, yaml 2, next-mdx-remote 6, Vitest, Husky 9, lint-staged, commitlint (`@commitlint/config-conventional`), pnpm 12, Node 24, gh CLI.

**Spec:** `docs/superpowers/specs/2026-11-27-nextjs-scaffold-design.md`

## Global Constraints

- English for all code, comments, docs, commit messages. No Vietnamese in any repo file.
- Commit messages: `type: message`, lowercase subject, no trailing period, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Work on branch `chore/scaffold-nextjs`. Never commit on `main` (Task 1's push of the existing `main` is the only `main` operation).
- Never edit `.claude/skills/hallmark/` or `skills-lock.json`. Never edit `content/` except temporary verification files a step creates and then deletes.
- Test fixtures use obviously fake data only (`Test Person`, `example.com`, `example.org`); never the owner's details.
- pnpm only. No UI component libraries. No visual design: pages use at most minimal spacing utilities.
- The loader never reads `process.env`; only `getContent()` does.
- Before pushing the branch (Task 7), ask the owner. Never merge the PR.
- Use the versions create-next-app 16 installs; add other packages at their current versions; don't force TypeScript 7.

## Review Focus

1. **CRLF line endings** in an MDX file the owner edits on another OS. Expected: parses exactly like LF. Test: Task 3 `parses CRLF files`.
2. **A number where text is expected** (`level: 7.5`). Expected: a build error naming `profile.yaml languages[0].level`, not a crash or a silent cast. Test: Task 3 `names the field when a number is given for text`.
3. **An emptied file** (template copied, then everything deleted). Expected: a clear error naming the file, not a `TypeError`. Test: Task 3 `reports an empty file clearly`.
4. **Placeholder variants** (`TODO - ask manager`, `TODO: fill`) in free-text fields: they pass validation and would ship to recruiters. Expected: any string whose trimmed value starts with `TODO` is a placeholder. Test: Task 3 `treats any string starting with TODO as a placeholder`.
5. **No `content/projects/` folder** (owner deletes it). Expected: zero personal projects, no crash. Test: Task 3 `treats a missing projects folder as no projects`.

---

### Task 1: Publish the repo and open the branch

**Files:** none in the repo (GitHub settings only); commits the spec and this plan.

**Interfaces:**
- Produces: remote `origin` = `github.com/<owner>/portfolio` (public), squash-only; local branch `chore/scaffold-nextjs` with the spec + plan committed.

- [ ] **Step 1: Preconditions**

Run: `git branch --show-current && git status --porcelain && gh auth status`
Expected: `main`; status lists only `?? docs/superpowers/specs/2026-11-27-nextjs-scaffold-design.md` and `?? docs/superpowers/plans/2026-11-27-nextjs-scaffold.md`; gh logged in.

- [ ] **Step 2: Create the public repo and push `main`**

Run: `gh repo create portfolio --public --source . --remote origin --description "Personal portfolio site built with Next.js, TypeScript, and Tailwind CSS." --push`
Expected: repo URL printed, `main` pushed. If the push is rejected for exposing a private email, stop and ask the owner.

- [ ] **Step 3: Apply squash-only settings**

```bash
gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge
gh api -X PATCH repos/{owner}/{repo} -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY >/dev/null
gh repo view --json visibility,squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed,deleteBranchOnMerge
```
Expected: `"visibility":"PUBLIC"`, `"squashMergeAllowed":true`, `"mergeCommitAllowed":false`, `"rebaseMergeAllowed":false`, `"deleteBranchOnMerge":true`. Also `gh api repos/{owner}/{repo} --jq '.squash_merge_commit_title+" "+.squash_merge_commit_message'` prints `PR_TITLE PR_BODY`.

- [ ] **Step 4: Branch and commit spec + plan**

```bash
git switch -c chore/scaffold-nextjs
git add docs/superpowers
git commit -m "docs: add next.js scaffold spec and plan" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git status --porcelain; git log --oneline -1 origin/main
```
Expected: empty status; `origin/main` is `docs: add agent docs foundation`.

---

### Task 2: Scaffold Next.js with scoped tooling

**Files:**
- Create (from create-next-app, then edited): `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `.prettierrc.json` (`{}`), `.prettierignore`, `.nvmrc` (`24`)
- Modify: `.gitignore` (merge create-next-app entries not already present)
- Delete: every create-next-app demo asset (`public/*.svg`, `src/app/favicon.ico`, `*.module.css`, its `README.md`)

**Interfaces:**
- Produces: scripts `dev`, `build`, `start`, `lint` (`eslint .`), `format` (`prettier --write .`), `format:check` (`prettier --check .`), `typecheck` (`next typegen && tsc --noEmit`), `test` (`vitest run`, wired in Task 3); `package.json` `name: "portfolio"`, `private: true`, `packageManager: "pnpm@<installed version>"`, `engines.node: ">=24"`.

- [ ] **Step 1: Generate into a temp dir**

Run `pnpm dlx create-next-app@16 --help`, then create the app in `$(mktemp -d)/portfolio` non-interactively with: TypeScript, Tailwind, ESLint, App Router, `src/` dir, import alias `@/*`, pnpm, no git init. Expected: app created.

- [ ] **Step 2: Move it into the repo**

Copy everything except `.git/`, `node_modules/`, `README.md`, `.gitignore`, and any generated `AGENTS.md`/`CLAUDE.md` into the repo root without overwriting any existing file; append create-next-app's `.gitignore` lines that the repo's `.gitignore` lacks (keep `.claude/settings.local.json`; never ignore `.claude/skills/`). Delete the demo assets listed above and replace `src/app/page.tsx` with a placeholder `<main><h1>Portfolio</h1></main>`. Run `pnpm install`.
Expected: `git status` shows only new scaffold files, `.gitignore` modified; `ls public` shows nothing.

- [ ] **Step 3: Configure scope and strictness**

- `tsconfig.json`: `strict: true`, add `noUncheckedIndexedAccess: true`, `exclude` contains `node_modules`, `.claude`, `.superpowers`.
- `eslint.config.mjs`: add `.claude/**` and `.superpowers/**` to the global ignores.
- `.prettierignore`: `.claude/`, `.superpowers/`, `skills-lock.json`, `pnpm-lock.yaml`, `*.md`, `*.mdx`.
- `src/app/globals.css`: only `@import "tailwindcss" source("..");` (scans `src/` only).
- `package.json`: name/private/scripts/`packageManager`/`engines` per Interfaces; `.nvmrc` = `24`.

- [ ] **Step 4: Prove `.claude/` is out of scope (sentinels)**

```bash
mkdir -p .claude/zz-sentinel
printf 'export const x: number = "not a number";\nexport const C = () => <div className="bg-[#abcdef]" />;\n' > .claude/zz-sentinel/s.tsx
pnpm typecheck && pnpm lint && pnpm format:check && pnpm build
grep -rl 'abcdef' .next/static --include='*.css'; echo css-checked
rm -rf .claude/zz-sentinel
```
Expected: all four commands succeed (the type error and the file are ignored); nothing printed before `css-checked`. Then confirm the sentinel can fail: with the sentinel back in place, temporarily remove `source("..")` from `globals.css`, `pnpm build`, and check whether `abcdef` appears in the CSS; restore the line and delete the sentinel. If it does not appear even without the restriction, record that Tailwind already skips `.claude/` and keep `source("..")` anyway.

- [ ] **Step 5: Commit**

```bash
git add -A
git status --porcelain | grep -E '\.claude/|skills-lock' ; echo scope-checked
git commit -m "chore: scaffold next.js app with tailwind" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected: nothing before `scope-checked`.

---

### Task 3: Content loader (TDD)

**Files:**
- Create: `src/lib/content/schema.ts`, `src/lib/content/load.ts`, `src/lib/content/load.test.ts`, `vitest.config.mts`
- Create fixtures: `src/lib/content/__fixtures__/valid/{profile.yaml,experience.yaml,company-projects.yaml}`, `.../valid/projects/{alpha-tool.mdx,beta-app.mdx,_template.mdx}`, `.../valid/projects/_drafts/gamma.mdx`, `.../public-cv/cv.pdf` (any bytes), `.../public-empty/.gitkeep`

**Interfaces:**
- Produces (`schema.ts`): `profileSchema`, `experienceSchema`, `companyProjectsSchema`, `projectFrontmatterSchema`; types `Profile`, `Job`, `CompanyProject`, `ProjectFrontmatter` (via `z.infer`). Fields exactly as `docs/ARCHITECTURE.md` § Content model; objects `.strict()`.
- Produces (`load.ts`):
  - `interface LoadOptions { contentDir: string; publicDir: string; production: boolean }`
  - `interface Project extends ProjectFrontmatter { slug: string; body: string }`
  - `interface Content { profile: Profile; experience: Job[]; companyProjects: CompanyProject[]; projects: Project[]; hasCv: boolean; placeholders: string[] }`
  - `class ContentError extends Error { readonly issues: string[] }` (message = issues joined by newlines)
  - `function loadContent(options: LoadOptions): Content` (synchronous)
  - `function isPlaceholder(value: unknown): boolean` (string whose trimmed value starts with `TODO`)
  - `function yearsOfExperience(careerStart: string, now: Date): number | "TODO"`
- String formats (tests assert them): validation issue = `<file> <path>: <message>`; placeholder = `<file>: <path>`; `<file>` relative to `contentDir` (`profile.yaml`, `projects/beta-app.mdx`); `<path>` like `links.github`, `[0].end`, `languages[0].level`, `body`; CV placeholder = `public/cv.pdf`. (The spec's error example prefixes `content/`; the relative form is used so fixtures and real content print the same way.)

- [ ] **Step 1: Wire Vitest**

`vitest.config.mts`: `environment: "node"`, `include: ["src/**/*.test.ts"]`; `package.json` `test` = `vitest run`. Add deps: `vitest`, `zod`, `yaml`. Write the `valid` fixture (Test Person, `https://github.com/example`, `test@example.com`, careerStart `2020-06`, 2 jobs, 1 company project with `url: null`, `alpha-tool` order 2, `beta-app` order 1, `_template.mdx` full of `TODO`, and `_drafts/Gamma_Bad.mdx`, an invalid slug that would fail if the `_drafts` folder were read).

- [ ] **Step 2: Write the failing tests**

Helper in the test file: `fixture(overrides: Record<string, string | null>): string` copies `__fixtures__/valid` to a new `mkdtempSync` dir, writes each override (relative path → content; `null` deletes), returns the dir. `load(dir, opts?)` calls `loadContent({ contentDir: dir, publicDir: CV_DIR, production: false, ...opts })`. Tests:

```ts
it("loads the valid fixture")                      // profile.name === "Test Person"; experience.length === 2; companyProjects[0].url === null; placeholders == []; hasCv === true
it("skips files and folders starting with _")      // projects.map(p => p.slug) == ["beta-app", "alpha-tool"]
it("sorts projects by order, then slug")           // alpha-tool order → 1: ["alpha-tool", "beta-app"]
it("rejects unknown keys")                         // profile links.linkdin → ContentError; some issue starts with "profile.yaml" and contains "linkdin"
it("rejects a malformed date")                     // experience [0].end "2024-13" → issue starts with "experience.yaml [0].end:"
it("rejects end before start")                     // [0] start 2023-05, end 2022-01 → issue starts with "experience.yaml [0]"
it("rejects http URLs")                            // links.github http://example.com → issue starts with "profile.yaml links.github:"
it("rejects a bad slug")                           // projects/Bad_Slug.mdx → issue contains "projects/Bad_Slug.mdx"
it("rejects non-mdx files in projects/")           // projects/notes.md → issue contains "projects/notes.md"
it("reports invalid YAML with the file name")      // profile.yaml "name: [" → issue starts with "profile.yaml"
it("reports an empty file clearly")                // profile.yaml "" → ContentError (not TypeError); issue starts with "profile.yaml"
it("names the field when a number is given for text") // languages[0].level: 7.5 → issue starts with "profile.yaml languages[0].level:"
it("collects placeholders with paths")             // links.github TODO + "TODO: write" line in beta-app body → placeholders contain "profile.yaml: links.github" and "projects/beta-app.mdx: body"
it("treats any string starting with TODO as a placeholder") // intro "TODO - ask" → placeholders contain "profile.yaml: intro"
it("fails in production when placeholders exist")  // same as above + production: true → ContentError whose issues contain "profile.yaml: links.github"
it("passes outside production with placeholders")  // production: false → no throw
it("counts a missing cv.pdf as a placeholder")     // publicDir = public-empty → hasCv false; placeholders contain "public/cv.pdf"
it("parses CRLF files")                            // beta-app.mdx with \r\n → loads; title unchanged; body has no stray "\r---"
it("treats a missing projects folder as no projects") // delete projects/ → projects == []
it("loads the real content/ folder outside production") // loadContent({ contentDir: "content", publicDir: "public", production: false }) does not throw
it("yearsOfExperience rounds down to whole years") // ("2020-06", new Date("2026-11-27")) === 6; ("2020-12", new Date("2026-11-27")) === 5
it("yearsOfExperience returns TODO for a placeholder") // ("TODO", any date) === "TODO"
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm test`
Expected: FAIL, module `./load` not found (or every test failing).

- [ ] **Step 4: Implement `schema.ts` and `load.ts`**

- Schema: wrap every string field as `z.union([placeholder, inner])` where `placeholder` accepts any string `isPlaceholder` is true for; dates `^\d{4}-(0[1-9]|1[0-2])$`; `end` also `present`; URLs `https://` only; email `z.email()`; `url`/`demo` nullable; `order` integer; arrays `stack`/`items`/`languages` non-empty; top-level lists may be empty.
- Loader: read the three YAML files and `projects/` (skip names starting with `_` or `.`; non-`.mdx` files are issues; missing `projects/` = none); split frontmatter with a CRLF-tolerant regex and parse it with `yaml`; slug regex `^[a-z0-9]+(-[a-z0-9]+)*$`; zod issues → `<file> <path>: <message>`; `end < start` check skipped when either is a placeholder; collect placeholders by walking parsed data (and body lines); `hasCv` = `existsSync(join(publicDir, "cv.pdf"))`; throw one `ContentError` with all issues; in production, placeholders become issues too; sort projects by `order`, then slug.

- [ ] **Step 5: Run to verify they pass**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all tests PASS (22); typecheck and lint clean.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add content loader with validation" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Pages

**Files:**
- Create: `src/lib/content/index.ts`, `src/app/projects/[slug]/page.tsx`, `src/app/not-found.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`

**Interfaces:**
- Consumes: Task 3 `loadContent`, `Content`, `Project`, `yearsOfExperience`.
- Produces: `getContent(): Content` in `index.ts`, memoized per process, calling `loadContent({ contentDir: join(process.cwd(), "content"), publicDir: join(process.cwd(), "public"), production: process.env.VERCEL_ENV === "production" })` and `console.warn`ing the placeholder list once when non-empty.

- [ ] **Step 1: Write the failing check**

```bash
cp content/projects/_template.mdx content/projects/demo-check.mdx
pnpm build 2>&1 | grep -E 'projects/demo-check' ; echo build-checked
```
Expected (before pages exist): nothing before `build-checked`.

- [ ] **Step 2: Implement**

- `layout.tsx`: `<html lang="en">`; `generateMetadata` → title `` `${name} — ${role}` ``, description `intro`.
- `page.tsx`: sections in PRD order (hero, tech stack, work experience, projects, contact) as headings/lists/links; years from `yearsOfExperience(profile.careerStart, new Date())`; email as `mailto:`; CV link `/cv.pdf` when `hasCv`, else the text `TODO: add public/cv.pdf`; company projects without detail links; personal projects link to `/projects/<slug>`.
- `projects/[slug]/page.tsx`: `generateStaticParams` from `getContent().projects`; `export const dynamicParams = false`; `params` is a Promise in Next 16; render title, summary, stack, repo/demo links, and the body via `compileMDX({ source: project.body })` from `next-mdx-remote/rsc`; `generateMetadata` → project title. Add dep `next-mdx-remote`.
- `not-found.tsx`: plain heading + link home.
- No `"use client"` anywhere; every route is statically generated.

- [ ] **Step 3: Verify pages and the production gate**

```bash
BUILD=$(mktemp); PROD=$(mktemp)
pnpm build >"$BUILD" 2>&1; grep -E 'projects/demo-check' "$BUILD" && echo route-ok; grep -c 'public/cv.pdf' "$BUILD"
(pnpm start -p 3123 >/dev/null 2>&1 &)
curl -s --retry 30 --retry-connrefused --retry-delay 1 localhost:3123/ | grep -c 'mailto:'
curl -s localhost:3123/projects/demo-check | grep -c 'TODO'
curl -s -o /dev/null -w '%{http_code}\n' localhost:3123/projects/nope
pkill -f 'next start -p 3123'
VERCEL_ENV=production pnpm build >"$PROD" 2>&1; echo "prod exit $?"; grep -c 'profile.yaml: name' "$PROD"
rm content/projects/demo-check.mdx
```
Expected: `route-ok`; the placeholder warning (which lists `public/cv.pdf`) appears in the build log (Next may print it once per build worker; one cache per process is what the spec's "once" means here); mailto count ≥ 1; TODO count ≥ 1; `404`; `prod exit` non-zero; the production log lists `profile.yaml: name` (count ≥ 1).

- [ ] **Step 4: Commit**

```bash
git status --porcelain | grep demo-check; echo temp-removed
pnpm lint && pnpm typecheck && pnpm test
git add -A && git commit -m "feat: render raw home and project pages" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected: nothing before `temp-removed`; checks pass.

---

### Task 5: Husky, lint-staged, commitlint

**Files:**
- Create: `.husky/pre-commit`, `.husky/commit-msg`, `commitlint.config.mjs`
- Modify: `package.json` (`prepare: "husky"`, `lint-staged` config, devDeps)

**Interfaces:**
- Consumes: scripts `typecheck`, `test` (Task 2/3).

- [ ] **Step 1: Write the failing checks**

```bash
echo "bad message" | pnpm exec commitlint; echo "exit $?"
```
Expected: fails because commitlint isn't installed yet.

- [ ] **Step 2: Implement**

- Install `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`; `pnpm exec husky init`.
- `commitlint.config.mjs`: `export default { extends: ["@commitlint/config-conventional"] };`
- `lint-staged`: `"*.{ts,tsx,js,mjs}": ["eslint --fix --no-warn-ignored", "prettier --write"]`, `"*.{json,css,yaml,yml}": ["prettier --write"]`.
- `.husky/pre-commit`, in order: refuse when `git symbolic-ref --short -q HEAD` is `main` (message: `Never commit on main: create a branch (see CLAUDE.md).`, exit 1; detached HEAD passes); `pnpm exec lint-staged`; `pnpm typecheck`; `pnpm test`.
- `.husky/commit-msg`: `pnpm exec commitlint --edit "$1"`.

- [ ] **Step 3: Verify**

The real `main` has no `.husky/` until this PR merges, so the guard is tested in a throwaway repo:

```bash
echo "bad message" | pnpm exec commitlint >/dev/null 2>&1; echo "bad exit $?"
echo "chore: ok" | pnpm exec commitlint >/dev/null; echo "good exit $?"
T=$(mktemp -d); git -C "$T" init -q -b main; cp .husky/pre-commit "$T/"
(cd "$T" && sh ./pre-commit) >"$T/main.log" 2>&1; echo "main exit $?"; grep -c 'Never commit on main' "$T/main.log"
git -C "$T" checkout -q -b feat/x; (cd "$T" && sh ./pre-commit) >"$T/feat.log" 2>&1; grep -c 'Never commit on main' "$T/feat.log"
git add -A && git commit -m "Bad Message"; echo "msg-hook exit $?"
```
Expected: `bad exit 1`; `good exit 0`; `main exit 1` with count `1`; feature-branch count `0` (the script goes on to lint-staged, which fails there for unrelated reasons); `msg-hook exit 1` (pre-commit passes, commit-msg rejects).

- [ ] **Step 4: Commit (through the hooks)**

```bash
git add -A && git commit -m "chore: add husky, lint-staged and commitlint" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected: pre-commit runs lint-staged, typecheck, and tests, then commits.

---

### Task 6: Docs reflect the real setup

**Files:**
- Modify: `CLAUDE.md` (§ Commands; Git workflow line about checking with `pnpm dev` until Vercel is connected), `README.md` (status line; § Run locally), `docs/ARCHITECTURE.md` (status line; Open decisions; Decision log)

**Interfaces:**
- Consumes: scripts from Tasks 2–5.

- [ ] **Step 1: Failing check**

```bash
for p in 'pnpm dev' 'pnpm build' 'pnpm lint' 'pnpm format' 'pnpm typecheck' 'pnpm test' 'until Vercel is connected'; do grep -qF -- "$p" CLAUDE.md || echo "MISSING CLAUDE: $p"; done
for p in 'pnpm install' 'pnpm dev'; do grep -qF -- "$p" README.md || echo "MISSING README: $p"; done
for p in 'pnpm' 'next-mdx-remote' 'Tailwind CSS v4' 'VERCEL_ENV' 'Prettier'; do grep -qF -- "$p" docs/ARCHITECTURE.md || echo "MISSING ARCH: $p"; done
grep -c 'Added when the Next.js app is scaffolded' CLAUDE.md; grep -c 'No app code' README.md docs/ARCHITECTURE.md
```
Expected now: MISSING lines, and the old placeholder/status counts are 1.

- [ ] **Step 2: Edit**

- `CLAUDE.md` § Commands: one line each for `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm test`, plus `VERCEL_ENV=production pnpm build` to rehearse the production gate. Git section: "until Vercel is connected, the owner checks a branch locally with `pnpm dev`". Stay ≤ 100 lines.
- `README.md`: status → scaffold in, design next; § Run locally: Node 24, `pnpm install`, `pnpm dev`.
- `docs/ARCHITECTURE.md`: status → app scaffolded, no visual design yet; Open decisions: remove decided rows (package manager pnpm, own loader, Tailwind CSS v4, Vitest); Decision log rows (2026-11-27): pnpm; own content loader (`yaml` + `zod` + `next-mdx-remote`); Tailwind CSS v4 scoped to `src/`; `TODO` fails only `VERCEL_ENV=production` builds; Prettier skips Markdown/MDX.

- [ ] **Step 3: Verify**

Re-run Step 1. Expected: no MISSING lines; both old counts `0`; `wc -l < CLAUDE.md` ≤ 100; no Vietnamese:
`LC_ALL=C.UTF-8 grep -rnP --exclude-dir={.git,.claude,.superpowers,node_modules,.next} '[\x{0102}\x{0103}\x{0110}\x{0111}\x{01A0}\x{01A1}\x{01AF}\x{01B0}\x{1EA0}-\x{1EF9}]' . ; echo vi-checked` prints only `vi-checked`.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md docs/ARCHITECTURE.md && git commit -m "docs: document scaffold commands and decisions" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Final checks and pull request

- [ ] **Step 1: Full suite**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && git status --porcelain && echo all-green`
Expected: `all-green` with nothing listed before it.

- [ ] **Step 2: Ask the owner**

Stop. Tell the owner (in Vietnamese) the branch is ready, how to try it (`pnpm install && pnpm dev`), and ask before pushing.

- [ ] **Step 3: Push and open the PR (after the owner says yes)**

```bash
git push -u origin chore/scaffold-nextjs
gh pr create --base main --title "chore: scaffold next.js app" --body "<summary of the 6 commits; links to docs/superpowers/specs/2026-11-27-nextjs-scaffold-design.md and docs/superpowers/plans/2026-11-27-nextjs-scaffold.md; how to test locally>

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```
Expected: PR URL. Do not merge.
