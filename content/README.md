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
