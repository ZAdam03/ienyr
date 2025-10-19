// src/lib/auth.ts
import { NextAuthOptions, Session } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaClient } from "@prisma/client";
import { JWT } from "next-auth/jwt";

const prisma = new PrismaClient();

// Extend the types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      appUserId?: string;
      azureGroups?: string[]; // Új: Azure group IDs
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    appUserId?: string;
    azureGroups?: string[]; // Új: Azure group IDs
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email User.Read GroupMember.Read.All", // Group olvasás engedélyezése
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Group IDs kinyerése a profile-ból
      const azureGroups = (profile as any)?.groups || [];

      await prisma.user.upsert({
        where: { email: user.email! },
        update: {
          name: user.name!,
          azureId: account?.providerAccountId ?? "",
          azEmail: user.email!,
          lastLogin: new Date(),
        },
        create: {
          email: user.email!,
          name: user.name!,
          azureId: account?.providerAccountId ?? "",
          azEmail: user.email!,
          lastLogin: new Date(),
        },
      });
      return true;
    },

    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (user) {
        token.azureId = user.id;
      }

      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (dbUser) {
          token.appUserId = dbUser.id;
        }
      }

      // Azure Groups hozzáadása a tokenhez
      if (profile) {
        token.azureGroups = (profile as any)?.groups || [];
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.appUserId && session.user) {
        (session.user as any).appUserId = token.appUserId;
      }
      
      if (token?.azureGroups && session.user) {
        (session.user as any).azureGroups = token.azureGroups;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};