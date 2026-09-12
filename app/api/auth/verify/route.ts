import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/lib/models/user";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return new NextResponse('Email is required', { status: 400 });
    }

    await dbConnect();

    // Check if the user exists in the DB and is still active.
    // A user can be deleted or deactivated after their JWT was issued, so the
    // token alone isn't enough proof they should still have access.
    const user = await User.findOne({ email }).select('status').lean();

    if (!user || (user as any).status === 'INACTIVE') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error("Auth verify error:", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
