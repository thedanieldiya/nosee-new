import ArrowRightRegular from "@mingcute/react/core-regular/arrow-right";

export function ArrowRight({ className = "" }: { className?: string } = {}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 shrink-0${className ? " " + className : ""}`}
    ><ArrowRightRegular size={16} className="block" aria-hidden="true" focusable="false" data-ui-icon="arrow-right" /></span>
  );
}
