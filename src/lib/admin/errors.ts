export class ManagementError extends Error {
  status: number;
  conflict?: { existingId?: string; deleted: boolean };
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
