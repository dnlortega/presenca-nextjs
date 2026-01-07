import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { jsonResponse } from '../../../../lib/api-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSaoPauloDate() {
    const now = new Date();
    // Ajuste simples para garantir que trabalhamos com o dia correto de SP
    // O ideal seria usar date-fns-tz ou similar, mas manteremos simples por enquanto
    const offset = -3 * 60 * 60 * 1000;
    return new Date(now.getTime() + offset);
}

function getDayRange(date: Date) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

        const todayRef = getSaoPauloDate();
        const { start: startToday, end: endToday } = getDayRange(todayRef);

        // Define range for the last 7 days for trend analysis
        const sevenDaysAgo = new Date(todayRef);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const { start: startSevenDaysAgo } = getDayRange(sevenDaysAgo);

        // Parellelize all independent queries
        const [totalCounts, sectorStats, trendRaw, recentActivities] = await Promise.all([
            // 1. Total Today
            prisma.$queryRawUnsafe<any[]>(
                'SELECT COUNT(*)::int as count FROM "presenca" WHERE "data_hora" >= $1 AND "data_hora" < $2',
                startToday, endToday
            ),

            // 2. Active Sectors Today
            prisma.$queryRawUnsafe<any[]>(
                `SELECT s.nome as setor, e.nome as empresa, COUNT(*)::int as count 
                 FROM "presenca" p 
                 JOIN "funcionarios" f ON p."funcionario_id" = f.id 
                 JOIN "setores" s ON f."setor_id" = s.id 
                 JOIN "empresas" e ON f."empresa_id" = e.id 
                 WHERE p."data_hora" >= $1 AND p."data_hora" < $2 
                 GROUP BY s.nome, e.nome 
                 ORDER BY count DESC`,
                startToday, endToday
            ),

            // 3. Weekly Trend (Efficient aggregation)
            prisma.$queryRawUnsafe<any[]>(
                `SELECT TO_CHAR(data_hora, 'YYYY-MM-DD') as day, COUNT(*)::int as count
                 FROM "presenca"
                 WHERE "data_hora" >= $1 AND "data_hora" < $2
                 GROUP BY day
                 ORDER BY day ASC`,
                startSevenDaysAgo, endToday
            ),

            // 4. Recent Activity
            prisma.$queryRawUnsafe<any[]>(
                `SELECT p.id, f.nome as funcionario, s.nome as setor, e.nome as empresa, p.data_hora 
                 FROM "presenca" p 
                 JOIN "funcionarios" f ON p."funcionario_id" = f.id 
                 JOIN "setores" s ON f."setor_id" = s.id 
                 JOIN "empresas" e ON f."empresa_id" = e.id 
                 ORDER BY p.id DESC LIMIT 5`
            )
        ]);

        const totalToday = totalCounts[0]?.count || 0;
        const sectorsActive = sectorStats.length;

        // Process trend data to fill in missing days
        const trend = [];
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayRef);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0]; // Simple YYYY-MM-DD

            // Find count in aggregated data
            // Note: TO_CHAR in postgres returns string, comparisons should match
            const dayData = trendRaw.find((t: any) => t.day === dateStr);

            trend.push({
                date: days[d.getUTCDay()],
                present: dayData?.count || 0,
                absent: 0, // Placeholder
            });
        }

        return jsonResponse({
            totalToday,
            sectorsActive,
            sectorStats,
            trend,
            recentActivities
        });

    } catch (err) {
        console.error('Dashboard API Error:', err);
        return jsonResponse({
            error: 'Erro ao carregar dados do dashboard',
            details: err instanceof Error ? err.message : 'Erro desconhecido'
        }, { status: 500 });
    }
}
