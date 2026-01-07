import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
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
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nome } = await req.json();
        
        if (!nome) {
            return jsonResponse({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const company = await prisma.empresas.create({
            data: { nome }
        });

        return jsonResponse(company);
    } catch (err: any) {
        console.error(err);
        if (err.code === 'P2002') {
            return jsonResponse({ error: 'Empresa já cadastrada' }, { status: 400 });
        }
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
