import * as React from "react";
import { cn } from "./utils";
export function Card({ className, ...props }: React.ComponentProps<"section">) { return <section data-slot="card" className={cn("rounded-xl border border-line-mild bg-default shadow-xs", className)} {...props} />; }
export function CardHeader({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-header" className={cn("space-y-1 border-b border-line-mild px-5 py-4 sm:px-6", className)} {...props} />; }
export function CardContent({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-content" className={cn("p-5 sm:p-6", className)} {...props} />; }
