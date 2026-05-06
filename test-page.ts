import NewSalePage from "./app/(dashboard)/sales/new/page";

export async function testPage() {
  try {
    const searchParams = Promise.resolve({});
    const result = await NewSalePage({ searchParams });
    console.log("Success", !!result);
  } catch (e) {
    console.error("Runtime error in NewSalePage:", e);
  }
}
