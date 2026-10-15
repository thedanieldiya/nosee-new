import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { administrator } from "@/lib/admin/session";
import { adminDatabase } from "@/lib/admin/database";
import { user, auditLog } from "@/lib/admin/schema";
import { profileInput } from "@/lib/admin/validation";
import { privateJson, readJson, sameOrigin } from "@/lib/admin/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const principal = await administrator(request.headers);
    return principal ? privateJson(principal) : privateJson({ error: "Sign in to continue." }, 401);
  } catch { return privateJson({ error: "Account service is currently unavailable." }, 503); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return privateJson({ error: "Request not permitted." }, 403);
  try {
    const principal = await administrator(request.headers);
    if (!principal) return privateJson({ error: "Sign in to continue." }, 401);
    let input;
    try { input = profileInput.safeParse(await readJson(request)); } catch { return privateJson({ error: "Enter valid account details." }, 400); }
    if (!input.success) return privateJson({ error: "Enter first and last names, each 1–80 printable characters." }, 400);
    const result = await adminDatabase().db.transaction(async tx => {
      const [record] = await tx.update(user).set({ ...input.data, name: `${input.data.firstName} ${input.data.lastName}`, updatedAt: new Date() }).where(and(eq(user.id, principal.id), eq(user.active, true))).returning({ firstName: user.firstName, lastName: user.lastName });
      if (!record) throw new Error("Account unavailable.");
      await tx.insert(auditLog).values({ id: randomUUID(), actorId: principal.id, action: "Updated account details" });
      return record;
    });
    return privateJson(result);
  } catch { return privateJson({ error: "Unable to save account details. Try again later." }, 503); }
}
