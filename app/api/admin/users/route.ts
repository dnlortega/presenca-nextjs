// github.com/dnlortega
// linkedin.com/in/daniel-op
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { jsonResponse } from '../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.usuarios.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                can_register: true,
                can_edit: true,
                created_at: true,
                password_hash: true,
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
        const formattedUsers = users.map(u => {
            const { password_hash, usuario_empresas, ...rest } = u;
            return {
                ...rest,
                has_password: !!password_hash,
                empresas: usuario_empresas.map(ue => ue.empresa.nome),
            };
        });

        return jsonResponse(formattedUsers);
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
