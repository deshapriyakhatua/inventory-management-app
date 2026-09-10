import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import B2BInvoice from "@/models/B2BInvoice";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

function getNextInvoiceId(lastId) {
  if (!lastId) return "CZ-A0001";
  
  const regex = /^CZ-([A-Z])(\d{4})$/i;
  const match = lastId.match(regex);
  if (!match) return "CZ-A0001";

  let letterCode = match[1].toUpperCase().charCodeAt(0);
  let num = parseInt(match[2], 10) + 1;

  if (num > 9999) {
    num = 1;
    letterCode += 1;
    if (letterCode > 90) { // 'Z'
      letterCode = 65; // Reset to 'A'
    }
  }

  const nextLetter = String.fromCharCode(letterCode);
  const nextNumStr = String(num).padStart(4, "0");
  return `CZ-${nextLetter}${nextNumStr}`;
}

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the latest invoice sorted by createdAt descending
    const latestInvoice = await B2BInvoice.findOne({})
      .sort({ createdAt: -1 })
      .select("invoiceNumber");

    const nextId = getNextInvoiceId(latestInvoice?.invoiceNumber);

    return NextResponse.json({ success: true, nextId }, { status: 200 });
  } catch (error) {
    console.error("Error generating B2B Invoice ID:", error);
    return NextResponse.json(
      { error: "Failed to generate Invoice ID" },
      { status: 500 }
    );
  }
}
