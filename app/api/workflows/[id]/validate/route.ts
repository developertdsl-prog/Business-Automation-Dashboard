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
    include: {
      nodes: true,
      edges: true,
    },
  })

  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const errors: string[] = []

  // Must have at least one node
  if (workflow.nodes.length === 0) {
    errors.push("Workflow must have at least one node")
  }

  // Must have at least one trigger node
  const triggerNodes = workflow.nodes.filter((n) => n.type === "TRIGGER")
  if (triggerNodes.length === 0) {
    errors.push("Workflow must have at least one trigger node")
  }
  if (triggerNodes.length > 1) {
    errors.push("Workflow can have only one trigger node")
  }

  // All edges must reference existing nodes
  const nodeIds = new Set(workflow.nodes.map((n) => n.id))
  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.sourceNodeId)) {
      errors.push(`Edge references non-existent source node: ${edge.sourceNodeId}`)
    }
    if (!nodeIds.has(edge.targetNodeId)) {
      errors.push(`Edge references non-existent target node: ${edge.targetNodeId}`)
    }
  }

  // Check for disconnected nodes (except trigger can be standalone)
  if (workflow.nodes.length > 1) {
    const connectedNodes = new Set<string>()
    for (const edge of workflow.edges) {
      connectedNodes.add(edge.sourceNodeId)
      connectedNodes.add(edge.targetNodeId)
    }
    for (const node of workflow.nodes) {
      if (!connectedNodes.has(node.id) && node.type !== "TRIGGER") {
        errors.push(`Node "${node.data?.label || node.id}" is not connected to the workflow`)
      }
    }
  }

  // Validate cron expression if scheduled
  if (workflow.triggerType === "SCHEDULE" && !workflow.cron) {
    errors.push("Scheduled workflows require a cron expression")
  }

  const isValid = errors.length === 0

  return NextResponse.json({ valid: isValid, errors })
}
