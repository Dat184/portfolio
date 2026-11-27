import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  ContentError,
  loadContent,
  yearsOfExperience,
  type LoadOptions,
} from "./load";

const FIXTURES = fileURLToPath(new URL("./__fixtures__", import.meta.url));
const VALID_DIR = join(FIXTURES, "valid");
const CV_DIR = join(FIXTURES, "public-cv");
const EMPTY_PUBLIC_DIR = join(FIXTURES, "public-empty");
const TEMP_DIRS: string[] = [];

function fixture(overrides: Record<string, string | null>): string {
  const dir = mkdtempSync(join(tmpdir(), "portfolio-content-test-"));
  TEMP_DIRS.push(dir);
  cpSync(VALID_DIR, dir, { recursive: true });

  for (const [name, contents] of Object.entries(overrides)) {
    const path = join(dir, name);
    if (contents === null) {
      rmSync(path, { recursive: true });
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, contents);
    }
  }

  return dir;
}

function fixtureText(name: string): string {
  return readFileSync(join(VALID_DIR, name), "utf8");
}

function load(dir: string, opts?: Partial<LoadOptions>) {
  return loadContent({
    contentDir: dir,
    publicDir: CV_DIR,
    production: false,
    ...opts,
  });
}

function issues(dir: string, opts?: Partial<LoadOptions>): string[] {
  try {
    load(dir, opts);
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    expect(error.message).toBe(error.issues.join("\n"));
    return error.issues;
  }
  return expect.fail("Expected a ContentError");
}

afterEach(() => {
  for (const dir of TEMP_DIRS.splice(0)) {
    rmSync(dir, { recursive: true });
  }
});

