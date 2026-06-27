import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '../../../lib/prisma';
import { jsonResponse } from '../../../lib/api-helpers';
import { getSession, isAdmin as checkAdmin } from '../../../lib/session';


export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const companyName = url.searchParams.get('company');
    const sectorName = url.searchParams.get('sector');

    const userId = session.user?.id;

    let allowedCompanyNames: string[] = [];
    if (session.user?.role === 'admin') {
      const all = await prisma.empresas.findMany();
      allowedCompanyNames = all.map(c => c.nome);
    } else {
      const mappings = await prisma.usuario_empresas.findMany({
        where: { usuario_id: Number(userId) },
        include: { empresa: true }
      });
      allowedCompanyNames = mappings.map(m => m.empresa.nome);
    }

    // 2. Validate requested company
    if (companyName && !allowedCompanyNames.includes(companyName)) {
      return jsonResponse({ error: 'Forbidden' }, { status: 403 });
    }

    type WhereClause = { empresa_id?: number | { in: number[] }; setor_id?: number };
    let where: WhereClause = {};

    if (companyName) {
      // Find company by name to get ID
      const company = await prisma.empresas.findFirst({
        where: { nome: companyName }
      });

      if (!company) {
        return jsonResponse({ error: 'Company not found' }, { status: 404 });
      }

      where.empresa_id = company.id;
    } else {
      // Get IDs of allowed companies - Optimized
      const companies = await prisma.empresas.findMany({
        where: { nome: { in: allowedCompanyNames } },
        select: { id: true }
      });
      where.empresa_id = { in: companies.map(c => c.id) };
    }

    if (sectorName) {
      // Find sector by name (within the company context) - case insensitive
      const sector = await prisma.setores.findFirst({
        where: {
          nome: {
            equals: sectorName,
            mode: 'insensitive'
          },
          ...(where.empresa_id && typeof where.empresa_id === 'number' ? { empresa_id: where.empresa_id } : {})
        }
      });

      if (!sector) {
        return jsonResponse({ error: 'Sector not found' }, { status: 404 });
      }

      where.setor_id = sector.id;
    }

    const list = await prisma.funcionarios.findMany({
      where,
      include: {
        empresa: true,
        setor: true
      },
      orderBy: { nome: 'asc' }
    });

    // Remap to match previous format if necessary (returning names as strings)
    const formatted = list.map(f => ({
      id: f.id,
      nome: f.nome,
      empresa: f.empresa.nome,
      setor: f.setor.nome,
      empresa_id: f.empresa_id,
      setor_id: f.setor_id
    }));

    return jsonResponse(formatted);
  } catch (err) {
    console.error('Error in /api/employees:', err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user;
    const isEducator = user.role === 'educador';
    const isAdmin = user.role === 'admin';

    // Verify permission: Must be admin or (educator + can_register)
    if (!isAdmin && !(isEducator && user.can_register)) {
      return jsonResponse({ error: 'Permissão negada para cadastrar funcionários' }, { status: 403 });
    }

    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) return jsonResponse({ error: 'Nenhum dado fornecido' }, { status: 400 });

    // 1. Fetch all allowed companies
    let allowedCompanies: { id: number; nome: string }[] = [];
    if (isAdmin) {
      allowedCompanies = await prisma.empresas.findMany({ select: { id: true, nome: true } });
    } else {
      const mappings = await prisma.usuario_empresas.findMany({
        where: { usuario_id: Number(user.id) },
        include: { empresa: { select: { id: true, nome: true } } }
      });
      allowedCompanies = mappings.map(m => m.empresa);
    }

    // 2. Fetch all relevant sectors (optimization: fetch all sectors for allowed companies)
    const allowedCompIds = allowedCompanies.map(c => c.id);
    const availableSectors = await prisma.setores.findMany({
      where: { empresa_id: { in: allowedCompIds } },
      select: { id: true, nome: true, empresa_id: true }
    });

    const validItems = [];
    for (const item of items) {
      // Resolve Company
      let compId: number | null = null;
      if (item.empresa_id) compId = Number(item.empresa_id);
      else if (item.empresa) {
        const found = allowedCompanies.find(c => c.nome === item.empresa);
        if (found) compId = found.id;
      }

      if (!compId || !allowedCompIds.includes(compId)) continue;

      // Resolve Sector
      let secId: number | null = null;
      if (item.setor_id) secId = Number(item.setor_id);
      else if (item.setor) {
        // Case insensitive match for sector within the company
        const foundS = availableSectors.find(s =>
          s.empresa_id === compId && s.nome.toLowerCase() === item.setor.toLowerCase()
        );
        if (foundS) secId = foundS.id;
      }

      if (!secId || !item.nome) continue;

      validItems.push({
        nome: item.nome,
        empresa_id: compId,
        setor_id: secId,
        valor: item.valor ? Number(item.valor) : null
      });
    }

    if (validItems.length === 0) {
      return jsonResponse({ error: 'Nenhum funcionário válido ou permissão negada.' }, { status: 400 });
    }

    // 3. Check for duplicates
    // Optimize: Fetch existing employees in these companies with these names
    const companiesInBatch = [...new Set(validItems.map(i => i.empresa_id))];
    const namesInBatch = validItems.map(i => i.nome);

    // Find collisions: same name AND same company (regardless of sector, to be safe? or strict Name+Company+Sector?)
    // User asked "nao deixa cadastrar em duplicidade". Usually implies "Name in Company".
    // Let's do loose check: Name + Company. If user wants same name in different sector, they should probably update the existing one or it's a homonym issue (edge case).
    // Given the context of "school/attendance", homonyms are possible but rare in same class/sector.
    // Let's check Name + Company + Sector to be precise, OR just Name + Company?
    // Let's start with Name + Company + Sector to avoid blocking legitimate moves, but usually "duplicidade" means accidentally adding same person twice.
    // Let's try to match exactly what we are inserting: verify if (nome, empresa_id) already exists?
    // If I have "John" in Sector A, and I add "John" in Sector B, is it the same person? Likely.
    // So let's block if Name + Company exists. 

    const potentialDuplicates = await prisma.funcionarios.findMany({
      where: {
        empresa_id: { in: companiesInBatch },
        nome: { in: namesInBatch, mode: 'insensitive' }
      },
      select: { nome: true, empresa_id: true }
    });

    const finalItems = [];
    const duplicates = [];

    for (const item of validItems) {
      const isDuplicate = potentialDuplicates.some(existing =>
        existing.empresa_id === item.empresa_id &&
        existing.nome.toLowerCase() === item.nome.toLowerCase()
      );

      if (isDuplicate) {
        duplicates.push(item.nome);
      } else {
        finalItems.push(item);
      }
    }

    if (finalItems.length === 0) {
      if (duplicates.length > 0) {
        return jsonResponse({ error: `Todos os funcionários já estão cadastrados na empresa: ${duplicates.join(', ')}` }, { status: 400 });
      }
      return jsonResponse({ error: 'Nenhum funcionário válido processado.' }, { status: 400 });
    }

    await prisma.funcionarios.createMany({
      data: finalItems
    });

    return jsonResponse({
      success: true,
      count: finalItems.length,
      skipped: duplicates.length,
      message: duplicates.length > 0 ? `${finalItems.length} cadastrados. ${duplicates.length} ignorados (já existem).` : undefined
    });

  } catch (err) {
    console.error('Error in /api/employees create:', err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}
