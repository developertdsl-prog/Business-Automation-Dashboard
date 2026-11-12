import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id as string,
      provider: "google",
    },
  })

  return NextResponse.json({ connected: !!account })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // In production, this would exchange the OAuth code for tokens
  // and store them in the Account table via NextAuth callbacks
  return NextResponse.json({ message: "Google OAuth initiated via NextAuth" })
}
