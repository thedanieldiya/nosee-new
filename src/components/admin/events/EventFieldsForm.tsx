"use client";
import { useState, type Dispatch, type SetStateAction } from "react";
import DeleteRegular from "@mingcute/react/core-regular/delete";
import { eventTypes, type EventFields } from "@/lib/events/input";
import { editorialZones } from "@/lib/news/input";
import { editorialLocal, editorialInstant } from "@/lib/timezones";
import { DescriptionEditor } from "@/components/admin/research/DescriptionEditor";
import { Field, Select } from "@/components/admin/ManagementShared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function EventDateTime({ id, label, value, zone, onChange, validationError }: { id: string; label: string; value: string; zone: string; onChange: (value: string) => void; validationError?: string }) {
  const read = (v: string) => { try { return editorialLocal(v, zone); } catch { return { date: "", time: "" }; } };
  const [state, setState] = useState(() => ({ value, zone, local: read(value), error: "" }));
  if (state.value !== value || state.zone !== zone) setState({ value, zone, local: read(value), error: "" });
  const { local } = state;
  const error = state.error || validationError || "";
  function change(next: typeof local) {
    let resolved: string, error = "";
    try { resolved = editorialInstant(next.date, next.time, zone); }
    catch (failure) { resolved = next.date + " " + next.time; error = failure instanceof Error ? failure.message.replace("publication ", "") : "Enter a valid local time."; }
    setState({ value: resolved, zone, local: next, error }); onChange(resolved);
  }
  return <fieldset className="min-w-0 space-y-2"><legend className="font-medium">{label}</legend><div className="grid gap-3 sm:grid-cols-2">
    <Field id={id + "-date"} label="Date"><Input id={id + "-date"} type="date" required value={local.date} onChange={e => change({ ...local, date: e.target.value })} aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} /></Field>
    <Field id={id + "-time"} label="Time"><Input id={id + "-time"} type="time" required step={1} value={local.time} onChange={e => change({ ...local, time: e.target.value })} aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} /></Field>
  </div>{error && <p id={id + "-error"} role="alert" className="text-sm text-red-800">{error}</p>}</fieldset>;
}
function Remove({ label, onClick }: { label: string; onClick: () => void }) { return <Button type="button" variant="ghost" className="size-11 p-0" onClick={onClick} aria-label={label}><DeleteRegular size={20} aria-hidden="true" focusable="false" /></Button>; }
export function EventFieldsForm({ initial, fields: f, setFields, errors, busy }: { initial: EventFields; fields: EventFields; setFields: Dispatch<SetStateAction<EventFields>>; errors: Record<string, string>; busy: boolean }) {
  function set<K extends keyof EventFields>(key: K, value: EventFields[K]) { setFields(old => ({ ...old, [key]: value })); }
  const fieldError = (key: string) => errors[key] ? <p id={"event-" + key + "-error"} className="text-sm text-red-800">{errors[key]}</p> : null;
  const invalid = (key: string) => ({ "aria-invalid": !!errors[key], "aria-describedby": errors[key] ? "event-" + key + "-error" : undefined });
  return <>
    <Field id="event-title" label="Title (required)"><Input id="event-title" required maxLength={160} value={f.title} onChange={e => set("title", e.target.value)} {...invalid("title")} />{fieldError("title")}</Field>
    <Field id="event-type" label="Event type"><Select id="event-type" value={f.type} onChange={e => set("type", e.target.value as EventFields["type"])}>{eventTypes.map(type => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</Select></Field>
    <Field id="event-summary" label="Short summary"><Textarea id="event-summary" rows={3} maxLength={400} value={f.summary} onChange={e => set("summary", e.target.value)} {...invalid("summary")} />{fieldError("summary")}</Field>
    <DescriptionEditor id="event-body" label="Description" validationError={errors.body} initial={initial.body} disabled={busy} onChange={body => set("body", body)} />
    <Field id="event-organiser" label="Organiser"><Input id="event-organiser" maxLength={160} value={f.organiser} onChange={e => set("organiser", e.target.value)} {...invalid("organiser")} />{fieldError("organiser")}</Field>
    <fieldset className="space-y-3"><legend className="mb-2 font-semibold">Speakers</legend>{f.speakers.map((speaker, i) => <div key={i} className="flex items-end gap-2"><div className="min-w-0 grow"><Field id={"speaker-" + i} label={"Speaker " + (i + 1)}><Input id={"speaker-" + i} required maxLength={160} value={speaker} onChange={e => set("speakers", f.speakers.map((s, j) => j === i ? e.target.value : s))} /></Field></div><Remove label={"Remove speaker " + (i + 1)} onClick={() => set("speakers", f.speakers.filter((_, j) => j !== i))} /></div>)}<Button type="button" variant="outline" disabled={f.speakers.length >= 30} onClick={() => set("speakers", [...f.speakers, ""])}>Add speaker</Button></fieldset>
    <label className="flex items-center gap-3"><input type="checkbox" className="size-5 accent-brand" checked={f.featured} onChange={e => set("featured", e.target.checked)} />Featured</label>
    <section className="space-y-5 border-t border-line-mild pt-5" aria-labelledby="event-schedule-heading"><h3 id="event-schedule-heading" className="font-semibold">Schedule</h3>
      <Field id="event-schedule-mode" label="Duration"><Select id="event-schedule-mode" {...invalid("scheduleMode")} value={f.scheduleMode} onChange={e => set("scheduleMode", e.target.value as EventFields["scheduleMode"])}><option value="single_day">Single day / overnight</option><option value="multi_day">Multi-day</option></Select></Field>{fieldError("scheduleMode")}
      <Field id="event-timezone" label="Time zone"><Select id="event-timezone" value={f.timezone} onChange={e => set("timezone", e.target.value as EventFields["timezone"])}>{editorialZones.map(z => <option key={z} value={z}>{z === "Africa/Lagos" ? "WAT (UTC+01:00) — Africa/Lagos" : z}</option>)}</Select></Field>
      <p className="text-sm text-secondary">Changing the zone displays the same instant in that zone. A repeated daylight-saving hour uses its earlier occurrence; nonexistent times must be changed. Event dates may be in the future; publishing makes the event visible now.</p>
      <EventDateTime key={"start" + f.timezone} id="event-start" label="Start" validationError={errors.startAt} value={f.startAt} zone={f.timezone} onChange={v => set("startAt", v)} />
      <EventDateTime key={"end" + f.timezone} id="event-end" label="End" validationError={errors.endAt} value={f.endAt} zone={f.timezone} onChange={v => set("endAt", v)} />
      <label className="flex items-center gap-3"><input type="checkbox" className="size-5 accent-brand" checked={f.deadline !== null} onChange={e => set("deadline", e.target.checked ? f.startAt : null)} />Application / registration deadline</label>
      {f.deadline !== null && <EventDateTime key={"deadline" + f.timezone} id="event-deadline" label="Deadline" validationError={errors.deadline} value={f.deadline} zone={f.timezone} onChange={v => set("deadline", v)} />}
      <fieldset className="space-y-4"><legend className="mb-2 font-semibold">Itinerary (optional)</legend>{f.itinerary.map((entry, i) => <div key={i} className="space-y-4 border-t border-line-mild pt-4">
        <div className="flex items-center justify-between"><p className="font-medium">Entry {i + 1}</p><Remove label={"Remove itinerary entry " + (i + 1)} onClick={() => set("itinerary", f.itinerary.filter((_, j) => j !== i))} /></div>
        <EventDateTime key={"at" + f.timezone} id={"itinerary-" + i} label="Start" validationError={errors["itinerary." + i]} value={entry.at} zone={f.timezone} onChange={v => set("itinerary", f.itinerary.map((x, j) => j === i ? { ...x, at: v } : x))} />
        <label className="flex items-center gap-3"><input type="checkbox" className="size-5 accent-brand" checked={entry.endAt !== null} onChange={e => set("itinerary", f.itinerary.map((x, j) => j === i ? { ...x, endAt: e.target.checked ? f.endAt : null } : x))} />Include end time</label>
        {entry.endAt && <EventDateTime key={"stop" + f.timezone} id={"itinerary-end-" + i} label="End" value={entry.endAt} zone={f.timezone} onChange={v => set("itinerary", f.itinerary.map((x, j) => j === i ? { ...x, endAt: v } : x))} />}
        <Field id={"itinerary-title-" + i} label="Title"><Input id={"itinerary-title-" + i} maxLength={160} value={entry.title} onChange={e => set("itinerary", f.itinerary.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} /></Field>
        <Field id={"itinerary-description-" + i} label="Description"><Textarea id={"itinerary-description-" + i} maxLength={600} value={entry.description} onChange={e => set("itinerary", f.itinerary.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} /></Field>{fieldError("itinerary." + i)}
      </div>)}<Button type="button" variant="outline" disabled={f.itinerary.length >= 40} onClick={() => set("itinerary", [...f.itinerary, { at: f.startAt, endAt: null, title: "", description: "" }])}>Add itinerary entry</Button></fieldset>
    </section>
    <section className="space-y-5 border-t border-line-mild pt-5" aria-labelledby="event-location-heading"><h3 id="event-location-heading" className="font-semibold">Location and links</h3>
      <Field id="event-location-type" label="Location type"><Select id="event-location-type" value={f.location.type} onChange={e => set("location", { ...f.location, type: e.target.value as EventFields["location"]["type"] })}><option value="physical">Physical</option><option value="online">Online</option><option value="hybrid">Hybrid</option></Select></Field>
      {(["venue", "address", "city", "country", "platform"] as const).filter(k => k === "platform" ? f.location.type !== "physical" : f.location.type !== "online").map(k => <Field key={k} id={"event-" + k} label={k === "platform" ? "Online platform" : k[0].toUpperCase() + k.slice(1)}><Input id={"event-" + k} maxLength={k === "address" ? 240 : k === "city" || k === "country" ? 120 : 160} value={f.location[k]} onChange={e => set("location", { ...f.location, [k]: e.target.value })} {...invalid("location." + k)} />{fieldError("location." + k)}</Field>)}
      <Field id="event-registration" label="Registration URL (optional)"><Input id="event-registration" type="url" maxLength={2048} value={f.registrationUrl} onChange={e => set("registrationUrl", e.target.value)} {...invalid("registrationUrl")} />{fieldError("registrationUrl")}</Field>
      {f.type === "meeting" && <Field id="event-meeting" label="Meeting-site URL"><Input id="event-meeting" type="url" maxLength={2048} value={f.meetingSiteUrl} onChange={e => set("meetingSiteUrl", e.target.value)} {...invalid("meetingSiteUrl")} />{fieldError("meetingSiteUrl")}</Field>}
    </section>
    <fieldset className="space-y-4 border-t border-line-mild pt-5"><legend className="font-semibold">Resources</legend>{f.resources.map((entry, i) => <div key={i} className="flex flex-wrap items-end gap-2"><div className="min-w-0 grow space-y-3"><Field id={"resource-label-" + i} label={"Resource " + (i + 1) + " label"}><Input id={"resource-label-" + i} required maxLength={120} value={entry.label} onChange={e => set("resources", f.resources.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} {...invalid("resources." + i + ".label")} />{fieldError("resources." + i + ".label")}</Field><Field id={"resource-url-" + i} label="URL"><Input id={"resource-url-" + i} type="url" required maxLength={2048} value={entry.url} onChange={e => set("resources", f.resources.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} {...invalid("resources." + i + ".url")} />{fieldError("resources." + i + ".url")}</Field></div><Remove label={"Remove resource " + (i + 1)} onClick={() => set("resources", f.resources.filter((_, j) => j !== i))} /></div>)}<Button type="button" variant="outline" disabled={f.resources.length >= 30} onClick={() => set("resources", [...f.resources, { label: "", url: "" }])}>Add resource</Button></fieldset>
    <p className="text-sm text-secondary">Images are retained where available. New uploads are deferred; events can publish without an image.</p>
  </>;
}
