import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const s: any = session;
    const usuario = await prisma.usuarios.findUnique({ where: { username: s.user.name } });
    if (!usuario) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mappings = await prisma.usuario_empresas.findMany({ where: { usuario_id: usuario.id } });
    const companies = mappings.map((m) => m.empresa);
    return NextResponse.json({ companies });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
