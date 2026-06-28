// github.com/dnlortega
// linkedin.com/in/daniel-op
import prisma from '../../../../../../lib/prisma';
import { jsonResponse } from '../../../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!isAdmin(session)) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const empId = Number(id);
    if (isNaN(empId)) return jsonResponse({ error: 'Invalid ID' }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { funcionario_id: empId };
    if (startDate || endDate) {
      where.data_hora = {};
      if (startDate) where.data_hora.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.data_hora.lt = end;
      }
    }

    const [employee, records, total30] = await Promise.all([
      prisma.funcionarios.findUnique({
        where: { id: empId },
        select: {
          id: true,
          nome: true,
          setor: { select: { nome: true } },
          empresa: { select: { nome: true } },
        },
      }),
      prisma.presenca.findMany({
        where,
        orderBy: { data_hora: 'desc' },
        take: 90,
        select: { id: true, data_hora: true },
      }),
      prisma.presenca.count({
        where: {
          funcionario_id: empId,
          data_hora: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    if (!employee) return jsonResponse({ error: 'Not found' }, { status: 404 });

    return jsonResponse({
      employee,
      records: records.map(r => ({ id: r.id, data_hora: r.data_hora })),
      total: records.length,
      total30,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}
