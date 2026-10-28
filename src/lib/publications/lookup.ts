import "server-only";
import { randomUUID } from "node:crypto";
import { eq,sql } from "drizzle-orm";
import { publicationLookup } from "../admin/schema.ts";
import { authorizedPublishing } from "../admin/publishing.ts";
import { ManagementError } from "../admin/errors.ts";
import type { Principal } from "../admin/policy.ts";
import { lookupRequestInput } from "./input.ts";
import { checkDoi } from "./service.ts";
import { retrieveDoi, type LookupResult } from "./lookup-adapter.ts";
export async function lookupPublication(actor: Principal, raw: unknown, fetcher: typeof fetch = fetch) {
  const parsed = lookupRequestInput.safeParse(raw);
  if (!parsed.success) throw new ManagementError("Enter a valid bare DOI or doi.org URL.");
  const {doi,id} = parsed.data, token = randomUUID();
  const prepared = await authorizedPublishing(actor,async tx => {
    await checkDoi(tx,doi,id);
    const now = new Date((await tx.execute<{now:string}>(sql`select clock_timestamp() as now`)).rows[0].now);
    const [cached] = await tx.select().from(publicationLookup).where(eq(publicationLookup.doi,doi));
    if (cached?.result && cached.expiresAt > now) return { cached:cached.result };
    if (cached?.leaseUntil && cached.leaseUntil > now) return { pending:true };
    // Shared buckets run inside this transaction, so revoked callers never cause provider work.
    for (const [key,max] of [["doi:actor:"+actor.id,10],["doi:global",60]] as const) {
      const result = await tx.execute<{count:number}>(sql`insert into admin_login_attempt(key,count,started_at) values(${key},1,now()) on conflict(key) do update set count=case when admin_login_attempt.started_at<now()-interval '60 seconds' then 1 else admin_login_attempt.count+1 end, started_at=case when admin_login_attempt.started_at<now()-interval '60 seconds' then now() else admin_login_attempt.started_at end returning count`);
      if (result.rows[0].count > max) throw new ManagementError("Too many DOI lookups. Retry in a minute or continue manually.",429);
    }
    await tx.execute(sql`delete from publication_lookup where doi in (select doi from publication_lookup where expires_at<now()-interval '48 hours' and (lease_until is null or lease_until<now()) limit 50)`);
    await tx.insert(publicationLookup).values({doi,expiresAt:now,leaseUntil:new Date(+now+10000),leaseToken:token}).onConflictDoUpdate({target:publicationLookup.doi,set:{leaseUntil:new Date(+now+10000),leaseToken:token}});
    return {};
  });
  if (prepared.cached) return {...prepared.cached,cached:true};
  if (prepared.pending) return {status:"pending" as const,doi,message:"A lookup for this DOI is already in progress. Retry shortly or continue manually."};
  const result: LookupResult = await retrieveDoi(doi,fetcher);
  return authorizedPublishing(actor,async tx => {
    await checkDoi(tx,doi,id);
    const seconds = result.status === "success" ? 86400 : result.status === "no_match" ? 600 : result.status === "rate_limited" ? result.retryAfter ?? 60 : 30;
    await tx.update(publicationLookup).set({result,expiresAt:sql`clock_timestamp()+${seconds}*interval '1 second'`,leaseUntil:null,leaseToken:null}).where(sql`${publicationLookup.doi}=${doi} and ${publicationLookup.leaseToken}=${token}::uuid`);
    return {...result,cached:false};
  });
}
