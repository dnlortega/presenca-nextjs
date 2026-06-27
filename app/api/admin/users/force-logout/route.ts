import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { jsonResponse } from '../../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../../lib/session';
import { audit } from '../../../../../lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await req.json() as { userId: number };
        if (!userId || typeof userId !== 'number') {
            return jsonResponse({ error: 'userId inválido' }, { status: 400 });
        }

        const target = await prisma.usuarios.findUnique({
            where: { id: userId },
            select: { id: true, role: true, username: true }
        });

        if (!target) {
            return jsonResponse({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        if (target.role === 'admin') {
            return jsonResponse({ error: 'Não é possível encerrar sessão de outro administrador' }, { status: 403 });
        }

        await prisma.usuarios.update({
            where: { id: userId },
            data: { force_logout: true }
        });

        await audit({
            usuario_id: session?.user?.id,
            action: 'FORCE_LOGOUT',
            entity: 'usuarios',
            entity_id: userId,
            details: `Sessão encerrada pelo admin para o usuário ${target.username}`
        });

        return jsonResponse({ ok: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
