import "server-only";
import { parseAdminConfig } from "./environment.ts";
export function adminConfig() { return parseAdminConfig(process.env); }
