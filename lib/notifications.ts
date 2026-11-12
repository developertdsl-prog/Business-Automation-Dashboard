import { prisma } from "@/lib/prisma"

export interface Notification {
  id: string
  type: "workflow_failure" | "workflow_success" | "system"
  title: string
  message: string
  read: boolean
  createdAt: Date
  workflowId?: string
  runId?: string
}

export async function createNotification(data: {
  type: Notification["type"]
  title: string
  message: string
  workflowId?: string
  runId?: string
}) {
  // For MVP, store notifications as audit logs with a specific action type
  // In production, this would be a dedicated Notification table
  const notification = await prisma.auditLog.create({
    data: {
      action: `NOTIFICATION_${data.type.toUpperCase()}`,
      entityType: "Notification",
      entityId: data.runId || data.workflowId || "system",
      metadata: {
        type: data.type,
        title: data.title,
        message: data.message,
        read: false,
      },
    },
  })

  return {
    id: notification.id,
    type: data.type,
    title: data.title,
    message: data.message,
    read: false,
    createdAt: notification.createdAt,
    workflowId: data.workflowId,
    runId: data.runId,
  }
}

export async function getNotifications(userId?: string, limit = 50) {
  const notifications = await prisma.auditLog.findMany({
    where: {
      action: {
        startsWith: "NOTIFICATION_",
      },
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return notifications.map((n) => ({
    id: n.id,
    type: (n.metadata as any)?.type || "system",
    title: (n.metadata as any)?.title || "Notification",
    message: (n.metadata as any)?.message || "",
    read: (n.metadata as any)?.read || false,
    createdAt: n.createdAt,
    workflowId: (n.metadata as any)?.workflowId,
    runId: (n.metadata as any)?.runId,
  }))
}

export async function markNotificationAsRead(notificationId: string) {
  await prisma.auditLog.update({
    where: { id: notificationId },
    data: {
      metadata: {
        read: true,
      } as any,
    },
  })
}

export async function notifyWorkflowFailure(runId: string, workflowId: string, error: string) {
  return createNotification({
    type: "workflow_failure",
    title: "Workflow Run Failed",
    message: `Workflow run failed: ${error}`,
    workflowId,
    runId,
  })
}

export async function notifyWorkflowSuccess(runId: string, workflowId: string) {
  return createNotification({
    type: "workflow_success",
    title: "Workflow Run Completed",
    message: "Workflow run completed successfully",
    workflowId,
    runId,
  })
}
