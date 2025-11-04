import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { usersApi } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email || "").toString().trim();
        const password = (credentials?.password || "").toString();
        if (!email || !password) return null;

        try {
          // Verify user credentials against database
          const user = await usersApi.verifyPassword(email, password);
          if (!user) return null;

          return { 
            id: user.id?.toString() || email, 
            name: user.name || email.split("@")[0], 
            email: user.email 
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If url is a relative path, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If url is same origin, allow it
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          return url;
        }
      } catch {
        // If invalid URL, return dashboard
      }
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {} as any;
        (session.user as any).email = (token as any).email;
        (session.user as any).name = (token as any).name;
      }
      return session;
    },
  },
};


