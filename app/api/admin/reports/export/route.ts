// github.com/dnlortega
// linkedin.com/in/daniel-op
import { getSession, isAdmin } from '../../../../../lib/session';
import prisma from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const empresaFilter = searchParams.get('empresa');
  const setorFilter = searchParams.get('setor');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (startDate || endDate) {
    where.data_hora = {};
    if (startDate) where.data_hora.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      where.data_hora.lt = end;
    }
  }

  if (empresaFilter || setorFilter) {
    where.funcionario = {};
    if (empresaFilter) {
      where.funcionario.empresa = { nome: { contains: empresaFilter, mode: 'insensitive' } };
    }
    if (setorFilter) {
      where.funcionario.setor = { nome: { contains: setorFilter, mode: 'insensitive' } };
    }
  }

  const records = await prisma.presenca.findMany({
    where,
    orderBy: { data_hora: 'desc' },
    include: {
      funcionario: {
        include: { setor: true, empresa: true }
      }
    }
  });

  const header = 'ID,Funcionário,Setor,Empresa,Data\n';
  const rows = records.map(r => {
    const date = new Date(r.data_hora).toLocaleDateString('pt-BR');
    const cols = [
      r.id,
      `"${r.funcionario.nome.replace(/"/g, '""')}"`,
      `"${r.funcionario.setor.nome.replace(/"/g, '""')}"`,
      `"${r.funcionario.empresa.nome.replace(/"/g, '""')}"`,
      date,
    ];
    return cols.join(',');
  });

  const csv = header + rows.join('\n');
  const filename = `presencas_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
