import Link from "next/link"
import { Activity, Mail, Clock, ClockIcon } from "lucide-react"

const statuses = [
  { label: "Active", color: "bg-green-100 text-green-700" },
  { label: "Inactive", color: "bg-gray-100 text-gray-700" },
  { label: "Active", color: "bg-green-100 text-green-700" },
]

const workflows = [
  {
    id: "1",
    name: "Daily Lead Follow-up",
    description: "Send personalized follow-up emails to new leads every morning at 9am",
    trigger: "Schedule",
    status: "Active",
    runsToday: 12,
    successRate: "98%",
  },
  {
    id: "2",
    name: "Invoice Reminder",
    description: "Automatically send invoice reminders 3 days before due date",
    trigger: "Schedule",
    status: "Active",
    runsToday: 8,
    successRate: "100%",
  },
  {
    id: "3",
    name: "Slack Daily Digest",
    description: "Post a summary of completed tasks to #general channel every evening",
    trigger: "Schedule",
    status: "Inactive",
    runsToday: 0,
    successRate: "95%",
  },
]

export default function WorkflowsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Manage and monitor your automated business processes
          </p>
        </div>
        <Link href="/workflows/new" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition">
          + New Workflow
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-muted-foreground text-sm">
              <th className="p-4 font-medium">Workflow</th>
              <th className="p-4 font-medium">Trigger</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Runs Today</th>
              <th className="p-4 font-medium">Success Rate</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((w) => (
              <tr key={w.id} className="border-b hover:bg-muted/50 transition">
                <td className="p-4">
                  <Link href={`/workflows/${w.id}`} className="font-medium hover:underline">
                    {w.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">{w.description}</p>
                </td>
                <td className="p-4 text-sm">
                  <span className="flex items-center gap-1">
                    {w.trigger === "Schedule" ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    {w.trigger}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {w.status}
                  </span>
                </td>
                <td className="p-4 text-sm">{w.runsToday}</td>
                <td className="p-4 text-sm font-medium">{w.successRate}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/workflows/${w.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                    {w.status === "Active" ? (
                      <button className="text-sm text-destructive hover:underline">
                        Disable
                      </button>
                    ) : (
                      <button className="text-sm text-primary hover:underline">
                        Enable
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {workflows.length === 0 && (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            No workflows yet. Create your first automation.
          </p>
          <Link href="/workflows/new" className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition">
            Create Workflow
          </Link>
        </div>
      )}
    </div>
  )
}
