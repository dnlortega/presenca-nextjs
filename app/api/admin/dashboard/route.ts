// github.com/dnlortega
// linkedin.com/in/daniel-op
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

        const thirtyDaysAgo = new Date(startToday);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

        const sevenDaysAgo = new Date(startToday);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const [
            totalCount,
            weekPresences,
            dailyCounts,
            recentRaw,
            totalEmployees,
            monthPresences,
            allEmployees,
        ] = await Promise.all([
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
            prisma.funcionarios.count(),
            prisma.presenca.findMany({
                where: { data_hora: { gte: thirtyDaysAgo, lt: endToday } },
                include: { funcionario: { include: { empresa: true, setor: true } } }
            }),
            prisma.funcionarios.findMany({
                select: { id: true, nome: true, empresa: { select: { nome: true } }, setor: { select: { nome: true } } }
            }),
        ]);

        // --- Today stats ---
        const statsMap = new Map<string, { setor: string; empresa: string; count: number }>();
        for (const p of dailyCounts) {
            const key = `${p.funcionario.empresa.nome}-${p.funcionario.setor.nome}`;
            if (!statsMap.has(key)) {
                statsMap.set(key, { setor: p.funcionario.setor.nome, empresa: p.funcionario.empresa.nome, count: 0 });
            }
            statsMap.get(key)!.count++;
        }
        const sectorStats = Array.from(statsMap.values()).sort((a, b) => b.count - a.count);

        const companyMap = new Map<string, number>();
        for (const p of dailyCounts) {
            const name = p.funcionario.empresa.nome;
            companyMap.set(name, (companyMap.get(name) || 0) + 1);
        }
        const companyDistribution = Array.from(companyMap.entries()).map(([name, value]) => ({ name, value }));

        // --- Hourly distribution today ---
        const hourMap = new Map<number, number>();
        for (const p of dailyCounts) {
            const h = new Date(p.data_hora).getHours();
            hourMap.set(h, (hourMap.get(h) || 0) + 1);
        }
        const hourlyDistribution = Array.from({ length: 24 }, (_, h) => ({
            hour: `${String(h).padStart(2, '0')}h`,
            count: hourMap.get(h) || 0,
        })).filter((_, h) => h >= 6 && h <= 22);

        // --- 7-day weekly trend ---
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

        // --- 30-day company bar chart ---
        const companyMonthMap = new Map<string, number>();
        for (const p of monthPresences) {
            const name = p.funcionario.empresa.nome;
            companyMonthMap.set(name, (companyMonthMap.get(name) || 0) + 1);
        }
        const companyMonthly = Array.from(companyMonthMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // --- 30-day sector donut ---
        const sectorMonthMap = new Map<string, number>();
        for (const p of monthPresences) {
            const name = p.funcionario.setor.nome;
            sectorMonthMap.set(name, (sectorMonthMap.get(name) || 0) + 1);
        }
        const sectorDonut = Array.from(sectorMonthMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        // --- 30-day heat map (daily counts) ---
        const heatMap = new Map<string, number>();
        for (const p of monthPresences) {
            const key = new Date(p.data_hora).toISOString().split('T')[0];
            heatMap.set(key, (heatMap.get(key) || 0) + 1);
        }
        const heatmapData: { date: string; count: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(startToday);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            heatmapData.push({ date: key, count: heatMap.get(key) || 0 });
        }

        // --- Top 5 with fewest presences in 30 days ---
        const employeePresenceCount = new Map<number, number>();
        for (const p of monthPresences) {
            const id = p.funcionario.id;
            employeePresenceCount.set(id, (employeePresenceCount.get(id) || 0) + 1);
        }
        const topAbsent = allEmployees
            .map(e => ({
                id: e.id,
                nome: e.nome,
                empresa: e.empresa.nome,
                setor: e.setor.nome,
                presencas: employeePresenceCount.get(e.id) || 0,
            }))
            .sort((a, b) => a.presencas - b.presencas)
            .slice(0, 5);

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
            companyMonthly,
            sectorDonut,
            heatmapData,
            hourlyDistribution,
            topAbsent,
        });

    } catch (err) {
        console.error('Dashboard API Error:', err);
        return jsonResponse({ error: 'Erro ao carregar dados do dashboard' }, { status: 500 });
    }
}
