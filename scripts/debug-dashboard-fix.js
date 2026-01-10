const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getSaoPauloDateRange() {
    const now = new Date();
    // Get date parts for Sao Paulo timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    // Format is MM/DD/YYYY
    const [{ value: month }, , { value: day }, , { value: year }] = formatter.formatToParts(now);

    console.log(`Debug SP Parts: Month=${month} Day=${day} Year=${year}`);

    // Create UTC date for 00:00:00 of that day
    const start = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
}

async function debug() {
    console.log('--- Debugging Date Query Logic ---');
    console.log('Current System Time:', new Date().toString());

    const { start, end } = getSaoPauloDateRange();
    console.log('calculated Start (UTC):', start.toISOString());
    console.log('calculated End (UTC):', end.toISOString());

    try {
        const count = await prisma.presenca.count({
            where: {
                data_hora: {
                    gte: start,
                    lt: end
                }
            }
        });
        console.log(`Found ${count} records for this range.`);

        // Also check if there are ANY records recently to verify DB isn't empty
        const last = await prisma.presenca.findFirst({
            orderBy: { id: 'desc' }
        });
        console.log('Last record in DB:', last ? JSON.stringify(last) : 'None');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
