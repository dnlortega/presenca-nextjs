// github.com/dnlortega
// linkedin.com/in/daniel-op
import prisma from '../../../../../../lib/prisma';
import { jsonResponse } from '../../../../../../lib/api-helpers';
import { getSession, isAdmin } from '../../../../../../lib/session';
import { audit } from '../../../../../../lib/audit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  newPassword: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres').max(128),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!isAdmin(session)) return jsonResponse({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const userId = Number(id);
    if (isNaN(userId) || userId <= 0) return jsonResponse({ error: 'ID inválido' }, { status: 400 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return jsonResponse({ error: parsed.error.issues[0].message }, { status: 400 });

    const user = await prisma.usuarios.findUnique({
      where: { id: userId },
      select: { id: true, password_hash: true, email: true, role: true },
    });

    if (!user) return jsonResponse({ error: 'Usuário não encontrado' }, { status: 404 });
    if (!user.password_hash) return jsonResponse({ error: 'Este usuário não usa credenciais de senha' }, { status: 400 });

    const hash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.usuarios.update({ where: { id: userId }, data: { password_hash: hash } });

    const adminId = session?.user?.id ? Number(session.user.id) : null;
    await audit({ usuario_id: adminId, action: 'CHANGE_PASSWORD', entity: 'usuarios', entity_id: userId, details: `Senha alterada pelo admin` });

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    return jsonResponse({ error: 'Server error' }, { status: 500 });
  }
}
