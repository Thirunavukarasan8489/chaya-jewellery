import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models/user";
import { Customer } from "@/lib/models/customer";
import connectDB from "@/lib/db";
import { getAuthSecret, requireEnv } from "@/lib/env";
import { getSafeCallbackUrl } from "@/lib/auth-redirect";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
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

        const user = await User.findOne({
          email: credentials.email.toLowerCase().trim(),
        }).lean();

        if (!user || !user.password || user.status !== "ACTIVE") {
          throw new Error("Invalid email or password");
        }

        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password as string,
        );

        if (!isMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: (user as any)._id.toString(),
          email: (user as any).email,
          name: (user as any).name,
          role: (user as any).role,
          image: user.image || null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // NextAuth verifies the ID token, state and PKCE. Require a verified
        // email before linking it to an existing customer account as well.
        if (
          !user.email ||
          !profile?.email ||
          !("email_verified" in profile) ||
          profile.email_verified !== true ||
          !account.providerAccountId ||
          profile.sub !== account.providerAccountId
        )
          return false;

        const normalizedEmail = user.email.toLowerCase().trim();
        if (profile.email.toLowerCase().trim() !== normalizedEmail)
          return false;
        const googleOwnsEmail =
          normalizedEmail.endsWith("@gmail.com") ||
          ("hd" in profile &&
            typeof profile.hd === "string" &&
            profile.hd.length > 0);

        try {
          await connectDB();

          // Persist both sides together so a failed login cannot leave an
          // orphan profile. Reuse the existing User/Customer collections.
          const dbUser = await User.db.transaction(async (dbSession) => {
            let existing = await User.findOne({
              googleId: account.providerAccountId,
            }).session(dbSession);
            if (existing && existing.email !== normalizedEmail) return null;
            existing ??= await User.findOne({ email: normalizedEmail }).session(
              dbSession,
            );

            // Google is a customer login. An email match must never grant an
            // administrative role or reactivate a disabled account.
            if (
              existing &&
              (existing.status !== "ACTIVE" ||
                existing.role !== "CUSTOMER" ||
                (existing.googleId &&
                  existing.googleId !== account.providerAccountId))
            )
              return null;

            let customer = existing?.customerProfileId
              ? await Customer.findById(existing.customerProfileId).session(
                  dbSession,
                )
              : null;
            if (!customer && existing) {
              customer = await Customer.findOne({
                userId: existing._id,
              }).session(dbSession);
            }
            customer ??= await Customer.findOne({
              "contact.email": normalizedEmail,
            }).session(dbSession);

            // Never move another user's customer record (orders/addresses).
            if (
              customer?.userId &&
              customer.userId.toString() !== existing?._id.toString()
            ) {
              return null;
            }
            // Google may have verified a third-party email years ago. Only
            // Gmail/Workspace can prove current ownership for automatic linking.
            if (
              !existing?.googleId &&
              (existing || customer) &&
              !googleOwnsEmail
            ) {
              return null;
            }

            const fullName = user.name?.trim() || "Customer";
            const [firstName, ...lastName] = fullName.split(/\s+/);
            const accountUser =
              existing ??
              new User({
                name: fullName,
                email: normalizedEmail,
                role: "CUSTOMER",
                status: "ACTIVE",
                provider: "google",
              });
            customer ??= new Customer({
              type: "PERSONAL",
              contact: { email: normalizedEmail },
              profile: { firstName, lastName: lastName.join(" ") },
              addresses: [],
              metrics: { totalOrders: 0, totalSpend: 0 },
            });

            accountUser.googleId = account.providerAccountId;
            if (user.image) accountUser.image = user.image;
            accountUser.customerProfileId = customer._id;
            customer.userId = accountUser._id;
            await accountUser.save({ session: dbSession });
            await customer.save({ session: dbSession });
            return accountUser;
          });

          if (!dbUser) return false;
          user.id = dbUser._id.toString();
          user.role = dbUser.role;
          user.email = normalizedEmail;
          return true;
        } catch {
          console.error(
            "Google sign-in failed while saving the customer account.",
          );
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // signIn/authorize already resolved the real MongoDB identity.
        token.role = user.role;
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const destination = new URL(url, baseUrl);
        if (destination.origin === new URL(baseUrl).origin) {
          return `${baseUrl}${getSafeCallbackUrl(`${destination.pathname}${destination.search}${destination.hash}`)}`;
        }
      } catch {
        // Invalid callback URLs use the same safe destination as the forms.
      }
      return `${baseUrl}${getSafeCallbackUrl()}`;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: getAuthSecret(),
};
