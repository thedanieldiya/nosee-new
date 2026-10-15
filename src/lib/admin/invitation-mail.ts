import "server-only";
import { resendInvitationTransport } from "./resend-mail.ts";
export type InvitationMessage = { to: string; subject: string; html: string; text: string };
export type DeliveryResult = { status: "accepted"; messageId: string } | { status: "failed" | "unconfirmed" };
export type InvitationTransport = { send(message: InvitationMessage, options: { signal: AbortSignal; idempotencyKey: string }): Promise<DeliveryResult> };
export function invitationTransport(): InvitationTransport | null { return resendInvitationTransport(process.env); }
