import { researchApi } from "@/lib/research/api";
import { groupDirectory, createResearchGroup } from "@/lib/research/groups";
export const dynamic = "force-dynamic";
export function GET(request: Request) { return researchApi(request, actor => groupDirectory(actor, Object.fromEntries(new URL(request.url).searchParams))); }
export function POST(request: Request) { return researchApi(request, (actor, body) => createResearchGroup(actor, body)); }
