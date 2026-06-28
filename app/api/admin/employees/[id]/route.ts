// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { jsonResponse } from '../../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../../lib/session';
import { audit } from '../../../../../lib/audit';
import { employeeSchema } from '../../../../../lib/schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const empId = Number(id);
        if (isNaN(empId) || empId <= 0) return jsonResponse({ error: 'ID inválido' }, { status: 400 });

        const parsed = employeeSchema.safeParse(await req.json());
        if (!parsed.success) return jsonResponse({ error: parsed.error.issues[0].message }, { status: 400 });

        const { nome, empresa_id, setor_id, valor } = parsed.data;
        const adminId = session?.user?.id ? Number(session.user.id) : null;

        await prisma.funcionarios.update({
            where: { id: empId },
            data: { nome, empresa_id, setor_id, valor: valor ?? null }
        });

        await audit({ usuario_id: adminId, action: 'UPDATE', entity: 'funcionarios', entity_id: empId, details: nome });
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
        const empId = Number(id);
        if (isNaN(empId) || empId <= 0) return jsonResponse({ error: 'ID inválido' }, { status: 400 });

        const adminId = session?.user?.id ? Number(session.user.id) : null;
        await prisma.funcionarios.delete({ where: { id: empId } });

        await audit({ usuario_id: adminId, action: 'DELETE', entity: 'funcionarios', entity_id: empId });
        return jsonResponse({ success: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
