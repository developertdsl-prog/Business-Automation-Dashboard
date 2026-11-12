import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/auth/[...nextauth]/route"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { runs: true } },
    },
  })

  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(workflow)
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: params.id },
  })

  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.workflow.update({
    where: { id: params.id },
    data: { isActive: !workflow.isActive },
  })

  return NextResponse.json(updated)
}
