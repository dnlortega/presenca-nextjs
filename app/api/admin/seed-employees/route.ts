// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

// Lista de nomes brasileiros comuns para gerar funcionários
const nomes = [
  'Ana', 'João', 'Maria', 'Pedro', 'Carla', 'Lucas', 'Juliana', 'Rafael',
  'Fernanda', 'Bruno', 'Patricia', 'Marcos', 'Camila', 'Thiago', 'Amanda',
  'Felipe', 'Larissa', 'Gabriel', 'Beatriz', 'Rodrigo', 'Mariana', 'Diego',
  'Vanessa', 'Ricardo', 'Priscila', 'André', 'Tatiana', 'Gustavo', 'Renata',
  'Leandro', 'Daniela', 'Vinicius', 'Cristina', 'Eduardo', 'Simone', 'Paulo',
  'Adriana', 'Roberto', 'Luciana', 'Fabio', 'Sandra', 'Alexandre', 'Monica'
];

const sobrenomes = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Ribeiro', 'Carvalho', 'Almeida', 'Lopes',
  'Martins', 'Rocha', 'Costa', 'Mendes', 'Nunes', 'Moreira', 'Araujo',
  'Fernandes', 'Barbosa', 'Dias', 'Cavalcanti', 'Monteiro', 'Cardoso',
  'Reis', 'Machado', 'Ramos', 'Freitas', 'Teixeira', 'Moraes', 'Castro'
];

function gerarNomeAleatorio(): string {
  const nome = nomes[Math.floor(Math.random() * nomes.length)];
  const sobrenome1 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  const sobrenome2 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  return `${nome} ${sobrenome1} ${sobrenome2}`;
}

export async function POST() {
  try {
    const session = await getSession();
    if (!isAdmin(session)) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar todos os setores
    const setores = await prisma.setores.findMany({
      include: {
        empresa: true
      }
    });

    if (setores.length === 0) {
      return jsonResponse({ 
        error: 'Nenhum setor cadastrado. Cadastre setores primeiro.' 
      }, { status: 400 });
    }

    const resultados = [];
    let totalCriados = 0;

    // Para cada setor, criar 15 funcionários
    for (const setor of setores) {
      const funcionariosExistentes = await prisma.funcionarios.count({
        where: { setor_id: setor.id }
      });

      // Verificar quantos já existem (15 por setor)
      const quantidadeNecessaria = 15 - funcionariosExistentes;
      
      if (quantidadeNecessaria <= 0) {
        resultados.push({
          setor: setor.nome,
          empresa: setor.empresa.nome,
          status: 'já_completo',
          quantidade: funcionariosExistentes
        });
        continue;
      }

      // Criar funcionários
      const funcionariosParaCriar = [];
      for (let i = 0; i < quantidadeNecessaria; i++) {
        let nome = gerarNomeAleatorio();
        let tentativas = 0;
        
        // Garantir que o nome seja único (verificar no setor)
        while (tentativas < 10) {
          const existe = await prisma.funcionarios.findFirst({
            where: {
              nome: nome,
              setor_id: setor.id
            }
          });
          
          if (!existe) break;
          nome = gerarNomeAleatorio();
          tentativas++;
        }

        funcionariosParaCriar.push({
          nome: nome,
          empresa_id: setor.empresa_id,
          setor_id: setor.id
        });
      }

      // Inserir em lote
      await prisma.funcionarios.createMany({
        data: funcionariosParaCriar,
        skipDuplicates: true
      });

      totalCriados += funcionariosParaCriar.length;
      resultados.push({
        setor: setor.nome,
        empresa: setor.empresa.nome,
        status: 'criado',
        quantidadeCriada: funcionariosParaCriar.length,
        quantidadeTotal: funcionariosExistentes + funcionariosParaCriar.length
      });
    }

    return jsonResponse({
      success: true,
      totalCriados,
      totalSetores: setores.length,
      resultados
    });

  } catch (err) {
    console.error('Erro ao criar funcionários:', err);
    return jsonResponse({ 
      error: 'Erro ao criar funcionários',
      details: err instanceof Error ? err.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