describe("loadContent", () => {
  it("loads the valid fixture", () => {
    const content = load(VALID_DIR);
    expect(content.profile.name).toBe("Test Person");
    expect(content.profile.careerStart).toBe("2020-06");
    expect(content.experience).toHaveLength(2);
    expect(content.companyProjects[0]?.url).toBeNull();
    expect(content.placeholders).toEqual([]);
    expect(content.hasCv).toBe(true);
  });

  it("skips project files and folders starting with _ or .", () => {
    const dir = fixture({ "projects/.scratch.md": "Scratch notes." });
    const content = load(dir);
    expect(content.projects.map(({ slug }) => slug)).toEqual([
      "beta-app",
      "alpha-tool",
    ]);
    expect(content.placeholders).toEqual([]);
  });

  it("sorts projects by order, then slug", () => {
    const dir = fixture({
      "projects/alpha-tool.mdx": fixtureText("projects/alpha-tool.mdx").replace(
        "order: 2",
        "order: 1",
      ),
    });
    expect(load(dir).projects.map(({ slug }) => slug)).toEqual([
      "alpha-tool",
      "beta-app",
    ]);
  });

  it("rejects unknown keys with their full paths", () => {
    const dir = fixture({
      "profile.yaml": fixtureText("profile.yaml").replace(
        "  linkedin:",
        "  linkdin:",
      ),
      "experience.yaml": fixtureText("experience.yaml").replace(
        "  summary:",
        "  summmary:",
      ),
    });
    expect(issues(dir)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^profile\.yaml links\.linkdin:/),
        expect.stringMatching(/^experience\.yaml \[0\]\.summmary:/),
      ]),
    );
  });

  it("rejects a malformed date", () => {
    const dir = fixture({
      "experience.yaml": fixtureText("experience.yaml").replace(
        "end: present",
        "end: 2024-13",
      ),
    });
    expect(issues(dir)).toContainEqual(
      expect.stringMatching(/^experience\.yaml \[0\]\.end:/),
    );
  });

  it("rejects end before start", () => {
    const dir = fixture({
      "experience.yaml": fixtureText("experience.yaml").replace(
        "end: present",
        "end: 2022-01",
      ),
      "company-projects.yaml": fixtureText("company-projects.yaml").replace(
        "end: 2022-01",
        "end: 2020-12",
      ),
    });
    expect(issues(dir)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^experience\.yaml \[0\]\.end:/),
        expect.stringMatching(/^company-projects\.yaml \[0\]\.end:/),
      ]),
    );
  });

  it("reports a reversed date range alongside an invalid field in the same job", () => {
    const dir = fixture({
      "experience.yaml": fixtureText("experience.yaml")
        .replace("end: present", "end: 2022-01")
        .replace("stack: [TypeScript]", "stack: 7.5"),
    });
    expect(issues(dir)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^experience\.yaml \[0\]\.end:/),
        expect.stringMatching(/^experience\.yaml \[0\]\.stack:/),
      ]),
    );
  });

  it.each([
    "http://example.com",
    "/example",
    "https:example.com",
    "https:///example.com",
  ])("rejects a URL that is not absolute HTTPS (%s)", (url) => {
    const dir = fixture({
      "profile.yaml": fixtureText("profile.yaml").replace(
        "https://github.com/example",
        url,
      ),
    });
    expect(issues(dir)).toContainEqual(
      expect.stringMatching(/^profile\.yaml links\.github:/),
    );
  });

  it("rejects a bad slug", () => {
    const dir = fixture({
      "projects/Bad_Slug.mdx": fixtureText("projects/alpha-tool.mdx"),
    });
    expect(issues(dir)).toContainEqual(
      expect.stringMatching(/^projects\/Bad_Slug\.mdx:/),
    );
  });

  it("rejects non-MDX files in projects/", () => {
    const dir = fixture({ "projects/notes.md": "Example notes." });
    expect(issues(dir)).toContainEqual(
      expect.stringMatching(/^projects\/notes\.md:/),
    );
  });

  it("reports invalid YAML with the file name", () => {
    const dir = fixture({ "profile.yaml": "name: [" });
    expect(issues(dir)).toContainEqual(
      expect.stringMatching(/^profile\.yaml:/),
    );
  });

  it("rejects an unresolved YAML tag on an otherwise valid date", () => {
    const dir = fixture({
      "profile.yaml": fixtureText("profile.yaml").replace(
        "careerStart: 2020-06",
        "careerStart: !!int 2020-06",
      ),
    });
    expect(issues(dir)).toContainEqual(
      expect.stringMatching(/^profile\.yaml: Unresolved tag:/),
    );
  });

  it("reports an empty file clearly", () => {
    const dir = fixture({ "profile.yaml": "" });
    expect(issues(dir)).toContainEqual(
      expect.stringMatching(/^profile\.yaml: .*empty/i),
    );
  });

  it("names the field when a number is given for text", () => {
    const dir = fixture({
      "profile.yaml": fixtureText("profile.yaml").replace(
        "level: Professional",
        "level: 7.5",
      ),
    });
    expect(issues(dir)).toContainEqual(
      expect.stringMatching(/^profile\.yaml languages\[0\]\.level:/),
    );
  });

  it("collects placeholders with paths", () => {
    const dir = fixture({
      "profile.yaml": fixtureText("profile.yaml")
        .replace("github: https://github.com/example", "github: TODO")
        .replace("items: [TypeScript]", "items: [TODO]"),
      "projects/beta-app.mdx":
        fixtureText("projects/beta-app.mdx") +
        "\n  TODO: write\nTODO: revise\n",
    });
    expect(load(dir).placeholders).toEqual([
      "profile.yaml: links.github",
      "profile.yaml: stack[0].items[0]",
      "projects/beta-app.mdx: body",
    ]);
  });

  it("treats any string starting with TODO as a placeholder", () => {
    const dir = fixture({
      "profile.yaml": fixtureText("profile.yaml").replace(
        "intro: I build example tools.",
        'intro: "  TODO - ask"',
      ),
    });
    expect(load(dir).placeholders).toEqual(["profile.yaml: intro"]);
  });

  it("fails in production when placeholders exist", () => {
    const dir = fixture({
      "profile.yaml": fixtureText("profile.yaml").replace(
        "github: https://github.com/example",
        "github: TODO",
      ),
    });
    expect(issues(dir, { production: true })).toEqual([
      "profile.yaml: links.github",
    ]);
  });

  it("passes outside production with placeholders", () => {
    const dir = fixture({
      "experience.yaml": fixtureText("experience.yaml").replace(
        "end: present",
        "end: TODO - confirm",
      ),
      "company-projects.yaml": fixtureText("company-projects.yaml").replace(
        "start: 2021-01",
        "start: TODO - confirm",
      ),
    });
    const content = load(dir);
    expect(content.experience[0]?.end).toBe("TODO - confirm");
    expect(content.companyProjects[0]?.start).toBe("TODO - confirm");
  });

  it("counts a missing cv.pdf as a placeholder", () => {
    const content = load(VALID_DIR, { publicDir: EMPTY_PUBLIC_DIR });
    expect(content.hasCv).toBe(false);
    expect(content.placeholders).toEqual(["public/cv.pdf"]);
  });

  it("counts a directory called cv.pdf as a missing CV", () => {
    const publicDir = fixture({ "cv.pdf/.gitkeep": "" });
    const content = load(VALID_DIR, { publicDir });
    expect(content.hasCv).toBe(false);
    expect(content.placeholders).toEqual(["public/cv.pdf"]);
    expect(issues(VALID_DIR, { publicDir, production: true })).toEqual([
      "public/cv.pdf",
    ]);
  });

  it("parses CRLF files", () => {
    const name = "projects/beta-app.mdx";
    const dir = fixture({
      [name]: fixtureText(name).replaceAll("\n", "\r\n"),
    });
    const project = load(dir).projects[0];
    expect(project?.title).toBe("Beta App");
    expect(project?.body).toBe(load(VALID_DIR).projects[0]?.body);
  });

  it("treats a missing projects folder as no projects", () => {
    const dir = fixture({ projects: null });
    expect(load(dir).projects).toEqual([]);
  });

  it("allows empty top-level lists in production", () => {
    const dir = fixture({
      "experience.yaml": "[]",
      "company-projects.yaml": "[]",
    });
    const content = load(dir, { production: true });
    expect(content.experience).toEqual([]);
    expect(content.companyProjects).toEqual([]);
  });

  it("requires non-empty nested lists", () => {
    const dir = fixture({
      "profile.yaml": fixtureText("profile.yaml")
        .replace("items: [TypeScript]", "items: []")
        .replace(
          "languages:\n  - language: English\n    level: Professional",
          "languages: []",
        ),
      "experience.yaml": fixtureText("experience.yaml").replace(
        "stack: [TypeScript]",
        "stack: []",
      ),
    });
    expect(issues(dir)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^profile\.yaml languages:/),
        expect.stringMatching(/^profile\.yaml stack\[0\]\.items:/),
        expect.stringMatching(/^experience\.yaml \[0\]\.stack:/),
      ]),
    );
  });

  it("loads the real content/ folder outside production", () => {
    expect(() =>
      loadContent({
        contentDir: "content",
        publicDir: "public",
        production: false,
      }),
    ).not.toThrow();
  });

  it("collects validation issues and production placeholders across files", () => {
    const dir = fixture({
      "profile.yaml": fixtureText("profile.yaml")
        .replace("email: test@example.com", "email: TODO")
        .replace("level: Professional", "level: 7.5"),
      "experience.yaml": null,
      "company-projects.yaml": "- name: [",
      "projects/beta-app.mdx": "Missing frontmatter.",
    });
    expect(
      issues(dir, { publicDir: EMPTY_PUBLIC_DIR, production: true }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^profile\.yaml languages\[0\]\.level:/),
        expect.stringMatching(/^experience\.yaml:/),
        expect.stringMatching(/^company-projects\.yaml:/),
        expect.stringMatching(/^projects\/beta-app\.mdx:/),
        "profile.yaml: links.email",
        "public/cv.pdf",
      ]),
    );
  });

  it("reports unknown fields even when their YAML aliases form a cycle", () => {
    const dir = fixture({
      "profile.yaml":
        fixtureText("profile.yaml") + "\nextra: &extra [*extra]\n",
    });
    expect(issues(dir, { production: true })).toContainEqual(
      expect.stringMatching(/^profile\.yaml extra:/),
    );
  });

  it("surfaces filesystem errors reading the projects path", () => {
    const dir = fixture({ projects: null });
    writeFileSync(join(dir, "projects"), "This path is a file.");
    expect(() => load(dir)).toThrow(/ENOTDIR/);
  });
});

describe("yearsOfExperience", () => {
  it("rounds down to whole years using the UTC month", () => {
    const now = new Date("2026-11-27T00:00:00Z");
    expect(yearsOfExperience("2020-06", now)).toBe(6);
    expect(yearsOfExperience("2020-12", now)).toBe(5);
    expect(yearsOfExperience("2020-12", new Date("2026-12-01T00:00:00Z"))).toBe(
      6,
    );
  });

  it("returns TODO for a placeholder", () => {
    expect(yearsOfExperience("TODO", new Date())).toBe("TODO");
    expect(yearsOfExperience("  TODO - confirm", new Date())).toBe("TODO");
  });
});
