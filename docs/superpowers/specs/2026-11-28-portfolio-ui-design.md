# Portfolio UI design

Status: Draft spec based on the owner-reviewed V8 prototype.

Open [the V8 prototype](../prototypes/portfolio-v8.html) in a browser. It is a self-contained HTML file that runs offline and shows the layout, responsive behavior, and scroll interaction. Use it alongside the [product requirements](../../PRD.md) and the [content guide](../../../content/README.md) when implementing the Next.js UI.

## Intent and approach

Recruiters should see the owner's role, experience, languages, and contact options on the first screen. Tech leads should be able to find the stack and work history, open a personal case study, and reach its GitHub repository.

The owner chose a dark palette and refined the stronger orange-and-lime draft into V8's warm dark background, soft orange accents, and sand-colored image placeholders. Use V8 as the visual reference. Build the layout with the existing Next.js and Tailwind scaffold. Use CSS for the logo loop and short transitions, with scroll logic scoped to Projects.

## Home page

| Section | Requirements |
| --- | --- |
| Hero | Place the name, current role, intro, years of experience, spoken languages, Download CV, and contact links together. Place a wide 16:10 image frame next to that content on desktop and below the actions on mobile. Keep the recruiter essentials visible without scrolling on the target viewports. |
| Web development | Use the heading **Web development**, one short description, and a grouped technology list that is always readable. Use **Web technologies** as a broad label for the first group. The prototype also shows **Language** and **Tooling**. Derive the actual entries from the profile and let the groups accommodate full-stack work. |
| Logo strip | Place the decorative logo loop beneath the static list. Use the original logo colors, a transparent background, and faded edges. Match the body background and omit a standalone **Pause logos** control. Preserve access to the complete static list with reduced motion. Confirm how the running strip can be stopped or hidden as part of the accessibility check. |
| Experience | Present company, role, and dates in reverse chronological order. Use the simple, separated rows in V8 for supporting responsibilities and stack when the content supplies them. |
| Projects | Give each project a full-width card. Use side-by-side copy and media on desktop and stack them inside the same card on narrow screens. Include the project role and stack where available. Personal cards open the case-study route. Company cards stay summaries and may link to a working public site. |
| Footer | Use **Get in touch**, a short invitation over roughly two to three lines, and **Email**, **GitHub**, and **LinkedIn** on one row at the target widths. Continue the body background through the footer without a top rule. Keep Download CV in the hero. |

## Projects interaction

- Display one complete project card at a time in a stable frame. Other cards stay out of view and out of the keyboard tab order.
- Scroll down to bring the next card up in the same frame. Scroll back to return to the earlier card. Use page scroll so wheel, trackpad, touch, and keyboard navigation retain their normal behavior.
- Start the transition promptly once the frame is in position. V8 switched within roughly 60–100 CSS pixels after opening Projects from the nav on the tested screens. Treat that as a reference for responsiveness and check the result at normal wheel and trackpad speeds.
- Release the frame after the last card so that **Get in touch** follows with a compact gap. Keep the interaction usable on short mobile screens and tall desktops.
- For the entrance, start with a short upward translation and fade. The suggested tuning is 16–24 pixels over about 220 ms, with an ease-out. With reduced motion, switch cards without the entrance animation.
- A single project uses a static card. Skip the section when there are no projects. Keep project content and links reachable when scripting is unavailable.

## Personal project detail

Use the same dark palette and a centered reading column. Include a clear way back to Projects, the title, summary, and stack, followed by **Problem**, **What I built**, **Challenges & solutions**, **Results**, and **Links**. Render the case study from its existing MDX content and link to its GitHub repository and any live demo.

## Content and assets

- The prototype shows `TODO` for missing personal facts, contact destinations, the CV, and images. Its example technologies identify tools used in the portfolio repo. Populate the real UI from `content/` and the owner's approved assets.
- Use a supplied landscape image for the hero and approved screenshots or visuals for projects. Leave a `TODO` where the owner has yet to supply an asset. Company project images must be suitable for the public repo.
- The embedded prototype icons are from Devicon v2.16.0. [Devicon source](https://github.com/devicons/devicon/tree/v2.16.0) · [License notice](../prototypes/DEVICON-LICENSE.txt)

## Review before implementation

- Compare the Next.js output with V8 on a laptop and a narrow phone. Check the hero above the fold at 1366×768 and the contact row without horizontal overflow.
- Open Projects from the nav, scroll in both directions, and continue into the footer. Confirm the last card is reachable at 1920×1080 and at 375×667.
- Check keyboard navigation, focus when the visible card changes, reduced motion, readable contrast, and direct access to case studies.
- Obtain the owner's approval of this spec before writing the implementation plan under `docs/superpowers/plans/`.
