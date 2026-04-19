import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const email = "waleed@ddterp.com";
  const user = await prisma.user.findFirst({
    where: { email },
  });
  
  const allUsers = await prisma.user.findMany({
    select: { email: true }
  });

  return NextResponse.json({
    searchingFor: email,
    found: !!user,
    user: user ? { email: user.email, id: user.id } : null,
    totalUsers: allUsers.length,
    allUsers: allUsers,
    DATABASE_URL: process.env.DATABASE_URL
  });
}
