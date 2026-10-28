import {revalidatePath} from 'next/cache.js';
export async function refreshSiteContent(result:object,path:'/'|'/about'){try{revalidatePath(path);return result;}catch{return{...result,cacheRefresh:'unconfirmed'};}}
