export const membershipEmailKinds = { receipt: "Applicant acknowledgement", admin_alert: "Administrator notification", approval: "Approval notification", rejection: "Rejection notification" } as const;
export type MembershipEmailKind = keyof typeof membershipEmailKinds;
export const membershipEmailStates = { held: "Held — not approved for sending", queued: "Queued", sending: "Processing — acceptance not confirmed", accepted: "Accepted by provider — inbox delivery not confirmed", failed: "Failed — not accepted", unconfirmed: "Unconfirmed — may have been accepted" } as const;
export type MembershipEmailState = keyof typeof membershipEmailStates;
