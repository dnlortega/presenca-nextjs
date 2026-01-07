import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { nome } = await req.json();
        const companyId = parseInt(id);

        if (!nome) {
            return jsonResponse({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const company = await prisma.empresas.update({
            where: { id: companyId },
            data: { nome }
        });

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
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const companyId = parseInt(id);

        await prisma.empresas.delete({
            where: { id: companyId }
        });

        return jsonResponse({ success: true });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
