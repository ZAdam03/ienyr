// src/lib/auth.ts (JAVÍTOTT - SESSION REFRESH)
import { NextAuthOptions, Session } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaClient } from "@prisma/client";
import { JWT } from "next-auth/jwt";
import { getUserPermissions } from './permissions';

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
      azureGroups?: string[];
      appGroups?: string[];
      permissions?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    appUserId?: string;
    azureGroups?: string[];
    appGroups?: string[];
    permissions?: string[];
    iat?: number;
    exp?: number;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      
      authorization: {
        params: { 
          scope: "openid profile email offline_access User.Read GroupMember.Read.All",
        },
      },
      
      idToken: true,
      checks: ["state"],
      
      profile(profile, tokens) {
        console.log('🔐 AZURE PROFILE:', profile);
        
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.preferred_username || profile.email,
          groups: profile.groups || [],
        };
      },
    }),
  ],
  
  // JAVÍTOTT: Session stratégia beállítása
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 perc - rövidebb session élettartam
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🚀 SIGN IN - PROFILE:', profile);
      
      const azureGroups = (profile as any)?.groups || [];
      console.log('🔐 AZURE GROUPS IN SIGNIN:', azureGroups);

      const dbUser = await prisma.user.upsert({
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

      console.log('💾 USER UPSERTED:', dbUser.id);
      return true;
    },

    async jwt({ token, user, account, profile, trigger }) {
      console.log('🔄 JWT CALLBACK - TRIGGER:', trigger);
      
      // JAVÍTOTT: Mindig frissítjük a jogosultságokat, ne csak signIn-kor
      if (trigger === "signIn" || trigger === "signUp" || !token.azureGroups) {
        console.log('🔄 FRESH JWT UPDATE - PROFILE:', profile);
        
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
            console.log('👤 APP USER ID SET:', dbUser.id);
          }
        }

        // Azure Groups hozzáadása
        let azureGroups: string[] = [];
        
        if (profile && (profile as any).groups) {
          azureGroups = (profile as any).groups;
        } else if (token.groups) {
          azureGroups = token.groups as string[];
        } else if (account?.id_token) {
          try {
            const payload = JSON.parse(Buffer.from(account.id_token.split('.')[1], 'base64').toString());
            azureGroups = payload.groups || [];
          } catch (error) {
            console.error('Error decoding ID token:', error);
          }
        }

        console.log('🔐 AZURE GROUPS FOUND:', azureGroups);
        token.azureGroups = azureGroups;

        // App Groups lekérése
        const appGroups = await getAppGroups(azureGroups);
        token.appGroups = appGroups;
        console.log('🏷️ APP GROUPS SET:', appGroups);

        // Jogosultságok lekérése
        const permissions = await getUserPermissions(appGroups);
        token.permissions = permissions;
        console.log('📋 PERMISSIONS SET:', permissions);
      } else {
        console.log('🔄 USING CACHED JWT DATA');
      }

      return token;
    },

    async session({ session, token }) {
      console.log('🎫 SESSION CALLBACK - TOKEN DATA:', {
        hasAzureGroups: !!token.azureGroups?.length,
        hasAppGroups: !!token.appGroups?.length,
        hasPermissions: !!token.permissions?.length,
        appUserId: token.appUserId
      });
      
      // JAVÍTOTT: Mindig friss értékek másolása
      session.user.appUserId = token.appUserId;
      session.user.azureGroups = token.azureGroups || [];
      session.user.appGroups = token.appGroups || [];
      session.user.permissions = token.permissions || [];

      console.log('🎫 FINAL SESSION DATA:', {
        azureGroups: session.user.azureGroups,
        appGroups: session.user.appGroups,
        permissions: session.user.permissions,
        appUserId: session.user.appUserId
      });

      return session;
    },
  },
  
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

// App Groups lekérése
async function getAppGroups(azureGroups: string[]): Promise<string[]> {
  try {
    if (!azureGroups || azureGroups.length === 0) {
      console.log('📭 NO AZURE GROUPS PROVIDED');
      return [];
    }

    console.log('🔍 LOOKING FOR APP GROUPS FOR:', azureGroups);
    
    const appRoles = await prisma.role.findMany({
      where: {
        azureGroupId: { in: azureGroups }
      },
      select: {
        azureGroupId: true,
        name: true
      }
    });

    console.log('🏷️ FOUND APP ROLES:', appRoles);
    
    const appGroupIds = appRoles.map(role => role.azureGroupId);
    console.log('✅ FINAL APP GROUP IDs:', appGroupIds);
    
    return appGroupIds;
  } catch (error) {
    console.error('❌ Error getting app groups:', error);
    return [];
  }
}