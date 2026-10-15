import { z } from "zod";
const name = z.string().trim().min(1, "Enter your name.").max(80, "Use at most 80 characters.").refine(value => !/[\x00-\x1f\x7f]/.test(value), "Use printable characters.");
export const profileInput = z.object({ firstName: name, lastName: name }).strict();
export const passwordInput = z.string().min(15, "Use at least 15 characters.").max(128, "Use at most 128 characters.");
export const bootstrapInput = profileInput.extend({ email: z.email().max(254).transform(value => value.toLowerCase()), password: passwordInput }).strict();
