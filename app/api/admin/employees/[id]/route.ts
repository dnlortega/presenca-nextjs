import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { nome, empresa_id, setor_id, valor } = await req.json();

        await prisma.funcionarios.update({
            where: { id: Number(id) },
            data: {
                nome,
                empresa_id: Number(empresa_id),
                setor_id: Number(setor_id),
                valor: valor ? Number(valor) : null
            }
        });

        return jsonResponse({ success: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await prisma.funcionarios.delete({
            where: { id: Number(id) }
        });

        return jsonResponse({ success: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
