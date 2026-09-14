import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models/user";
import connectDB from "@/lib/db";
import { requireSecret } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string" ||
          !credentials.email ||
          !credentials.password
        ) {
          // SECURITY: without the typeof checks, a direct POST to the
          // credentials callback (bypassing NextAuth's own client, which
          // always sends strings) could pass e.g. { "$regex": "^admin" } as
          // email — Mongoose doesn't cast query filters, so that reaches
          // User.findOne() as a live Mongo operator.
          throw new Error("Missing credentials");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).lean();
        
        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isMatch = await bcrypt.compare(credentials.password, user.password as string);

        if (!isMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: requireSecret("NEXTAUTH_SECRET", "fallback-secret-for-development"),
};
