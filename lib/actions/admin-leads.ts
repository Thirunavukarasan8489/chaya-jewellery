"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import { Lead } from "@/lib/models/lead";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/services/email";
import {
  UpdateLeadStatusSchema,
  AddLeadNoteSchema,
  SendLeadEmailSchema,
} from "@/lib/validations/admin-leads";

const requireLeadManager = async () => {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "LEAD_MANAGER")
  ) {
    throw new Error("Unauthorized");
  }
  return session;
};

const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "QUALIFIED",
  "CONVERTED",
  "CLOSED",
  "SPAM",
];

/**
 * SECURITY: builds the Mongo query from an explicit allowlist instead of
 * forwarding the caller's filter object straight into Lead.find(). Every
 * other list action in the codebase does this; this one used to pass
 * `filters` through untouched, which — since it's reachable by the
 * lowest-privileged admin role that can call this file (LEAD_MANAGER) —
 * meant a caller could pass Mongo query operators beyond what the admin UI
 * ever intends to expose.
 */
function buildLeadFilter(filters: Record<string, unknown>) {
  const query: Record<string, unknown> = {};

  if (
    typeof filters.status === "string" &&
    LEAD_STATUSES.includes(filters.status)
  ) {
    query.status = filters.status;
  }
  if (typeof filters.source === "string" && filters.source.length < 200) {
    query.source = filters.source;
  }
  const from = filters.dateFrom;
  const to = filters.dateTo;
  if (typeof from === "string" || typeof to === "string") {
    const range: Record<string, Date> = {};
    if (typeof from === "string" && !Number.isNaN(Date.parse(from)))
      range.$gte = new Date(from);
    if (typeof to === "string" && !Number.isNaN(Date.parse(to)))
      range.$lte = new Date(to);
    if (Object.keys(range).length) query.createdAt = range;
  }

  return query;
}

export async function getLeads(
  filters: Record<string, unknown> = {},
  page = 1,
  limit = 10,
) {
  try {
    await requireLeadManager();
    await dbConnect();

    const query = buildLeadFilter(filters);
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Lead.countDocuments(query),
    ]);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(leads)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: unknown) {
    console.error("Error fetching leads:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getLeadById(id: string) {
  try {
    await requireLeadManager();
    await dbConnect();

    const lead = await Lead.findById(id).lean();
    if (!lead) throw new Error("Lead not found");

    return { success: true, data: JSON.parse(JSON.stringify(lead)) };
  } catch (error: unknown) {
    console.error("Error fetching lead:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateLeadStatus(id: string, status: string) {
  try {
    await requireLeadManager();
    const parsed = UpdateLeadStatusSchema.parse({ status });

    await dbConnect();
    const lead = await Lead.findByIdAndUpdate(
      id,
      { status: parsed.status },
      { returnDocument: "after" },
    );

    if (!lead) throw new Error("Lead not found");

    revalidatePath(`/admin/leads`);
    revalidatePath(`/admin/leads/${id}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating lead status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function addLeadNote(id: string, content: string) {
  try {
    const session = await requireLeadManager();
    const parsed = AddLeadNoteSchema.parse({ content });

    await dbConnect();
    const lead = await Lead.findById(id);
    if (!lead) throw new Error("Lead not found");

    lead.notes.push({
      content: parsed.content,
      addedBy: session.userId,
      createdAt: new Date(),
    });

    await lead.save();

    revalidatePath(`/admin/leads/${id}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error adding lead note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendLeadEmail(
  id: string,
  subject: string,
  message: string,
) {
  try {
    const session = await requireLeadManager();
    const parsed = SendLeadEmailSchema.parse({ subject, message });

    await dbConnect();
    const lead = await Lead.findById(id);
    if (!lead) throw new Error("Lead not found");
    if (!lead.email) throw new Error("Lead does not have an email address");

    // Send email using nodemailer service
    await sendEmail({
      to: lead.email,
      subject: parsed.subject,
      html: parsed.message,
    });

    // Log in timeline
    lead.notes.push({
      content: `Email Sent: ${parsed.subject}`,
      addedBy: session.userId,
      createdAt: new Date(),
    });

    // Update status to CONTACTED if it's currently NEW
    if (lead.status === "NEW") {
      lead.status = "CONTACTED";
    }

    await lead.save();

    revalidatePath(`/admin/leads/${id}`);
    revalidatePath(`/admin/leads`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error sending lead email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
