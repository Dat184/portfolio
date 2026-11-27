# Agent Docs Foundation — Design

- **Date:** 2026-11-27
- **Status:** Approved by owner (2026-11-27)
- **Scope:** Documentation and repo setup only. No Next.js scaffold, no dependencies, no product code.

## 1. Intent

The owner is building a personal-brand portfolio site whose single job is to win over recruiters. Before any code is written, the repo needs a set of documents that let an AI agent (Claude Code, using the superpowers workflow) build the site the way the owner wants without re-asking the same questions, and without inventing content.

The repo will be **public**, so it is itself a showcase. Tech leads who open the owner's GitHub will read this repo's code, docs, and commit history. The docs must therefore read well to humans too, not only to agents.

## 2. Product decisions (source material for `docs/PRD.md`)

Everything in this section was decided by the owner in conversation, unless marked *(builder's call)*.

### Audience and success

- **Primary reader: HR / recruiters.** They skim, don't read code, and decide in seconds. They look for name, current role, years of experience, tech keywords that match a job description, and foreign languages.
- **Secondary reader: tech leads**, after HR passes the owner along. They read deeper and want evidence of real ability.
- **Desired action after reading:** contact the owner, or open their GitHub / LinkedIn.
- **No blog** for now. The owner has nothing to publish yet.

### Site

- **Language:** English only. No i18n.
- **Home page (`/`)**, content order *(order is builder's call, agreed in principle)*:
  1. Hero: name, current role, 1–2 sentence intro, years of experience, languages spoken, links (GitHub, LinkedIn, email) and a **Download CV** button. Everything HR needs must be visible without scrolling.
  2. Tech stack, grouped (e.g. Frontend / Backend / Tools).
  3. Work experience: company, period, role.
  4. Projects:
     - **Company projects** (e.g. Fountain, e-commerce): **short cards only.** Niche, stack, owner's role, live link if one still works. No detail page, no source code, no confidential details.
     - **Personal projects** (repos on the owner's personal GitHub): card on the home page **plus a detail page** at `/projects/[slug]`. The detail page covers the problem, what the owner built and how, technical challenges and solutions, results, and links to the repo and live demo.
  5. Contact: email, GitHub, LinkedIn, Download CV.
- **Contact:** links only. **No contact form.** Email is a `mailto:` link.
- **CV:** a PDF in the repo (planned path `public/cv.pdf`), updated by replacing the file and pushing. Because the repo is public, the PDF must not contain phone number or home address.
- **No `/admin` area.** Considered and dropped. All content is edited as files in the repo.
- **Deploy:** Vercel (free tier).

### Repo standards (owner decided)

- Next.js (not a plain React SPA), TypeScript in strict mode.
- Lint + format + typecheck + unit tests.
- **Husky** instead of GitHub Actions: `pre-commit` runs lint-staged, `tsc --noEmit`, and unit tests; `commit-msg` runs commitlint (Conventional Commits). The build is not in a hook; Vercel's build is the last gate. Slow tests (e2e), if added later, go in `pre-push`.
- All code comments, docs, and `.md` files are in English. *(Commit messages in English too: builder's call, follows from the same rule.)*
- **Git workflow** (owner decided; solo repo):
  - Default branch is `main`. Every feature or fix starts on a new branch checked out from an up-to-date `main`. No work is committed directly on `main`.
  - Commit messages follow Conventional Commits: `type: message`, e.g. `feat: add hero section`, `fix: correct CV link`, `refactor: extract project card`. Allowed types are the `@commitlint/config-conventional` set (feat, fix, refactor, docs, test, chore, style, perf, build, ci, revert). A scope is optional (`feat(projects): ...`). *(Type list and optional scope: builder's call.)*
  - Conflicts with `main` are resolved by rebasing the feature branch onto `main` (`git fetch origin && git rebase origin/main` from the feature branch; `git rebase main` only while there is no remote), never by merging `main` into the feature branch. *(Corrected after the final review: PRs are squash-merged on GitHub, so local `main` is stale and rebasing onto it would miss the real conflicts.)* If the branch was already pushed, update it with `git push --force-with-lease`; never force-push `main`.
  - Branch names mirror the commit type: `feat/<slug>`, `fix/<slug>`, `refactor/<slug>`, `docs/<slug>`, `chore/<slug>`. *(Builder's call.)*
  - **A branch lands on `main` through a GitHub pull request, merged with squash merge.** The squash commit becomes the only commit on `main`, so the **PR title must itself be a valid `type: message`**; the PR description summarizes the change and links its spec and plan. Vercel's preview deployment for the PR is where the owner checks the feature before merging. *(Builder's calls: when a branch is done the agent asks the owner, pushes the branch, and opens the PR with `gh pr create`, but never merges it unless the owner says so; with no GitHub remote yet, it asks the owner how to land the branch; after the merge, the local branch is deleted with `git branch -D` because git does not see squashed branches as merged.)*
- All agent files stay public, including `CLAUDE.md` and `docs/superpowers/`. The README has a short section on how the owner works with Claude Code and superpowers.
- **UI skill: Hallmark** (`nutlope/hallmark`). The already-installed `impeccable` skill is **not** used in this repo, so two design rulebooks never conflict.
- **Planning: superpowers only.** OpenSpec (also installed on this machine) is not used in this repo.

## 3. Goals, non-goals, anti-goals

**Goals**

- An agent starting a fresh session can read `CLAUDE.md` and know the rules, the workflow, and where to look for product and technical context.
- A tech lead opening the repo understands what it is, who built it, and how, from `README.md`, `docs/PRD.md`, and `docs/ARCHITECTURE.md`.
- The owner can start writing real content in `content/` before any code exists.

**Non-goals**

- Scaffolding Next.js, installing packages, configuring Husky/ESLint/Prettier/Vitest. That is the next spec, and it requires a `package.json`.
- Visual design or `DESIGN.md`. Those come from the Hallmark design phase.
- `AGENTS.md`. The owner only uses Claude Code.
- `.claude/rules/` modular rules (approach C, rejected).
- Creating the GitHub remote or pushing. That happens only when the owner asks.

**Anti-goals** (failure even if everything "works")

- An agent invents personal facts: names, companies, dates, metrics, project details. Every personal fact must come from `content/` or from the owner.
- Confidential company information leaks into a public repo.
- `CLAUDE.md` grows into a long dump that agents skim and ignore.
- Docs that read as AI boilerplate to a human tech lead.

## 4. Constraints

- Public repo: no secrets, no phone number, no home address, no client-confidential data.
- Vercel runtime cannot write to repo files. Content changes always go through git.
- `CLAUDE.md` is loaded into every session, so it must stay short: about 100 lines or fewer *(builder's call on the exact number)*.

## 5. Approaches

| | Approach | Trade-off | Verdict |
|---|---|---|---|
| A | One big `CLAUDE.md` with product, rules, workflow, structure | Fewest files; but loaded every session, so it bloats context, rules get missed, "what" and "how" are mixed | Rejected |
| **B** | **Short `CLAUDE.md` (commands, hard rules, workflow, pointers) + `docs/PRD.md` + `docs/ARCHITECTURE.md` + `content/`** | One job per file; agent reads detail only when needed; PRD and ARCHITECTURE double as human-readable project docs for tech leads | **Chosen by owner** |
| C | B, plus rules split into `.claude/rules/*.md` (optionally scoped to paths) | Leanest context; but many files to keep in sync, hidden directory that repo visitors rarely see; overkill for a portfolio | Rejected |

## 6. Deliverables

### 6.1 Repo setup

- `git init` with default branch `main`.
- `.gitignore`: Node/Next.js defaults (`node_modules/`, `.next/`, `out/`, `coverage/`, `*.tsbuildinfo`, `next-env.d.ts`), `.env*` except `.env.example`, `.vercel/`, `.claude/settings.local.json`, OS/editor junk. `.claude/skills/` is **not** ignored.
- This work follows the git workflow from day one: the only commit made directly on `main` is the bootstrap commit (`chore: initialize repository`, containing just `.gitignore`), which gives `main` a base to branch from. Everything else is done on `docs/agent-docs-foundation`. Because the GitHub repo doesn't exist yet, this one branch lands on `main` with a **local squash merge** (`git merge --squash` + one commit titled `docs: add agent docs foundation`), which gives `main` the same shape a GitHub squash merge would. *(Builder's call.)* From the next branch on, the PR rule applies.

### 6.2 `CLAUDE.md` (short, for agents)

Sections:

1. **Project in one paragraph.** Portfolio for recruiters (HR first, then tech leads). Public repo. Points to `docs/PRD.md`.
2. **Read before you work.** `docs/PRD.md` for product questions, `docs/ARCHITECTURE.md` for technical decisions, `content/` for every personal fact, `docs/superpowers/specs|plans` for current work.
3. **Workflow.** superpowers: brainstorm → spec in `docs/superpowers/specs/` → owner approval → plan in `docs/superpowers/plans/` → implement. No feature code without an approved spec. Do not use OpenSpec.
4. **Hard rules:**
   - Never invent personal content. If something is missing from `content/`, leave a visible `TODO` and ask.
   - Company projects: card fields only. Never add source code, internal names, metrics, or client details the owner didn't write.
   - Public repo: no secrets, phone numbers, or addresses.
   - English for code, comments, docs, and commit messages.
   - Never bypass hooks (`--no-verify`).
   - TypeScript strict; avoid `any`.
   - UI work uses the Hallmark skill; do not use `impeccable`.
   - When a technical decision is made, record it in `docs/ARCHITECTURE.md`; when scope changes, update `docs/PRD.md`.
5. **Git workflow.** The rules from section 2, stated as short imperatives: branch from `main`, branch naming, `type: message` with the allowed types, rebase onto `main` for conflicts, `--force-with-lease` only on feature branches, PR with a `type: message` title merged by squash, agent never merges unless told, GitHub repo settings to apply (section 6.8).
6. **Commands.** Placeholder section: "Added when the Next.js app is scaffolded."

### 6.3 `README.md` (for humans; the repo's landing page)

- Who the owner is (name, role, one line), link to the live site, GitHub and LinkedIn. All personal values are `TODO` placeholders until the owner fills them in. Never invent them.
- What this repo is and the tech stack (Next.js, TypeScript, Vercel; details "coming with the scaffold").
- Repo map: `CLAUDE.md`, `docs/`, `content/`.
- "How I work with AI": Claude Code + superpowers (spec → plan → implement), Hallmark for UI, quality gates with Husky. Short and factual, written in the owner's voice.
- Run locally: placeholder until the scaffold exists.
- License: no license file in v1, so all rights are reserved by default. *(Builder's call: personal content and CV should not be reusable; the owner can add a code license later.)*

### 6.4 `docs/PRD.md`

Written from section 2. Structure: problem and goal, audience (HR, tech lead) and what each needs, user journeys (HR skim → contact/CV; tech lead → personal project detail → GitHub), pages and sections, content rules (company vs personal projects, no invented facts), non-goals (blog, admin, contact form, i18n), success criteria.

**Success criteria** *(builder's proposals, owner can adjust)*:

- On a 1366×768 laptop and a phone, HR sees name, role, years of experience, languages, contact links, and the CV button without scrolling.
- Every personal project card links to a detail page, and every detail page links to its GitHub repo.
- Sharing the site URL on LinkedIn shows a preview card with the owner's name and role (Open Graph metadata).
- Accessibility: WCAG 2.1 AA for contrast, keyboard navigation, and alt text.
- Lighthouse score ≥ 90 for Performance, Accessibility, Best Practices, and SEO on the home page.

### 6.5 `docs/ARCHITECTURE.md`

- **Decided:** Next.js with TypeScript strict, deployed on Vercel; pages are statically generated (no backend, no database); content read from `content/` at build time; Husky hooks as in section 2; no CI service (Vercel build is the final gate).
- **Content model** *(builder's call)*:
  - `content/profile.yaml`: name, role, intro, years of experience or career start date, languages, links (GitHub, LinkedIn, email), stack groups.
  - `content/experience.yaml`: list of jobs (company, role, start, end, short summary, stack).
  - `content/company-projects.yaml`: list of cards (name, niche, role, stack, optional live URL, period).
  - `content/projects/<slug>.mdx`: one file per personal project. Frontmatter holds title, summary, stack, repo URL, optional demo URL, and order; the body holds the case study.
  - Rationale: YAML for structured lists the owner edits by hand; MDX for long-form case studies. The scaffold spec will add build-time schema validation so a missing field fails the build instead of rendering blank.
- **Open (decided in the scaffold spec):** package manager, MDX/content pipeline library, styling approach (depends on Hallmark output), test setup details, Open Graph image generation, custom domain, analytics.

### 6.6 `content/` templates

Create the four files and folder above with the right fields and `TODO` values, plus one example personal project file `content/projects/_template.mdx` showing the case-study sections (Problem / What I built / Challenges & solutions / Results / Links). Include a short `content/README.md` explaining what goes where and the "no confidential company details" rule.

### 6.7 Hallmark

Install Hallmark **into the repo** (owner's decision) and commit it, so anyone who clones the repo gets the same version.

- Command, per the Hallmark README: `npx skills add nutlope/hallmark --agent claude-code` (no `-g`, which would install it machine-wide). Expected location: `.claude/skills/hallmark/`. Right after running it, check where files actually landed and whether the CLI created a lock/manifest file; commit whatever is needed to reproduce the install. Keep Hallmark's MIT licence notice intact.
- Updating Hallmark later = re-run the command and commit the diff (`chore: update hallmark skill`).
- Browser checks (`sloplint --render`, screenshots) need `puppeteer-core` installed globally (`npm i -g puppeteer-core`) and Chrome. Checked on 2026-11-27: Chrome is at `/usr/bin/google-chrome`, Node is v24 (Hallmark needs ≥ 18), `puppeteer-core` is not installed yet.
- Hallmark treats `design.md` / `DESIGN.md` at the repo root as a locked design system. `DESIGN.md` is created later through Hallmark's "lock the system" step, not in this spec.
- Hallmark's optional edit-time hook (`install-hook.mjs`) is not installed now; revisit in the design phase. *(Builder's call.)*
- `.claude/skills/hallmark/` is third-party code (about 187 files / 7 MB, including 50 theme JPGs and some `.tsx`, `.vue`, `.html`, `.css` examples): the scaffold spec must exclude `.claude/` from ESLint, Prettier, lint-staged, TypeScript (`tsconfig` `exclude`), and Vitest, so the repo's hooks never reformat or type-check it.
- `CLAUDE.md` names the skill, where it lives, and the update command. The README's repo map lists it as third-party (MIT).

### 6.8 GitHub

The `gh` CLI is installed and authenticated with `repo` scope (checked 2026-11-27). Creating the public GitHub repo (`gh repo create`) and pushing stay out of scope until the owner asks.

`CLAUDE.md`'s git section records the settings to apply when the repo is created *(builder's call)*: squash merge only (merge commits and rebase merge disabled), squash commit title and message default to the PR title and description, and head branches auto-deleted after merge, e.g. `gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge` plus `gh api -X PATCH repos/<owner>/<repo> -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY`.

## 7. Left to the builder

- Exact wording and length of every document, within the section outlines above.
- `.gitignore` details beyond the listed entries.
- Field names in the content templates, as long as they cover the listed data.

## 8. After this spec

The next brainstorm → spec → plan cycle is **scaffolding the Next.js app**: package manager, content pipeline with schema validation, ESLint/Prettier/TypeScript/Vitest (all excluding `.claude/`), Husky + lint-staged + commitlint (enforcing the type list above), a Husky guard that refuses commits made directly on `main` *(builder's proposal)*, Vercel project. Then the Hallmark design phase produces `DESIGN.md` and the UI.
