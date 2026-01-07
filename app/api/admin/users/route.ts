import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session || (session as any).user?.role !== 'admin') {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.usuarios.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                can_register: true,
                // can_edit: true,
                created_at: true,
                usuario_empresas: {
                    select: {
                        empresa: {
                            select: {
                                nome: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Flatten the relationship for easier consumption
        const formattedUsers = users.map(u => ({
            ...u,
            empresas: u.usuario_empresas.map((ue: any) => ue.empresa.nome)
        }));

        return jsonResponse(formattedUsers);
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
