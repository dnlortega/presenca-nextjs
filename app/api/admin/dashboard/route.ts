import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper for Sao Paulo date (same as in attendance route)
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
        const totalToday = await prisma.presenca.count({
            where: {
                data_hora: {
                    gte: startToday,
                    lt: endToday,
                },
            },
        });

        // 2. Active Sectors Today
        // Prisma doesn't support distinct count directly on a column easily with count(), 
        // so we group by or fetch distinct.
        const sectors = await prisma.presenca.findMany({
            where: {
                data_hora: {
                    gte: startToday,
                    lt: endToday,
                },
            },
            select: {
                setor: true,
            },
            distinct: ['setor'],
        });
        const sectorsActive = sectors.length;

        // 3. Weekly Trend (Last 7 days)
        // We'll generate the last 7 days and query counts for each.
        const trend = [];
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayRef);
            d.setDate(d.getDate() - i);
            const { start, end } = getDayRange(d);

            const count = await prisma.presenca.count({
                where: {
                    data_hora: {
                        gte: start,
                        lt: end,
                    },
                },
            });

            trend.push({
                date: days[d.getUTCDay()],
                present: count,
                absent: 0, // We don't track absent yet in this simple model
            });
        }

        return NextResponse.json({
            totalToday,
            sectorsActive,
            trend,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
