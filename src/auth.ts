import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  // plus simple : on utilise des sessions JWT
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Identifiants",
      credentials: {
        identifier: {
          label: "Pseudo ou email",
          type: "text",
        },
        password: {
          label: "Mot de passe",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          return null;
        }

        // On accepte soit l'e-mail, soit le pseudo
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          return null;
        }

        // Ce qui sera accessible dans les callbacks / session
        return {
          id: user.id,
          name: user.name ?? user.username ?? undefined,
          email: user.email ?? undefined,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // quand l'utilisateur vient de se connecter
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // on propage le rôle côté client
      if (session.user && token) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/connexion", // pour que NextAuth utilise ta page
  },
};
