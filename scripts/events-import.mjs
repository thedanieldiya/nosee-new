// Read-only inventory unless --apply is supplied. No provider calls, emails or media writes.
import { legacyEventMapping, importLegacyEvents } from '../src/lib/events/legacy.ts';
import { adminDatabase } from '../src/lib/admin/database.ts';
import { user } from '../src/lib/admin/schema.ts';
import { eq } from 'drizzle-orm';
const args = process.argv.slice(2), mapping = legacyEventMapping();
if (!args.includes('--apply')) console.log(JSON.stringify(mapping.map(r => ({ slug: r.slug, startAt: r.fields.startAt, endAt: r.fields.endAt, meetingSiteUrl: r.fields.meetingSiteUrl, provenance: r.provenance })), null, 2));
else {
 const actorId = args.find(a => a.startsWith('--actor='))?.slice(8);
 if (!actorId || !/^[0-9a-f-]{36}$/.test(actorId)) throw new Error('Supply the existing publishing administrator UUID using --actor=.');
 const approved = args.find(a => a.startsWith('--reviewed-published='))?.slice(21).split(',').filter(Boolean) ?? [];
 const { db, pool } = adminDatabase();
 try {
  const [actor] = await db.select().from(user).where(eq(user.id, actorId));
  if (!actor) throw new Error('Publishing administrator not found.');
  console.log(JSON.stringify(await importLegacyEvents(actor, approved), null, 2));
 } finally { await pool.end(); }
}
