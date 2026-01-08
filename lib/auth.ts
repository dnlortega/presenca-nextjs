import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

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

                    return { id: user.id.toString(), name: user.username, role: user.role };
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
    session: { strategy: 'jwt' },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login',
        error: '/login',
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
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
                (session.user as any).can_register = token.can_register;
                (session.user as any).can_edit = token.can_edit;
            }
            return session;
        }
    }
};
