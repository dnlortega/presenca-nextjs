import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { jsonResponse } from '../../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../../lib/session';
import { audit } from '../../../../../lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { nome, empresa_id, setor_id, valor } = await req.json();
        const adminId = session?.user?.id ? Number(session.user.id) : null;

        await prisma.funcionarios.update({
            where: { id: Number(id) },
            data: {
                nome,
                empresa_id: Number(empresa_id),
                setor_id: Number(setor_id),
                valor: valor ? Number(valor) : null
            }
        });

        await audit({ usuario_id: adminId, action: 'UPDATE', entity: 'funcionarios', entity_id: Number(id), details: nome });
        return jsonResponse({ success: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const adminId = session?.user?.id ? Number(session.user.id) : null;
        await prisma.funcionarios.delete({
            where: { id: Number(id) }
        });

        await audit({ usuario_id: adminId, action: 'DELETE', entity: 'funcionarios', entity_id: Number(id) });
        return jsonResponse({ success: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
