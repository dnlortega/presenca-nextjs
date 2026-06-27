import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      role: string;
      can_register: boolean;
      can_edit: boolean;
      forceLogout?: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: number;
    role?: string;
    can_register?: boolean;
    can_edit?: boolean;
    forceLogout?: boolean;
  }
}
