import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../lib/session';
import { companySchema } from '../../../../lib/schemas';
import { audit } from '../../../../lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const companies = await prisma.empresas.findMany({
            orderBy: { nome: 'asc' }
        });
        return jsonResponse(companies);
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

        const parsed = companySchema.safeParse(await req.json());
        if (!parsed.success) {
            return jsonResponse({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const adminId = session?.user?.id ? Number(session.user.id) : null;
        const company = await prisma.empresas.create({
            data: { nome: parsed.data.nome }
        });

        await audit({ usuario_id: adminId, action: 'CREATE', entity: 'empresas', entity_id: company.id, details: company.nome });
        return jsonResponse(company);
    } catch (err: any) {
        console.error(err);
        if (err.code === 'P2002') {
            return jsonResponse({ error: 'Empresa já cadastrada' }, { status: 400 });
        }
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
