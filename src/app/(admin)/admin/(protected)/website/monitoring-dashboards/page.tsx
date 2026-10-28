import {requirePermission} from '@/lib/admin/session';
export const metadata={title:'Monitoring dashboards'};
export default async function Monitoring(){await requirePermission('website');return <main id="main-content" className="mx-auto max-w-5xl p-5 sm:p-8"><h1 className="text-2xl font-semibold">Monitoring dashboards</h1></main>;}
