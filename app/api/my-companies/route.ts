import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { jsonResponse } from '../../../lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
    const s: any = session;
    const userId = s.user.id;
    const role = s.user.role;

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
    const companies = mappings.map((m) => m.empresa.nome);
    return jsonResponse({ companies });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}
