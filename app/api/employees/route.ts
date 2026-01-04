import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const companyName = url.searchParams.get('company');
    const sectorName = url.searchParams.get('sector');

    const s: any = session;
    const userId = s.user?.id;

    // 1. Fetch allowed companies for this user
    let allowedCompanyNames: string[] = [];
    if (s.user?.role === 'admin') {
      const all = await prisma.empresas.findMany();
      allowedCompanyNames = all.map(c => c.nome);
    } else {
      const mappings = await prisma.usuario_empresas.findMany({
        where: { usuario_id: Number(userId) },
        include: { empresa: true }
      });
      allowedCompanyNames = mappings.map(m => m.empresa.nome);
    }

    // 2. Validate requested company
    if (companyName && !allowedCompanyNames.includes(companyName)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Build query
    let where: any = {};
    if (companyName) {
      where.empresa = { nome: companyName };
    } else {
      where.empresa = { nome: { in: allowedCompanyNames } };
    }

    if (sectorName) {
      where.setor = { nome: sectorName };
    }

    const list = await prisma.funcionarios.findMany({
      where,
      include: {
        empresa: true,
        setor: true
      },
      orderBy: { id: 'asc' }
    });

    // Remap to match previous format if necessary (returning names as strings)
    const formatted = list.map(f => ({
      id: f.id,
      nome: f.nome,
      empresa: f.empresa.nome,
      setor: f.setor.nome,
      empresa_id: f.empresa_id,
      setor_id: f.setor_id
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
