// github.com/dnlortega
// linkedin.com/in/daniel-op
import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../lib/session';
import { Prisma } from '@prisma/client';

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
        const actionFilter = searchParams.get('action') ?? '';
        const userFilter = searchParams.get('user') ?? '';
        const startDate = searchParams.get('startDate') ?? '';
        const endDate = searchParams.get('endDate') ?? '';

        const where: Prisma.audit_logWhereInput = {};
        if (actionFilter) where.action = actionFilter;
        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) (where.created_at as Prisma.DateTimeFilter).gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                (where.created_at as Prisma.DateTimeFilter).lte = end;
            }
        }

        // Filter by username requires joining through usuarios
        let userIdFilter: number[] | null = null;
        if (userFilter) {
            const matchedUsers = await prisma.usuarios.findMany({
                where: { username: { contains: userFilter, mode: 'insensitive' } },
                select: { id: true },
            });
            userIdFilter = matchedUsers.map(u => u.id);
            if (userIdFilter.length === 0) {
                return jsonResponse({ data: [], total: 0, page, limit });
            }
            where.usuario_id = { in: userIdFilter };
        }

        const [total, logs] = await Promise.all([
            prisma.audit_log.count({ where }),
            prisma.audit_log.findMany({ where, orderBy: { id: 'desc' }, skip, take: limit })
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

export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const logId = Number(id);
            if (isNaN(logId) || logId <= 0) return jsonResponse({ error: 'ID inválido' }, { status: 400 });
            await prisma.audit_log.delete({ where: { id: logId } });
            return jsonResponse({ success: true, deleted: 1 });
        }

        const { count } = await prisma.audit_log.deleteMany({});
        return jsonResponse({ success: true, deleted: count });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
