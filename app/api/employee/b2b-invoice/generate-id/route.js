import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";
import { getNextAvailableInvoiceNumber } from "@/lib/invoiceNumber";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nextId = await getNextAvailableInvoiceNumber();

    return NextResponse.json({ success: true, nextId }, { status: 200 });
  } catch (error) {
    console.error("Error generating B2B Invoice ID:", error);
    return NextResponse.json(
      { error: "Failed to generate Invoice ID" },
      { status: 500 }
    );
  }
}
