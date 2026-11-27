import { z } from "zod";

export function isPlaceholder(value: unknown): boolean {
  return typeof value === "string" && value.trim().startsWith("TODO");
}

const placeholder = z.string().refine(isPlaceholder);

function withPlaceholder(schema: z.ZodType<string>, message: string) {
  return z.union([placeholder, schema], { error: message });
}

const text = withPlaceholder(
  z
    .string()
    .refine((value) => value.trim().length > 0, "Expected non-empty text"),
  "Expected non-empty text",
);
const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");
const start = withPlaceholder(yearMonth, "Expected YYYY-MM");
const end = withPlaceholder(
  z.union([yearMonth, z.literal("present")]),
  'Expected YYYY-MM or "present"',
);
const https = withPlaceholder(
  z
    .url({ protocol: /^https$/ })
    .refine((value) => /^https:\/\/[^/\\\s]/.test(value)),
  "Expected an absolute https:// URL",
);
const email = withPlaceholder(z.email(), "Expected a valid email address");
const stack = z.array(text).min(1);

export const profileSchema = z.strictObject({
  name: text,
  role: text,
  intro: text,
  careerStart: start,
  languages: z.array(z.strictObject({ language: text, level: text })).min(1),
  links: z.strictObject({ github: https, linkedin: https, email }),
  stack: z.array(z.strictObject({ group: text, items: stack })).min(1),
});

const dateFields = { start, end };
const dateRange = z.object(dateFields);

function isValidDateRange({ start, end }: z.infer<typeof dateRange>): boolean {
  return (
    end === "present" ||
    isPlaceholder(start) ||
    isPlaceholder(end) ||
    end >= start
  );
}

const dateRangeCheck = {
  path: ["end"],
  error: "End cannot be before start",
  when: ({ value }: { value: unknown }) => dateRange.safeParse(value).success,
};

const jobSchema = z
  .strictObject({
    company: text,
    role: text,
    ...dateFields,
    summary: text,
    stack,
  })
  .refine(isValidDateRange, dateRangeCheck);

const companyProjectSchema = z
  .strictObject({
    name: text,
    niche: text,
    role: text,
    stack,
    ...dateFields,
    url: https.nullable(),
  })
  .refine(isValidDateRange, dateRangeCheck);

export const experienceSchema = z.array(jobSchema);
export const companyProjectsSchema = z.array(companyProjectSchema);

export const projectFrontmatterSchema = z.strictObject({
  title: text,
  summary: text,
  stack,
  repo: https,
  demo: https.nullable(),
  order: z.int(),
});

export type Profile = z.infer<typeof profileSchema>;
export type Job = z.infer<typeof jobSchema>;
export type CompanyProject = z.infer<typeof companyProjectSchema>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;
