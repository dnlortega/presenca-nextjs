// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getSession, isAdmin } from '../../../../lib/session';

const SUPERADMIN = process.env.SUPERADMIN_EMAIL ?? 'dnlortega@gmail.com';

async function read(): Promise<boolean> {
  try {
    const row = await prisma.configuracoes.findUnique({ where: { chave: 'demo_mode' } });
    return row?.valor === 'true';
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const enabled = await read();
  return NextResponse.json({ enabled });
}

export async function POST() {
  const session = await getSession();
  if (session?.user?.email !== SUPERADMIN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const current = await read();
  const next = !current;

  await prisma.configuracoes.upsert({
    where:  { chave: 'demo_mode' },
    update: { valor: String(next) },
    create: { chave: 'demo_mode', valor: String(next) },
  });

  return NextResponse.json({ enabled: next });
}
