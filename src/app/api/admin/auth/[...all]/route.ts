import { z } from "zod";
import { adminAuth } from "@/lib/admin/auth";
import { administrator } from "@/lib/admin/session";
import { privateJson, sameOrigin, readJson, allowSignIn } from "@/lib/admin/http";
import { passwordInput } from "@/lib/admin/validation";
export const dynamic = "force-dynamic";
const signInInput = z.object({ email: z.email().max(254).transform(value => value.toLowerCase()), password: z.string().min(1).max(128) }).strict();
const changePasswordInput = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordInput }).strict();
async function handle(request: Request, context: { params: Promise<{ all: string[] }> }) {
  const path = (await context.params).all.join("/");
  if (!((request.method === "GET" && path === "get-session") || (request.method === "POST" && ["sign-in/email", "sign-out", "change-password"].includes(path)))) return privateJson({ error: "Not found." }, 404);
  if (!adminAuth()) return privateJson({ error: "Administrator sign-in is currently unavailable." }, 503);
  if (request.method === "POST" && !sameOrigin(request)) return privateJson({ error: "Request not permitted." }, 403);
  try {
    if (path !== "sign-in/email" && path !== "sign-out") {
      const principal = await administrator(request.headers);
      if (!principal) return privateJson({ error: "Sign in to continue." }, 401);
      if (path === "get-session") return privateJson({ user: principal });
    }
    let body;
    if (path === "sign-in/email") {
      let input;
      try { input = await readJson(request); } catch { return privateJson({ error: "Enter a valid email and password." }, 400); }
      const parsed = signInInput.safeParse(input);
      if (!parsed.success) return privateJson({ error: "Enter a valid email and password." }, 400);
      if (!(await allowSignIn(parsed.data.email))) return privateJson({ error: "Too many attempts. Try again in 15 minutes." }, 429, { "Retry-After": "900" });
      // Better Auth's non-remembered mode hardcodes 24h; use the configured 8h.
      body = { ...parsed.data, rememberMe: true };
    } else if (path === "change-password") {
      let input;
      try { input = await readJson(request); } catch { return privateJson({ error: "Enter valid password details." }, 400); }
      const parsed = changePasswordInput.safeParse(input);
      if (!parsed.success) return privateJson({ error: "Use a password of 15–128 characters." }, 400);
      body = { ...parsed.data, revokeOtherSessions: true };
    } else if (path === "sign-out") body = {};
    const response = await adminAuth()!.handler(body ? new Request(request, { body: JSON.stringify(body) }) : request);
    const headers = new Headers(response.headers);
    headers.delete("set-auth-token");
    headers.delete("content-length");
    headers.set("Cache-Control", "private, no-store, max-age=0");
    headers.set("X-Robots-Tag", "noindex, nofollow");
    // Session tokens stay in HttpOnly cookies and the server, never browser JSON.
    return Response.json(response.ok ? { success: true } : { error: path === "sign-in/email" ? "Invalid email or password." : "Unable to complete this request. Check your details and try again." }, { status: response.status, headers });
  } catch { return privateJson({ error: "Unable to complete this request. Try again later." }, 503); }
}
export { handle as GET, handle as POST };
