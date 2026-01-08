import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const sectors = await prisma.setores.findMany({
            include: { empresa: true },
            orderBy: { nome: 'asc' }
        });

        return jsonResponse(sectors);
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

        const body = await req.json();
        const { empresa_id } = body;

        if (!empresa_id) {
            return jsonResponse({ error: 'Empresa é obrigatória' }, { status: 400 });
        }

        // Check for bulk creation first
        if (body.nomes && Array.isArray(body.nomes)) {
            const nomes: string[] = body.nomes.map((n: string) => n.trim()).filter((n: string) => n.length > 0);
            
            if (nomes.length === 0) {
                return jsonResponse({ error: 'Nenhum nome de setor válido fornecido' }, { status: 400 });
            }

            // Find existing sectors to avoid duplicates
            const existingSectors = await prisma.setores.findMany({
                where: {
                    empresa_id: Number(empresa_id),
                    nome: { in: nomes }
                },
                select: { nome: true }
            });

            const existingNames = new Set(existingSectors.map(s => s.nome.toLowerCase()));
            const newNomes = nomes.filter(n => !existingNames.has(n.toLowerCase()));

            // Remove duplicates within the new list itself
            const uniqueNewNomes = Array.from(new Set(newNomes));

            if (uniqueNewNomes.length > 0) {
                await prisma.setores.createMany({
                    data: uniqueNewNomes.map(nome => ({
                        nome,
                        empresa_id: Number(empresa_id)
                    }))
                });
            }

            return jsonResponse({ 
                created: uniqueNewNomes.length, 
                duplicates: nomes.length - uniqueNewNomes.length,
                message: `${uniqueNewNomes.length} setores criados, ${nomes.length - uniqueNewNomes.length} ignorados.`
            });
        }

        // Legacy single creation
        const { nome } = body;
        if (!nome) {
            return jsonResponse({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const sector = await prisma.setores.create({
            data: {
                nome,
                empresa_id: Number(empresa_id)
            }
        });

        return jsonResponse(sector);
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
