import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { db } from './lib/db';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.activo || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        if (!profile?.email) return false;

        const isAllowedDomain = profile.email.endsWith('@keranai.com');
        const isDeveloper = profile.email === 'bcandia9@gmail.com';

        // Permitir solo dominio @keranai.com o el correo específico bcandia9@gmail.com
        if (!isAllowedDomain && !isDeveloper) {
          return false;
        }

        // Buscar si el usuario ya existe en la BD
        const dbUser = await db.user.findUnique({
          where: { email: profile.email },
        });

        if (dbUser && account.access_token) {
          await db.calendarToken.upsert({
            where: { userId: dbUser.id },
            create: {
              userId: dbUser.id,
              accessToken: account.access_token,
              refreshToken: account.refresh_token ?? null,
              expiresAt: account.expires_at
                ? new Date(account.expires_at * 1000)
                : null,
            },
            update: {
              accessToken: account.access_token,
              refreshToken: account.refresh_token ?? null,
              expiresAt: account.expires_at
                ? new Date(account.expires_at * 1000)
                : null,
            },
          });
        }

        // Auto-registrar si el usuario no existe
        if (!dbUser) {
          await db.user.create({
            data: {
              name: profile.name || 'Usuario Google',
              email: profile.email,
              role: isDeveloper ? 'ADMIN' : 'VENDEDOR',
              activo: true,
            },
          });
        } else if (!dbUser.activo) {
          return false;
        }
      }
      return true;
    },

    async jwt({ token, account }) {
      // Al hacer login con Google, guardar tokens en el JWT temporalmente
      if (account?.provider === 'google') {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      // Verificar estado del usuario en BD
      if (token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, activo: true },
        });
        if (dbUser && dbUser.activo) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        } else {
          return {};
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user && token.id) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        // Exponer accessToken para las API routes del calendario
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
});
