import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Direct exports require an approved export request." },
    { status: 403 }
  );
}
