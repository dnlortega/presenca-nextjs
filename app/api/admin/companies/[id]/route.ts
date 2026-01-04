import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nome } = await req.json();
        const id = parseInt(params.id);

        if (!nome) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const company = await prisma.empresas.update({
            where: { id },
            data: { nome }
        });

        return NextResponse.json(company);
    } catch (err: any) {
        console.error(err);
        if (err.code === 'P2002') {
            return NextResponse.json({ error: 'Empresa já existe' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt(params.id);

        await prisma.empresas.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
