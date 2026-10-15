import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { verifiedPostgresUrl } from '../src/lib/admin/environment.ts';
// Prefer Neon's direct connection for DDL; do not expose it to the app runtime.
const suppliedUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!suppliedUrl) throw new Error('Set DATABASE_MIGRATION_URL, DATABASE_URL_UNPOOLED, or DATABASE_URL before migrations.');
const connectionString = verifiedPostgresUrl(suppliedUrl);
if (!connectionString) throw new Error('Use PostgreSQL with verified TLS (sslmode=verify-full) for remote migrations.');
const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000 });
try { await migrate(drizzle(pool), { migrationsFolder: 'drizzle' }); console.log('Administrator migrations applied.'); }
finally { await pool.end(); }
