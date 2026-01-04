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

                    const users = await prisma.$queryRawUnsafe<any[]>(
                        'SELECT * FROM "usuarios" WHERE "username" = $1 LIMIT 1',
                        cleanUsername
                    );
                    const user = users[0];

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
                const users = await prisma.$queryRawUnsafe<any[]>(
                    'SELECT * FROM "usuarios" WHERE "email" = $1 LIMIT 1',
                    user.email
                );
                const existingUser = users[0];

                if (!existingUser) {
                    await prisma.$executeRawUnsafe(
                        'INSERT INTO "usuarios" (email, username, role, can_register, updated_at) VALUES ($1, $2, $3::"Role", $4, NOW())',
                        user.email,
                        user.email.split('@')[0],
                        'pendente',
                        false
                    );
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                const users = await prisma.$queryRawUnsafe<any[]>(
                    'SELECT * FROM "usuarios" WHERE "email" = $1 OR "username" = $2 LIMIT 1',
                    token.email || '',
                    token.name || ''
                );
                const dbUser = users[0];

                token.role = dbUser?.role || 'pendente';
                token.id = dbUser?.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        }
    }
};
