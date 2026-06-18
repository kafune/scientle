import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // O tipo do client gerado (Prisma 7, output custom) é estruturalmente
  // compatível com o adapter, mas o cast evita ruído de tipos entre pacotes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any),
  providers: [Google], // lê AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET do ambiente
  session: { strategy: "database" },
  trustHost: true, // atrás do nginx do host
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
