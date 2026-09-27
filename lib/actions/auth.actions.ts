"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { Otp } from "@/lib/models/otp";
import { sendEmail } from "@/lib/services/email";

export async function sendLoginOtp(email: string) {
  try {
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    await dbConnect();

    // Check rate limiting: prevent resend within 45 seconds
    const existing = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    if (existing && Date.now() - new Date(existing.createdAt).getTime() < 45 * 1000) {
      const waitSec = Math.ceil((45 * 1000 - (Date.now() - new Date(existing.createdAt).getTime())) / 1000);
      return {
        success: false,
        error: `Please wait ${waitSec}s before requesting a new code.`,
      };
    }

    // Generate secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete prior OTPs for this email and save new one
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({
      email: normalizedEmail,
      otpHash,
      expiresAt,
      attempts: 0,
    });

    // Send luxurious Chaya Jewellery verification email
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #FFFDF9; border: 1px solid #E9DFE7; border-radius: 16px; color: #26002F;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4A0B52; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: 1px;">CHAYA JEWELLERY</h1>
          <p style="color: #D9A441; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Exclusive Fine Jewellery</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #F8F1F7; text-align: center;">
          <p style="font-size: 15px; margin: 0 0 16px; color: #26002F;">Your one-time verification code to view your orders and account:</p>
          <div style="display: inline-block; background-color: #26002F; color: #F4D58A; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 14px 28px; border-radius: 10px; border: 1px solid #D9A441; margin: 12px 0;">
            ${otpCode}
          </div>
          <p style="font-size: 12px; color: #756B76; margin-top: 16px;">This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.</p>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #756B76;">
          <p style="margin: 0;">If you didn't request this code, you can safely ignore this email.</p>
          <p style="margin: 6px 0 0;">© ${new Date().getFullYear()} Chaya Jewellery. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: normalizedEmail,
      subject: `Your Chaya Jewellery Verification Code: ${otpCode}`,
      html: emailHtml,
    });

    return {
      success: true,
      message: "Verification code sent to your email.",
    };
  } catch (error: any) {
    console.error("sendLoginOtp error:", error);
    return { success: false, error: "Failed to send verification code. Please try again." };
  }
}
