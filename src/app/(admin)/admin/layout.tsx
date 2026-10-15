import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Administration | NOSEE", template: "%s | NOSEE Admin" }, robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: ReactNode }) { return <div className="admin">{children}</div>; }
