// The only authorised event-presentation change; preserve every other PHP field.
export function approvedBadgeContrast(value) {
  if (Array.isArray(value)) return value.map(approvedBadgeContrast);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    key === "tag_classes" && item === "bg-brand/10 text-brand"
      ? "bg-brand/10 text-[#0b5025]" : approvedBadgeContrast(item),
  ]));
}
