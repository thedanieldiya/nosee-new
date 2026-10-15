import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { adminDatabase } from "./database.ts";
import { requireManagerTransaction } from "./management.ts";
import { directoryInput, activityInput } from "./management-input.ts";
import type { Principal } from "./policy.ts";
export const PAGE_SIZE = 20;
export type DirectoryRow = {
  id: string; kind: "account" | "invitation"; firstName: string; lastName: string; email: string;
  role: "super_admin" | "editor" | "research_group_lead"; status: string; delivery: string | null;
  createdAt: string; lastLoginAt: string | null; expiresAt: string | null;
};
export type ActivityRow = { id: string; actorId: string | null; actor: string; action: string; createdAt: string; targetType: string | null; targetId: string | null; targetLabel: string | null; changes: { before: Record<string, string | boolean | null>; after: Record<string, string | boolean | null> } | null };
const pattern = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
export async function administratorDirectory(actor: Principal, raw: unknown) {
  const query = directoryInput.parse(raw);
  return adminDatabase().db.transaction(async tx => {
    await requireManagerTransaction(tx, actor);
    const directory = sql`(
      select u.id, 'account'::text kind, u.first_name "firstName", u.last_name "lastName", u.email, u.role,
        case when u.active then 'active' else 'deactivated' end status,
        case when i.id is not null then 'Invitation accepted' else null end delivery,
        coalesce(i.created_at,u.created_at) "createdAt", u.last_login_at "lastLoginAt", null::timestamptz "expiresAt"
      from administrator u left join admin_invitation i on i.accepted_user_id=u.id
      union all
      select i.id, 'invitation', i.first_name, i.last_name, i.email, i.role,
        case when i.revoked_at is not null then 'revoked' when i.expires_at <= now() then 'expired' else 'pending' end,
        case when s.status='sending' and s.created_at <= now()-interval '2 minutes' then 'unconfirmed' else coalesce(s.status,'unconfirmed') end,
        i.created_at, null::timestamptz, i.expires_at
      from admin_invitation i left join lateral (select status,created_at from admin_invitation_send where invitation_id=i.id order by created_at desc,id desc limit 1) s on true
      where i.accepted_at is null
    ) d`;
    const predicates: SQL[] = [sql`true`];
    if (query.q) predicates.push(sql`(d."firstName" || ' ' || d."lastName" || ' ' || d.email) ilike ${pattern(query.q)}`);
    if (query.role) predicates.push(sql`d.role = ${query.role}`);
    if (query.status) predicates.push(sql`d.status = ${query.status}`);
    const where = sql.join(predicates, sql` and `);
    const total = Number((await tx.execute<{ total: number }>(sql`select count(*)::int total from ${directory} where ${where}`)).rows[0].total);
    const page = Math.min(query.page, Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const rows = (await tx.execute<DirectoryRow>(sql`select * from ${directory} where ${where} order by "createdAt" desc,id desc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`)).rows;
    return { rows: JSON.parse(JSON.stringify(rows)) as DirectoryRow[], total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
  });
}
export async function activityDirectory(actor: Principal, raw: unknown) {
  const query = activityInput.parse(raw);
  return adminDatabase().db.transaction(async tx => {
    await requireManagerTransaction(tx, actor);
    const predicates: SQL[] = [sql`true`];
    if (query.actor === "system") predicates.push(sql`a.actor_id is null`);
    else if (query.actor) predicates.push(sql`a.actor_id=${query.actor}::uuid`);
    if (query.action) predicates.push(sql`a.action=${query.action}`);
    if (query.target) predicates.push(sql`concat_ws(' ',a.target_type,a.target_id::text,a.target_label) ilike ${pattern(query.target)}`);
    if (query.from) predicates.push(sql`a.created_at >= ${query.from}::date::timestamp at time zone 'UTC'`);
    if (query.to) predicates.push(sql`a.created_at < (${query.to}::date+1)::timestamp at time zone 'UTC'`);
    const where = sql.join(predicates, sql` and `);
    const total = Number((await tx.execute<{ total: number }>(sql`select count(*)::int total from admin_audit_log a where ${where}`)).rows[0].total);
    const page = Math.min(query.page, Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const rows = (await tx.execute<ActivityRow>(sql`select a.id,a.actor_id "actorId",coalesce(u.name,'System') actor,a.action,a.created_at "createdAt",a.target_type "targetType",a.target_id "targetId",a.target_label "targetLabel",a.changes
      from admin_audit_log a left join administrator u on u.id=a.actor_id where ${where} order by a.created_at desc,a.id desc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`)).rows;
    const actors = (await tx.execute<{ id: string; name: string }>(sql`select id,name from administrator order by name,id limit 200`)).rows;
    const actions = (await tx.execute<{ action: string }>(sql`select distinct action from admin_audit_log order by action limit 100`)).rows.map(row => row.action);
    return { rows: JSON.parse(JSON.stringify(rows)) as ActivityRow[], total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), actors, actions };
  });
}
