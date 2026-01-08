import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { jsonResponse } from '../../../../lib/api-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSaoPauloDate() {
    const now = new Date();
    // For simple daily matching without TZ libs, we can just use the server time if configured correctly,
    // or assume the input dates from frontend are adjusted.
    // For now, let's just use standard new Date() and we can refine TZ later if needed.
    return now;
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
        const [totalCount, activeSectorsRaw, dailyCounts, recentRaw] = await Promise.all([
            // 1. Total Today
            prisma.presenca.count({
                where: {
                    data_hora: {
                        gte: startToday,
                        lt: endToday
                    }
                }
            }),

            // 2. Active Sectors Today
            prisma.presenca.groupBy({
                by: ['funcionario_id'],
                where: {
                    data_hora: {
                        gte: startToday,
                        lt: endToday
                    }
                },
                _count: {
                    _all: true
                }
            }).then(async (grouped) => {
                // Since prisma groupBy doesn't support joining easily to get names in one go for non-aggregate fields in some versions,
                // and to avoid complexity, we can fetch details.
                // Actually, a better approach without raw query for this aggregation is hard in simple prisma.
                // Let's stick to a simpler approach: Get all presences today include relations and aggregate in JS
                // or keep raw query if it works. But we want to remove raw queries.

                // Let's fetch all presences today with relations
                const presences = await prisma.presenca.findMany({
                    where: {
                        data_hora: {
                            gte: startToday,
                            lt: endToday
                        }
                    },
                    include: {
                        funcionario: {
                            include: {
                                setor: true,
                                empresa: true
                            }
                        }
                    }
                });

                // Aggregate in JS
                const statsMap = new Map<string, { setor: string, empresa: string, count: number }>();

                for (const p of presences) {
                    const key = `${p.funcionario.empresa.nome}-${p.funcionario.setor.nome}`;
                    if (!statsMap.has(key)) {
                        statsMap.set(key, {
                            setor: p.funcionario.setor.nome,
                            empresa: p.funcionario.empresa.nome,
                            count: 0
                        });
                    }
                    statsMap.get(key)!.count++;
                }

                return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
            }),

            // 3. Weekly Trend
            prisma.presenca.groupBy({
                by: ['data_hora'],
                where: {
                    data_hora: {
                        gte: startSevenDaysAgo,
                        lt: endToday
                    }
                },
                _count: {
                    _all: true
                }
            }),

            // 4. Recent Activity
            prisma.presenca.findMany({
                take: 5,
                orderBy: { id: 'desc' },
                include: {
                    funcionario: {
                        include: {
                            setor: true,
                            empresa: true
                        }
                    }
                }
            })
        ]);

        const totalToday = totalCount;
        const sectorStats = activeSectorsRaw || []; // It is the result of the .then block
        const sectorsActive = sectorStats.length;

        // Process trend data
        const trend = [];
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayRef);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // Filter dailyCounts for this day
            // Note: DB timestamp might include time, so strictly grouping by data_hora in Prisma might split by second.
            // We need to aggregate the JS result properly if we didn't use raw query date truncation.
            // Since we used groupBy data_hora which includes time, we have many groups. We need to sum them up per day.

            // Re-aggregate dailyCounts (which is actually all records grouped by exact timestamp)
            // Wait, groupBy data_hora is bad if times are different. 
            // Better to fetch all records in range and map in JS for safety without raw SQL date functions.
            const countForDay = (dailyCounts as any[]).filter(c => {
                const cDate = new Date(c.data_hora).toISOString().split('T')[0];
                return cDate === dateStr;
            }).reduce((acc, curr) => acc + curr._count._all, 0);

            trend.push({
                date: days[d.getUTCDay()],
                present: countForDay,
                absent: 0,
            });
        }

        const recentActivities = recentRaw.map(p => ({
            id: p.id,
            funcionario: p.funcionario.nome,
            setor: p.funcionario.setor.nome,
            empresa: p.funcionario.empresa.nome,
            data_hora: p.data_hora
        }));

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
