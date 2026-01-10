const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompanies() {
    try {
        const count = await prisma.empresas.count();
        console.log(`Total companies: ${count}`);
        const companies = await prisma.empresas.findMany({
            include: { _count: { select: { setores: true } } }
        });
        console.log('Companies:', JSON.stringify(companies, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCompanies();
