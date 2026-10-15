"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Close from "@mingcute/react/core-regular/close";
import { cn } from "./utils";
export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;
export function SheetContent({ children, className, ...props }: React.ComponentProps<typeof Dialog.Content>) {
  return <Dialog.Portal><Dialog.Overlay className="admin fixed inset-0 z-50 bg-black/40" /><Dialog.Content data-slot="sheet-content" className={cn("admin fixed inset-y-0 left-0 z-50 w-[min(85vw,300px)] overflow-y-auto border-r border-line-mild bg-surface p-4 text-primary shadow-xl", className)} {...props}>
    {children}<Dialog.Close aria-label="Close navigation" className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-md text-primary hover:bg-black/5"><Close size={20} aria-hidden="true" focusable="false" data-admin-icon="close" /></Dialog.Close>
  </Dialog.Content></Dialog.Portal>;
}
