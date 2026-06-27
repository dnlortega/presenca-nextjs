import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { jsonResponse } from '../../../lib/api-helpers';
import { getSession } from '../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const companyName = url.searchParams.get('company');

        if (!companyName) {
            return jsonResponse({ error: 'Company is required' }, { status: 400 });
        }

        const userId = session.user?.id;

        // 1. Validate user has access to this company
        let allowedCompanyNames: string[] = [];
        if (session.user?.role === 'admin') {
            const all = await prisma.empresas.findMany();
            allowedCompanyNames = all.map(c => c.nome);
        } else {
            const mappings = await prisma.usuario_empresas.findMany({
                where: { usuario_id: Number(userId) },
                include: { empresa: true }
            });
            allowedCompanyNames = mappings.map(m => m.empresa.nome);
        }

        if (!allowedCompanyNames.includes(companyName)) {
            return jsonResponse({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Find the company by name
        const company = await prisma.empresas.findFirst({
            where: { nome: companyName }
        });

        if (!company) {
            return jsonResponse({ error: 'Company not found' }, { status: 404 });
        }

        // 3. Get all sectors for this company
        const sectors = await prisma.setores.findMany({
            where: {
                empresa_id: company.id,
                status: 'ativo'
            },
            orderBy: { nome: 'asc' }
        });

        return jsonResponse(sectors.map(s => s.nome));
    } catch (err) {
        console.error('Error in /api/sectors:', err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
