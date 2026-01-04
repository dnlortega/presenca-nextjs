import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sectors = await prisma.setores.findMany({
            include: { empresa: true },
            orderBy: { nome: 'asc' }
        });

        return NextResponse.json(sectors);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nome, empresa_id } = await req.json();

        if (!nome || !empresa_id) {
            return NextResponse.json({ error: 'Nome e Empresa são obrigatórios' }, { status: 400 });
        }

        const sector = await prisma.setores.create({
            data: {
                nome,
                empresa_id: Number(empresa_id)
            }
        });

        return NextResponse.json(sector);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
