import * as React from "react";
import { cn } from "./utils";
export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("flex h-11 w-full min-w-0 rounded-md border border-line-strong bg-default px-3 py-2 text-base text-primary shadow-xs md:text-sm placeholder:text-secondary focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-surface disabled:text-secondary aria-invalid:border-red-700", className)} {...props} />;
}
