"use client";

import { useState } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Gem,
  Users,
  Boxes,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const highlights = [
  { icon: Boxes, label: "Live inventory & reservations" },
  { icon: Users, label: "Lead CRM & customer records" },
  { icon: BarChart3, label: "Orders, payments & revenue KPIs" },
];

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
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
        setLoginError("Invalid credentials. Please try again.");
        console.error(result.error);
      } else {
        router.push("/admin");
      }
    } catch (error) {
      console.error("Login failed", error);
      setLoginError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-ivory-100 dark:bg-plum-950 selection:bg-plum-200 selection:text-plum-900">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-2/5 relative overflow-hidden bg-plum-950 text-ivory-100 flex-col justify-between p-0 shrink-0">
        <div className="absolute inset-0">
          <Image
            src="/images/login-page.png"
            alt="Chaya Jewellery"
            width={941}
            height={1672}
            className="h-full w-full object-cover object-center"
          />
        </div>
        {/* Decorative facet pattern */}
        {/* <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent 45%, rgba(221,182,58,0.9) 45%, rgba(221,182,58,0.9) 55%, transparent 55%), linear-gradient(45deg, transparent 45%, rgba(221,182,58,0.9) 45%, rgba(221,182,58,0.9) 55%, transparent 55%)',
            backgroundSize: '15px 15px',
          }}
        /> */}
        {/* <div className="absolute -top-24 -right-24 w-96 h-96 rounded-none bg-gold-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-none bg-emerald-500/10 blur-3xl" /> */}

        {/* <div className="relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-500/15 border border-gold-400/30 mb-8">
            <Gem className="text-gold-400" size={26} />
          </div>
          <div className="">
            <Image src="/logo.png" alt="Chaya Jewellery" width={150} height={100} className="rounded-lg bg-white" />
          </div>
          <h1 className="text-foil font-display text-4xl xl:text-5xl font-semibold tracking-tight">
            Chaya Jewellery
          </h1>
          <p className="mt-3 text-plum-300 text-sm tracking-[0.2em] uppercase">
            Operations Console
          </p>
          <p className="mt-6 text-plum-200 text-base leading-relaxed max-w-sm">
            Manage catalogue, orders, leads and inventory from a single, secure
            command center built for the Chaya Jewellery trade floor.
          </p>
        </div> */}

        {/* <div className="relative space-y-4">
          {highlights.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 text-plum-200 text-sm">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-plum-900 border border-plum-800">
                <Icon size={16} className="text-emerald-400" />
              </span>
              {label}
            </div>
          ))}
        </div> */}

        {/* <p className="relative text-xs text-plum-400">
          &copy; {new Date().getFullYear()} Chaya Jewellery Platform. All rights reserved.
        </p> */}
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile-only branding */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-plum-950 mb-4">
              <Gem className="text-gold-400" size={28} />
            </div>
            <h1 className="text-3xl font-display font-semibold text-plum-900 dark:text-ivory-100 tracking-tight">
              Chaya Jewellery
            </h1>
            <p className="text-plum-500 dark:text-plum-400 mt-2 text-sm">
              Sign in to your administration panel
            </p>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-display font-semibold text-plum-900 dark:text-ivory-100">
              Welcome back
            </h2>
            <p className="text-plum-500 dark:text-plum-400 mt-1.5 text-sm">
              Sign in to your administration panel to continue.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-plum-900 rounded-2xl shadow-lg border border-gray-200 dark:border-plum-800 p-6 sm:p-8">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              {loginError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-800">
                  {loginError}
                </div>
              )}

              <div className="space-y-4">
                {/* Email Input */}
                <div>
                  <label
                    className="block text-sm font-medium text-plum-900 dark:text-ivory-100 mb-1.5"
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-plum-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register("email")}
                      className={`block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-plum-950 border ${
                        errors.email
                          ? "border-rose-500 focus:ring-rose-500/30 focus:border-rose-500"
                          : "border-gray-300 dark:border-plum-700 focus:ring-plum-600/30 focus:border-plum-600"
                      } rounded-lg text-plum-900 dark:text-ivory-100 placeholder-plum-400 focus:outline-none focus:ring-2 transition-colors text-sm`}
                      placeholder="admin@chayajewellery.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-rose-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="block text-sm font-medium text-plum-900 dark:text-ivory-100"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <Link
                      href="/admin/forgot-password"
                      className="text-sm font-medium text-plum-600 dark:text-plum-300 hover:text-plum-900 dark:hover:text-white transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-plum-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...register("password")}
                      className={`block w-full pl-10 pr-10 py-2.5 bg-white dark:bg-plum-950 border ${
                        errors.password
                          ? "border-rose-500 focus:ring-rose-500/30 focus:border-rose-500"
                          : "border-gray-300 dark:border-plum-700 focus:ring-plum-600/30 focus:border-plum-600"
                      } rounded-lg text-plum-900 dark:text-ivory-100 placeholder-plum-400 focus:outline-none focus:ring-2 transition-colors text-sm`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-plum-400 hover:text-plum-700 dark:hover:text-plum-200 transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-rose-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  {...register("rememberMe")}
                  className="h-4 w-4 rounded border-gray-300 dark:border-plum-600 text-plum-700 focus:ring-plum-600/40 dark:bg-plum-800"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-plum-600 dark:text-plum-300"
                >
                  Keep me signed in
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-ivory-100 bg-plum-900 hover:bg-plum-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-plum-600 dark:focus:ring-offset-plum-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.99] shadow-xs"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    <ShieldCheck size={16} className="text-emerald-400" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-plum-500 dark:text-plum-400">
            Secure portal for authorized personnel only. <br />
            &copy; {new Date().getFullYear()} Chaya Jewellery Platform.
          </p>
        </div>
      </div>
    </div>
  );
}
