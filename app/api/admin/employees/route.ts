// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getSession, isAdmin } from '../../../../lib/session';
import { jsonResponse } from '../../../../lib/api-helpers';
import { employeeSchema } from '../../../../lib/schemas';
import { audit } from '../../../../lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const employees = await prisma.funcionarios.findMany({
            include: {
                empresa: true,
                setor: true
            },
            orderBy: { nome: 'asc' }
        });

        // Remap to include names for the frontend
        const formatted = employees.map(e => ({
            id: e.id,
            nome: e.nome,
            valor: e.valor ? Number(e.valor) : null,
            empresa_id: e.empresa_id,
            setor_id: e.setor_id,
            empresa: e.empresa?.nome || null,
            setor: e.setor?.nome || null
        }));

        return jsonResponse(formatted);
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const parsed = employeeSchema.safeParse(await req.json());
        if (!parsed.success) {
            return jsonResponse({ error: parsed.error.issues[0].message }, { status: 400 });
        }
        const { nome, empresa_id, setor_id, valor } = parsed.data;
        const adminId = session?.user?.id ? Number(session.user.id) : null;

        const created = await prisma.funcionarios.create({
            data: { nome, empresa_id, setor_id, valor: valor ?? null }
        });

        await audit({ usuario_id: adminId, action: 'CREATE', entity: 'funcionarios', entity_id: created.id, details: nome });
        return jsonResponse({ success: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
