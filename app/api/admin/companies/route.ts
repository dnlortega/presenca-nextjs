import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companies = await prisma.empresas.findMany({
            orderBy: { nome: 'asc' }
        });
        return NextResponse.json(companies);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nome } = await req.json();
        
        if (!nome) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const company = await prisma.empresas.create({
            data: { nome }
        });

        return NextResponse.json(company);
    } catch (err: any) {
        console.error(err);
        if (err.code === 'P2002') {
            return NextResponse.json({ error: 'Empresa já cadastrada' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
