import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const employees = await prisma.funcionarios.findMany({
            include: {
                empresa: true,
                setor: true
            },
            orderBy: { nome: 'asc' }
        });

        // Remap to include names for the frontend
        const formatted = employees.map(e => ({
            id: e.id,
            nome: e.nome,
            valor: e.valor ? Number(e.valor) : null,
            empresa_id: e.empresa_id,
            setor_id: e.setor_id,
            empresa: e.empresa?.nome || null,
            setor: e.setor?.nome || null
        }));

        return NextResponse.json(formatted);
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

        const { nome, empresa_id, setor_id, valor } = await req.json();

        if (!nome || !empresa_id || !setor_id) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
        }

        await prisma.funcionarios.create({
            data: {
                nome,
                empresa_id: Number(empresa_id),
                setor_id: Number(setor_id),
                valor: valor ? Number(valor) : null
            }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
