const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting cleanup...');

    // 1. Delete all presences (attendance records)
    console.log('Deleting attendance records...');
    await prisma.presenca.deleteMany({});

    // 2. Delete all employees
    console.log('Deleting employees...');
    await prisma.funcionarios.deleteMany({});

    // 3. Delete all sectors
    console.log('Deleting sectors...');
    await prisma.setores.deleteMany({});

    // 4. Delete all user_company associations
    console.log('Deleting user-company associations...');
    await prisma.usuario_empresas.deleteMany({});

    // 5. Delete all companies
    console.log('Deleting companies...');
    await prisma.empresas.deleteMany({});

    // 6. Delete users except 'admin' and 'educador'
    console.log('Deleting users (except admin and educador)...');
    await prisma.usuarios.deleteMany({
        where: {
            username: {
                notIn: ['admin', 'educador', 'educator'] // Added 'educator' just in case
            }
        }
    });

    console.log('✅ Cleanup finished successfully.');
}

main()
    .catch((e) => {
        console.error('Error during cleanup:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
