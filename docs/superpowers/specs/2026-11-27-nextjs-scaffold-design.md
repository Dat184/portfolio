# Next.js Scaffold — Design

- **Date:** 2026-11-27
- **Status:** Approved by owner (2026-11-27)
- **Builds on:** `docs/PRD.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`, and the [agent docs foundation spec](2026-11-27-agent-docs-foundation-design.md) §8.

## 1. Intent

Lay the technical foundation the design phase will build on: a Next.js app that reads `content/` at build time, validates it, and renders it as plain, undesigned HTML, plus the quality gates `ARCHITECTURE.md` promises. The Hallmark design phase then designs the pages on top of working data, instead of mixing plumbing and design in one step.

The repo goes **public on GitHub** in this step (owner's decision), so from here on tech leads can read it. The code has to be clean, small, and obviously intentional, with no create-next-app leftovers.

## 2. Decisions

Owner decided unless marked *(builder's call)*.

- **GitHub repo:** created now, **public**, named `portfolio` *(name: builder's call, owner didn't object)*, English description. Squash-only settings from `CLAUDE.md` applied at creation. Current `main` (2 commits) is pushed first; this work then lands through a PR from `chore/scaffold-nextjs` *(branch name: builder's call, shown to the owner)*.
- **Vercel: not connected yet.** No Vercel project, no previews. Until it is connected, the owner checks a branch locally with `pnpm dev`.
- **Stack:** Next.js 16 (App Router) + React 19, TypeScript strict, **pnpm** *(builder's call: pnpm 12.8.1 is installed)*, **Tailwind CSS v4**.
- **Content pipeline: approach A**, a small loader written in this repo with `yaml` + `zod`, and `next-mdx-remote` for the MDX case studies.
- **Pages render raw content** *(builder's call, not objected)*: semantic HTML, no visual design. Design is the Hallmark phase's job.

## 3. Goals, non-goals, anti-goals

**Goals**

- `pnpm dev` and `pnpm build` work, with `content/` still all `TODO`.
- Every field in `content/` is validated at build time; a malformed value fails with a message naming the file and field.
- The two repo rules are code with tests: `_`-prefixed files are skipped; `TODO` fails only the real production deploy.
- Husky + commitlint + lint-staged enforce the quality gates and the "never commit on `main`" rule.
- `CLAUDE.md`, `README.md`, and `ARCHITECTURE.md` reflect the real setup (commands, decisions).

**Non-goals**

- Visual design, layout, fonts, colors, dark mode, the Open Graph image (Hallmark phase).
- `public/cv.pdf` itself (the owner provides it).
- Connecting Vercel, custom domain, analytics.
- E2E tests (Playwright).
- UI component libraries (shadcn/ui etc.): they would pre-empt Hallmark's design choices.

**Anti-goals**

- Any create-next-app boilerplate left in the repo (demo page, Vercel/Next logos in `public/`, demo CSS).
- Tooling that touches `.claude/` or `skills-lock.json` (lint, format, type-check, Tailwind scanning).
- Invented content: pages show `TODO` where content is missing; they never fill gaps.
- A loader whose behavior can only be checked by building the site.

## 4. Constraints

- Public repo from the first push: no secrets, no `.env` files committed.
- `create-next-app` refuses a non-empty directory. Scaffold into a temporary directory and move the files in, keeping every existing file (`CLAUDE.md`, `README.md`, `content/`, `docs/`, `.claude/`, `skills-lock.json`), and merge `.gitignore` by hand.
- Use the TypeScript major version that `create-next-app` installs for Next 16. Don't force TypeScript 7 (latest on npm) unless Next 16 supports it.
- Tailwind v4 auto-detects class sources in every non-gitignored file, which would include Hallmark's example `.tsx`/`.html`/`.vue` files. Restrict it (`@import "tailwindcss" source("../")` with `@source not "../../.claude"`, or an equivalent) so `.claude/` is never scanned.
- No CI: everything is enforced by Husky locally.

## 5. Approaches (content pipeline)

| | Approach | Trade-off | Verdict |
|---|---|---|---|
| **A** | **Own loader: `yaml` + `zod` + `next-mdx-remote`** | Few dependencies; the `_` and `TODO` rules are plain code with unit tests; no generated folders; readable code for tech leads. Costs ~150–200 lines to write and maintain. | **Chosen by owner** |
| B | Velite 0.4 (content collections, schema, MDX, generated types) | Less code; but pre-1.0, needs a separate build step before `next dev`/`next build` under Turbopack, a generated folder, and the two repo rules squeezed into its transform hooks (harder to test). | Rejected |
| C | Content Collections | Same trade-offs as B. | Rejected |

## 6. Design

### 6.1 Layout

```
src/
  app/
    layout.tsx                  # <html lang="en">, metadata from profile, globals.css
    page.tsx                    # home: raw render of all sections
    projects/[slug]/page.tsx    # personal project detail: frontmatter + compiled MDX
    not-found.tsx               # plain 404
    globals.css                 # Tailwind import + source restriction only
  lib/content/
    schema.ts                   # zod schemas
    load.ts                     # file reading, validation, TODO policy
    load.test.ts                # Vitest, against fixture directories
    __fixtures__/               # small content/ trees for tests
```

*(Exact file split inside `lib/content/`: builder's call, as long as `schema.ts`/`load.ts` stay small and focused.)*

### 6.2 Content loading

- **Inputs are parameters, not globals:** the loader takes `{ contentDir, publicDir, production }`. Pages pass `content/`, `public/`, and `production: process.env.VERCEL_ENV === "production"`; tests pass fixture directories and either mode. The loader never reads `process.env` itself.
- **Called once per build:** pages share one cached result per process, so the placeholder warning prints once. *(Caching mechanism: builder's call.)*
- **Files:** `profile.yaml`, `experience.yaml`, `company-projects.yaml`, `projects/*.mdx`, with exactly the fields in `docs/ARCHITECTURE.md` § Content model.
- **Schemas are strict:** unknown keys fail, so typos like `linkdin:` are caught.
- **Field rules:**
  - `careerStart`, `start`: `YYYY-MM`. `end`: `YYYY-MM` or `present`. `end` must not be before `start`.
  - `links.github`, `links.linkedin`, `url`, `repo`, `demo`: absolute `https://` URLs. `url`/`demo` may be `null`.
  - `links.email`: a valid email address.
  - `stack`, `items`, `languages`: non-empty arrays. The top-level lists in `experience.yaml` and `company-projects.yaml` may be empty (the section then renders nothing), and zero personal projects is valid.
  - `order`: integer. Projects sort by `order`, then by slug.
  - Slug = MDX file name without extension; must match `^[a-z0-9]+(-[a-z0-9]+)*$`. Duplicate slugs are impossible by construction.
- **`_` files:** any file or directory entry whose name starts with `_` is skipped: never read, validated, or rendered.
- **`TODO` placeholder:** every string field, including array items, accepts the literal `TODO` as a placeholder in place of a valid value. In an MDX body, any line whose trimmed text starts with `TODO` is a placeholder. The loader collects the path of every placeholder (e.g. `profile.yaml: links.github`, `projects/my-tool.mdx: body`).
  - **Production deploy** (`process.env.VERCEL_ENV === "production"`): any placeholder fails the build with the full list of paths.
  - **Everywhere else** (local dev/build, tests, future previews): the build passes, the loader logs one warning listing the paths, and pages render `TODO` visibly.
  - Validation errors (bad format, unknown key, missing field) always fail, in every environment.
- **CV:** the loader reports whether `public/cv.pdf` exists. Missing CV counts as a placeholder (`public/cv.pdf`), with the same production rule.
- **Years of experience:** computed from `careerStart` at build time (whole years, rounded down). `TODO` when `careerStart` is a placeholder.
- **Errors** name the file and the field path, e.g. `content/experience.yaml [0].end: expected YYYY-MM or "present"`.

### 6.3 Pages

- **`/`**: one `<main>` with sections in PRD order (hero, tech stack, work experience, projects, contact) as semantic HTML: headings, lists, links. Email is a `mailto:` link. CV link points to `/cv.pdf` when the file exists, otherwise shows `TODO`. Company projects render as card content without links to a detail page; personal projects link to `/projects/<slug>`.
- **`/projects/[slug]`**: `generateStaticParams` from the loaded projects, `dynamicParams = false`; title, summary, stack, repo/demo links from frontmatter; MDX body compiled with `next-mdx-remote`'s RSC API. No custom MDX components yet.
- **Metadata:** `<title>` = `name — role`, description = `intro`, from `profile.yaml`. `lang="en"`.
- All pages are statically generated. No client components.
- Styling: Tailwind is installed and wired up, but the pages use at most minimal utility classes for readability (e.g. spacing). No design system.

### 6.4 Quality tooling

- **ESLint:** the flat config `create-next-app` generates for Next 16 (`eslint-config-next`), ignoring `.claude/**`.
- **Prettier:** formats code and config (`ts`, `tsx`, `js`, `mjs`, `json`, `css`, `yaml`). Ignores `.claude/`, `skills-lock.json`, `pnpm-lock.yaml`, and all `*.md`/`*.mdx` *(builder's call: prose and MDX stay exactly as written; Prettier can break MDX)*.
- **TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true` *(builder's call)*; `exclude` contains `.claude`.
- **Vitest:** Node environment; `include` only `src/**/*.test.ts`; `.claude/` never matched.
- **Tests (minimum):** valid fixture loads; `_` file skipped; unknown key fails; bad date fails; `end` before `start` fails; bad slug fails; placeholders collected with correct paths (including a `TODO` line in an MDX body); production mode fails on placeholders; non-production passes; missing `cv.pdf` is a placeholder; years-of-experience computation; projects sorted by `order` then slug; plus one test that loads the real `content/` folder in non-production mode, so a broken edit to content fails `pnpm test` and therefore the commit.
- **Husky** (`prepare` script installs it):
  - `pre-commit`: (1) refuse when the current branch is `main` (detached HEAD, e.g. mid-rebase, is allowed); (2) lint-staged (ESLint `--fix` + Prettier on staged files); (3) `pnpm typecheck`; (4) `pnpm test`.
  - `typecheck` generates Next's route and env types first (`next typegen`), then runs `tsc --noEmit`. `next-env.d.ts` is gitignored, so a fresh clone must be able to type-check without running `next dev` first.
  - `commit-msg`: commitlint with `@commitlint/config-conventional`.
- **`package.json` scripts:** `dev`, `build`, `start`, `lint`, `format`, `format:check`, `typecheck`, `test`. `packageManager` pinned to the installed pnpm; `engines.node` `>=24` and `.nvmrc` `24` *(builder's call)*.

### 6.5 Docs updates

- **`CLAUDE.md` § Commands:** the scripts above, one line each. Git section: until Vercel is connected, the owner checks a branch with `pnpm dev`.
- **`README.md` § Run locally:** `pnpm install`, `pnpm dev`; status line updated (scaffold in, design next).
- **`docs/ARCHITECTURE.md`:** status line updated; Open decisions table updated (package manager, pipeline, styling, tests decided); Decision log rows: pnpm, own content loader, Tailwind v4, TODO fails only production deploys, Prettier skips Markdown/MDX.

### 6.6 GitHub

1. `gh repo create portfolio --public --source . --remote origin --description "<English one-liner>"` and push `main`.
2. Apply the squash-only settings from `CLAUDE.md`.
3. Do the work on `chore/scaffold-nextjs`; commit the spec and plan first.
4. At the end: ask the owner, push the branch, `gh pr create` with title `chore: scaffold next.js app` and a body linking this spec and its plan. The owner merges.

## 7. Risks

- **pnpm 12 on Vercel:** when Vercel is connected later, check it supports the pinned pnpm version (or enable Corepack there). Out of scope now; noted for the Vercel step.
- **Push protection:** if the owner's GitHub account blocks pushes that expose a private email, the first push fails. The owner already chose to keep their email; if this happens, stop and ask.
- **Next 16 / ESLint 10 / Vitest 5 versions move fast:** use what `create-next-app` installs, then add the rest at their current versions; resolve peer warnings rather than forcing versions.

## 8. Left to the builder

- Exact zod schema code, error message wording beyond the example format, fixture contents.
- Exact markup of the raw pages, within §6.3.
- Exact lint-staged globs and Prettier options (defaults preferred).
