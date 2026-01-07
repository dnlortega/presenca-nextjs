const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Lista de nomes brasileiros comuns para gerar funcionários
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
  console.log('🚀 Iniciando criação de funcionários...\n');

  try {
    // Buscar todos os setores
    const setores = await prisma.setores.findMany({
      include: {
        empresa: true
      }
    });

    if (setores.length === 0) {
      console.log('❌ Nenhum setor cadastrado. Cadastre setores primeiro.');
      return;
    }

    console.log(`📋 Encontrados ${setores.length} setor(es):\n`);

    let totalCriados = 0;
    const resultados = [];

    // Para cada setor, criar 15 funcionários
    for (const setor of setores) {
      console.log(`📦 Processando: ${setor.empresa.nome} - ${setor.nome}`);

      // Verificar quantos funcionários já existem neste setor
      const funcionariosExistentes = await prisma.funcionarios.count({
        where: { setor_id: setor.id }
      });

      const quantidadeNecessaria = 15 - funcionariosExistentes;

      if (quantidadeNecessaria <= 0) {
        console.log(`   ✓ Já possui ${funcionariosExistentes} funcionários (completo)\n`);
        resultados.push({
          setor: setor.nome,
          empresa: setor.empresa.nome,
          status: 'já_completo',
          quantidade: funcionariosExistentes
        });
        continue;
      }

      console.log(`   → Criando ${quantidadeNecessaria} funcionário(s)...`);

      // Criar funcionários
      const funcionariosParaCriar = [];
      const nomesUsados = new Set();

      for (let i = 0; i < quantidadeNecessaria; i++) {
        let nome = gerarNomeAleatorio();
        let tentativas = 0;

        // Garantir que o nome seja único no setor
        while (nomesUsados.has(nome) && tentativas < 20) {
          nome = gerarNomeAleatorio();
          tentativas++;
        }

        nomesUsados.add(nome);

        funcionariosParaCriar.push({
          nome: nome,
          empresa_id: setor.empresa_id,
          setor_id: setor.id
        });
      }

      // Inserir em lote
      const resultado = await prisma.funcionarios.createMany({
        data: funcionariosParaCriar,
        skipDuplicates: true
      });

      totalCriados += resultado.count;
      console.log(`   ✓ ${resultado.count} funcionário(s) criado(s) com sucesso!\n`);

      resultados.push({
        setor: setor.nome,
        empresa: setor.empresa.nome,
        status: 'criado',
        quantidadeCriada: resultado.count,
        quantidadeTotal: funcionariosExistentes + resultado.count
      });
    }

    // Resumo final
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RESUMO FINAL');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Total de setores processados: ${setores.length}`);
    console.log(`Total de funcionários criados: ${totalCriados}`);
    console.log('\nDetalhes por setor:');
    resultados.forEach(r => {
      if (r.status === 'já_completo') {
        console.log(`  ✓ ${r.empresa} - ${r.setor}: ${r.quantidade} funcionários (já completo)`);
      } else {
        console.log(`  ✓ ${r.empresa} - ${r.setor}: ${r.quantidadeCriada} criados (total: ${r.quantidadeTotal})`);
      }
    });
    console.log('═══════════════════════════════════════════════════\n');
    console.log('✅ Processo concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar funcionários:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

