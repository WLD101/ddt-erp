export async function POST() {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Connecting your WhatsQuery Voice call.</Say></Response>`,
    {
      headers: {
        "content-type": "text/xml; charset=utf-8",
      },
    }
  );
}

export async function GET() {
  return POST();
}
