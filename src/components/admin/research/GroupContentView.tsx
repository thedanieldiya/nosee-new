import { DescriptionView } from "./DescriptionView";
import { descriptionText } from "@/lib/research/description";
import Image from "next/image";
import type { GroupContent } from "@/lib/research/options";
export function GroupContentView({ content }: { content: GroupContent }) {
  return <article className="space-y-6 break-words"><h2 className="font-heading text-2xl font-semibold">{content.name}</h2>{content.coverImage ? <Image src={content.coverImage} alt={content.coverAlt} width={1000} height={600} className="max-h-96 w-full rounded-lg object-cover" /> : null}{content.introduction ? <p className="whitespace-pre-wrap text-base leading-relaxed">{content.introduction}</p> : <p className="text-secondary">No introduction saved.</p>}<section aria-label="Full description">{descriptionText(content.description) ? <DescriptionView value={content.description} /> : <p className="text-secondary">No description saved.</p>}</section><section><h3 className="font-semibold">Objectives / focus areas</h3>{content.objectives.length ? <ul className="mt-3 list-disc space-y-2 pl-5">{content.objectives.map((objective, index) => <li key={index}>{objective}</li>)}</ul> : <p className="mt-2 text-secondary">No focus areas saved.</p>}</section></article>;
}
