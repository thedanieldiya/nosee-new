import type { Description } from "./description.ts";
export type GroupContent = { name: string; slug: string; introduction: string; description: Description; objectives: string[]; coverImage: string; coverAlt: string };
export const emptyGroupContent: GroupContent = { name: "", slug: "", introduction: "", description: "", objectives: [], coverImage: "", coverAlt: "" };
// Validation of retained legacy covers only; the editor offers no image selection/upload.
export const researchCovers = ["/media/about/earth-space-environment.png", "/media/about/solar-observation.png", "/media/home/hero-1.png", "/media/home/hero-2.jpg"] as const;
export type EligibleMember = { id: string; firstName: string; lastName: string; affiliation: string; version: number };
