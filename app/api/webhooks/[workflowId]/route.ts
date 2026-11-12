import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { enqueueWorkflowRun } from "@/lib/queue"
import crypto from "crypto"

export async function POST(
  req: Request,
  { params }: { params: { workflowId: string } }
) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: params.workflowId },
  })

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
  }

  if (!workflow.isActive || workflow.triggerType !== "WEBHOOK") {
    return NextResponse.json(
      { error: "Workflow is not active or not a webhook trigger" },
      { status: 400 }
    )
  }

  // Verify webhook signature if secret is configured
  const signature = req.headers.get("x-webhook-signature")
  const secret = process.env.WEBHOOK_SECRET

  if (secret && signature) {
    const body = await req.text()
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex")
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  const payload = await req.json().catch(() => ({}))

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: params.workflowId,
      status: "PENDING",
      triggerPayload: payload,
    },
  })

  await enqueueWorkflowRun(run.id, params.workflowId)

  return NextResponse.json({
    runId: run.id,
    status: "queued",
    message: "Webhook received and workflow triggered",
  })
}

export async function GET(
  req: Request,
  { params }: { params: { workflowId: string } }
) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: params.workflowId },
    select: {
      id: true,
      name: true,
      triggerType: true,
      isActive: true,
    },
  })

  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const webhookUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/webhooks/${workflow.id}`

  return NextResponse.json({
    webhookUrl,
    triggerType: workflow.triggerType,
    isActive: workflow.isActive,
  })
}
