"use client";
import type { Dispatch,SetStateAction } from "react";
import DeleteRegular from "@mingcute/react/core-regular/delete";
import { publicationTypes,type PublicationFields } from "@/lib/publications/input";
import { researchInterests } from "@/lib/membership/options";
import { DoiLookup } from "./DoiLookup";
import { GroupAutocomplete } from "./GroupAutocomplete";
import { Field,Select } from "@/components/admin/ManagementShared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
export function PublicationFieldsForm({fields:f,setFields,errors,busy,id,selectedGroup}: {fields:PublicationFields;setFields:Dispatch<SetStateAction<PublicationFields>>;errors:Record<string,string>;busy:boolean;id?:string;selectedGroup:{id:string;name:string}|null}) {
  const [group,setGroup]=useState(selectedGroup);
  function set<K extends keyof PublicationFields>(key:K,value:PublicationFields[K]){setFields(old=>({...old,[key]:value}));}
  const attrs=(key:string)=>({"aria-invalid":!!errors[key],"aria-describedby":errors[key]?"publication-"+key+"-error":undefined});
  const error=(key:string)=>errors[key]?<p id={"publication-"+key+"-error"} className="text-sm text-red-800">{errors[key]}</p>:null;
  return <>
    <DoiLookup fields={f} setFields={setFields} id={id} busy={busy} error={errors.doi} />
    <Field id="publication-title" label="Title (required)"><Input id="publication-title" required maxLength={400} value={f.title} onChange={e=>set("title",e.target.value)} {...attrs("title")} />{error("title")}</Field>
    <fieldset className="space-y-3" aria-describedby={errors.authors?"publication-authors-error":undefined}><legend className="mb-2 font-semibold">Authors</legend><p className="text-xs text-secondary">Keep the recorded order. Use each person’s or organisation’s full display name.</p>{f.authors.map((name,i)=><div key={i} className="flex items-end gap-2"><div className="min-w-0 grow"><Field id={"publication-author-"+i} label={"Author "+(i+1)}><Input id={"publication-author-"+i} required maxLength={240} value={name} onChange={e=>set("authors",f.authors.map((n,j)=>i===j?e.target.value:n))} {...attrs("authors."+i)} />{error("authors."+i)}</Field></div><Button type="button" className="size-11 p-0" variant="ghost" aria-label={"Remove author "+(i+1)} onClick={()=>set("authors",f.authors.filter((_,j)=>j!==i))}><DeleteRegular size={20} aria-hidden="true" focusable="false" /></Button></div>)}{error("authors")}<Button type="button" variant="outline" disabled={f.authors.length>=200} onClick={()=>set("authors",[...f.authors,""])}>Add author</Button></fieldset>
    <Field id="publication-type" label="Publication type"><Select id="publication-type" value={f.type} onChange={e=>set("type",e.target.value as PublicationFields["type"])}>{publicationTypes.map(t=><option key={t} value={t}>{t.replaceAll("-"," ").replace(/^./,x=>x.toUpperCase())}</option>)}</Select></Field>
    <Field id="publication-date" label="Publication date"><Input id="publication-date" value={f.publicationDate} onChange={e=>set("publicationDate",e.target.value)} maxLength={10} placeholder="YYYY, YYYY-MM or YYYY-MM-DD" {...attrs("publicationDate")} />{error("publicationDate")}<p className="text-xs text-secondary">Record only known components. Future bibliographic dates are allowed; publishing makes the page visible now.</p></Field>
    <Field id="publication-source" label="Journal, conference or source"><Input id="publication-source" maxLength={400} value={f.source} onChange={e=>set("source",e.target.value)} {...attrs("source")} />{error("source")}</Field>
    <Field id="publication-reference" label="Reference URL (optional)"><Input id="publication-reference" type="url" maxLength={2048} value={f.referenceUrl} onChange={e=>set("referenceUrl",e.target.value)} {...attrs("referenceUrl")} />{error("referenceUrl")}</Field>
    <Field id="publication-abstract" label="Abstract or summary (optional)"><Textarea id="publication-abstract" rows={6} maxLength={6000} value={f.abstract} onChange={e=>set("abstract",e.target.value)} {...attrs("abstract")} /><p className="text-xs text-secondary">Editor-supplied text; abstracts and full papers are not imported. {f.abstract.length.toLocaleString("en")} / 6,000 characters.</p>{error("abstract")}</Field>
    <fieldset className="space-y-3"><legend className="mb-2 font-semibold">Research areas</legend>{Object.entries(researchInterests).map(([key,label])=><label key={key} className="flex min-h-11 items-center gap-3"><input type="checkbox" className="size-5 accent-brand" checked={f.researchAreas.includes(key as keyof typeof researchInterests)} onChange={e=>set("researchAreas",e.target.checked?[...f.researchAreas,key as keyof typeof researchInterests]:f.researchAreas.filter(v=>v!==key))} />{label}</label>)}{error("researchAreas")}</fieldset>
    <GroupAutocomplete selected={group} onSelect={value=>{setGroup(value);set("groupId",value?.id??null);}} />{f.groupId&&!group&&<div className="space-y-2"><p className="text-sm text-secondary">The selected group is no longer available.</p><Button type="button" variant="outline" onClick={()=>set("groupId",null)}>Clear unavailable group</Button></div>}{error("groupId")}
    {f.lookup&&<p className="text-xs text-secondary">Metadata source: {f.lookup.provider}. Imported citation fields remain editable.</p>}
  </>;
}
