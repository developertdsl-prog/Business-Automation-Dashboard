import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const webhooks = await prisma.workflow.findMany({
    where: {
      ownerId: session.user.id as string,
      triggerType: "WEBHOOK",
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  return NextResponse.json(
    webhooks.map((w) => ({
      ...w,
      webhookUrl: `${baseUrl}/api/webhooks/${w.id}`,
    }))
  )
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { name, description } = body

  const workflow = await prisma.workflow.create({
    data: {
      name,
      description,
      triggerType: "WEBHOOK",
      ownerId: session.user.id as string,
      isActive: true,
    },
  })

  return NextResponse.json(workflow, { status: 201 })
}
