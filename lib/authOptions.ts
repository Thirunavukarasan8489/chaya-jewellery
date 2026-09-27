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
      id: "otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          throw new Error("Email and verification code are required.");
        }
        const normalizedEmail = credentials.email.toLowerCase().trim();
        const inputOtp = credentials.otp.trim();

        await connectDB();
        const { Otp } = await import("@/lib/models/otp");

        const otpRecord = await Otp.findOne({ email: normalizedEmail }).sort({
          createdAt: -1,
        });
        if (!otpRecord) {
          throw new Error(
            "Verification code expired or not found. Please request a new code.",
          );
        }

        if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
          await Otp.deleteMany({ email: normalizedEmail });
          throw new Error(
            "Verification code has expired. Please request a new code.",
          );
        }

        if ((otpRecord.attempts || 0) >= 5) {
          await Otp.deleteMany({ email: normalizedEmail });
          throw new Error(
            "Too many failed attempts. Please request a new code.",
          );
        }

        const isMatch = await bcrypt.compare(inputOtp, otpRecord.otpHash);
        if (!isMatch) {
          otpRecord.attempts = (otpRecord.attempts || 0) + 1;
          await otpRecord.save();
          throw new Error("Invalid verification code. Please try again.");
        }

        // OTP is valid! Delete used OTP
        await Otp.deleteMany({ email: normalizedEmail });

        // Find or create User and Customer account
        let user = await User.findOne({ email: normalizedEmail });
        let customer = await Customer.findOne({
          "contact.email": normalizedEmail,
        });

        if (!user) {
          const defaultName = customer?.profile?.firstName
            ? `${customer.profile.firstName} ${customer.profile.lastName || ""}`.trim()
            : normalizedEmail.split("@")[0];

          user = await User.create({
            name: defaultName,
            email: normalizedEmail,
            role: "CUSTOMER",
            status: "ACTIVE",
            provider: "email_otp",
          });
        }

        if (!customer) {
          customer = await Customer.create({
            type: "PERSONAL",
            userId: user._id,
            contact: { email: normalizedEmail },
            profile: {
              firstName: user.name?.split(" ")[0] || "Customer",
              lastName: user.name?.split(" ").slice(1).join(" ") || "",
            },
            addresses: [],
            metrics: { totalOrders: 0, totalSpend: 0 },
          });
        } else if (!customer.userId) {
          customer.userId = user._id;
          await customer.save();
        }

        if (!user.customerProfileId) {
          user.customerProfileId = customer._id;
          await user.save();
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image || null,
        };
      },
    }),
    CredentialsProvider({
      id: "credentials",
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
