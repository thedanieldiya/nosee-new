export function ArrowRight({ className = "" }: { className?: string } = {}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 shrink-0 bg-current${className ? " " + className : ""}`}
      style={{
        WebkitMask: "url('/media/icons/arrow-right.svg') center / contain no-repeat",
        mask: "url('/media/icons/arrow-right.svg') center / contain no-repeat",
      }}
    />
  );
}
