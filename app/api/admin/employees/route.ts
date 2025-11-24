import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const employees = await prisma.funcionarios.findMany({
            orderBy: { nome: 'asc' },
        });

        return NextResponse.json(employees);
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { nome, empresa, setor } = body;

        if (!nome || !empresa || !setor) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const created = await prisma.funcionarios.create({
            data: { nome, empresa, setor },
        });

        return NextResponse.json(created);
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
