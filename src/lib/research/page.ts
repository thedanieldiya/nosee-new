import "server-only";
import { forbidden, notFound } from "next/navigation";
import { ManagementError } from "../admin/errors.ts";
export async function researchPage<T>(work: () => Promise<T>) {
  try { return await work(); }
  catch (error) { if (error instanceof ManagementError && error.status === 403) forbidden(); if (error instanceof ManagementError && error.status === 404) notFound(); throw error; }
}
