# Content

Every personal fact on the site comes from this folder. Code and agents read it; they never invent it. A value still marked `TODO` is not filled in yet.

| File | What it holds | Shown as |
|---|---|---|
| `profile.yaml` | Name, role, intro, career start date, languages, links, grouped tech stack | Hero, tech stack, contact |
| `experience.yaml` | Jobs, newest first | Work experience |
| `company-projects.yaml` | Projects built at a company | Short cards on the home page |
| `projects/<slug>.mdx` | One personal GitHub project per file | Card on the home page + detail page at `/projects/<slug>` |

## Personal projects

Copy `projects/_template.mdx` to `projects/<slug>.mdx`, where `<slug>` is the URL you want (for example `projects/my-tool.mdx` becomes `/projects/my-tool`). Files whose name starts with `_` are templates: the site skips them, so they are never loaded, validated, or rendered. Every section body in a project file starts as a `TODO:` line; replace each one, because a leftover `TODO` will fail the production build.

## Rules

- **Company projects are cards only.** Never add source code, internal names, metrics, or client details that are not already public.
- **This repo is public.** No phone number, home address, or secrets in any file.
- **CV:** put the PDF at `public/cv.pdf`, without phone number or home address. Update it by replacing the file and pushing.

## Content model

YAML holds structured data. MDX holds the case studies.

| File | Fields |
|---|---|
| `content/profile.yaml` | `name`, `role`, `intro`, `careerStart` (`YYYY-MM`), `languages[]` {`language`, `level`}, `links` {`github`, `linkedin`, `email`}, `stack[]` {`group`, `items[]`} |
| `content/experience.yaml` | list, newest first, of {`company`, `role`, `start` (`YYYY-MM`), `end` (`YYYY-MM` or `present`), `summary`, `stack[]`} |
| `content/company-projects.yaml` | list of {`name`, `niche`, `role`, `stack[]`, `start`, `end`, `url` (`null` if there is no working live link)} |
| `content/projects/<slug>.mdx` | frontmatter {`title`, `summary`, `stack[]`, `repo`, `demo` (`null` if none), `order` (integer, ascending on the home page)}; body sections: Problem, What I built, Challenges & solutions, Results, Links |

Rules:

- **Slug = file name.** `content/projects/my-tool.mdx` renders at `/projects/my-tool`.
- **Files starting with `_` are templates** (e.g. `content/projects/_template.mdx`). The content pipeline skips them: they are never loaded, validated, or rendered.
- **Years of experience are computed from `careerStart`**, so the number never goes stale.
- **Build-time schema validation.** The loader in `src/lib/content/` reads YAML and MDX frontmatter and validates their fields with Zod. Invalid data fails every build. A `TODO` prefix in a string value, a line starting with `TODO` in an MDX body, or a missing `public/cv.pdf` produces a warning locally and in previews. Each blocks a deployment when `VERCEL_ENV=production`.
