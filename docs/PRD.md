# Product Requirements: Portfolio Site

Status: v1, agreed 2026-11-27. Personal facts are not in this document; they live in [`content/`](../content/README.md).

## Problem & goal

I am looking for developer roles. A CV is a page of claims; this site backs those claims up and makes me easy to contact.

The site has one job: get a recruiter from "who is this?" to "let's talk" as fast as possible, and then give the tech lead who reviews me next enough evidence to agree.

Success means a visitor contacts me, downloads my CV, or opens my GitHub or LinkedIn.

## Audience

**HR / recruiters (primary).** They read first and decide in seconds. They don't read code. They scan for:

- name and current role
- years of experience
- tech keywords that match the job description
- languages spoken
- a way to reach me or get my CV

**Tech leads (secondary).** They see the site after HR passes me along. They read more slowly and want proof of ability: what I actually built, how, and the problems I solved. Company code is private, so the proof comes from my personal GitHub projects.

## User journeys

1. **HR skim.** Lands on `/` → sees name, role, years of experience, languages, and contact links without scrolling → downloads the CV or follows a contact link.
2. **Tech lead deep read.** Lands on `/` → scans the stack and experience → opens a personal project card → reads the detail page at `/projects/[slug]` → opens the GitHub repo to read the code.

## Pages & sections

### Home (`/`)

In this order:

1. **Hero.** Name, current role, a 1–2 sentence intro, years of experience, languages spoken, links to GitHub, LinkedIn, and email, and a **Download CV** button. Everything in this section is visible without scrolling.
2. **Tech stack.** Grouped, e.g. Frontend / Backend / Tools.
3. **Work experience.** Company, period, role, newest first.
4. **Projects.**
   - **Company projects:** short cards only. Niche (e.g. e-commerce), stack, my role, and a live link if one still works. No detail page.
   - **Personal projects:** a card that links to its detail page.
5. **Contact.** Email, GitHub, LinkedIn, Download CV.

### Personal project detail (`/projects/[slug]`)

One page per personal GitHub project, with these sections: Problem, What I built, Challenges & solutions, Results, Links (GitHub repo, live demo if there is one).

## Content rules

- **No invented facts.** Every name, date, number, and claim comes from `content/` or from me. A missing fact stays a visible `TODO`.
- **Company projects are cards only.** No source code, internal names, metrics, or client details that are not already public.
- **Personal projects get the depth.** Their detail pages and public repos are the evidence for tech leads.
- **Contact is links only**, no contact form. Email is a `mailto:` link.
- **CV** is a PDF at `public/cv.pdf`, updated by replacing the file. It contains no phone number or home address, because this repo is public.
- **English only.**

## Non-goals

- **Blog.** I have nothing to publish yet.
- **`/admin` area.** Content is edited as files in this repo and deployed by pushing.
- **Contact form.** Recruiters email or message on LinkedIn; a form would need a mail service and spam protection for no gain.
- **i18n.** The site is English only.

## Success criteria

- On a 1366×768 laptop screen and on a phone, the hero shows name, role, years of experience, languages, contact links, and the CV button without scrolling.
- Every personal project card links to a detail page, and every detail page links to its GitHub repo.
- Sharing the site URL on LinkedIn shows a preview card with my name and role (Open Graph metadata).
- Accessibility meets WCAG 2.1 AA for contrast, keyboard navigation, and alt text.
- Lighthouse scores ≥ 90 for Performance, Accessibility, Best Practices, and SEO on the home page.
