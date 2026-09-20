"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { BackButton } from "@/components/public/ui/back-button";
import { GoogleSignInButton } from "@/components/public/auth/google-sign-in-button";
import { getSafeCallbackUrl } from "@/lib/auth-redirect";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const oauthError = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setRegisterError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setRegisterError(
          json.error || "Failed to create account. Please try again.",
        );
        return;
      }

      // Automatically sign in upon successful registration
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (loginRes?.ok && !loginRes.error) {
        toast.success("Account created successfully! Welcome to Chaya.");
        router.push(callbackUrl);
        router.refresh();
      } else {
        toast.success("Account created! Please sign in with your credentials.");
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
    } catch {
      setRegisterError("An unexpected error occurred. Please try again.");
    }
  };

  const activeError =
    registerError ||
    (oauthError === "AccessDenied"
      ? "This Google account could not be signed in. Try email and password, or contact us for help."
      : oauthError
        ? "Google sign-in was interrupted or failed. Please try again."
        : null);

  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col justify-center bg-plum-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <BackButton fallbackHref="/" label="Back to Store" />
        </div>
        <h2 className="mt-2 text-center font-display text-4xl font-bold tracking-tight text-plum-900">
          Create an Account
        </h2>
        <p className="mt-2 text-center text-sm text-plum-600">
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-gold-600 transition-colors hover:text-gold-500"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-8 py-10 shadow-xl shadow-plum-200/40 rounded-3xl border border-plum-100/50 relative overflow-hidden group">
          {/* Subtle gradient effect in background */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-none bg-emerald-100/50 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <div className="relative z-10 space-y-6">
            {/* Google OAuth Register */}
            <GoogleSignInButton
              callbackUrl={callbackUrl}
              label="Sign up with Google"
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-plum-200/70" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-plum-500 font-semibold tracking-wider">
                  Or register with email
                </span>
              </div>
            </div>

            {activeError && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3"
              >
                <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{activeError}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-semibold leading-6 text-plum-900"
                  >
                    First Name
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User
                        className="h-5 w-5 text-plum-400"
                        aria-hidden="true"
                      />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      {...register("firstName")}
                      className={`block w-full rounded-xl border-0 py-3.5 pl-10 text-plum-900 shadow-sm ring-1 ring-inset ${
                        errors.firstName
                          ? "ring-red-300 focus:ring-red-500"
                          : "ring-plum-200 focus:ring-gold-500"
                      } placeholder:text-plum-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow`}
                      placeholder="Jane"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-semibold leading-6 text-plum-900"
                  >
                    Last Name
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User
                        className="h-5 w-5 text-plum-400"
                        aria-hidden="true"
                      />
                    </div>
                    <input
                      id="lastName"
                      type="text"
                      {...register("lastName")}
                      className={`block w-full rounded-xl border-0 py-3.5 pl-10 text-plum-900 shadow-sm ring-1 ring-inset ${
                        errors.lastName
                          ? "ring-red-300 focus:ring-red-500"
                          : "ring-plum-200 focus:ring-gold-500"
                      } placeholder:text-plum-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow`}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold leading-6 text-plum-900"
                >
                  Email address
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail
                      className="h-5 w-5 text-plum-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    className={`block w-full rounded-xl border-0 py-3.5 pl-10 text-plum-900 shadow-sm ring-1 ring-inset ${
                      errors.email
                        ? "ring-red-300 focus:ring-red-500"
                        : "ring-plum-200 focus:ring-gold-500"
                    } placeholder:text-plum-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold leading-6 text-plum-900"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock
                      className="h-5 w-5 text-plum-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`block w-full rounded-xl border-0 py-3.5 pl-10 pr-10 text-plum-900 shadow-sm ring-1 ring-inset ${
                      errors.password
                        ? "ring-red-300 focus:ring-red-500"
                        : "ring-plum-200 focus:ring-gold-500"
                    } placeholder:text-plum-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-plum-400 hover:text-plum-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold leading-6 text-plum-900"
                >
                  Confirm Password
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock
                      className="h-5 w-5 text-plum-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className={`block w-full rounded-xl border-0 py-3.5 pl-10 pr-10 text-plum-900 shadow-sm ring-1 ring-inset ${
                      errors.confirmPassword
                        ? "ring-red-300 focus:ring-red-500"
                        : "ring-plum-200 focus:ring-gold-500"
                    } placeholder:text-plum-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex w-full justify-center items-center gap-2 rounded-xl bg-gold-500 px-3 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                  {isSubmitting ? "Creating account..." : "Create account"}
                  {!isSubmitting && (
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-100px)] items-center justify-center bg-plum-50">
          <div className="skeleton h-96 w-full max-w-md rounded-2xl" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
