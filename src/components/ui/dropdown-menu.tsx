"use client";
import * as React from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { cn } from "./utils";
export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export function DropdownMenuContent({ className, sideOffset = 8, ...props }: React.ComponentProps<typeof Menu.Content>) {
  return <Menu.Portal><Menu.Content data-slot="dropdown-menu-content" sideOffset={sideOffset} className={cn("admin z-50 min-w-56 rounded-lg border border-line-mild bg-default p-1.5 text-sm text-primary shadow-lg", className)} {...props} /></Menu.Portal>;
}
export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof Menu.Item>) { return <Menu.Item data-slot="dropdown-menu-item" className={cn("relative flex min-h-10 cursor-default items-center gap-2 rounded-md px-3 py-2 focus:bg-surface data-disabled:pointer-events-none data-disabled:opacity-50", className)} {...props} />; }
