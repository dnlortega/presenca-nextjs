import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { rateLimit } from './rate-limit';
import { audit } from './audit';
import type { Session } from 'next-auth';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                try {
                    if (!credentials) return null;
                    const { username, password } = credentials as { username: string; password: string };

                    const cleanUsername = username.trim();
                    const cleanPassword = password.trim();

                    const { allowed } = rateLimit(`login:${cleanUsername}`);
                    if (!allowed) {
                        throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
                    }

                    const user = await prisma.usuarios.findUnique({
                        where: { username: cleanUsername }
                    });

                    if (!user || !user.password_hash) {
                        return null;
                    }

                    const match = await bcrypt.compare(cleanPassword, user.password_hash);
                    if (!match) {
                        return null;
                    }

                    return { id: user.id.toString(), name: user.username, role: user.role ?? undefined };
                } catch (error) {
                    console.error('Erro no authorize:', error);
                    return null;
                }
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 20 * 60,   // 20 minutes inactivity timeout
        updateAge: 5 * 60, // refresh token every 5 minutes when active
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login',
        error: '/login',
    },
    events: {
        async signIn({ user, account }) {
            try {
                const dbUser = await prisma.usuarios.findFirst({
                    where: {
                        OR: [
                            { email: user.email || undefined },
                            { username: user.name || undefined }
                        ]
                    },
                    select: { id: true }
                });
                await audit({
                    usuario_id: dbUser?.id ?? null,
                    action: 'LOGIN',
                    entity: 'usuarios',
                    entity_id: dbUser?.id ?? null,
                    details: `Login via ${account?.provider ?? 'credentials'}`
                });

                // Limpar audit_log com mais de 30 dias
                await prisma.audit_log.deleteMany({
                    where: { created_at: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
                });
            } catch { /* não quebrar o login */ }
        },
        async signOut({ token }) {
            try {
                if (token?.id) {
                    await audit({
                        usuario_id: token.id as number,
                        action: 'LOGOUT',
                        entity: 'usuarios',
                        entity_id: token.id as number,
                        details: 'Sessão encerrada'
                    });
                }
            } catch { /* não quebrar o logout */ }
        }
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google' && user.email) {
                const existingUser = await prisma.usuarios.findUnique({
                    where: { email: user.email }
                });

                if (!existingUser) {
                    await prisma.usuarios.create({
                        data: {
                            email: user.email,
                            username: user.email.split('@')[0],
                            role: 'pendente',
                            can_register: false
                        }
                    });
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                const dbUser = await prisma.usuarios.findFirst({
                    where: {
                        OR: [
                            { email: token.email || undefined },
                            { username: token.name || undefined }
                        ]
                    }
                });
                token.role = dbUser?.role || 'pendente';
                token.id = dbUser?.id;
                token.can_register = dbUser?.can_register || false;
                token.can_edit = dbUser?.can_edit || false;
                token.forceLogout = false;
            } else if (token.id) {
                // Check force_logout flag and refresh permissions on every token update
                try {
                    const dbUser = await prisma.usuarios.findUnique({
                        where: { id: token.id as number },
                        select: { force_logout: true, role: true, can_register: true, can_edit: true }
                    });
                    if (dbUser?.force_logout) {
                        await prisma.usuarios.update({
                            where: { id: token.id as number },
                            data: { force_logout: false }
                        });
                        token.forceLogout = true;
                    } else {
                        token.forceLogout = false;
                        token.role = dbUser?.role || 'pendente';
                        token.can_register = dbUser?.can_register || false;
                        token.can_edit = dbUser?.can_edit || false;
                    }
                } catch {
                    // Don't break auth on DB errors
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role ?? 'pendente';
                session.user.id = token.id ?? 0;
                session.user.can_register = token.can_register ?? false;
                session.user.can_edit = token.can_edit ?? false;
                session.user.forceLogout = token.forceLogout ?? false;
            }
            return session;
        }
    }
};
