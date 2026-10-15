import { runMembershipEmailWorker } from '../src/lib/membership/email-outbox.ts';
import { adminDatabase } from '../src/lib/admin/database.ts';
let pool;
try { const result=await runMembershipEmailWorker(); console.log(JSON.stringify(result)); if(!result.enabled)process.exitCode=2; }
catch { console.error('Membership notification processing could not be confirmed. Check private configuration and retry later.'); process.exitCode=1; }
finally { try{pool=adminDatabase().pool;}catch{/* Configuration can be intentionally absent. */}await pool?.end(); }
