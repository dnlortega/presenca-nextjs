import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const s: any = session;
    const userId = s.user.id;
    const role = s.user.role;

    if (role === 'admin') {
      const allCompanies = await prisma.empresas.findMany({
        orderBy: { nome: 'asc' }
      });
      return NextResponse.json({ companies: allCompanies.map(c => c.nome) });
    }

    const mappings = await prisma.usuario_empresas.findMany({
      where: { usuario_id: Number(userId) },
      include: { empresa: true }
    });
    const companies = mappings.map((m) => m.empresa.nome);
    return NextResponse.json({ companies });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
