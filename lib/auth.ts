import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import "./db-schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const db = getDb();
        const user = db
          .prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
          .get(email) as
          | { id: number; email: string; name: string | null; password_hash: string }
          | undefined;

        if (!user) return null;
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return { id: String(user.id), email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
