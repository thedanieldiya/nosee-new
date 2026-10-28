import "server-only";
import { administrator } from "../admin/session.ts";
import { privateJson, sameOrigin, takeBucket } from "../admin/http.ts";
import { ManagementError } from "../admin/errors.ts";
import { checkUpload, acceptUpload } from "../media/uploads.ts";
import { readImageBody } from "../media/image.ts";
import { deliverImage } from "../media/delivery.ts";
export async function binaryUpload(r: Request, id: string, uploadId: string) {
  if (!sameOrigin(r))
    return privateJson({ error: "Request not permitted." }, 403);
  try {
    const a = await administrator(r.headers);
    if (!a) return privateJson({ error: "Sign in to continue." }, 401);
    if (!["super_admin", "editor"].includes(a.role))
      return privateJson({ error: "Gallery access is required." }, 403);
    if (!(await takeBucket("gallery:" + a.id, 60, 40)))
      return privateJson({ error: "Too many uploads. Retry shortly." }, 429, {
        "Retry-After": "60",
      });
    await checkUpload(a, id, uploadId);
    return privateJson(
      await acceptUpload(a, id, uploadId, await readImageBody(r)),
    );
  } catch (e) {
    return privateJson(
      {
        error:
          e instanceof ManagementError
            ? e.message
            : "Upload could not be confirmed. Retry this file.",
      },
      e instanceof ManagementError ? e.status : 503,
    );
  }
}
export async function imageResponse(
  r: Request,
  id: string,
  asset: string,
  privateAccess: boolean,
) {
  try {
    const a = privateAccess ? await administrator(r.headers) : undefined;
    if (privateAccess && !a)
      return privateJson({ error: "Sign in to continue." }, 401);
    if (
      privateAccess &&
      (!a ||
        !["super_admin", "editor"].includes(a.role) ||
        r.headers.get("sec-fetch-site") === "cross-site")
    )
      return privateJson({ error: "Gallery access is required." }, 403);
    return await deliverImage(
      id,
      asset,
      new URL(r.url).searchParams.get("variant") ?? "thumb",
      a ?? undefined,
    );
  } catch (e) {
    return privateJson(
      {
        error:
          e instanceof ManagementError
            ? e.message
            : "Image is temporarily unavailable.",
      },
      e instanceof ManagementError ? e.status : 503,
    );
  }
}
