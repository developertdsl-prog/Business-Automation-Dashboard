"use client"

import { useEffect, useState } from "react"
import { Search, Filter, Clock, User, Mail, Activity } from "lucide-react"

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  metadata: any
  createdAt: string
  user: { name: string | null; email: string | null } | null
}

const actionIcons: Record<string, React.ComponentType<any>> = {
  WORKFLOW_CREATE: Activity,
  WORKFLOW_TOGGLE: Clock,
  WORKFLOW_DELETE: Mail,
  RUN_TRIGGER: Activity,
  NOTIFICATION_WORKFLOW_FAILURE: Mail,
  NOTIFICATION_WORKFLOW_SUCCESS: CheckCircleIcon,
  USER_CREATE: User,
  DEFAULT: Activity,
}

function CheckCircleIcon() {
  return null as unknown as JSX.Element
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")

  useEffect(() => {
    fetch("/api/audit-logs")
      .then((res) => res.json())
      .then((data: AuditLog[]) => {
        setLogs(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredLogs = logs.filter(
    (log) =>
      !filter ||
      log.action.toLowerCase().includes(filter.toLowerCase()) ||
      log.entityType.toLowerCase().includes(filter.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(filter.toLowerCase())
  )

  const actionLabels: Record<string, string> = {
    WORKFLOW_CREATE: "Workflow Created",
    WORKFLOW_TOGGLE: "Workflow Toggled",
    WORKFLOW_DELETE: "Workflow Deleted",
    RUN_TRIGGER: "Run Triggered",
    NOTIFICATION_WORKFLOW_FAILURE: "Workflow Failure",
    NOTIFICATION_WORKFLOW_SUCCESS: "Workflow Success",
    USER_CREATE: "User Created",
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all actions and changes across your automation dashboard
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by action, entity, or user..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <button className="px-4 py-2 border rounded-md text-sm hover:bg-muted transition">
          <Filter className="w-4 h-4 mr-2" /> Export
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-8 w-32 rounded bg-muted" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No audit log entries found.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted text-muted-foreground text-sm">
                <th className="p-4 font-medium">Time</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Entity</th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const Icon = actionIcons[log.action] || Activity
                return (
                  <tr key={log.id} className="border-b hover:bg-muted/50 transition">
                    <td className="p-4 text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{actionLabels[log.action] || log.action}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {log.entityType}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span>{log.user?.email || "System"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {log.entityId.slice(0, 8)}...
                      {log.metadata && (
                        <button className="ml-2 text-xs text-primary hover:underline">
                          View details
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
