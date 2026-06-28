// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { jsonResponse } from '../../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../../lib/session';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const sectorId = Number(id);
        const { nome, empresa_id } = await req.json();

        const sector = await prisma.setores.update({
            where: { id: sectorId },
            data: {
                nome,
                empresa_id: Number(empresa_id)
            }
        });

        return jsonResponse(sector);
    } catch (err: any) {
        console.error(err);
        if (err.code === 'P2002') {
            return jsonResponse({ error: 'Já existe um setor com este nome nesta empresa.' }, { status: 400 });
        }
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
        const sectorId = Number(id);
        await prisma.setores.delete({ where: { id: sectorId } });

        return jsonResponse({ ok: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
