import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSaoPauloDate() {
    const now = new Date();
    const offset = -3 * 60 * 60 * 1000;
    const localTime = new Date(now.getTime() + offset);
    const year = localTime.getUTCFullYear();
    const month = localTime.getUTCMonth();
    const day = localTime.getUTCDate();
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
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
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const todayRef = getSaoPauloDate();
        const { start: startToday, end: endToday } = getDayRange(todayRef);

        // 1. Total Today
        const totalCounts: any[] = await prisma.$queryRawUnsafe(
            'SELECT COUNT(*)::int as count FROM "presenca" WHERE "data_hora" >= $1 AND "data_hora" < $2',
            startToday, endToday
        );
        const totalToday = totalCounts[0]?.count || 0;

        // 2. Active Sectors Today with counts
        const sectorStats: any[] = await prisma.$queryRawUnsafe(
            'SELECT f."setor", f."empresa", COUNT(*)::int as count FROM "presenca" p JOIN "funcionarios" f ON p."funcionario_id" = f.id WHERE p."data_hora" >= $1 AND p."data_hora" < $2 GROUP BY f."setor", f."empresa" ORDER BY count DESC',
            startToday, endToday
        );
        const sectorsActive = sectorStats.length;

        // 3. Weekly Trend (Last 7 days)
        const trend = [];
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayRef);
            d.setDate(d.getDate() - i);
            const { start, end } = getDayRange(d);

            const counts: any[] = await prisma.$queryRawUnsafe(
                'SELECT COUNT(*)::int as count FROM "presenca" WHERE "data_hora" >= $1 AND "data_hora" < $2',
                start, end
            );

            trend.push({
                date: days[d.getUTCDay()],
                present: counts[0]?.count || 0,
                absent: 0,
            });
        }

        // 4. Recent Activity (Last 5 presence records)
        const recentActivities = await prisma.$queryRawUnsafe<any[]>(
            'SELECT p.id, f.nome as funcionario, f.setor, f.empresa, p.data_hora FROM "presenca" p JOIN "funcionarios" f ON p."funcionario_id" = f.id ORDER BY p.id DESC LIMIT 5'
        );

        return NextResponse.json({
            totalToday,
            sectorsActive,
            sectorStats,
            trend,
            recentActivities
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
