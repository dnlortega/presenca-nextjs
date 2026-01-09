const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const nomes = [
    'Ana', 'João', 'Maria', 'Pedro', 'Carla', 'Lucas', 'Juliana', 'Rafael',
    'Fernanda', 'Bruno', 'Patricia', 'Marcos', 'Camila', 'Thiago', 'Amanda',
    'Felipe', 'Larissa', 'Gabriel', 'Beatriz', 'Rodrigo', 'Mariana', 'Diego',
    'Vanessa', 'Ricardo', 'Priscila', 'André', 'Tatiana', 'Gustavo', 'Renata',
    'Leandro', 'Daniela', 'Vinicius', 'Cristina', 'Eduardo', 'Simone', 'Paulo',
    'Adriana', 'Roberto', 'Luciana', 'Fabio', 'Sandra', 'Alexandre', 'Monica',
    'Rafaela', 'Leonardo', 'Isabela', 'Matheus', 'Carolina', 'Guilherme', 'Bruna'
];

const sobrenomes = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
    'Pereira', 'Lima', 'Gomes', 'Ribeiro', 'Carvalho', 'Almeida', 'Lopes',
    'Martins', 'Rocha', 'Costa', 'Mendes', 'Nunes', 'Moreira', 'Araujo',
    'Fernandes', 'Barbosa', 'Dias', 'Cavalcanti', 'Monteiro', 'Cardoso',
    'Reis', 'Machado', 'Ramos', 'Freitas', 'Teixeira', 'Moraes', 'Castro',
    'Correia', 'Azevedo', 'Pinto', 'Melo', 'Cunha', 'Vieira', 'Barros'
];

function gerarNomeAleatorio() {
    const nome = nomes[Math.floor(Math.random() * nomes.length)];
    const sobrenome1 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    const sobrenome2 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    return `${nome} ${sobrenome1} ${sobrenome2}`;
}

async function main() {
    console.log('🚀 Iniciando reset total e seed do banco de dados...\n');

    try {
        // 1. Limpeza
        console.log('🗑️ Apagando dados existentes...');
        await prisma.presenca.deleteMany({});
        await prisma.usuario_empresas.deleteMany({});
        await prisma.funcionarios.deleteMany({});
        await prisma.setores.deleteMany({});
        await prisma.empresas.deleteMany({});
        console.log('✓ Dados apagados com sucesso.\n');

        // 2. Criar Empresas (5 empresas)
        console.log('🏢 Criando 5 empresas...');
        const empresasCriadas = [];
        for (let i = 1; i <= 5; i++) {
            const empresa = await prisma.empresas.create({
                data: { nome: `Empresa ${i}` }
            });
            empresasCriadas.push(empresa);
        }
        console.log('✓ Empresas criadas.\n');

        // 3. Criar Setores e Funcionários
        console.log('🏗️ Criando setores e funcionários...');

        for (const empresa of empresasCriadas) {
            console.log(`\nProcessando ${empresa.nome}:`);
            for (let s = 1; s <= 20; s++) {
                // Criar Setor
                const setor = await prisma.setores.create({
                    data: {
                        nome: `Setor ${s}`,
                        empresa_id: empresa.id
                    }
                });
                process.stdout.write(`  Setor ${s}: Criando funcionários... `);

                // Criar 15 Funcionários para este setor
                const funcionariosParaCriar = [];
                for (let f = 0; f < 15; f++) {
                    funcionariosParaCriar.push({
                        nome: gerarNomeAleatorio(),
                        empresa_id: empresa.id,
                        setor_id: setor.id
                    });
                }

                await prisma.funcionarios.createMany({
                    data: funcionariosParaCriar
                });
                process.stdout.write('✓\n');
            }
        }

        console.log('\n✨ Processo finalizado com sucesso!');
        console.log('📊 Resumo:');
        console.log('- 5 Empresas');
        console.log('- 100 Setores (20 por empresa)');
        console.log('- 1500 Funcionários (15 por setor)');

    } catch (error) {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
