import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    const url = new URL(req.url);
    const company = url.searchParams.get('company');
    const sector = url.searchParams.get('sector');

    // If user is educator, restrict to their mapped companies
    let where: any = {};
    if (company) where.empresa = company;
    if (sector) where.setor = sector;

    if (!session) {
      // no session: deny
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const s: any = session;
    if (s.user?.role === 'admin') {
      const list = await prisma.funcionarios.findMany({ where, orderBy: { id: 'asc' } });
      return NextResponse.json(list);
    }

    // educator: fetch permitted companies
    const usuario = await prisma.usuarios.findUnique({ where: { username: s.user.name } });
    if (!usuario) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mappings = await prisma.usuario_empresas.findMany({ where: { usuario_id: usuario.id } });
    const allowed = mappings.map((m) => m.empresa);
    if (company && !allowed.includes(company)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // apply allowed companies
    where.empresa = Array.isArray(where.empresa) ? where.empresa : where.empresa || undefined;
    const list = await prisma.funcionarios.findMany({ where: { ...where, empresa: { in: allowed } }, orderBy: { id: 'asc' } });
    return NextResponse.json(list);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
