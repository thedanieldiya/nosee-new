import {requirePermission} from '@/lib/admin/session';
import {WebsiteNavigation} from '@/components/admin/WebsiteNavigation';
export default async function WebsiteLayout({children}:{children:React.ReactNode}){await requirePermission('website');return <><WebsiteNavigation />{children}</>;}
