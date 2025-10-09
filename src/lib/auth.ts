import { NextAuthOptions, Session } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extend the Session type to include 'id' on user
declare module "next-auth" {
    interface Session {
        user: {
            id?: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID!,
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // frissítjük vagy létrehozzuk a User rekordot
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
        async jwt({ token, user }) {
            if (user) token.azureId = user.id; // Azure ID
            if (user?.email) {
            const dbUser = await prisma.user.findUnique({
                where: { email: user.email },
            });

            if (dbUser) {
                token.appUserId = dbUser.id; // 💾 adatbázisos ID
            }
            }
            return token;
        },

        async session({ session, token }) {
            if (token?.appUserId && session.user) {
            (session.user as any).appUserId = token.appUserId;
            }
            return session;
        },

    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};
