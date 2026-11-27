# AGENTS.md

## Project

A personal portfolio site whose job is to win over recruiters: HR skims it first, then tech leads read it after HR passes the owner along. Visitors should end up contacting the owner, downloading the CV, or opening GitHub/LinkedIn. The repo is **public**, so tech leads will also read this code, these docs, and the commit history. Full requirements: `docs/PRD.md`.

## Read before you work

- `docs/PRD.md`: what the site is, who it's for, pages, content rules, non-goals.
- `README.md`: technical overview, quality gates, and decision log.
- `content/README.md`: content model and editing rules.
- `content/`: the only source of personal facts (profile, experience, projects).
- `docs/superpowers/specs/` and `docs/superpowers/plans/`: approved designs and plans for current and past work.

## Workflow

- Use superpowers: brainstorm → spec in `docs/superpowers/specs/` → owner approves → plan in `docs/superpowers/plans/` → implement.
- No feature code without an approved spec.
- Do not use OpenSpec in this repo.
- UI design work uses the **Hallmark** skill (`.claude/skills/hallmark/`). Do not use `impeccable`.
- The owner talks to you in Vietnamese; everything written to the repo is in English.

## Hard rules

- **Never invent personal content.** Names, companies, dates, roles, numbers, URLs, and claims come from `content/` or the owner. If something is missing, leave a visible `TODO` and ask.
- **Company projects are cards only.** Never add company source code. Add internal names, metrics, or client details only if the owner wrote them in `content/`.
- **Public repo.** No secrets, phone numbers, or home addresses in any file, including `public/cv.pdf`.
- **English** for code, comments, docs, and commit messages.
- **TypeScript strict.** Avoid `any`.
- **Never bypass hooks** (`--no-verify`).
- **Record decisions.** Add a row to the Decision log in `README.md` when you make a technical decision; update `docs/PRD.md` when scope changes.
- **Hallmark is third-party.** Never hand-edit `.claude/skills/hallmark/` or `skills-lock.json`. To update it, run `npx skills add nutlope/hallmark --agent claude-code --copy -y` and commit as `chore: update hallmark skill`. Without `--copy` the installer creates symlinks that break for anyone who clones the repo. Its browser checks (`sloplint --render`) need Chrome and `npm i -g puppeteer-core`, which is tied to the active nvm Node version.

## Git workflow

- `main` is the default branch. Never commit directly on `main`.
- Start every change on a new branch from the latest `main`:
  `git switch main && git pull --ff-only` (skip the pull if there is no remote), then `git switch -c <branch>`.
  Branch names: `feat/<slug>`, `fix/<slug>`, `refactor/<slug>`, `docs/<slug>`, `chore/<slug>`.
- Commit messages are Conventional Commits: `type: message` (scope optional: `feat(projects): ...`).
  Types: feat, fix, refactor, docs, test, chore, style, perf, build, ci, revert.
- Conflicts with `main`: rebase, never merge `main` into the branch. From the feature branch:
  `git fetch origin && git rebase origin/main` (no remote yet: `git rebase main`).
  If the branch was already pushed: `git push --force-with-lease`. Never force-push `main`.
- Land work through a GitHub PR merged by **squash**. When a branch is done, ask the owner before pushing, then:
  ```bash
  git push -u origin <branch>
  gh pr create --base main --title "<type: message>" --body "<summary, links to spec and plan>"
  ```
  - The PR title becomes the squash commit on `main`, so it must be a valid `type: message`.
  - The owner checks the branch locally with `pnpm dev` before merging until Vercel is connected.
  - **Never merge a PR unless the owner says so.**
  - After the merge: `git switch main && git pull --ff-only && git branch -D <branch>` (`-D` because git does not see squashed branches as merged).
- No GitHub remote yet? Stop when the branch is done and ask the owner how to land it.
- When the GitHub repo is created, apply these settings (squash only, PR title/body as the squash message, auto-delete branches):
  ```bash
  gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge
  gh api -X PATCH repos/<owner>/<repo> -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY
  ```
- Create the GitHub repo, or push `main`, only when the owner asks.

## Commands

- `pnpm dev` starts the local development server.
- `pnpm build` generates the site from `content/`.
- `pnpm start` serves the most recent build.
- `pnpm lint` checks source files with ESLint.
- `pnpm format` formats code and configuration with Prettier.
- `pnpm format:check` checks formatting without editing files.
- `pnpm typecheck` generates Next.js route types and runs TypeScript.
- `pnpm test` runs the Vitest suite, including validation of the repository content.
- `VERCEL_ENV=production pnpm build` checks the deployment with production content rules.
