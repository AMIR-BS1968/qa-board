import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account && account.provider === "google" && user && user.id) {
        const dbAccount = await prisma.account.findFirst({
          where: {
            userId: user.id,
            provider: "google",
          },
        });

        if (dbAccount) {
          await prisma.account.update({
            where: { id: dbAccount.id },
            data: {
              access_token: account.access_token,
              refresh_token: account.refresh_token ?? dbAccount.refresh_token,
              expires_at: account.expires_at,
              scope: account.scope ?? dbAccount.scope,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
