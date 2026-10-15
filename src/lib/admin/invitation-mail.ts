import "server-only";
export type InvitationMessage = { to: string; subject: string; html: string; text: string };
export type DeliveryResult = { status: "accepted"; messageId: string } | { status: "failed" | "unconfirmed" };
export type InvitationTransport = { send(message: InvitationMessage, options: { signal: AbortSignal }): Promise<DeliveryResult> };
// No provider, SDK, secret or production fake sender is enabled before owner approval.
export function invitationTransport(): InvitationTransport | null { return null; }
