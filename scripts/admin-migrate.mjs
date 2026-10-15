import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { safePostgresUrl } from '../src/lib/admin/environment.ts';
const connectionString = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('Set DATABASE_MIGRATION_URL or DATABASE_URL before migrations.');
if (!safePostgresUrl(connectionString)) throw new Error('Use PostgreSQL with verified TLS (sslmode=verify-full) for remote migrations.');
const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000 });
try { await migrate(drizzle(pool), { migrationsFolder: 'drizzle' }); console.log('Administrator migrations applied.'); }
finally { await pool.end(); }
