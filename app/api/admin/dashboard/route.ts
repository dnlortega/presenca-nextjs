import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getSaoPauloDateRange } from '../../../../lib/timezone';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

        const { start: startToday, end: endToday } = getSaoPauloDateRange();

        const sevenDaysAgo = new Date(startToday);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const [totalCount, weekPresences, dailyCounts, recentRaw, totalEmployees] = await Promise.all([
            prisma.presenca.count({
                where: { data_hora: { gte: startToday, lt: endToday } }
            }),
            prisma.presenca.findMany({
                where: { data_hora: { gte: sevenDaysAgo, lt: endToday } },
                select: { data_hora: true }
            }),
            prisma.presenca.findMany({
                where: { data_hora: { gte: startToday, lt: endToday } },
                include: { funcionario: { include: { setor: true, empresa: true } } }
            }),
            prisma.presenca.findMany({
                take: 5,
                orderBy: { id: 'desc' },
                include: { funcionario: { include: { setor: true, empresa: true } } }
            }),
            prisma.funcionarios.count()
        ]);

        // Sector stats for today
        const statsMap = new Map<string, { setor: string; empresa: string; count: number }>();
        for (const p of dailyCounts) {
            const key = `${p.funcionario.empresa.nome}-${p.funcionario.setor.nome}`;
            if (!statsMap.has(key)) {
                statsMap.set(key, { setor: p.funcionario.setor.nome, empresa: p.funcionario.empresa.nome, count: 0 });
            }
            statsMap.get(key)!.count++;
        }
        const sectorStats = Array.from(statsMap.values()).sort((a, b) => b.count - a.count);

        // Company distribution for today
        const companyMap = new Map<string, number>();
        for (const p of dailyCounts) {
            const name = p.funcionario.empresa.nome;
            companyMap.set(name, (companyMap.get(name) || 0) + 1);
        }
        const companyDistribution = Array.from(companyMap.entries()).map(([name, value]) => ({ name, value }));

        // Weekly trend (last 7 days)
        const trendBuckets: { date: string; label: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(startToday);
            d.setDate(d.getDate() - i);
            trendBuckets.push({
                date: d.toISOString().split('T')[0],
                label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
                count: 0,
            });
        }
        for (const p of weekPresences) {
            const key = new Date(p.data_hora).toISOString().split('T')[0];
            const bucket = trendBuckets.find(b => b.date === key);
            if (bucket) bucket.count++;
        }
        const weeklyTrend = trendBuckets.map(({ label, count }) => ({ date: label, count }));

        const recentActivities = recentRaw.map(p => ({
            id: p.id,
            funcionario: p.funcionario.nome,
            setor: p.funcionario.setor.nome,
            empresa: p.funcionario.empresa.nome,
            data_hora: p.data_hora,
        }));

        return jsonResponse({
            totalToday: totalCount,
            totalEmployees,
            sectorsActive: sectorStats.length,
            sectorStats,
            companyDistribution,
            weeklyTrend,
            recentActivities,
        });

    } catch (err) {
        console.error('Dashboard API Error:', err);
        return jsonResponse({ error: 'Erro ao carregar dados do dashboard' }, { status: 500 });
    }
}
