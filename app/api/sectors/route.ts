import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const company = url.searchParams.get('company');

        if (!company) {
            return NextResponse.json({ error: 'Company is required' }, { status: 400 });
        }

        const sectors = await prisma.$queryRawUnsafe<any[]>(
            'SELECT DISTINCT "setor" FROM "funcionarios" WHERE "empresa" = $1 ORDER BY "setor" ASC',
            company
        );

        return NextResponse.json(sectors.map(s => s.setor));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
