import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/auth/[...nextauth]/route"

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

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: params.id,
      status: "PENDING",
    },
  })

  return NextResponse.json(run, { status: 201 })
}
