import { join } from "node:path";
import { loadContent, type Content } from "./load";

let cachedContent: Content | undefined;
let warned = false;

export function getContent(): Content {
  if (cachedContent) return cachedContent;

  const content = loadContent({
    contentDir: join(process.cwd(), "content"),
    publicDir: join(process.cwd(), "public"),
    production: process.env.VERCEL_ENV === "production",
  });

  if (!warned && content.placeholders.length > 0) {
    console.warn(`Content placeholders:\n${content.placeholders.join("\n")}`);
    warned = true;
  }

  // Read content on every dev request so edits are visible without a restart.
  if (process.env.NODE_ENV !== "development") {
    cachedContent = content;
  }

  return content;
}
