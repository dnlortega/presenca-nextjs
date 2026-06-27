import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '../../../lib/prisma';
import { jsonResponse } from '../../../lib/api-helpers';
import { getSession } from '../../../lib/session';
import { audit } from '../../../lib/audit';
import { getSaoPauloDateRange, getSaoPauloRefDate } from '../../../lib/timezone';

function getDayRange() {
  return { ...getSaoPauloDateRange(), refDate: getSaoPauloRefDate() };
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { employeeIds } = body;

    if (!employeeIds || !Array.isArray(employeeIds)) {
      return jsonResponse({ error: 'No employee IDs provided' }, { status: 400 });
    }

    const { start, end, refDate } = getDayRange();
    let count = 0;

    for (const id of employeeIds) {
      const nid = Number(id);
      if (isNaN(nid)) continue;

      const existing = await prisma.presenca.findFirst({
        where: {
          funcionario_id: nid,
          data_hora: {
            gte: start,
            lt: end,
          },
        },
      });

      if (!existing) {
        await prisma.presenca.create({
          data: {
            funcionario_id: nid,
            data_hora: refDate
          }
        });
        count++;
      }
    }

    return jsonResponse({ ok: true, count });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaNome = searchParams.get('empresa');
    const setorNome = searchParams.get('setor');

    if (!empresaNome || !setorNome) {
      return jsonResponse({ error: 'Missing parameters' }, { status: 400 });
    }

    const { start, end } = getDayRange();

    // Find company by name
    const empresa = await prisma.empresas.findFirst({
      where: { nome: empresaNome }
    });

    if (!empresa) {
      return jsonResponse({ error: 'Company not found' }, { status: 404 });
    }

    // Find sector by name (within the company) - case insensitive
    const setor = await prisma.setores.findFirst({
      where: {
        nome: {
          equals: setorNome,
          mode: 'insensitive'
        },
        empresa_id: empresa.id
      }
    });

    if (!setor) {
      return jsonResponse({ error: 'Sector not found' }, { status: 404 });
    }

    const records = await prisma.presenca.findMany({
      where: {
        funcionario: {
          empresa_id: empresa.id,
          setor_id: setor.id,
        },
        data_hora: {
          gte: start,
          lt: end,
        },
      },
      select: {
        id: true,
        funcionario_id: true,
        funcionario: {
          select: {
            nome: true
          }
        }
      },
    });

    return jsonResponse(records.map(r => ({
      id: r.id,
      funcionario_id: r.funcionario_id,
      funcionario: r.funcionario.nome
    })));
  } catch (err) {
    console.error('Error in GET /api/attendance:', err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonResponse({ error: 'Missing ID' }, { status: 400 });
    }

    const userId = session?.user?.id ? Number(session.user.id) : null;
    await prisma.presenca.delete({
      where: { id: Number(id) }
    });

    await audit({ usuario_id: userId, action: 'DELETE', entity: 'presenca', entity_id: Number(id) });
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}
