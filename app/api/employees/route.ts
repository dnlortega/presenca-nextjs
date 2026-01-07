import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '../../../lib/prisma';
import { jsonResponse } from '../../../lib/api-helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const companyName = url.searchParams.get('company');
    const sectorName = url.searchParams.get('sector');

    const s: any = session;
    const userId = s.user?.id;

    // 1. Fetch allowed companies for this user
    let allowedCompanyNames: string[] = [];
    if (s.user?.role === 'admin') {
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

    // 3. Build query - need to get IDs from names
    let where: any = {};

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
      // Get IDs of allowed companies
      const companies = await prisma.empresas.findMany({
        where: { nome: { in: allowedCompanyNames } }
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
      orderBy: { id: 'asc' }
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
