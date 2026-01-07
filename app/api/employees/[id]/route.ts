import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

        const s: any = session;
        const user = s.user;
        const { id } = await params;
        const employeeId = Number(id);
        const body = await req.json();
        const { nome } = body;

        if (!nome || typeof nome !== 'string' || nome.trim() === '') {
            return jsonResponse({ error: 'Nome inválido' }, { status: 400 });
        }

        // Permission Check: Admin OR (Educator + can_edit)
        const isAdmin = user.role === 'admin';
        const isEducator = user.role === 'educador';
        const canEdit = user.can_edit;

        if (!isAdmin && !(isEducator && canEdit)) {
            return jsonResponse({ error: 'Permissão negada para editar funcionários' }, { status: 403 });
        }

        // Additional Security: If educator, verify they have access to this employee's company
        if (!isAdmin) {
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
