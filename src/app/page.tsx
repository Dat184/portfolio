import Link from "next/link";
import { getContent } from "@/lib/content";
import { isPlaceholder, yearsOfExperience } from "@/lib/content/load";
import type { Profile } from "@/lib/content/schema";

function ContactLinks({
  links,
  hasCv,
}: {
  links: Profile["links"];
  hasCv: boolean;
}) {
  return (
    <ul>
      <li>
        {isPlaceholder(links.github) ? (
          `GitHub: ${links.github}`
        ) : (
          <a href={links.github}>GitHub</a>
        )}
      </li>
      <li>
        {isPlaceholder(links.linkedin) ? (
          `LinkedIn: ${links.linkedin}`
        ) : (
          <a href={links.linkedin}>LinkedIn</a>
        )}
      </li>
      <li>
        {isPlaceholder(links.email) ? (
          `Email: ${links.email}`
        ) : (
          <a href={`mailto:${links.email}`}>{links.email}</a>
        )}
      </li>
      <li>
        {hasCv ? (
          <a href="/cv.pdf" download>
            Download CV
          </a>
        ) : (
          "TODO: add public/cv.pdf"
        )}
      </li>
    </ul>
  );
}

export default function Home() {
  const { profile, experience, companyProjects, projects, hasCv } =
    getContent();
  const years = yearsOfExperience(profile.careerStart, new Date());

  return (
    <main>
      <section>
        <h1>{profile.name}</h1>
        <p>{profile.role}</p>
        <p>{profile.intro}</p>
        <p>
          {years} {years === 1 ? "year" : "years"} of experience
        </p>
        <h2>Languages</h2>
        <ul>
          {profile.languages.map(({ language, level }, index) => (
            <li key={index}>
              {language} ({level})
            </li>
          ))}
        </ul>
        <ContactLinks links={profile.links} hasCv={hasCv} />
      </section>

      <section>
        <h2>Tech stack</h2>
        {profile.stack.map(({ group, items }, index) => (
          <div key={index}>
            <h3>{group}</h3>
            <ul>
              {items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {experience.length > 0 && (
        <section>
          <h2>Work experience</h2>
          <ul>
            {experience.map((job, index) => (
              <li key={index}>
                <h3>{job.company}</h3>
                <p>{job.role}</p>
                <p>
                  {job.start} – {job.end}
                </p>
                <p>{job.summary}</p>
                <p>{job.stack.join(", ")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(companyProjects.length > 0 || projects.length > 0) && (
        <section>
          <h2>Projects</h2>
          {companyProjects.length > 0 && (
            <section>
              <h3>Company projects</h3>
              <ul>
                {companyProjects.map((project, index) => (
                  <li key={index}>
                    <h4>{project.name}</h4>
                    <p>{project.niche}</p>
                    <p>{project.role}</p>
                    <p>
                      {project.start} – {project.end}
                    </p>
                    <p>{project.stack.join(", ")}</p>
                    {project.url && (
                      <p>
                        {isPlaceholder(project.url) ? (
                          project.url
                        ) : (
                          <a href={project.url}>Visit {project.name}</a>
                        )}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {projects.length > 0 && (
            <section>
              <h3>Personal projects</h3>
              <ul>
                {projects.map((project) => (
                  <li key={project.slug}>
                    <h4>
                      <Link href={`/projects/${project.slug}`}>
                        {project.title}
                      </Link>
                    </h4>
                    <p>{project.summary}</p>
                    <p>{project.stack.join(", ")}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      )}

      <section>
        <h2>Contact</h2>
        <ContactLinks links={profile.links} hasCv={hasCv} />
      </section>
    </main>
  );
}
