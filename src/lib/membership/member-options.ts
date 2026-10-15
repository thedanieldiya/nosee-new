export const memberStatuses = { active: "Active", inactive: "Inactive" } as const;
export type MemberStatus = keyof typeof memberStatuses;
export type MemberFields = { firstName: string; lastName: string; email: string; phone: string; affiliation: string; careerStage: string; researchInterests: string[]; status: MemberStatus; joinDate: string; notes: string };
export const emptyMemberFields: MemberFields = { firstName: "", lastName: "", email: "", phone: "", affiliation: "", careerStage: "", researchInterests: [], status: "active", joinDate: "", notes: "" };
