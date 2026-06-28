// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { jsonResponse } from '../../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../../lib/session';
import { audit } from '../../../../../lib/audit';
import { companySchema } from '../../../../../lib/schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const companyId = Number(id);
        if (isNaN(companyId) || companyId <= 0) return jsonResponse({ error: 'ID inválido' }, { status: 400 });

        const parsed = companySchema.safeParse(await req.json());
        if (!parsed.success) return jsonResponse({ error: parsed.error.issues[0].message }, { status: 400 });

        const { nome } = parsed.data;
        const adminId = session?.user?.id ? Number(session.user.id) : null;
        const company = await prisma.empresas.update({
            where: { id: companyId },
            data: { nome }
        });

        await audit({ usuario_id: adminId, action: 'UPDATE', entity: 'empresas', entity_id: companyId, details: nome });
        return jsonResponse(company);
    } catch (err: any) {
        console.error(err);
        if (err.code === 'P2002') {
            return jsonResponse({ error: 'Empresa já existe' }, { status: 400 });
        }
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const companyId = Number(id);
        if (isNaN(companyId) || companyId <= 0) return jsonResponse({ error: 'ID inválido' }, { status: 400 });

        const adminId = session?.user?.id ? Number(session.user.id) : null;
        await prisma.empresas.delete({ where: { id: companyId } });

        await audit({ usuario_id: adminId, action: 'DELETE', entity: 'empresas', entity_id: companyId });
        return jsonResponse({ success: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
