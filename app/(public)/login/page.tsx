"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
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
      } else {
        router.push("/account/dashboard");
      }
    } catch (error) {
      setLoginError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col justify-center bg-plum-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center font-display text-4xl font-bold tracking-tight text-plum-900">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-plum-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-gold-600 transition-colors hover:text-gold-500"
          >
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-8 py-10 shadow-xl shadow-plum-200/40 rounded-3xl border border-plum-100/50 relative overflow-hidden group">
          {/* Subtle gradient effect in background */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-gold-100/50 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <form className="space-y-6 relative z-10" onSubmit={handleSubmit(onSubmit)}>
            {loginError && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{loginError}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold leading-6 text-plum-900"
              >
                Email address
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-plum-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className={`block w-full rounded-xl border-0 py-3.5 pl-10 text-plum-900 shadow-sm ring-1 ring-inset ${
                    errors.email ? "ring-red-300 focus:ring-red-500" : "ring-plum-200 focus:ring-gold-500"
                  } placeholder:text-plum-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold leading-6 text-plum-900"
                >
                  Password
                </label>
                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-gold-600 hover:text-gold-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-plum-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className={`block w-full rounded-xl border-0 py-3.5 pl-10 pr-10 text-plum-900 shadow-sm ring-1 ring-inset ${
                    errors.password ? "ring-red-300 focus:ring-red-500" : "ring-plum-200 focus:ring-gold-500"
                  } placeholder:text-plum-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-plum-400 hover:text-plum-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex w-full justify-center items-center gap-2 rounded-xl bg-gold-500 px-3 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                {isSubmitting ? "Signing in..." : "Sign in"}
                {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
