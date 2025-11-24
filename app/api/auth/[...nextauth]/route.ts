import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import prisma from '../../../../lib/prisma';

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

          console.log('Tentando login para:', cleanUsername);

          // Look up user in the introspected `usuarios` table
          const user = await prisma.usuarios.findUnique({ where: { username: cleanUsername } });

          if (!user) {
            console.log('Usuário não encontrado:', cleanUsername);
            return null;
          }

          const match = await bcrypt.compare(cleanPassword, user.password_hash);
          if (!match) {
            console.log('Senha incorreta para:', cleanUsername);
            return null;
          }

          return { id: user.id.toString(), name: user.username, role: user.role } as any;
        } catch (error) {
          console.error('Erro no authorize:', error);
          return null;
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // @ts-ignore
      session.user = session.user ?? {};
      // @ts-ignore
      session.user.role = (token as any).role;
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
