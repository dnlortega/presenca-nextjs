const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const username = 'admin';
    const password = 'Admin#1234';

    console.log(`Verifying login for user: '${username}' with password: '${password}'`);

    try {
        const users = await prisma.$queryRawUnsafe(
            'SELECT * FROM "usuarios" WHERE "username" = $1 LIMIT 1',
            username
        );

        if (users.length === 0) {
            console.log('User not found in database via raw query.');
            return;
        }

        const user = users[0];
        console.log('User found:', user.username, 'Role:', user.role);
        console.log('Hash length:', user.password_hash ? user.password_hash.length : 0);

        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            console.log('✅ Password Match! Login should work.');
        } else {
            console.log('❌ Password DOES NOT Match.');

            // Debug: generate new hash and compare
            const newHash = bcrypt.hashSync(password, 10);
            console.log('Test hash generation:', newHash);
            console.log('Stored hash:', user.password_hash);
        }

    } catch (error) {
        console.error('Error during verification:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
