"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Store, Mail, Phone, MapPin, Share2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateSettings } from "@/lib/actions/settings.actions";

export default function CompanySettingsForm({
  initialData,
}: {
  initialData: any;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || "Chaya Jewellery",
    supportEmail: initialData?.supportEmail || "",
    supportPhone: initialData?.supportPhone || "",
    whatsappNumber: initialData?.whatsappNumber || "",
    businessAddress: initialData?.businessAddress || "",
    gstin: initialData?.gstin || "",
    socialLinks: {
      facebook: initialData?.socialLinks?.facebook || "",
      instagram: initialData?.socialLinks?.instagram || "",
      twitter: initialData?.socialLinks?.twitter || "",
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("social_")) {
      const network = name.split("_")[1];
      setFormData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [network]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await updateSettings(formData);
      if (!res.success) throw new Error(res.error);

      toast.success("Company settings updated successfully");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 flex items-center gap-2 bg-gray-50/50 dark:bg-plum-950/50">
          <Store size={18} className="text-plum-500" />
          <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100">
            Basic Information
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white dark:bg-plum-950 border border-gray-300 dark:border-plum-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-plum-900 dark:text-ivory-100"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
              GSTIN / Tax ID
            </label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white dark:bg-plum-950 border border-gray-300 dark:border-plum-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-plum-900 dark:text-ivory-100 uppercase"
              placeholder="e.g. 27ABCDE1234F1Z5"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 flex items-center gap-2 bg-gray-50/50 dark:bg-plum-950/50">
          <Phone size={18} className="text-plum-500" />
          <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100">
            Contact Details
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
              Support Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                name="supportEmail"
                value={formData.supportEmail}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-plum-950 border border-gray-300 dark:border-plum-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-plum-900 dark:text-ivory-100"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
              Support Phone
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                name="supportPhone"
                value={formData.supportPhone}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-plum-950 border border-gray-300 dark:border-plum-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-plum-900 dark:text-ivory-100"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
              WhatsApp Number
            </label>
            <input
              type="text"
              name="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 bg-white dark:bg-plum-950 border border-gray-300 dark:border-plum-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-plum-900 dark:text-ivory-100"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
              Registered Business Address
            </label>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <textarea
                name="businessAddress"
                rows={3}
                value={formData.businessAddress}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-plum-950 border border-gray-300 dark:border-plum-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-plum-900 dark:text-ivory-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 flex items-center gap-2 bg-gray-50/50 dark:bg-plum-950/50">
          <Share2 size={18} className="text-plum-500" />
          <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100">
            Social Media
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
              Instagram URL
            </label>
            <input
              type="url"
              name="social_instagram"
              value={formData.socialLinks.instagram}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white dark:bg-plum-950 border border-gray-300 dark:border-plum-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-plum-900 dark:text-ivory-100"
              placeholder="https://instagram.com/..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
              Facebook URL
            </label>
            <input
              type="url"
              name="social_facebook"
              value={formData.socialLinks.facebook}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white dark:bg-plum-950 border border-gray-300 dark:border-plum-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-plum-900 dark:text-ivory-100"
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors shadow-sm"
        >
          <Save size={18} />
          {isSubmitting ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
