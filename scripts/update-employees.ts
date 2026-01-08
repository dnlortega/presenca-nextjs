import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dados dos funcionários organizados por setor
const employeeData = {
  'FATURAMENTO': [
    'ALYNE MANDALITI DEMARCO',
    'BIANCA MARIA BATISTA FERNANDES',
    'CARINA ELAINE CARDOSO NABA',
    'DANIEL ORTEGA PEREIRA',
    'DANIELLE CORDEIRO DE MOURA',
    'DANIELLE PASCHOAL R. BERGONZINE',
    'DEBORA DA SILVA BEVILACQUA',
    'ERICA CAMILA MORGUES MARTINEZ',
    'GIULIA AMOS CALIXTO',
    'HEITOR KAMANTAUSCAS F. DE SOUZA',
    'KALINA APARECIDA RADIGUIERI LIGIERO',
    'KLEBER HENRIQUE CELESTINO PROSPERO',
    'LAIS DI MONIQUE NEVES',
    'LILIANE GONCALVES A. C. FELICIO',
    'LUARA PRISCILA DAMAS VILLARES',
    'MARIA CLECIA DOS SANTOS SOUZA',
    'MARTA DE FATIMA SANTANA DE OLIVEIRA',
    'MATHEUS FONSECA DOS SANTOS FARIA',
    'NATAIR LOUZADA MATOSO',
    'PRISCILA CORREIA DA SILVA',
    'RAQUEL CAMPOS DA SILVA',
    'RENATA APARECIDA AMARAL CARDOZO',
    'RENATA CRISTINA ALVES',
    'RENATA QUEIROZ BEZERRA',
    'ROSILENE SOARES TRIDENTE',
    'SABRINA DE MATTOS DORIGO DUTRA',
    'SILVIA LUCIA PINTO',
    'THALITA CRISTINA BENTO DE MOURAS',
    'VALERIA GONCALVES',
    'PATRICIA ADRIANA DOS S. DA S. FER'
  ],
  'AUDITORIA HUB': [
    'ALINE BARBOSA DIORIO',
    'APARECIDA DULCINEIA MAGALHAES',
    'DANIELE CASSIA DE OLIVEIRA',
    'DEBORA MARTINS DOS SANTOS COSTA',
    'FABIANA CORRADINI DA SILVA',
    'FABIANA CRISTINA FANTI BACHIEGA',
    'HELOIZA DE ALMEIDA SERPA',
    'ISABELA GIMENES DE SOUZA',
    'JANAINA APARECIDA DE ALMEIDA',
    'JOAQUINA MARA GUERRA DE SOUZA',
    'LUCIANA DE SOUZA PEREIRA',
    'MAYARA DELASTA GUIDE LEITE',
    'MICHELLE CRISTINA DALMASSA',
    'SILVANA CRISTINA DA S. TOMAZ SANTOS',
    'VICTOR PINHEIRO CAMAFORTE',
    'ADRIANA DA SILVA ARIELO',
    'ANDREA HORACIO DA SILVA'
  ],
  'CUSTOS': [
    'CAIO EDUARDO MOREIRA',
    'MICHELE FERREIRA ALVES DE MELLO',
    'NICHOLAS VIEIRA'
  ],
  'CONTAS MÉDICAS': [
    'ALESSANDRA RABELO NAVARRO',
    'CAMILA FORMENTI FRANCISCO SANTOS',
    'GENI DA SILVA MELRO',
    'GIOVANA CRISTINA MINETI SARGASSO',
    'KATIA JAQUELINE ALVAREZ DEPICOLI',
    'LUCIMARI FERREIRA BRASIL CHIES',
    'MARIANA TEIXEIRA MORENO',
    'SYLVIA LETICIA PERALTA DA SILVA'
  ],
  'PAGAMENTO MÉDICO': [
    'OSMAR WELLINGTON THOMAZ DA SILVA',
    'VIVIANE FERRARI'
  ],
  'CONTROLADORIA': [
    'ALINE CRISTINA BORBA DE SOUZA',
    'JOSE BUSSATO ROCHA'
  ],
  'GQH - GESTÃO QUALIDADE HOSPITALAR': [
    'ANA CAROLINA DE OLIVEIRA',
    'CARISTON RODRIGO BENICHEL',
    'GRAZIELA DA SILVA PALHACI'
  ],
  'TECNOLOGIA': [
    'CAIO RYOJI ARAI',
    'CESAR DANILO LUCON',
    'HENRIQUE DE CARVALHO MEIRELLES',
    'JOAO PEDRO DA SILVA FARIA',
    'LUCAS FELIPE LOPES HAYASHI',
    'RAFAEL ALMIR DA SILVA CESCHIM',
    'VITOR MOZELLA MUNHOZ',
    'ANTONIO DIAS SOARES NETO',
    'ALINE FIDENCIO HUNZECHER',
    'GUILHERME LEANDRIN FERNANDES',
    'GUSTAVO MATHEUS DOS SANTOS',
    'LEONARDO POZZER MENEZES',
    'MURILO CARLOMAGNO DE PAULA',
    'ENRIQUE DE ANDRADE CASTRO',
    'FERNANDO NOVELLI LORENZETTI',
    'GABRIEL DOS SANTOS BRUNE FRANCISCO',
    'VINICIUS FERNANDO RICI',
    'WAGNER ROBERTO GAIOTO MARIANO'
  ]
};

