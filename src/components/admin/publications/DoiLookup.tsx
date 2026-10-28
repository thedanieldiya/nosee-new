"use client";
import { useEffect,useRef,useState,type Dispatch,type SetStateAction } from "react";
import Link from "next/link";
import { normalizeDoi } from "@/lib/publications/doi";
import type { PublicationFields } from "@/lib/publications/input";
import { lookupMetadataInput } from "@/lib/publications/input";
import type { LookupResult } from "@/lib/publications/lookup-adapter";
import { Field } from "@/components/admin/ManagementShared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const citation = (f: PublicationFields) => JSON.stringify([f.title,f.authors,f.type,f.publicationDate,f.source,f.referenceUrl]);
const populated = (f: PublicationFields) => !!(f.title || f.authors.length || f.publicationDate || f.source || f.referenceUrl || f.type !== "other");
type State = {doi:string;status:string;message:string;result?:Extract<LookupResult,{status:"success"}>;existingId?:string};
export function DoiLookup({fields,setFields,id,busy,error}: {fields:PublicationFields;setFields:Dispatch<SetStateAction<PublicationFields>>;id?:string;busy:boolean;error?:string}) {
  const [state,setState] = useState<State | null>(null), initial = useRef(fields.doi), latest = useRef(fields), controller = useRef<AbortController | null>(null), sequence=useRef(0), timer=useRef<ReturnType<typeof setTimeout> | null>(null), cache=useRef(new Map<string,{result:LookupResult;until:number}>()), manual=useRef<string | null>(null),lastDoi=useRef<string | null>(null),inFlightDoi=useRef<string | null>(null);
  useEffect(()=>{latest.current=fields;});
  function apply(result:Extract<LookupResult,{status:"success"}>) {
    try { if (normalizeDoi(latest.current.doi)!==result.doi) return; } catch { return; }
    setFields(current=>({...current,...result.metadata,doi:result.doi,lookup:{doi:result.doi,provider:result.provider,retrievedAt:result.retrievedAt}}));
    setState({doi:result.doi,status:"success",message:"Metadata applied. Review and edit every field before saving."});
  }
  async function lookup() {
    if (timer.current) clearTimeout(timer.current);
    let doi:string;try {doi=normalizeDoi(latest.current.doi);}catch(error){setState({doi:latest.current.doi,status:"failure",message:(error as Error).message});return;}
    if (controller.current && !controller.current.signal.aborted && inFlightDoi.current === doi) return;
    controller.current?.abort();const abort=new AbortController();controller.current=abort;inFlightDoi.current=doi;const key=++sequence.current,baseline=citation(latest.current);
    setState({doi,status:"loading",message:"Looking up DOI…"});manual.current=null;
    try {
      let result:LookupResult;
      const cached=cache.current.get(doi);
      if(cached&&cached.until>Date.now())result=cached.result;
      else {
        const response=await fetch("/api/admin/publications/lookup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({doi,...(id?{id}:{})}),signal:abort.signal});
        const value=await response.json();
        if(abort.signal.aborted||sequence.current!==key||normalizeDoi(latest.current.doi)!==doi)return;
        lastDoi.current=doi;
        if(!response.ok){setState({doi,status:"failure",message:value.error||"Lookup unavailable. Continue manually.",existingId:value.conflict?.existingId});return;}
        if(value.status==="success")value.metadata=lookupMetadataInput.parse(value.metadata);
        if(value.status==="pending"){setState({doi,status:"failure",message:value.message});return;}
        result=value;
        const ttl=result.status==="success"?86400000:result.status==="no_match"?600000:(result.retryAfter??30)*1000;
        if(cache.current.size>=20)cache.current.delete(cache.current.keys().next().value!);
        cache.current.set(doi,{result,until:Date.now()+ttl});
      }
      if(abort.signal.aborted||sequence.current!==key||normalizeDoi(latest.current.doi)!==doi)return;
      lastDoi.current=doi;
      if(result.status==="success") {
        if(!populated(latest.current)&&citation(latest.current)===baseline)apply(result);
        else setState({doi,status:"review",message:"Metadata found. Review it before replacing your current fields.",result});
      }else setState({doi,status:result.status,message:result.message});
    }catch{if(!abort.signal.aborted&&sequence.current===key)setState({doi,status:"failure",message:"Lookup unavailable. Retry or continue manually; your fields are unchanged."});}
    finally{if(sequence.current===key){controller.current=null;inFlightDoi.current=null;}}
  }
  const lookupRef=useRef(lookup);useEffect(()=>{lookupRef.current=lookup;});
  useEffect(()=>{
    if(fields.doi===initial.current||manual.current===fields.doi)return;
    try{if(normalizeDoi(fields.doi)===lastDoi.current)return;}catch{return;}
    timer.current=setTimeout(()=>void lookupRef.current(),400);
    return()=>{if(timer.current)clearTimeout(timer.current);controller.current?.abort();};
  },[fields.doi]);
  useEffect(()=>()=>{controller.current?.abort();if(timer.current)clearTimeout(timer.current);},[]);
  function change(value:string){controller.current?.abort();sequence.current++;if(timer.current)clearTimeout(timer.current);manual.current=null;setState(null);setFields(old=>({...old,doi:value,lookup:null}));}
  function blurLookup() {
    if(!fields.doi.trim()||manual.current===fields.doi)return;
    try { if(normalizeDoi(fields.doi)===lastDoi.current)return; } catch { /* Lookup reports invalid input inline. */ }
    void lookup();
  }
  const visible=state&&(()=>{try{return normalizeDoi(fields.doi)===state.doi||fields.doi===state.doi;}catch{return fields.doi===state.doi;}})()?state:null;
  return <div className="space-y-3"><Field id="publication-doi" label="DOI (optional)"><Input id="publication-doi" value={fields.doi} maxLength={2048} onChange={e=>change(e.target.value)} onBlur={blurLookup} aria-invalid={!!error} aria-describedby={error?"publication-doi-error":"publication-doi-help"} />{error&&<p id="publication-doi-error" className="text-red-800">{error}</p>}</Field>
    <p id="publication-doi-help" className="text-xs text-secondary">Paste a DOI or doi.org URL. Lookup is optional; all citation fields can be entered manually.</p>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy||!fields.doi.trim()||visible?.status==="loading"} onClick={()=>void lookup()}>{visible?.status==="loading"?"Looking up…":visible?.status==="failure"||visible?.status==="rate_limited"||visible?.status==="no_match"?"Retry lookup":"Look up DOI"}</Button><Button type="button" variant="ghost" disabled={busy} onClick={()=>{controller.current?.abort();sequence.current++;if(timer.current)clearTimeout(timer.current);manual.current=fields.doi;setState({doi:fields.doi,status:"manual",message:"Manual entry selected. Your fields are unchanged."});}}>Enter manually</Button></div>
    {visible&&<p role="status" className="text-sm text-secondary">{visible.message}</p>}
    {visible?.existingId&&<Link className="inline-block underline" href={"/admin/publishing/publications/"+visible.existingId}>Open existing publication</Link>}
    {visible?.result&&<section className="space-y-4 rounded-md border border-line-mild p-4" aria-labelledby="lookup-review-heading"><h3 id="lookup-review-heading" className="font-semibold">Review metadata</h3><p className="text-sm text-secondary">From {visible.result.provider}. Applying replaces only the supplied fields below. Your abstract and research associations are retained.</p><dl className="space-y-3">{Object.entries(visible.result.metadata).map(([key,value])=><div key={key}><dt className="text-xs font-medium text-secondary">{{title:"Title",authors:"Authors",type:"Type",publicationDate:"Publication date",source:"Source",referenceUrl:"Reference URL"}[key]}</dt><dd className="break-words">{Array.isArray(value)?value.join("; "):value}</dd></div>)}</dl><div className="flex flex-wrap gap-2"><Button type="button" disabled={busy} onClick={()=>apply(visible.result!)}>Apply metadata</Button><Button type="button" variant="outline" onClick={()=>setState({doi:visible.doi,status:"success",message:"Current fields kept. You can edit them manually."})}>Keep current fields</Button></div></section>}
  </div>;
}
