// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getSession } from '../../../lib/session';
import { jsonResponse } from '../../../lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;
    const role = session.user.role;

    if (role === 'admin') {
      const allCompanies = await prisma.empresas.findMany({
        orderBy: { nome: 'asc' }
      });
      return jsonResponse({ companies: allCompanies.map(c => c.nome) });
    }

    const mappings = await prisma.usuario_empresas.findMany({
      where: { usuario_id: Number(userId) },
      include: { empresa: true }
    });
    const companies = mappings.map((m) => m.empresa.nome).sort();
    return jsonResponse({ companies });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}
