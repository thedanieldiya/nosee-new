import {requirePermission} from '@/lib/admin/session';import{SiteNavigation}from'@/components/admin/site-content/SiteNavigation';
export default async function SiteContentLayout({children}:{children:React.ReactNode}){await requirePermission('website');return <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)]"><SiteNavigation /><div className="min-w-0">{children}</div></div>;}
