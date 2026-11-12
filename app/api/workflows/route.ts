import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workflows = await prisma.workflow.findMany({
    include: {
      _count: {
        select: { runs: true },
      },
      owner: {
        select: { name: true, email: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(workflows)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { name, description, triggerType, cron } = body

  const workflow = await prisma.workflow.create({
    data: {
      name,
      description,
      triggerType,
      cron,
      ownerId: session.user.id as string,
    },
  })

  return NextResponse.json(workflow, { status: 201 })
}
