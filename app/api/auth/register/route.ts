import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import { User } from "@/lib/models/user";
import { Customer } from "@/lib/models/customer";

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Customer profile first
    const customer = await Customer.create({
      type: "PERSONAL",
      contact: { email },
      profile: { firstName, lastName },
    });

    // Create User account linked to Customer profile
    const user = await User.create({
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      role: "CUSTOMER",
      customerProfileId: customer._id,
    });

    // Link back (optional, but good for bidirectional mapping if needed, although we already set it)
    await Customer.findByIdAndUpdate(customer._id, { userId: user._id });

    return NextResponse.json(
      { success: true, message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
