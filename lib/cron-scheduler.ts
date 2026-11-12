import { prisma } from "@/lib/prisma"
import { enqueueWorkflowRun } from "@/lib/queue"
import { getRedisClient } from "@/lib/redis"

// Simple cron expression matcher (supports standard 5-field cron)
function cronMatches(cronExpr: string, date: Date): boolean {
  const [min, hour, dayOfMonth, month, dayOfWeek] = cronExpr.split(/\s+/)

  const matchesField = (value: number, field: string): boolean => {
    if (field === "*") return true
    if (field.includes(",")) {
      return field.split(",").some((f) => matchesField(value, f.trim()))
    }
    if (field.includes("-")) {
      const [start, end] = field.split("-").map(Number)
      return value >= start && value <= end
    }
    if (field.includes("/")) {
      const [base, step] = field.split("/").map(Number)
      return (value - (base || 0)) % step === 0
    }
    return value === Number(field)
  }

  return (
    matchesField(date.getMinutes(), min) &&
    matchesField(date.getHours(), hour) &&
    matchesField(date.getDate(), dayOfMonth) &&
    matchesField(date.getMonth() + 1, month) &&
    matchesField(date.getDay(), dayOfWeek)
  )
}

let schedulerInterval: NodeJS.Timeout | null = null

export function startCronScheduler() {
  if (schedulerInterval) return

  // Check every minute for scheduled workflows due to run
  schedulerInterval = setInterval(async () => {
    try {
      const now = new Date()
      // Only check on the minute boundary (seconds = 0)
      if (now.getSeconds() !== 0) return

      const workflows = await prisma.workflow.findMany({
        where: {
          isActive: true,
          triggerType: "SCHEDULE",
          cron: { not: null },
        },
      })

      for (const workflow of workflows) {
        if (!workflow.cron) continue

        if (cronMatches(workflow.cron, now)) {
          // Check if a run was already created for this minute
          const existingRun = await prisma.workflowRun.findFirst({
            where: {
              workflowId: workflow.id,
              createdAt: {
                gte: new Date(now.getTime() - 60000), // last minute
              },
            },
          })

          if (!existingRun) {
            const run = await prisma.workflowRun.create({
              data: {
                workflowId: workflow.id,
                status: "PENDING",
              },
            })

            await enqueueWorkflowRun(run.id, workflow.id)
            console.log(`[Cron] Triggered scheduled run ${run.id} for workflow ${workflow.id}`)
          }
        }
      }
    } catch (error) {
      console.error("[Cron] Scheduler error:", error)
    }
  }, 1000) // Check every second for precision

  console.log("[Cron] Scheduler started")
}

export function stopCronScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    console.log("[Cron] Scheduler stopped")
  }
}
