import prisma from './prisma';

interface AuditParams {
  usuario_id?: number | null;
  action: string;
  entity: string;
  entity_id?: number | null;
  details?: string | null;
}

export async function audit(params: AuditParams): Promise<void> {
  try {
    await prisma.audit_log.create({ data: params });
  } catch {
    // Audit log failures must never break the main flow
  }
}
