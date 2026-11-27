import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { getContent } from "@/lib/content";
import { isPlaceholder } from "@/lib/content/load";

type ProjectPageProps = PageProps<"/projects/[slug]">;

export const dynamicParams = false;

export function generateStaticParams() {
  return getContent().projects.map(({ slug }) => ({ slug }));
}

function getProject(slug: string) {
  const project = getContent().projects.find(
    (project) => project.slug === slug,
  );
  if (!project) notFound();
  return project;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: getProject(slug).title };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const { title, summary, stack, repo, demo, body } = getProject(slug);
  const { content } = await compileMDX({ source: body });

  return (
    <main>
      <article>
        <h1>{title}</h1>
        <p>{summary}</p>
        <ul aria-label="Tech stack">
          {stack.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        {content}
        <ul aria-label="Project links">
          <li>
            {isPlaceholder(repo) ? repo : <a href={repo}>GitHub repository</a>}
          </li>
          {demo && (
            <li>{isPlaceholder(demo) ? demo : <a href={demo}>Live demo</a>}</li>
          )}
        </ul>
      </article>
    </main>
  );
}
