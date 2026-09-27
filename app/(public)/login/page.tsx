"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { BackButton } from "@/components/public/ui/back-button";
import { GoogleSignInButton } from "@/components/public/auth/google-sign-in-button";
import { getSafeCallbackUrl } from "@/lib/auth-redirect";
import { sendLoginOtp } from "@/lib/actions/auth.actions";
import toast from "react-hot-toast";

const passwordLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type PasswordLoginFormValues = z.infer<typeof passwordLoginSchema>;

function LoginForm() {
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // OTP State
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl") || "/account/orders");
  const oauthError = searchParams.get("error");

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordLoginFormValues>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  // Handle Requesting OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const emailToUse = otpEmail.trim().toLowerCase();
    if (!emailToUse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
      setLoginError("Please enter a valid email address.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await sendLoginOtp(emailToUse);
      if (res.success) {
        setOtpSent(true);
        setCountdown(45);
        toast.success("Verification code sent to your email!");
      } else {
        setLoginError(res.error || "Failed to send code. Please try again.");
      }
    } catch {
      setLoginError("An unexpected error occurred. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Verifying OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const trimmedOtp = otpCode.trim();
    if (trimmedOtp.length < 6) {
      setLoginError("Please enter the complete 6-digit code.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const result = await signIn("otp", {
        redirect: false,
        email: otpEmail.trim().toLowerCase(),
        otp: trimmedOtp,
      });

      if (!result?.ok || result.error) {
        setLoginError(result?.error || "Invalid verification code. Please check and try again.");
        return;
      }

      toast.success("Signed in successfully!");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setLoginError("Verification failed. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Password Login
  const onPasswordSubmit = async (data: PasswordLoginFormValues) => {
    setLoginError(null);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (!result?.ok || result.error) {
        setLoginError("Invalid email or password. Please try again.");
        return;
      }

      toast.success("Signed in successfully!");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setLoginError("An unexpected error occurred. Please try again.");
    }
  };

  const activeError =
    loginError ||
    (oauthError === "AccessDenied"
      ? "This Google account could not be signed in. Try email OTP, or contact us for help."
      : oauthError
        ? "Google sign-in was interrupted or failed. Please try again."
        : null);

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
          <div className="mb-6 flex items-center justify-between">
            <BackButton fallbackHref="/" label="Back to Store" />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-display text-3xl font-semibold text-plum-900 lg:text-4xl">
              Welcome to Chaya
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Sign in to track orders, manage addresses, and view your purchase history.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-ivory-300 bg-white p-6 shadow-lg sm:p-8 space-y-6">
            {/* Google OAuth Login */}
            <GoogleSignInButton
              callbackUrl={callbackUrl}
              label="Continue with Google"
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ivory-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-ink-soft font-medium tracking-wider">
                  Or Sign In with Email
                </span>
              </div>
            </div>

            {/* Authentication Method Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-ivory-100 rounded-xl border border-ivory-300 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("otp");
                  setLoginError(null);
                }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMethod === "otp"
                    ? "bg-plum-900 text-gold-300 shadow-sm"
                    : "text-plum-800 hover:text-plum-950"
                }`}
              >
                <Zap size={13} className={authMethod === "otp" ? "text-gold-400" : "text-gold-600"} />
                <span>Instant OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("password");
                  setLoginError(null);
                }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMethod === "password"
                    ? "bg-plum-900 text-gold-300 shadow-sm"
                    : "text-plum-800 hover:text-plum-950"
                }`}
              >
                <KeyRound size={13} />
                <span>Password</span>
              </button>
            </div>

            {/* Global Error Banner */}
            {activeError && (
              <div
                role="alert"
                className="rounded-xl border border-danger-100 bg-danger-50 p-3 text-sm text-danger-700 animate-in fade-in duration-200"
              >
                {activeError}
              </div>
            )}

            {/* ── METHOD 1: EMAIL OTP SIGN IN ── */}
            {authMethod === "otp" && (
              <div>
                {!otpSent ? (
                  /* Step A: Request OTP */
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label
                        htmlFor="otpEmail"
                        className="mb-1.5 block text-sm font-medium text-plum-900"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Mail className="h-5 w-5 text-plum-400" />
                        </div>
                        <input
                          id="otpEmail"
                          type="email"
                          autoComplete="email"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          className="block w-full rounded-xl border border-ivory-300 py-2.5 pr-3 pl-10 text-sm text-plum-900 placeholder-plum-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/30 focus:outline-none transition-colors"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-ink-soft">
                        We will email a 6-digit code. Any order placed with this email will be linked.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className={buttonStyles({
                        size: "lg",
                        full: true,
                        className: "font-semibold",
                      })}
                    >
                      {otpLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step B: Enter & Verify OTP */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="p-3 bg-ivory-100 rounded-xl border border-ivory-300 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <span className="text-ink-soft block text-[10px] uppercase font-bold tracking-wider">
                          Code sent to:
                        </span>
                        <strong className="text-plum-950 truncate block">
                          {otpEmail}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                        }}
                        className="text-gold-700 font-bold hover:underline shrink-0 text-xs"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label
                        htmlFor="otpCode"
                        className="mb-1.5 block text-sm font-medium text-plum-900"
                      >
                        Enter 6-Digit Code
                      </label>
                      <input
                        id="otpCode"
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className="block w-full text-center tracking-[8px] font-mono text-xl font-bold rounded-xl border border-ivory-300 py-3 text-plum-950 placeholder-plum-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/30 focus:outline-none transition-colors"
                        placeholder="••••••"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      {countdown > 0 ? (
                        <span className="text-ink-soft">
                          Resend available in <strong className="text-plum-900">{countdown}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={otpLoading}
                          className="text-gold-700 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <RefreshCw size={12} className={otpLoading ? "animate-spin" : ""} />
                          <span>Resend verification code</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={verifyingOtp || otpCode.length !== 6}
                      className={buttonStyles({
                        size: "lg",
                        full: true,
                        className: "font-semibold",
                      })}
                    >
                      {verifyingOtp ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          <span>Verify & View Orders</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── METHOD 2: PASSWORD SIGN IN ── */}
            {authMethod === "password" && (
              <form
                onSubmit={handleSubmit(onPasswordSubmit)}
                className="space-y-4"
                noValidate
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-plum-900"
                  >
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
                      className={`block w-full rounded-xl border py-2.5 pr-3 pl-10 text-sm text-plum-900 placeholder-plum-400 transition-colors focus:ring-2 focus:outline-none ${
                        errors.email
                          ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
                          : "border-ivory-300 focus:border-gold-500 focus:ring-gold-400/30"
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-danger-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-plum-900"
                    >
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
                      className={`block w-full rounded-xl border py-2.5 pr-10 pl-10 text-sm text-plum-900 placeholder-plum-400 transition-colors focus:ring-2 focus:outline-none ${
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
                    <p className="mt-1 text-sm text-danger-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    {...register("rememberMe")}
                    className="h-4 w-4 rounded border-ivory-300 text-gold-600 focus:ring-gold-400/40"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 block text-sm text-ink-soft"
                  >
                    Keep me signed in
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={buttonStyles({
                    size: "lg",
                    full: true,
                    className: "font-semibold",
                  })}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
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
            )}
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Looking for an instant order tracking update?{" "}
            <Link
              href="/track-order"
              className="font-semibold text-gold-700 hover:text-gold-600"
            >
              Track by Order Number
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
