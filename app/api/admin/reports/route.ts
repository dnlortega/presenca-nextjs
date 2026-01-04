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

        const reports = await prisma.presenca.findMany({
            orderBy: { id: 'desc' },
            include: {
                funcionario: {
                    include: {
                        setor: true,
                        empresa: true
                    }
                }
            }
        });

        const formatted = reports.map(r => ({
            id: r.id,
            data_hora: r.data_hora,
            funcionario: r.funcionario.nome,
            setor: r.funcionario.setor.nome,
            empresa: r.funcionario.empresa.nome
        }));

        return NextResponse.json(formatted);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
