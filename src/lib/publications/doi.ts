export function normalizeDoi(raw: string) {
  let value = raw.trim();
  if (/^https?:/i.test(value)) {
    const url = new URL(value);
    if (!["doi.org", "dx.doi.org"].includes(url.hostname.toLowerCase()) || url.username || url.password || url.port || url.search || url.hash || /[\\\s]/.test(value)) throw new Error("Use a bare DOI or a standard doi.org URL without query parameters.");
    value = decodeURIComponent(url.pathname.slice(1));
  }
  if (!/^10\.\d{4,9}\/[^\s\x00-\x1f\x7f]+$/i.test(value) || value.length > 255 || /[\\<>]/.test(value)) throw new Error("Enter a DOI such as 10.1234/example, or leave it blank for manual entry.");
  return value.toLowerCase();
}
export const doiUrl = (doi: string) => "https://doi.org/" + normalizeDoi(doi).split("/").map(encodeURIComponent).join("/");
