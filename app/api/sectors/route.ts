import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const companyName = url.searchParams.get('company');

        if (!companyName) {
            return NextResponse.json({ error: 'Company is required' }, { status: 400 });
        }

        const s: any = session;
        const userId = s.user?.id;

        // 1. Validate user has access to this company
        let allowedCompanyNames: string[] = [];
        if (s.user?.role === 'admin') {
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
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Find the company by name
        const company = await prisma.empresas.findFirst({
            where: { nome: companyName }
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // 3. Get all sectors for this company
        const sectors = await prisma.setores.findMany({
            where: {
                empresa_id: company.id,
                status: 'ativo'
            },
            orderBy: { nome: 'asc' }
        });

        return NextResponse.json(sectors.map(s => s.nome));
    } catch (err) {
        console.error('Error in /api/sectors:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
