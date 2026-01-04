const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Running seed...');

  // Admin user
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
      can_register: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  });

  console.log('Admin user ensured:', admin.username, 'Email:', admin.email);

  // Educador user
  const eduPassword = 'Educador#123';
  const eduHash = bcrypt.hashSync(eduPassword, 10);
  const educador = await prisma.usuarios.upsert({
    where: { username: 'educador' },
    update: {
      email: 'educador@presenca.pro',
      password_hash: eduHash,
      role: 'educador',
      updated_at: new Date()
    },
    create: {
      username: 'educador',
      email: 'educador@presenca.pro',
      password_hash: eduHash,
      role: 'educador',
      can_register: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  });

  console.log('Educador user ensured:', educador.username, 'Email:', educador.email);

  // Sample Employees
  const sampleEmployees = [
    { nome: 'Mariana Silva', empresa: 'Escola Sol', setor: 'Sala 1' },
    { nome: 'João Pereira', empresa: 'Escola Sol', setor: 'Sala 1' },
    { nome: 'Ana Costa', empresa: 'Escola Sol', setor: 'Sala 2' }
  ];

  for (const emp of sampleEmployees) {
    await prisma.funcionarios.upsert({
      where: { id: sampleEmployees.indexOf(emp) + 1 }, // Using ID as a shortcut for seed
      update: emp,
      create: emp
    }).catch(() => {
      // Fallback if ID strategy fails
      return prisma.funcionarios.create({ data: emp });
    });
  }

  // Map educador to Empresa 'Escola Sol'
  await prisma.usuario_empresas.upsert({
    where: { id: 1 },
    update: { empresa: 'Escola Sol', usuario_id: educador.id },
    create: { usuario_id: educador.id, empresa: 'Escola Sol' }
  });

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
