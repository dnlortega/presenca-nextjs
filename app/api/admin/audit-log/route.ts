import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
        const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
        const skip = (page - 1) * limit;

        const [total, logs] = await Promise.all([
            prisma.audit_log.count(),
            prisma.audit_log.findMany({
                orderBy: { id: 'desc' },
                skip,
                take: limit,
            })
        ]);

        const userIds = [...new Set(logs.filter(l => l.usuario_id).map(l => l.usuario_id!))];
        const users = userIds.length > 0
            ? await prisma.usuarios.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true } })
            : [];
        const userMap = new Map(users.map(u => [u.id, u.username]));

        const formatted = logs.map(l => ({
            id: l.id,
            username: l.usuario_id ? (userMap.get(l.usuario_id) ?? 'Usuário removido') : 'Sistema',
            action: l.action,
            entity: l.entity,
            entity_id: l.entity_id,
            details: l.details,
            created_at: l.created_at,
        }));

        return jsonResponse({ data: formatted, total, page, limit });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
