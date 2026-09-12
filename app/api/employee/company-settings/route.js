import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import CompanySettings from "@/models/CompanySettings";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

// GET - Fetch company & bank settings
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({});
    }

    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error) {
    console.error("GET CompanySettings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company settings" },
      { status: 500 }
    );
  }
}

// POST - Save or update company & bank settings
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      address,
      state,
      gstNo,
      bankName,
      accountNo,
      ifscCode,
      accountHolderName,
      upiId,
      notes,
    } = body;

    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings();
    }

    if (businessName !== undefined) settings.businessName = businessName;
    if (address !== undefined) settings.address = address;
    if (state !== undefined) settings.state = state;
    if (gstNo !== undefined) settings.gstNo = gstNo;
    if (bankName !== undefined) settings.bankName = bankName;
    if (accountNo !== undefined) settings.accountNo = accountNo;
    if (ifscCode !== undefined) settings.ifscCode = ifscCode;
    if (accountHolderName !== undefined) settings.accountHolderName = accountHolderName;
    if (upiId !== undefined) settings.upiId = upiId;
    if (notes !== undefined) settings.notes = notes;

    await settings.save();

    return NextResponse.json(
      {
        success: true,
        message: "Company & Bank info saved successfully",
        data: settings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST CompanySettings error:", error);
    return NextResponse.json(
      { error: "Failed to save company settings" },
      { status: 500 }
    );
  }
}
