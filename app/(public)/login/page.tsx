"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/public/layout/logo";
import { buttonStyles } from "@/components/public/ui/button";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setLoginError("Invalid email or password. Please try again.");
        return;
      }

      // Honour ?callbackUrl= (set by the proxy when an unauthenticated
      // visitor is redirected here from a protected /account/* route) so
      // signing in lands back where they were headed, not always the
      // dashboard. Only ever follow a same-site relative path.
      const callbackUrl = searchParams.get("callbackUrl");
      router.push(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/account/dashboard");
    } catch {
      setLoginError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-100px)] w-full flex-col bg-ivory-100 selection:bg-plum-200 selection:text-plum-900 lg:flex-row">
      {/* Brand panel — desktop only */}
      <div className="relative hidden shrink-0 overflow-hidden bg-plum-950 lg:block lg:w-[44%] xl:w-2/5">
        <Image
          src="/images/login-page.png"
          alt="Chaya Jewellery"
          fill
          sizes="44vw"
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-4 py-10 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile-only branding */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-display text-3xl font-semibold text-plum-900 lg:text-4xl">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Sign in to track orders, save addresses and check out faster.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-ivory-300 bg-white p-6 shadow-lg sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {loginError && (
                <div className="rounded-lg border border-danger-100 bg-danger-50 p-3 text-sm text-danger-700">
                  {loginError}
                </div>
              )}

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-plum-900">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-plum-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register("email")}
                      className={`block w-full rounded-lg border py-2.5 pr-3 pl-10 text-sm text-plum-900 placeholder-plum-400 transition-colors focus:ring-2 focus:outline-none ${
                        errors.email
                          ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
                          : "border-ivory-300 focus:border-gold-500 focus:ring-gold-400/30"
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-plum-900">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-gold-700 hover:text-gold-600"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-plum-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...register("password")}
                      className={`block w-full rounded-lg border py-2.5 pr-10 pl-10 text-sm text-plum-900 placeholder-plum-400 transition-colors focus:ring-2 focus:outline-none ${
                        errors.password
                          ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
                          : "border-ivory-300 focus:border-gold-500 focus:ring-gold-400/30"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-plum-400 hover:text-plum-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  {...register("rememberMe")}
                  className="h-4 w-4 rounded border-ivory-300 text-gold-600 focus:ring-gold-400/40"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-ink-soft">
                  Keep me signed in
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={buttonStyles({ size: "lg", full: true, className: "font-semibold" })}
              >
                {isSubmitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-gold-700 hover:text-gold-600">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-100px)] items-center justify-center bg-ivory-100">
          <div className="skeleton h-96 w-full max-w-md rounded-2xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
