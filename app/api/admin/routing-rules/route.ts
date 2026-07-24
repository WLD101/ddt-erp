import { NextResponse } from "next/server";
import { TenantForbiddenError } from "@/lib/tenant";
import { saveRoutingRule } from "@/modules/calls/service";

export async function POST(request: Request) {
  try {
    const rule = await saveRoutingRule(await request.json());
    return NextResponse.json({ ok: true, rule });
  } catch (error) {
    if (error instanceof TenantForbiddenError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to save routing rule." },
      { status: 400 }
    );
  }
}
