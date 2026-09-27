"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Store,
  Mail,
  Phone,
  MapPin,
  Share2,
  Receipt,
  FileText,
  ShieldCheck,
  Building2,
  Percent,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { updateSettings } from "@/lib/actions/settings.actions";

export default function CompanySettingsForm({
  initialData,
}: {
  initialData: any;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"basic" | "gst">("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || "Chaya Jewellery",
    supportEmail: initialData?.supportEmail || "",
    supportPhone: initialData?.supportPhone || "",
    whatsappNumber: initialData?.whatsappNumber || "",
    businessAddress: initialData?.businessAddress || "",

    // GST Configuration
    isGstEnabled: initialData?.isGstEnabled !== false,
    legalName: initialData?.legalName || "",
    gstin: initialData?.gstin || "",
    panNumber: initialData?.panNumber || "",
    gstState: initialData?.gstState || "",
    gstRate: initialData?.gstRate ?? 3,
    hsnCode: initialData?.hsnCode || "7113",
    invoicePrefix: initialData?.invoicePrefix || "CHAYA",

    socialLinks: {
      facebook: initialData?.socialLinks?.facebook || "",
      instagram: initialData?.socialLinks?.instagram || "",
      twitter: initialData?.socialLinks?.twitter || "",
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name.startsWith("social_")) {
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
    <div className="space-y-6">
      {/* Tabs Navigation Header */}
      <div className="flex border-b border-gray-200 dark:border-plum-800 bg-white dark:bg-plum-950 rounded-t-2xl p-2 gap-2 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("basic")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === "basic"
              ? "bg-plum-900 text-white dark:bg-gold-500 dark:text-plum-950 font-semibold shadow-sm"
              : "text-plum-700 dark:text-plum-300 hover:bg-gray-50 dark:hover:bg-plum-900"
          }`}
        >
          <Store size={18} />
          1. Basic Configuration
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gst")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === "gst"
              ? "bg-plum-900 text-white dark:bg-gold-500 dark:text-plum-950 font-semibold shadow-sm"
              : "text-plum-700 dark:text-plum-300 hover:bg-gray-50 dark:hover:bg-plum-900"
          }`}
        >
          <Receipt size={18} />
          2. GST & Invoicing Configuration
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: BASIC CONFIG */}
        {activeTab === "basic" && (
          <div className="space-y-6">
            {/* General Info */}
            <div className="bg-white dark:bg-plum-950 border border-gray-200 dark:border-plum-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 flex items-center gap-2 bg-gray-50/50 dark:bg-plum-900/40">
                <Store size={18} className="text-gold-500" />
                <h2 className="text-base font-semibold text-plum-900 dark:text-ivory-100">
                  Business Profile
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Store / Company Display Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Support Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      name="supportEmail"
                      value={formData.supportEmail}
                      onChange={handleChange}
                      placeholder="care@chayajewellery.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Support Helpline Phone
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      name="supportPhone"
                      value={formData.supportPhone}
                      onChange={handleChange}
                      placeholder="+91 98400 12345"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Official WhatsApp Number
                  </label>
                  <input
                    type="text"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    placeholder="+91 98400 12345"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                  />
                  <p className="text-[11px] text-gray-400">
                    Used for WhatsApp Chat & Consultation CTAs across the storefront.
                  </p>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Registered Store / Showroom Address
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3.5 top-3.5 text-gray-400"
                    />
                    <textarea
                      name="businessAddress"
                      rows={3}
                      value={formData.businessAddress}
                      onChange={handleChange}
                      placeholder="e.g. 123 Gold Souk, Commercial Street, Chennai, Tamil Nadu, 600001"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white dark:bg-plum-950 border border-gray-200 dark:border-plum-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 flex items-center gap-2 bg-gray-50/50 dark:bg-plum-900/40">
                <Share2 size={18} className="text-gold-500" />
                <h2 className="text-base font-semibold text-plum-900 dark:text-ivory-100">
                  Social Media Links
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Instagram Handle / URL
                  </label>
                  <input
                    type="url"
                    name="social_instagram"
                    value={formData.socialLinks.instagram}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                    placeholder="https://instagram.com/chayajewellery"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    name="social_facebook"
                    value={formData.socialLinks.facebook}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                    placeholder="https://facebook.com/chayajewellery"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GST CONFIG */}
        {activeTab === "gst" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-plum-950 border border-gray-200 dark:border-plum-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 flex items-center justify-between bg-gray-50/50 dark:bg-plum-900/40">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-gold-500" />
                  <h2 className="text-base font-semibold text-plum-900 dark:text-ivory-100">
                    GST & Tax Identification
                  </h2>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-plum-800 dark:text-plum-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isGstEnabled"
                    checked={formData.isGstEnabled}
                    onChange={handleChange}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  GST Enabled for Orders & Invoices
                </label>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Legal Entity Name (As per GST Certificate) *
                  </label>
                  <div className="relative">
                    <Building2
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      name="legalName"
                      value={formData.legalName}
                      onChange={handleChange}
                      placeholder="e.g. Chaya Jewellery Private Limited"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    GSTIN / Goods & Services Tax ID *
                  </label>
                  <div className="relative">
                    <ShieldCheck
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleChange}
                      placeholder="e.g. 33AABCC1234F1Z5"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="e.g. AABCC1234F"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Registered State (State Code)
                  </label>
                  <input
                    type="text"
                    name="gstState"
                    value={formData.gstState}
                    onChange={handleChange}
                    placeholder="e.g. Tamil Nadu (33)"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Default GST Rate (%)
                  </label>
                  <div className="relative">
                    <Percent
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      name="gstRate"
                      value={formData.gstRate}
                      onChange={handleChange}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="3"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Standard GST rate for gold/silver jewellery in India is 3% (1.5% CGST + 1.5% SGST).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Default HSN Code
                  </label>
                  <input
                    type="text"
                    name="hsnCode"
                    value={formData.hsnCode}
                    onChange={handleChange}
                    placeholder="e.g. 7113"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm"
                  />
                  <p className="text-[11px] text-gray-400">
                    HSN 7113 is the standard code for articles of jewellery of precious metal.
                  </p>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-plum-900 dark:text-ivory-200">
                    Invoice Number Prefix
                  </label>
                  <div className="relative">
                    <FileText
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      name="invoicePrefix"
                      value={formData.invoicePrefix}
                      onChange={handleChange}
                      placeholder="e.g. CHAYA"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-plum-900 border border-gray-300 dark:border-plum-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-plum-900 dark:text-ivory-100 text-sm uppercase"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Generated invoices will follow the format: {formData.invoicePrefix || "INV"}-2026-0001
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-sm text-sm"
          >
            <Save size={18} />
            {isSubmitting ? "Saving Configuration..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

