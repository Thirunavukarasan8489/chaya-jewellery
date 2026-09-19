import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models/user";
import { Customer } from "@/lib/models/customer";
import connectDB from "@/lib/db";
import { requireSecret } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
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
          throw new Error("Missing credentials");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() }).lean();
        
        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isMatch = await bcrypt.compare(credentials.password, user.password as string);

        if (!isMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: (user as any)._id.toString(),
          email: (user as any).email,
          name: (user as any).name,
          role: (user as any).role,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        try {
          await connectDB();
          const normalizedEmail = user.email.toLowerCase().trim();
          let dbUser = await User.findOne({ email: normalizedEmail });

          if (!dbUser) {
            const fullName = user.name || (profile as any)?.name || "Customer";
            const nameParts = fullName.trim().split(" ");
            const firstName = nameParts[0] || "Customer";
            const lastName = nameParts.slice(1).join(" ") || "";

            let customer = await Customer.findOne({ "contact.email": normalizedEmail });
            if (!customer) {
              customer = await Customer.create({
                type: "PERSONAL",
                contact: { email: normalizedEmail },
                profile: { firstName, lastName },
                addresses: [],
                metrics: { totalOrders: 0, totalSpend: 0 },
              });
            }

            dbUser = await User.create({
              name: fullName,
              email: normalizedEmail,
              role: "CUSTOMER",
              status: "ACTIVE",
              provider: "google",
              googleId: account.providerAccountId || (profile as any)?.sub,
              image: user.image || (profile as any)?.picture,
              customerProfileId: customer._id,
            });

            if (!customer.userId) {
              customer.userId = dbUser._id;
              await customer.save();
            }
          } else {
            // User exists: update googleId or image if not set
            const updateFields: any = {};
            if (!(dbUser as any).googleId) {
              updateFields.googleId = account.providerAccountId || (profile as any)?.sub;
            }
            if (user.image && !(dbUser as any).image) {
              updateFields.image = user.image;
            }
            if (Object.keys(updateFields).length > 0) {
              await User.findByIdAndUpdate(dbUser._id, { $set: updateFields });
            }

            // Ensure customer profile is linked
            let customer = await Customer.findOne({ userId: dbUser._id });
            if (!customer) {
              customer = await Customer.findOne({ "contact.email": normalizedEmail });
              if (customer) {
                customer.userId = dbUser._id;
                await customer.save();
              } else {
                const nameParts = (dbUser.name || "Customer").trim().split(" ");
                customer = await Customer.create({
                  userId: dbUser._id,
                  type: "PERSONAL",
                  contact: { email: normalizedEmail },
                  profile: {
                    firstName: nameParts[0] || "Customer",
                    lastName: nameParts.slice(1).join(" ") || "",
                  },
                  addresses: [],
                  metrics: { totalOrders: 0, totalSpend: 0 },
                });
              }
            }

            if (!dbUser.customerProfileId && customer) {
              await User.findByIdAndUpdate(dbUser._id, {
                $set: { customerProfileId: customer._id },
              });
            }
          }

          user.id = dbUser._id.toString();
          (user as any).role = dbUser.role;
          return true;
        } catch (error) {
          console.error("Google OAuth sign in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email?.toLowerCase().trim() }).lean();
          if (dbUser) {
            token.id = (dbUser as any)._id.toString();
            token.role = (dbUser as any).role;
          } else {
            token.id = user.id;
            token.role = (user as any).role || "CUSTOMER";
          }
        } else {
          token.role = (user as any).role;
          token.id = user.id;
        }
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
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: requireSecret("NEXTAUTH_SECRET", "fallback-secret-for-development"),
};

