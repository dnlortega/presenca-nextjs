import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { role, empresas } = body;
        const userId = Number(id);

        if (role) {
            await prisma.$executeRawUnsafe(
                'UPDATE "usuarios" SET "role" = $1::"Role", "updated_at" = NOW() WHERE "id" = $2',
                role,
                userId
            );
        }

        if (Array.isArray(empresas)) {
            await prisma.$transaction([
                prisma.usuario_empresas.deleteMany({ where: { usuario_id: userId } }),
                prisma.usuario_empresas.createMany({
                    data: empresas.map((emp: string) => ({
                        usuario_id: userId,
                        empresa: emp
                    }))
                })
            ]);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Erro ao atualizar cargo:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
