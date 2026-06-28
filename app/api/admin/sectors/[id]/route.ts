// github.com/dnlortega
// linkedin.com/in/daniel-op
import prisma from '../../../../../lib/prisma';
import { jsonResponse } from '../../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../../lib/session';
import { audit } from '../../../../../lib/audit';
import { sectorSchema } from '../../../../../lib/schemas';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const sectorId = Number(id);
        if (isNaN(sectorId) || sectorId <= 0) return jsonResponse({ error: 'ID inválido' }, { status: 400 });

        const parsed = sectorSchema.safeParse(await req.json());
        if (!parsed.success) return jsonResponse({ error: parsed.error.issues[0].message }, { status: 400 });

        const { nome, empresa_id } = parsed.data;
        if (!nome) return jsonResponse({ error: 'Nome é obrigatório' }, { status: 400 });

        const adminId = session?.user?.id ? Number(session.user.id) : null;
        const sector = await prisma.setores.update({
            where: { id: sectorId },
            data: { nome, empresa_id },
        });

        await audit({ usuario_id: adminId, action: 'UPDATE', entity: 'setores', entity_id: sectorId, details: nome });
        return jsonResponse(sector);
    } catch (err: any) {
        console.error(err);
        if (err.code === 'P2002') return jsonResponse({ error: 'Já existe um setor com este nome nesta empresa.' }, { status: 400 });
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const sectorId = Number(id);
        if (isNaN(sectorId) || sectorId <= 0) return jsonResponse({ error: 'ID inválido' }, { status: 400 });

        const adminId = session?.user?.id ? Number(session.user.id) : null;
        await prisma.setores.delete({ where: { id: sectorId } });

        await audit({ usuario_id: adminId, action: 'DELETE', entity: 'setores', entity_id: sectorId });
        return jsonResponse({ ok: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
