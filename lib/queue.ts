import { Queue, Worker, Job } from "bullmq"
import { getRedisClient, connectRedis } from "@/lib/redis"
import { prisma } from "@/lib/prisma"
import { notifyWorkflowFailure } from "@/lib/notifications"

export const WORKFLOW_QUEUE = "workflow-execution"
export const RETRY_DELAY = 5000 // 5 seconds
export const MAX_RETRIES = 3

let workflowQueue: Queue | null = null

export function getWorkflowQueue() {
  if (!workflowQueue) {
    const redisClient = getRedisClient()
    workflowQueue = new Queue(WORKFLOW_QUEUE, {
      connection: redisClient,
      defaultJobOptions: {
        attempts: MAX_RETRIES,
        backoff: {
          type: "exponential",
          delay: RETRY_DELAY,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    })
  }
  return workflowQueue
}

export async function enqueueWorkflowRun(runId: string, workflowId: string) {
  const queue = getWorkflowQueue()
  await queue.add("execute-workflow", { runId, workflowId }, { jobId: `run-${runId}` })
}

export async function startWorkflowWorker() {
  const redisClient = await connectRedis()

  const worker = new Worker(
    WORKFLOW_QUEUE,
    async (job: Job) => {
      const { runId, workflowId } = job.data as { runId: string; workflowId: string }

      // Mark run as running
      await prisma.workflowRun.update({
        where: { id: runId },
        data: { status: "RUNNING", startedAt: new Date() },
      })

      try {
        const workflow = await prisma.workflow.findUnique({
          where: { id: workflowId },
          include: { nodes: true, edges: true },
        })

        if (!workflow) {
          throw new Error("Workflow not found")
        }

        // Execute nodes in topological order
        const executionOrder = getExecutionOrder(workflow.nodes, workflow.edges)

        for (const nodeId of executionOrder) {
          const node = workflow.nodes.find((n) => n.id === nodeId)
          if (!node) continue

          await prisma.runStep.create({
            data: {
              runId,
              nodeId,
              nodeType: node.type,
              status: "RUNNING",
              startedAt: new Date(),
            },
          })

          try {
            const result = await executeNode(node)
            await prisma.runStep.updateMany({
              where: { runId, nodeId, status: "RUNNING" },
              data: { status: "COMPLETED", output: result, completedAt: new Date() },
            })
          } catch (nodeError) {
            await prisma.runStep.updateMany({
              where: { runId, nodeId, status: "RUNNING" },
              data: {
                status: "FAILED",
                error: nodeError instanceof Error ? nodeError.message : String(nodeError),
                completedAt: new Date(),
              },
            })
            throw nodeError
          }
        }

        // Mark run as completed
        await prisma.workflowRun.update({
          where: { id: runId },
          data: { status: "COMPLETED", completedAt: new Date() },
        })
      } catch (error) {
        // Mark run as failed
        await prisma.workflowRun.update({
          where: { id: runId },
          data: {
            status: "FAILED",
            error: error instanceof Error ? error.message : String(error),
            completedAt: new Date(),
          },
        })
        throw error
      }
    },
    { connection: redisClient }
  )

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`)
  })

  worker.on("failed", async (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message)
    if (job?.data) {
      const { runId, workflowId } = job.data as { runId: string; workflowId: string }
      await notifyWorkflowFailure(runId, workflowId, err.message)
    }
  })

  worker.on("error", (err) => {
    console.error("Worker error:", err)
  })

  return worker
}

function getExecutionOrder(nodes: any[], edges: any[]): string[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const inDegree = new Map(nodes.map((n) => [n.id, 0]))
  const adjList = new Map(nodes.map((n) => [n.id, [] as string[]]))

  for (const edge of edges) {
    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1)
    adjList.get(edge.sourceNodeId)!.push(edge.targetNodeId)
  }

  const queue: string[] = []
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId)
  }

  const order: string[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    order.push(current)
    for (const neighbor of adjList.get(current)!) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    }
  }

  return order
}

async function executeNode(node: any): Promise<any> {
  // Simulate node execution based on type
  switch (node.type) {
    case "TRIGGER":
      return { triggered: true, timestamp: new Date().toISOString() }
    case "ACTION":
      return { action: node.config?.action || "executed", timestamp: new Date().toISOString() }
    case "CONDITION":
      return { condition: node.config?.condition || "evaluated", result: true, timestamp: new Date().toISOString() }
    case "DELAY":
      return { delay: node.config?.duration || 0, timestamp: new Date().toISOString() }
    default:
      return { executed: true, timestamp: new Date().toISOString() }
  }
}
