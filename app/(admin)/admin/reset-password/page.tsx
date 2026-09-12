'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, Gem, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (_data: ResetPasswordValues) => {
    setSubmitError(null);
    try {
      // Simulate API call for password reset
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In a real app, you would POST to /api/auth/reset-password with the token from the URL
      setIsSuccess(true);
    } catch (error) {
      console.error('Password reset failed', error);
      setSubmitError('Failed to reset password. The link might be invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-ivory-100 dark:bg-plum-950 p-4 sm:p-8 selection:bg-plum-200 selection:text-plum-900">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-plum-950 mb-4">
            <Gem className="text-gold-400" size={28} />
          </div>
          <h1 className="text-3xl font-display font-semibold text-plum-900 dark:text-ivory-100 tracking-tight">
            Chaya Jewellery
          </h1>
          <p className="text-plum-500 dark:text-plum-400 mt-2 text-sm">Create New Password</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-plum-900 rounded-2xl shadow-lg border border-gray-200 dark:border-plum-800 p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-plum-900 dark:text-ivory-100">Password Reset Complete</h2>
              <p className="text-plum-500 dark:text-plum-400 text-sm">
                Your password has been successfully updated. You can now use your new password to sign in.
              </p>
              <div className="pt-4">
                <Link
                  href="/admin/login"
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-ivory-100 bg-plum-900 hover:bg-plum-800 transition-colors shadow-xs"
                >
                  Sign in to your account
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

              <div className="text-center mb-2">
                <p className="text-sm text-plum-500 dark:text-plum-400">
                  Please enter your new password below.
                </p>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-800">
                  {submitError}
                </div>
              )}

              <div className="space-y-4">
                {/* New Password Input */}
                <div>
                  <label className="block text-sm font-medium text-plum-900 dark:text-ivory-100 mb-1.5" htmlFor="password">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-plum-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password')}
                      className={`block w-full pl-10 pr-10 py-2.5 bg-white dark:bg-plum-950 border ${
                        errors.password
                          ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500'
                          : 'border-gray-300 dark:border-plum-700 focus:ring-plum-600/30 focus:border-plum-600'
                      } rounded-lg text-plum-900 dark:text-ivory-100 placeholder-plum-400 focus:outline-none focus:ring-2 transition-colors text-sm`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-plum-400 hover:text-plum-700 dark:hover:text-plum-200 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-rose-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-sm font-medium text-plum-900 dark:text-ivory-100 mb-1.5" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-plum-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                      className={`block w-full pl-10 pr-10 py-2.5 bg-white dark:bg-plum-950 border ${
                        errors.confirmPassword
                          ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500'
                          : 'border-gray-300 dark:border-plum-700 focus:ring-plum-600/30 focus:border-plum-600'
                      } rounded-lg text-plum-900 dark:text-ivory-100 placeholder-plum-400 focus:outline-none focus:ring-2 transition-colors text-sm`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-plum-400 hover:text-plum-700 dark:hover:text-plum-200 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-rose-500">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-ivory-100 bg-plum-900 hover:bg-plum-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-plum-600 dark:focus:ring-offset-plum-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.99] shadow-xs"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Password'
                )}
              </button>

              <div className="text-center mt-4">
                <Link
                  href="/admin/login"
                  className="text-sm font-medium text-plum-600 dark:text-plum-300 hover:text-plum-900 dark:hover:text-white transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-plum-500 dark:text-plum-400">
          Secure portal for authorized personnel only. <br />
          &copy; {new Date().getFullYear()} Chaya Jewellery Platform.
        </p>
      </div>
    </div>
  );
}
