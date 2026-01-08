import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔍 Verificando setores duplicados...\n');

        // Buscar todos os setores agrupados por empresa_id e nome
        const sectors = await prisma.setores.findMany({
            orderBy: [
                { empresa_id: 'asc' },
                { nome: 'asc' }
            ],
            include: {
                empresa: true
            }
        });

        // Agrupar por empresa_id + nome
        const grouped = new Map<string, typeof sectors>();

        for (const sector of sectors) {
            const key = `${sector.empresa_id}-${sector.nome}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(sector);
        }

        // Encontrar duplicados
        const duplicates = Array.from(grouped.entries()).filter(([_, items]) => items.length > 1);

        if (duplicates.length === 0) {
            console.log('✅ Nenhum setor duplicado encontrado!');
            console.log('   É seguro aplicar a constraint única.');
        } else {
            console.log(`❌ Encontrados ${duplicates.length} setores duplicados:\n`);

            for (const [key, items] of duplicates) {
                console.log(`📂 Empresa: ${items[0].empresa.nome} - Setor: ${items[0].nome}`);
                console.log(`   IDs duplicados: ${items.map(s => s.id).join(', ')}`);
                console.log(`   Quantidade de funcionários em cada:`);

                for (const item of items) {
                    const count = await prisma.funcionarios.count({
                        where: { setor_id: item.id }
                    });
                    console.log(`   - ID ${item.id}: ${count} funcionários`);
                }
                console.log('');
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
