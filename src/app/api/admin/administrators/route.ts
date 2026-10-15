import { managementApi } from "@/lib/admin/management-api";
import { manageAdministrator } from "@/lib/admin/management";
import { administratorDirectory } from "@/lib/admin/management-queries";
import { directoryInput } from "@/lib/admin/management-input";
import { privateJson } from "@/lib/admin/http";
import { ManagementError } from "@/lib/admin/management";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return managementApi(request, async actor => {
    const query = directoryInput.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) throw new ManagementError("Invalid directory filters.");
    return administratorDirectory(actor, query.data);
  });
}
export async function POST(request: Request) { return managementApi(request, (actor, body) => manageAdministrator(actor, body)); }
export function DELETE() { return privateJson({ error: "Administrator deletion is not available." }, 405, { Allow: "GET, POST" }); }
