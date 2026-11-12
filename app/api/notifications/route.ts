import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/auth/[...nextauth]/route"
import { getNotifications } from "@/lib/notifications"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const notifications = await getNotifications(session.user.id as string)

  return NextResponse.json(notifications)
}
