const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting admin user...');

    const adminPassword = 'Admin#1234';
    const adminHash = bcrypt.hashSync(adminPassword, 10);

    const admin = await prisma.usuarios.upsert({
        where: { username: 'admin' },
        update: {
            email: 'admin@presenca.pro',
            password_hash: adminHash,
            role: 'admin',
            updated_at: new Date()
        },
        create: {
            username: 'admin',
            email: 'admin@presenca.pro',
            password_hash: adminHash,
            role: 'admin',
            can_register: true,
            can_edit: true,
            created_at: new Date(),
            updated_at: new Date()
        }
    });

    console.log('Admin user reset successfully.');
    console.log('Username: admin');
    console.log('Password: ' + adminPassword);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
