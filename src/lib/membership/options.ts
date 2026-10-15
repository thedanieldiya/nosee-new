export const careerStages = {
  high_school_student: "High school student",
  undergraduate_student: "Undergraduate student",
  graduate_postgraduate_student: "Graduate/Postgraduate student",
  postdoctoral_researcher: "Postdoctoral researcher",
  early_career: "Early career (<10 years)",
  mid_career: "Mid-career (10–20 years)",
  experienced: "Experienced (>20 years)",
  retired: "Retired",
} as const;
export const researchInterests = {
  atmosphere_air_quality: "Atmosphere and Air Quality",
  climate_science: "Climate Science",
  earth_space_informatics: "Earth and Space Informatics",
  energy_resources_environment: "Energy, Resources and Environment",
  space_weather: "Space Weather",
} as const;
export const applicationStatuses = { pending: "Pending", approved: "Approved", rejected: "Rejected", expired: "Expired" } as const;
export type ApplicationStatus = keyof typeof applicationStatuses;
export const membershipConsent = { text: "I agree to NOSEE using the information I provide to review my membership application.", version: "membership-review-v1", privacyVersion: "development-placeholder-v1" } as const;
export type ApplicationValues = { firstName: string; lastName: string; email: string; careerStage: string; researchInterests: string[]; why: string; consent: boolean };
export type ApplicationFormState = { success?: boolean; formToken: string; values: ApplicationValues; errors: Record<string, string>; message?: string };
export const emptyApplicationValues: ApplicationValues = { firstName: "", lastName: "", email: "", careerStage: "", researchInterests: [], why: "", consent: false };
