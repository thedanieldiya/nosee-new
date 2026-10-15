"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { cn } from "./utils";
export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export const DialogTitle = Primitive.Title;
export const DialogDescription = Primitive.Description;
export function DialogContent({ className, ...props }: React.ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Overlay className="fixed inset-0 z-50 bg-black/40" /><Primitive.Content className={cn("admin fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-line-mild bg-default p-6 shadow-lg", className)} {...props} /></Primitive.Portal>;
}
