import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import "./globals.css";

export function generateMetadata(): Metadata {
  const { name, role, intro } = getContent().profile;

  return {
    title: `${name} — ${role}`,
    description: intro,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
