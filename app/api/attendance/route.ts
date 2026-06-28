// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '../../../lib/prisma';
import { jsonResponse } from '../../../lib/api-helpers';
import { getSession, isAdmin, isEducator } from '../../../lib/session';
import { audit } from '../../../lib/audit';
import { getSaoPauloDateRange, getSaoPauloRefDate } from '../../../lib/timezone';

const MAX_IDS = 500;

function getDayRange() {
  return { ...getSaoPauloDateRange(), refDate: getSaoPauloRefDate() };
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

    const canRegister = isAdmin(session) || (isEducator(session) && session.user.can_register === true);
    if (!canRegister) return jsonResponse({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { employeeIds } = body;

    if (!employeeIds || !Array.isArray(employeeIds)) {
      return jsonResponse({ error: 'No employee IDs provided' }, { status: 400 });
    }

    if (employeeIds.length > MAX_IDS) {
      return jsonResponse({ error: `Máximo de ${MAX_IDS} registros por requisição` }, { status: 400 });
    }

    const { refDate } = getDayRange();

    const validIds = [...new Set(employeeIds.map(Number).filter(n => !isNaN(n) && n > 0))];

    // If educator, restrict to employees in their companies
    let allowedIds = validIds;
    if (!isAdmin(session)) {
      const userId = Number(session.user.id);
      const mappings = await prisma.usuario_empresas.findMany({
        where: { usuario_id: userId },
        select: { empresa_id: true },
      });
      const allowedCompanyIds = mappings.map(m => m.empresa_id);
      const ownedEmployees = await prisma.funcionarios.findMany({
        where: { id: { in: validIds }, empresa_id: { in: allowedCompanyIds } },
        select: { id: true },
      });
      allowedIds = ownedEmployees.map(e => e.id);
    }

    if (allowedIds.length === 0) {
      return jsonResponse({ ok: true, count: 0 });
    }

    const result = await prisma.presenca.createMany({
      data: allowedIds.map(id => ({ funcionario_id: id, data_hora: refDate })),
      skipDuplicates: true,
    });

    const userId = session.user?.id ? Number(session.user.id) : null;
    await audit({ usuario_id: userId, action: 'CREATE', entity: 'presenca', entity_id: null });

    return jsonResponse({ ok: true, count: result.count });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

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

    // Educators can only query their own companies
    if (!isAdmin(session)) {
      const userId = Number(session.user.id);
      const linked = await prisma.usuario_empresas.findFirst({
        where: { usuario_id: userId, empresa_id: empresa.id },
      });
      if (!linked) return jsonResponse({ error: 'Forbidden' }, { status: 403 });
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
    if (!isEducator(session)) return jsonResponse({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonResponse({ error: 'Missing ID' }, { status: 400 });
    }

    const userId = session?.user?.id ? Number(session.user.id) : null;
    const presencaId = Number(id);
    if (isNaN(presencaId) || presencaId <= 0) return jsonResponse({ error: 'ID inválido' }, { status: 400 });

    // Educators can only delete presença from their own companies
    if (!isAdmin(session)) {
      const record = await prisma.presenca.findUnique({
        where: { id: presencaId },
        select: { funcionario: { select: { empresa_id: true } } },
      });
      if (!record) return jsonResponse({ error: 'Not found' }, { status: 404 });
      const linked = await prisma.usuario_empresas.findFirst({
        where: { usuario_id: userId!, empresa_id: record.funcionario.empresa_id },
      });
      if (!linked) return jsonResponse({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.presenca.delete({ where: { id: presencaId } });

    await audit({ usuario_id: userId, action: 'DELETE', entity: 'presenca', entity_id: presencaId });
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}
