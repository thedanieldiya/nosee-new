import input from '@inquirer/input';
import password from '@inquirer/password';
import { bootstrapAdministrator } from '../src/lib/admin/bootstrap.ts';
import { adminConfig } from '../src/lib/admin/config.ts';
import { adminDatabase } from '../src/lib/admin/database.ts';
if (!process.stdin.isTTY || !process.stdout.isTTY || process.argv.length !== 2) {
  console.error('Run admin:bootstrap in an interactive privileged terminal, without arguments.'); process.exitCode = 1;
} else if (!adminConfig()) {
  console.error('Administrator infrastructure is not configured. Follow docs/admin/architecture.md.'); process.exitCode = 1;
} else {
  try {
    const firstName = await input({ message: 'First name' }), lastName = await input({ message: 'Last name' }), email = await input({ message: 'Email' });
    const secret = await password({ message: 'Password (15–128 characters)', mask: '*' });
    const confirmation = await password({ message: 'Confirm password', mask: '*' });
    if (secret !== confirmation) throw new Error('Passwords differ.');
    await bootstrapAdministrator({ firstName, lastName, email, password: secret });
    console.log('Initial Super Admin created. Sign in at /admin/sign-in on the configured origin.');
  } catch {
    console.error('Bootstrap did not complete. Check inputs, migrations and whether a Super Admin already exists.'); process.exitCode = 1;
  } finally { await adminDatabase().pool.end(); }
}
