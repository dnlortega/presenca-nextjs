const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Running seed...');

  // Admin user for `usuarios` model (introspected schema)
  const adminPassword = 'Admin#1234';
  const adminHash = bcrypt.hashSync(adminPassword, 10);

  // Upsert admin to avoid duplicates
  const admin = await prisma.usuarios.upsert({
    where: { username: 'admin' },
    update: {
      password_hash: adminHash,
      role: 'admin',
      can_register: false,
      updated_at: new Date()
    },
    create: {
      username: 'admin',
      password_hash: adminHash,
      role: 'admin',
      can_register: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  });

  console.log('Admin user ensured:', admin.username, '(password: ' + adminPassword + ')');

  // Create sample funcionarios
  const sampleEmployees = [
    { nome: 'Mariana Silva', empresa: 'Escola Sol', setor: 'Sala 1' },
    { nome: 'João Pereira', empresa: 'Escola Sol', setor: 'Sala 1' },
    { nome: 'Ana Costa', empresa: 'Escola Sol', setor: 'Sala 2' }
  ];

  for (const emp of sampleEmployees) {
    const exists = await prisma.funcionarios.findFirst({ where: { nome: emp.nome, empresa: emp.empresa, setor: emp.setor } });
    if (!exists) {
      const f = await prisma.funcionarios.create({ data: emp });
      console.log('Funcionario created:', f.nome);
    } else {
      console.log('Funcionario already exists:', exists.nome);
    }
  }

  // Create an educador user and map to 'Escola Sol'
  const eduPassword = 'Educador#123';
  const eduHash = bcrypt.hashSync(eduPassword, 10);
  const educador = await prisma.usuarios.upsert({
    where: { username: 'educador' },
    update: {
      password_hash: eduHash,
      role: 'educador',
      updated_at: new Date()
    },
    create: {
      username: 'educador',
      password_hash: eduHash,
      role: 'educador',
      can_register: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  });

  // Map educador to Empresa 'Escola Sol' in usuario_empresas
  const map = await prisma.usuario_empresas.upsert({
    where: { id: 1 },
    update: { empresa: 'Escola Sol', usuario_id: educador.id },
    create: { usuario_id: educador.id, empresa: 'Escola Sol' }
  });

  console.log('Educador user ensured:', educador.username, '(password: ' + eduPassword + ')');

  console.log('Seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
