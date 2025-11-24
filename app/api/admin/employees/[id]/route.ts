import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const id = parseInt(params.id);
        const body = await req.json();
        const { nome, empresa, setor } = body;

        const updated = await prisma.funcionarios.update({
            where: { id },
            data: { nome, empresa, setor },
        });

        return NextResponse.json(updated);
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const id = parseInt(params.id);

        await prisma.funcionarios.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
