import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

        const user = session.user;
        const { id } = await params;
        const employeeId = Number(id);
        const body = await req.json();
        const { nome } = body;

        if (!nome || typeof nome !== 'string' || nome.trim() === '') {
            return jsonResponse({ error: 'Nome inválido' }, { status: 400 });
        }

        const userIsAdmin = isAdmin(session);
        const isEducator = user.role === 'educador';

        if (!userIsAdmin && !(isEducator && user.can_edit)) {
            return jsonResponse({ error: 'Permissão negada para editar funcionários' }, { status: 403 });
        }

        if (!userIsAdmin) {
            const employee = await prisma.funcionarios.findUnique({
                where: { id: employeeId },
                select: { empresa_id: true }
            });

            if (!employee) return jsonResponse({ error: 'Funcionário não encontrado' }, { status: 404 });

            const mapping = await prisma.usuario_empresas.findFirst({
                where: {
                    usuario_id: Number(user.id),
                    empresa_id: employee.empresa_id
                }
            });

            if (!mapping) {
                return jsonResponse({ error: 'Você não tem acesso a esta empresa' }, { status: 403 });
            }
        }

        const updated = await prisma.funcionarios.update({
            where: { id: employeeId },
            data: { nome: nome.trim() }
        });

        return jsonResponse(updated);

    } catch (err) {
        console.error('Error updating employee:', err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
