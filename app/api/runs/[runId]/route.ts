import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/auth/[...nextauth]/route"

export async function GET(
  req: Request,
  { params }: { params: { runId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const run = await prisma.workflowRun.findUnique({
    where: { id: params.runId },
    include: {
      workflow: { select: { name: true, id: true } },
    },
  })

  if (!run) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(run)
}
