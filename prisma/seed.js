// github.com/dnlortega
// linkedin.com/in/daniel-op
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8, 0, 0, 0);
  return d;
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── USUÁRIOS ──
  const adminHash = bcrypt.hashSync('Admin#1234', 10);
  const eduHash   = bcrypt.hashSync('Educador#123', 10);

  const admin = await prisma.usuarios.upsert({
    where:  { username: 'admin' },
    update: { password_hash: adminHash, role: 'admin', email: 'admin@presenca.pro', updated_at: new Date() },
    create: { username: 'admin', email: 'admin@presenca.pro', password_hash: adminHash, role: 'admin', can_register: false, updated_at: new Date() },
  });

  const educador = await prisma.usuarios.upsert({
    where:  { username: 'educador' },
    update: { password_hash: eduHash, role: 'educador', email: 'educador@presenca.pro', can_register: true, updated_at: new Date() },
    create: { username: 'educador', email: 'educador@presenca.pro', password_hash: eduHash, role: 'educador', can_register: true, updated_at: new Date() },
  });

  console.log('✅ Usuários: admin / educador');

  // ── EMPRESAS ──
  const empresasData = [
    'Escola Municipal Girassol',
    'Colégio Estadual Horizonte',
    'Instituto Educacional Futuro',
    'Centro de Ensino Alfa',
  ];

  const empresas = {};
  for (const nome of empresasData) {
    empresas[nome] = await prisma.empresas.upsert({
      where:  { nome },
      update: {},
      create: { nome },
    });
  }
  console.log(`✅ Empresas: ${empresasData.length}`);

  // ── SETORES ──
  const setoresConfig = {
    'Escola Municipal Girassol':   ['Ensino Fundamental I', 'Ensino Fundamental II', 'Educação Infantil', 'Coordenação'],
    'Colégio Estadual Horizonte':  ['1º Ano', '2º Ano', '3º Ano', 'Laboratório', 'Direção'],
    'Instituto Educacional Futuro':['Turma A', 'Turma B', 'Turma C', 'Secretaria'],
    'Centro de Ensino Alfa':       ['Berçário', 'Maternal', 'Pré-escola', 'Apoio Pedagógico'],
  };

  const setores = {};
  for (const [empNome, nomes] of Object.entries(setoresConfig)) {
    setores[empNome] = {};
    for (const nome of nomes) {
      setores[empNome][nome] = await prisma.setores.upsert({
        where:  { empresa_id_nome: { empresa_id: empresas[empNome].id, nome } },
        update: {},
        create: { nome, empresa_id: empresas[empNome].id },
      });
    }
  }
  console.log('✅ Setores criados');

  // ── FUNCIONÁRIOS ──
  const nomes = [
    'Ana Beatriz Santos','Carlos Eduardo Lima','Fernanda Oliveira','Ricardo Souza',
    'Juliana Mendes','Marcos Ferreira','Patrícia Alves','Roberto Costa',
    'Simone Rodrigues','Thiago Pereira','Vanessa Martins','Diego Carvalho',
    'Larissa Nunes','Felipe Araújo','Camila Barbosa','Gustavo Ribeiro',
    'Isabela Cardoso','Leonardo Dias','Natália Moreira','Paulo Henrique Silva',
    'Renata Gomes','Sérgio Nascimento','Talita Castro','Vinícius Teixeira',
    'Aline Correia','Bruno Monteiro','Cristiane Freitas','Daniel Azevedo',
    'Elisa Rocha','Fábio Cavalcante','Gabriela Lemos','Henrique Vieira',
    'Joana Pinto','Kevin Marques','Letícia Fonseca','Márcio Andrade',
    'Nívia Duarte','Otávio Rezende','Priscila Machado','Rafael Sousa',
  ];

  // Limpa funcionários vinculados às empresas do seed para evitar duplicatas
  const empIds = Object.values(empresas).map(e => e.id);
  const funcExistentes = await prisma.funcionarios.findMany({ where: { empresa_id: { in: empIds } }, select: { id: true } });
  if (funcExistentes.length > 0) {
    await prisma.presenca.deleteMany({ where: { funcionario_id: { in: funcExistentes.map(f => f.id) } } });
    await prisma.funcionarios.deleteMany({ where: { empresa_id: { in: empIds } } });
  }

  const funcionariosList = [];
  let nameIdx = 0;
  for (const [empNome, setNomes] of Object.entries(setoresConfig)) {
    for (const setNome of setNomes) {
      const count = 4 + Math.floor(Math.random() * 4); // 4-7 per sector
      for (let i = 0; i < count && nameIdx < nomes.length; i++, nameIdx++) {
        const f = await prisma.funcionarios.create({
          data: {
            nome: nomes[nameIdx],
            empresa_id: empresas[empNome].id,
            setor_id:   setores[empNome][setNome].id,
          },
        });
        funcionariosList.push(f);
      }
    }
  }
  console.log(`✅ Funcionários: ${funcionariosList.length}`);

  // ── VINCULAR educador à primeira empresa ──
  await prisma.usuario_empresas.upsert({
    where:  { id: 1 },
    update: { usuario_id: educador.id, empresa_id: empresas['Escola Municipal Girassol'].id },
    create: { usuario_id: educador.id, empresa_id: empresas['Escola Municipal Girassol'].id },
  }).catch(() =>
    prisma.usuario_empresas.create({
      data: { usuario_id: educador.id, empresa_id: empresas['Escola Municipal Girassol'].id },
    }).catch(() => {})
  );

  // ── PRESENÇAS nos últimos 30 dias (batch insert) ──
  const presencasBatch = [];
  for (const f of funcionariosList) {
    for (let day = 29; day >= 0; day--) {
      const d = daysAgo(day);
      if (d.getDay() === 0 || d.getDay() === 6) continue; // pula fds
      if (Math.random() < (0.65 + Math.random() * 0.25)) {
        d.setHours(7 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
        presencasBatch.push({ funcionario_id: f.id, data_hora: new Date(d) });
      }
    }
  }
  // Insere em chunks de 500 para evitar timeout
  const CHUNK = 500;
  for (let i = 0; i < presencasBatch.length; i += CHUNK) {
    await prisma.presenca.createMany({ data: presencasBatch.slice(i, i + CHUNK), skipDuplicates: true });
  }
  console.log(`✅ Presenças: ${presencasBatch.length} registros (30 dias)`);

  // ── AUDIT LOG ──
  await prisma.audit_log.createMany({
    data: [
      { usuario_id: admin.id, action: 'LOGIN', entity: 'usuarios', entity_id: admin.id, details: 'Login via credentials', created_at: daysAgo(1) },
      { usuario_id: admin.id, action: 'UPDATE_ROLE', entity: 'usuarios', entity_id: educador.id, details: 'educador', created_at: daysAgo(2) },
      { usuario_id: educador.id, action: 'LOGIN', entity: 'usuarios', entity_id: educador.id, details: 'Login via credentials', created_at: daysAgo(0) },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Audit log');
  console.log('\n🎉 Seed concluído!');
  console.log('   admin     → Admin#1234');
  console.log('   educador  → Educador#123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
