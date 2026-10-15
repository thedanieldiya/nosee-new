import { NextResponse } from "next/server";

/** Keep the source-era /login navbar URL, but lead to the real admin sign-in. */
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/admin/sign-in", request.url), 307);
}
