// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
        const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
        const skip = (page - 1) * limit;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const empresaFilter = searchParams.get('empresa');
        const setorFilter = searchParams.get('setor');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (startDate || endDate) {
            where.data_hora = {};
            if (startDate) where.data_hora.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1);
                where.data_hora.lt = end;
            }
        }

        if (empresaFilter || setorFilter) {
            where.funcionario = {};
            if (empresaFilter) {
                where.funcionario.empresa = { nome: { contains: empresaFilter, mode: 'insensitive' } };
            }
            if (setorFilter) {
                where.funcionario.setor = { nome: { contains: setorFilter, mode: 'insensitive' } };
            }
        }

        const [total, records] = await Promise.all([
            prisma.presenca.count({ where }),
            prisma.presenca.findMany({
                where,
                orderBy: { id: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    data_hora: true,
                    funcionario: {
                        select: {
                            nome: true,
                            setor: { select: { nome: true } },
                            empresa: { select: { nome: true } }
                        }
                    }
                }
            })
        ]);

        const formatted = records.map(r => ({
            id: r.id,
            data_hora: r.data_hora,
            funcionario: r.funcionario.nome,
            setor: r.funcionario.setor.nome,
            empresa: r.funcionario.empresa.nome
        }));

        return jsonResponse({ data: formatted, total, page, limit });
    } catch (err) {
        console.error(err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
