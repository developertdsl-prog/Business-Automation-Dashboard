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

  const steps = await prisma.runStep.findMany({
    where: { runId: params.runId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(steps)
}
