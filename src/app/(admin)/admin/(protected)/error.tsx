"use client";
import { Button } from "@/components/ui/button";
export default function AdminError({ reset }: { reset: () => void }) { return <main id="main-content" className="mx-auto max-w-xl space-y-5 p-8"><h1 className="text-2xl font-semibold">Unable to load this workspace</h1><p className="text-secondary">Please try again. If the problem continues, contact your administrator.</p><Button onClick={reset}>Try again</Button></main>; }
