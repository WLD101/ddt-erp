async function run() {
  const pageRes = await fetch("http://127.0.0.1:3000/onboarding", {
    headers: {
      "Host": "voice.whatsquery.com"
    },
    redirect: "manual"
  });
  console.log("Page status:", pageRes.status);
  console.log("Location:", pageRes.headers.get("location"));
  const body = await pageRes.text();
  console.log("Body length:", body.length);
}

run();
