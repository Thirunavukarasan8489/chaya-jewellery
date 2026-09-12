"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { User, Phone, Mail, CheckCircle2 } from "lucide-react";
import { updateCustomerProfile } from "@/lib/actions/customer.actions";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileForm({
  userId,
  initialData,
}: {
  userId: string;
  initialData: { firstName: string; lastName: string; email: string; phone: string };
}) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const result = await updateCustomerProfile(userId, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || "",
      });

      if (result.success) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(result.error || "Failed to update profile.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold leading-6 text-plum-900">
            First Name
          </label>
          <div className="relative mt-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-plum-400" aria-hidden="true" />
            </div>
            <input
              id="firstName"
              type="text"
              {...register("firstName")}
              className={`block w-full rounded-xl border-0 py-3 pl-10 text-plum-900 shadow-sm ring-1 ring-inset ${
                errors.firstName ? "ring-red-300 focus:ring-red-500" : "ring-plum-200 focus:ring-gold-500"
              } placeholder:text-plum-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow`}
            />
          </div>
          {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold leading-6 text-plum-900">
            Last Name
          </label>
          <div className="relative mt-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-plum-400" aria-hidden="true" />
            </div>
            <input
              id="lastName"
              type="text"
              {...register("lastName")}
              className={`block w-full rounded-xl border-0 py-3 pl-10 text-plum-900 shadow-sm ring-1 ring-inset ${
                errors.lastName ? "ring-red-300 focus:ring-red-500" : "ring-plum-200 focus:ring-gold-500"
              } placeholder:text-plum-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow`}
            />
          </div>
          {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold leading-6 text-plum-900">
            Email Address
          </label>
          <div className="relative mt-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-5 w-5 text-plum-400" aria-hidden="true" />
            </div>
            <input
              id="email"
              type="email"
              disabled
              {...register("email")}
              className="block w-full rounded-xl border-0 py-3 pl-10 text-plum-500 bg-plum-50 shadow-sm ring-1 ring-inset ring-plum-200 sm:text-sm sm:leading-6 cursor-not-allowed"
            />
          </div>
          <p className="mt-2 text-xs text-plum-500">Email address cannot be changed currently.</p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold leading-6 text-plum-900">
            Phone Number
          </label>
          <div className="relative mt-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Phone className="h-5 w-5 text-plum-400" aria-hidden="true" />
            </div>
            <input
              id="phone"
              type="text"
              {...register("phone")}
              className={`block w-full rounded-xl border-0 py-3 pl-10 text-plum-900 shadow-sm ring-1 ring-inset ${
                errors.phone ? "ring-red-300 focus:ring-red-500" : "ring-plum-200 focus:ring-gold-500"
              } placeholder:text-plum-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow`}
              placeholder="+91 98765 43210"
            />
          </div>
          {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <CheckCircle2 size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
