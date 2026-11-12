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
    include: { nodes: true, edges: true },
  })

  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // If activating, validate the workflow first
  if (!workflow.isActive) {
    const errors: string[] = []

    if (workflow.nodes.length === 0) {
      errors.push("Workflow must have at least one node")
    }

    const triggerNodes = workflow.nodes.filter((n) => n.type === "TRIGGER")
    if (triggerNodes.length === 0) {
      errors.push("Workflow must have at least one trigger node")
    }
    if (triggerNodes.length > 1) {
      errors.push("Workflow can have only one trigger node")
    }

    const nodeIds = new Set(workflow.nodes.map((n) => n.id))
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.sourceNodeId)) {
        errors.push(`Edge references non-existent source node: ${edge.sourceNodeId}`)
      }
      if (!nodeIds.has(edge.targetNodeId)) {
        errors.push(`Edge references non-existent target node: ${edge.targetNodeId}`)
      }
    }

    if (workflow.triggerType === "SCHEDULE" && !workflow.cron) {
      errors.push("Scheduled workflows require a cron expression")
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 })
    }
  }

  const updated = await prisma.workflow.update({
    where: { id: params.id },
    data: { isActive: !workflow.isActive },
  })

  return NextResponse.json(updated)
}
