# Portfolio

Source code of my personal site. I'm **TODO: name**, **TODO: current role**.

> **Status:** The scaffold renders the portfolio from files in `content/`. Visual design is the next phase.

- Live site: TODO
- GitHub: TODO
- LinkedIn: TODO

## About this repo

This is the site I send to recruiters: who I am, what I work with, the projects I've built, and how to reach me. It's written to be read by HR in a few seconds and by tech leads in more depth.

Next.js 16 generates the pages at build time using React 19 and TypeScript. Vercel is the planned deployment target.

## Repo map

| Path | What it is |
|---|---|
| `CLAUDE.md` | Rules and workflow for the AI agent working in this repo |
| `docs/PRD.md` | Product requirements: audience, pages, content rules, success criteria |
| `docs/ARCHITECTURE.md` | Technical decisions, content model, quality gates, decision log |
| `docs/superpowers/` | Design specs and implementation plans, one pair per piece of work |
| `content/` | Every personal fact on the site: profile, experience, projects |
| `.claude/skills/hallmark/` | [Hallmark](https://github.com/nutlope/hallmark) design skill by Together AI, third-party, MIT license, pinned in `skills-lock.json` |

## How I work with AI

I build this site with Claude Code, and I keep the decisions in this repo instead of in chat history.

- Every change starts as a spec and a plan, using the [superpowers](https://github.com/obra/superpowers) workflow: brainstorm, write the spec, approve it, write the plan, then implement. Both live in `docs/superpowers/`.
- UI work goes through Hallmark, which checks pages against common tells of generated design.
- Content comes only from `content/`. The agent is not allowed to invent facts about me.
- Husky checks staged files, runs the type checker and tests, and validates commit messages.
- From the scaffold on, each change lands on `main` as a pull request merged by squash: one commit per reviewed change.

## Run locally

Use Node.js 24 and pnpm 12.8.1. From the repo root, run:

```sh
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000). To add a personal project, copy `content/projects/_template.mdx` to a file named for its URL, such as `content/projects/my-tool.mdx`.

`pnpm build` builds a local preview with visible placeholders. Run `VERCEL_ENV=production pnpm build` to check that the content and CV are ready to publish.

## License

No license: all rights reserved. The content and CV are personal. Hallmark keeps its own MIT license in `.claude/skills/hallmark/LICENSE`.
