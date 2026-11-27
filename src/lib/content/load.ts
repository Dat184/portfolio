import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";
import type { z } from "zod";
import {
  companyProjectsSchema,
  experienceSchema,
  isPlaceholder,
  profileSchema,
  projectFrontmatterSchema,
  type CompanyProject,
  type Job,
  type Profile,
  type ProjectFrontmatter,
} from "./schema";

export { isPlaceholder };

export interface LoadOptions {
  contentDir: string;
  publicDir: string;
  production: boolean;
}

export interface Project extends ProjectFrontmatter {
  slug: string;
  body: string;
}

export interface Content {
  profile: Profile;
  experience: Job[];
  companyProjects: CompanyProject[];
  projects: Project[];
  hasCv: boolean;
  placeholders: string[];
}

export class ContentError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join("\n"));
    this.name = "ContentError";
  }
}

interface Diagnostics {
  issues: string[];
  placeholders: string[];
}

function appendPath(path: string, key: PropertyKey): string {
  if (typeof key === "number") return `${path}[${key}]`;
  return path ? `${path}.${String(key)}` : String(key);
}

function collectPlaceholders(
  value: unknown,
  file: string,
  placeholders: string[],
  path = "",
  ancestors = new WeakSet<object>(),
): void {
  if (isPlaceholder(value)) placeholders.push(path ? `${file}: ${path}` : file);
  if (typeof value !== "object" || value === null || ancestors.has(value))
    return;

  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) {
    const childPath = appendPath(
      path,
      Array.isArray(value) ? Number(key) : key,
    );
    collectPlaceholders(child, file, placeholders, childPath, ancestors);
  }
  ancestors.delete(value);
}

function readText(contentDir: string, file: string, issues: string[]) {
  try {
    return readFileSync(join(contentDir, file), "utf8");
  } catch (error) {
    issues.push(
      `${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function parseYaml<T>(
  source: string,
  file: string,
  schema: z.ZodType<T>,
  { issues, placeholders }: Diagnostics,
): T | undefined {
  let data: unknown;
  try {
    const document = parseDocument(source);
    if (document.errors.length > 0) {
      issues.push(
        ...document.errors.map(({ message }) => `${file}: ${message}`),
      );
      return;
    }
    if (document.contents === null) {
      issues.push(`${file}: Expected YAML content, but it is empty`);
      return;
    }
    data = document.toJS();
  } catch (error) {
    issues.push(
      `${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }

  // Walk the parsed input so a bad field does not hide other TODOs in the file.
  collectPlaceholders(data, file, placeholders);
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  for (const issue of result.error.issues) {
    const path = issue.path.reduce<string>(appendPath, "");
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) {
        issues.push(`${file} ${appendPath(path, key)}: Unexpected field`);
      }
    } else {
      issues.push(`${path ? `${file} ${path}` : file}: ${issue.message}`);
    }
  }
}

function readYaml<T>(
  contentDir: string,
  file: string,
  schema: z.ZodType<T>,
  diagnostics: Diagnostics,
): T | undefined {
  const source = readText(contentDir, file, diagnostics.issues);
  if (source !== undefined) return parseYaml(source, file, schema, diagnostics);
}

const frontmatterBlock =
  /^\uFEFF?---[ \t]*\r?\n((?:[^\n]*\n)*?)---[ \t]*(?:\r?\n|$)/;
const projectSlug = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function readProjects(contentDir: string, diagnostics: Diagnostics): Project[] {
  const { issues, placeholders } = diagnostics;
  let entries;
  try {
    entries = readdirSync(join(contentDir, "projects"), {
      withFileTypes: true,
    });
  } catch (error) {
    if (!(
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    )) {
      issues.push(
        `projects: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return [];
  }

  const projects: Project[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const { name } = entry;
    if (name.startsWith("_") || name.startsWith(".") || entry.isDirectory())
      continue;

    const file = `projects/${name}`;
    if (!name.endsWith(".mdx")) {
      issues.push(`${file}: Expected an .mdx file`);
      continue;
    }

    const slug = name.slice(0, -".mdx".length);
    if (!projectSlug.test(slug)) {
      issues.push(
        `${file}: Use lowercase letters and numbers separated by single hyphens`,
      );
    }

    const source = readText(contentDir, file, issues);
    if (source === undefined) continue;

    const block = frontmatterBlock.exec(source);
    if (block?.[1] === undefined) {
      issues.push(
        `${file}: Expected a YAML frontmatter block delimited by ---`,
      );
      continue;
    }

    const frontmatter = parseYaml(
      block[1],
      file,
      projectFrontmatterSchema,
      diagnostics,
    );
    const body = source.slice(block[0].length).replaceAll("\r\n", "\n");
    if (body.split("\n").some(isPlaceholder))
      placeholders.push(`${file}: body`);
    if (frontmatter) projects.push({ ...frontmatter, slug, body });
  }

  return projects.sort(
    (a, b) => a.order - b.order || a.slug.localeCompare(b.slug),
  );
}

export function loadContent({
  contentDir,
  publicDir,
  production,
}: LoadOptions): Content {
  const diagnostics: Diagnostics = { issues: [], placeholders: [] };
  const { issues, placeholders } = diagnostics;
  const profile = readYaml(
    contentDir,
    "profile.yaml",
    profileSchema,
    diagnostics,
  );
  const experience = readYaml(
    contentDir,
    "experience.yaml",
    experienceSchema,
    diagnostics,
  );
  const companyProjects = readYaml(
    contentDir,
    "company-projects.yaml",
    companyProjectsSchema,
    diagnostics,
  );
  const projects = readProjects(contentDir, diagnostics);
  const hasCv = existsSync(join(publicDir, "cv.pdf"));
  if (!hasCv) placeholders.push("public/cv.pdf");
  if (production) issues.push(...placeholders);

  if (issues.length || !profile || !experience || !companyProjects) {
    throw new ContentError(issues);
  }

  return {
    profile,
    experience,
    companyProjects,
    projects,
    hasCv,
    placeholders,
  };
}

export function yearsOfExperience(
  careerStart: string,
  now: Date,
): number | "TODO" {
  if (isPlaceholder(careerStart)) return "TODO";
  const startYear = Number(careerStart.slice(0, 4));
  const startMonth = Number(careerStart.slice(5));
  const years = now.getUTCFullYear() - startYear;
  return now.getUTCMonth() + 1 < startMonth ? years - 1 : years;
}
