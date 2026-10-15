import { privateJson, readJson, sameOrigin } from "@/lib/admin/http";
import { acceptInvitation, ManagementError } from "@/lib/admin/management";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return privateJson({ error: "Request not permitted." }, 403);
  let body;
  try { body = await readJson(request); } catch { return privateJson({ error: "Enter valid invitation details." }, 400); }
  try { return privateJson(await acceptInvitation(body)); }
  catch (error) { return privateJson({ error: error instanceof ManagementError ? error.message : "Account setup is unavailable. Try again later." }, error instanceof ManagementError ? error.status : 503); }
}
