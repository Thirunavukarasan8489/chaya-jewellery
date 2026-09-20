"use client";

import { useState } from "react";
import {
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  User,
  Calendar,
  Edit,
  Send,
} from "lucide-react";
import { updateLeadStatus, sendLeadEmail } from "@/lib/actions/admin-leads";
import StatusPill from "@/components/admin/ui/StatusPill";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";
import { LeadType } from "@/lib/types";

export default function LeadDetailPanel({ lead }: { lead: LeadType }) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState(
    `Regarding your enquiry at Chaya Jewellery`,
  );
  const [emailMessage, setEmailMessage] = useState("");

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setIsUpdatingStatus(true);
    await updateLeadStatus(lead._id.toString(), e.target.value);
    setIsUpdatingStatus(false);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject || !emailMessage) return;

    setIsSendingEmail(true);
    await sendLeadEmail(lead._id.toString(), emailSubject, emailMessage);
    setEmailMessage("");
    setIsSendingEmail(false);
    alert("Email sent successfully");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column (Customer & Enquiry) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Customer Info Card */}
        <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-gold-200 dark:border-gold-800">
            <h2 className="text-lg font-semibold text-gold-800 dark:text-gold-100 flex items-center gap-2">
              <User size={18} className="text-gold-400" />
              Customer Information
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gold-500 mb-1">Full Name</p>
              <p className="font-medium text-gold-900 dark:text-gold-100">
                {lead.customerName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gold-500 mb-1">Phone</p>
              <a
                href={`tel:${lead.phone}`}
                className="font-medium text-gold-600 hover:underline flex items-center gap-1"
              >
                <Phone size={14} /> {lead.phone}
              </a>
            </div>
            {lead.email && (
              <div>
                <p className="text-sm text-gold-500 mb-1">Email</p>
                <a
                  href={`mailto:${lead.email}`}
                  className="font-medium text-gold-600 hover:underline flex items-center gap-1"
                >
                  <Mail size={14} /> {lead.email}
                </a>
              </div>
            )}
            {lead.location && (
              <div>
                <p className="text-sm text-gold-500 mb-1">Location</p>
                <p className="font-medium text-gold-900 dark:text-gold-100 flex items-center gap-1">
                  <MapPin size={14} className="text-gold-400" /> {lead.location}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Enquiry Info Card */}
        <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-gold-200 dark:border-gold-800">
            <h2 className="text-lg font-semibold text-gold-800 dark:text-gold-100 flex items-center gap-2">
              <MessageCircle size={18} className="text-gold-400" />
              Enquiry Details
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gold-500 mb-1">Source</p>
                <p className="font-medium text-gold-900 dark:text-gold-100">
                  {lead.source}
                </p>
              </div>
              <div>
                <p className="text-sm text-gold-500 mb-1">Date</p>
                <p className="font-medium text-gold-900 dark:text-gold-100 flex items-center gap-1">
                  <Calendar size={14} className="text-gold-400" />{" "}
                  {new Date(lead.createdAt).toLocaleDateString()}
                </p>
              </div>
              {lead.product && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gold-500 mb-1">
                    Product of Interest
                  </p>
                  <p className="font-medium text-gold-900 dark:text-gold-100">
                    {lead.product.name || "View Product"}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gold-50 dark:bg-gold-800 p-4 rounded-md border border-gold-100 dark:border-gold-700">
              <p className="text-sm text-gold-500 mb-2">Message:</p>
              <p className="text-gold-800 dark:text-gold-200 whitespace-pre-wrap">
                {lead.message}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (Management & Actions) */}
      <div className="space-y-6">
        {/* Management Card */}
        <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-gold-200 dark:border-gold-800">
            <h2 className="text-lg font-semibold text-gold-800 dark:text-gold-100 flex items-center gap-2">
              <Edit size={18} className="text-gold-400" />
              Management
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm text-gold-500 mb-2">Current Status</p>
              <div className="flex items-center gap-3">
                <StatusPill status={lead.status} type="lead" />
                {isUpdatingStatus && (
                  <span className="text-xs text-gold-400 animate-pulse">
                    Updating...
                  </span>
                )}
              </div>
            </div>

            <div>
              <label
                className="block text-sm text-gold-500 mb-1"
                htmlFor="status-select"
              >
                Change Status
              </label>
              <AdminSelect
                id="status-select"
                value={
                  [
                    { value: "NEW", label: "New" },
                    { value: "CONTACTED", label: "Contacted" },
                    { value: "FOLLOW_UP", label: "Follow Up" },
                    { value: "QUALIFIED", label: "Qualified" },
                    { value: "CONVERTED", label: "Converted" },
                    { value: "CLOSED", label: "Closed" },
                    { value: "SPAM", label: "Spam" },
                  ].find((o) => o.value === lead.status) || null
                }
                onChange={(opt: any) =>
                  handleStatusChange({
                    target: { value: opt ? opt.value : lead.status },
                  } as any)
                }
                isDisabled={isUpdatingStatus}
                options={[
                  { value: "NEW", label: "New" },
                  { value: "CONTACTED", label: "Contacted" },
                  { value: "FOLLOW_UP", label: "Follow Up" },
                  { value: "QUALIFIED", label: "Qualified" },
                  { value: "CONVERTED", label: "Converted" },
                  { value: "CLOSED", label: "Closed" },
                  { value: "SPAM", label: "Spam" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Email Action Card */}
        {lead.email && (
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-gold-200 dark:border-gold-800">
              <h2 className="text-lg font-semibold text-gold-800 dark:text-gold-100 flex items-center gap-2">
                <Send size={18} className="text-gold-400" />
                Send Email
              </h2>
            </div>
            <div className="p-5">
              <form onSubmit={handleSendEmail} className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-gold-50 dark:bg-gold-800 border border-gold-200 dark:border-gold-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Type your message here..."
                    rows={4}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full bg-gold-50 dark:bg-gold-800 border border-gold-200 dark:border-gold-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full bg-gold-600 hover:bg-gold-700 text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50 text-sm flex justify-center items-center gap-2"
                >
                  {isSendingEmail ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send size={16} /> Send directly via Email
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
