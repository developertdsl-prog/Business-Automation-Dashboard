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

  const runs = await prisma.workflowRun.findMany({
    where: { workflowId: params.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(runs)
}
