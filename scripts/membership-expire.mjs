import { expireMembershipApplications } from '../src/lib/membership/service.ts';
import { adminDatabase } from '../src/lib/admin/database.ts';
let pool;
try { pool=adminDatabase().pool; console.log(JSON.stringify(await expireMembershipApplications())); }
catch { console.error('Membership expiry could not complete. Check the private database configuration and retry.'); process.exitCode=1; }
finally { await pool?.end(); }
