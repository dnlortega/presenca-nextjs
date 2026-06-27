import { getSession, isAdmin } from '../../../../../lib/session';
import prisma from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const records = await prisma.presenca.findMany({
    orderBy: { data_hora: 'desc' },
    include: {
      funcionario: {
        include: { setor: true, empresa: true }
      }
    }
  });

  const header = 'ID,Funcionário,Setor,Empresa,Data/Hora\n';
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
