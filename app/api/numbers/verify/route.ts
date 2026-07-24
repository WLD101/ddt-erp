import { NextResponse } from "next/server";
import { TenantForbiddenError } from "@/lib/tenant";
import { verifyTenantPhoneNumber } from "@/modules/calls/service";

export async function POST(request: Request) {
  try {
    const phoneNumber = await verifyTenantPhoneNumber(await request.json());
    return NextResponse.json({ ok: true, phoneNumber });
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to start number verification." },
      { status: 400 }
    );
  }
}
