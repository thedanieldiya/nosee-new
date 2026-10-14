import type { Metadata } from "next";
import { headers } from "next/headers";
import RootLayout from "./layout";
import PublicLayout from "./(public)/layout";
import { NotFoundContent } from "@/components/site/layout/NotFoundContent";

export const metadata: Metadata = { title: "Page not found — NOSEE" };

export default async function GlobalNotFound() {
  // The global boundary provides SSR 404 HTML, including request-specific navigation.
  await headers();
  return <RootLayout><PublicLayout><NotFoundContent /></PublicLayout></RootLayout>;
}
