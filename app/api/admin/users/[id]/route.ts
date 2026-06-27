import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { jsonResponse } from '../../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../../lib/session';
import { Role } from '@prisma/client';
import { userUpdateSchema } from '../../../../../lib/schemas';
import { audit } from '../../../../../lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const parsed = userUpdateSchema.safeParse(await req.json());
        if (!parsed.success) {
            return jsonResponse({ error: parsed.error.issues[0].message }, { status: 400 });
        }
        const { role, empresas } = parsed.data;
        const userId = Number(id);
        const adminId = session?.user?.id ? Number(session.user.id) : null;

        if (role) {
            await prisma.usuarios.update({
                where: { id: userId },
                data: { role: role as Role }
            });
            await audit({ usuario_id: adminId, action: 'UPDATE_ROLE', entity: 'usuarios', entity_id: userId, details: role });
        }

        if (Array.isArray(empresas)) {
            // Find IDs for the names provided
            const dbCompanies = await prisma.empresas.findMany({
                where: {
                    nome: { in: empresas }
                }
            });

            await prisma.$transaction([
                prisma.usuario_empresas.deleteMany({ where: { usuario_id: userId } }),
                prisma.usuario_empresas.createMany({
                    data: dbCompanies.map((c) => ({
                        usuario_id: userId,
                        empresa_id: c.id
                    }))
                })
            ]);
        }

        if (typeof parsed.data.can_register === 'boolean') {
            await prisma.usuarios.update({
                where: { id: userId },
                data: { can_register: parsed.data.can_register }
            });
            await audit({ usuario_id: adminId, action: 'UPDATE_PERMISSION', entity: 'usuarios', entity_id: userId, details: `can_register=${parsed.data.can_register}` });
        }

        if (typeof parsed.data.can_edit === 'boolean') {
            await prisma.usuarios.update({
                where: { id: userId },
                data: { can_edit: parsed.data.can_edit }
            });
            await audit({ usuario_id: adminId, action: 'UPDATE_PERMISSION', entity: 'usuarios', entity_id: userId, details: `can_edit=${parsed.data.can_edit}` });
        }

        return jsonResponse({ success: true });
    } catch (err) {
        console.error('Erro ao atualizar cargo:', err);
        return jsonResponse({ error: 'Server error' }, { status: 500 });
    }
}
