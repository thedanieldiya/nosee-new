import type { Metadata } from "next";
import PublicLayout from "./(public)/layout";
import { NotFoundContent } from "@/components/site/layout/NotFoundContent";

export const metadata: Metadata = { title: "Page not found — NOSEE" };

export default function NotFound() {
  return <PublicLayout><NotFoundContent /></PublicLayout>;
}
