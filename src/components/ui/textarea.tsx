import type { ComponentProps } from "react";
import { cn } from "./utils";
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn("min-h-28 w-full rounded-md border border-line-strong bg-default px-3 py-2 text-base text-primary shadow-xs md:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:bg-surface disabled:text-secondary aria-invalid:border-red-700", className)} {...props} />;
}