// Função para extrair apenas o primeiro nome
function getFirstName(fullName: string): string {
  return fullName.trim().split(' ')[0];
}

async function main() {
  try {
    console.log('🗑️  Removendo todos os funcionários cadastrados...');

    // Deletar todos os funcionários (as presenças serão deletadas em cascata)
    const deletedEmployees = await prisma.funcionarios.deleteMany({});
    console.log(`✅ ${deletedEmployees.count} funcionários removidos`);

    // Buscar a primeira empresa (assumindo que existe pelo menos uma)
    const empresa = await prisma.empresas.findFirst();

    if (!empresa) {
      console.error('❌ Nenhuma empresa encontrada no banco de dados!');
      console.log('Por favor, crie uma empresa primeiro.');
      return;
    }

    console.log(`\n📋 Usando empresa: ${empresa.nome} (ID: ${empresa.id})`);

    let totalEmployeesAdded = 0;

    // Processar cada setor
    for (const [sectorName, employees] of Object.entries(employeeData)) {
      console.log(`\n📂 Processando setor: ${sectorName}`);

      // Usar upsert para garantir que não haja duplicados
      const sector = await prisma.setores.upsert({
        where: {
          empresa_id_nome: {
            empresa_id: empresa.id,
            nome: sectorName
          }
        },
        update: {
          status: 'ativo' // Reativar se estava inativo
        },
        create: {
          nome: sectorName,
          empresa_id: empresa.id,
          status: 'ativo'
        }
      });

      console.log(`  ✓ Setor: ${sectorName} (ID: ${sector.id})`);

      // Adicionar funcionários do setor
      for (const fullName of employees) {
        const firstName = getFirstName(fullName);

        await prisma.funcionarios.create({
          data: {
            nome: firstName,
            empresa_id: empresa.id,
            setor_id: sector.id,
            valor: null
          }
        });

        totalEmployeesAdded++;
        console.log(`  ➕ Adicionado: ${firstName}`);
      }

      console.log(`  ✅ ${employees.length} funcionários adicionados ao setor ${sectorName}`);
    }

    console.log(`\n🎉 Processo concluído!`);
    console.log(`📊 Resumo:`);
    console.log(`   - Funcionários removidos: ${deletedEmployees.count}`);
    console.log(`   - Setores processados: ${Object.keys(employeeData).length}`);
    console.log(`   - Funcionários adicionados: ${totalEmployeesAdded}`);

  } catch (error) {
    console.error('❌ Erro ao processar:', error);
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
