import type { ComponentPropsWithoutRef } from "react";

export function Container({ children, className = "", ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div {...props} className={`mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 xl:px-16 ${className}`}>
      {children}
    </div>
  );
}
