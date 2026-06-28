// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getSession } from '../../../lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (session.user?.role !== 'pendente') {
    return NextResponse.json({ error: 'Papel já definido' }, { status: 400 });
  }

  const demo = await prisma.configuracoes.findUnique({ where: { chave: 'demo_mode' } });
  if (demo?.valor !== 'true') {
    return NextResponse.json({ error: 'Demo mode inativo' }, { status: 403 });
  }

  const { role } = await req.json();
  if (!['admin', 'educador'].includes(role)) {
    return NextResponse.json({ error: 'Papel inválido' }, { status: 400 });
  }

  const userId = Number(session.user?.id);
  await prisma.usuarios.update({
    where: { id: userId },
    data: {
      role,
      can_register: true,
      can_edit: role === 'admin',
    },
  });

  return NextResponse.json({ success: true, role });
}
