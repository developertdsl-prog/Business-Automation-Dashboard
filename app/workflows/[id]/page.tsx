"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Activity, Mail, Clock, CheckCircle, RefreshCw, Edit, Trash2 } from "lucide-react"

interface Workflow {
  id: string
  name: string
  description: string
  triggerType: string
  cron: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  owner: { name: string | null; email: string }
  _count: { runs: number }
}

interface Run {
  id: string
  status: string
  startedAt: string | null
  completedAt: string | null
  error: string | null
  createdAt: string
}

export default function WorkflowDetail() {
  const params = useParams()
  const router = useRouter()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkflow()
  }, [params.id])

  const loadWorkflow = async () => {
    try {
      const [wRes, rRes] = await Promise.all([
        fetch(`/api/workflows/${params.id}`),
        fetch(`/api/workflows/${params.id}/runs`),
      ])
      const wData = await wRes.json()
      const rData = await rRes.json()
      setWorkflow(wData)
      setRuns(rData)
    } catch (error) {
      console.error("Failed to load workflow", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflow = async () => {
    if (!workflow) return
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/toggle`, {
        method: "POST",
      })
      if (res.ok) {
        loadWorkflow()
      }
    } catch (error) {
      console.error("Failed to toggle workflow", error)
    }
  }

  const runNow = async () => {
    if (!workflow) return
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/run`, {
        method: "POST",
      })
      if (res.ok) {
        loadWorkflow()
      }
    } catch (error) {
      console.error("Failed to run workflow", error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-8 w-32 rounded bg-muted" />
          <div className="h-8 w-64 rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="p-6">
        <div className="border rounded-lg p-12 text-center">
          <h2 className="text-muted-foreground">Workflow not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{workflow.name}</h1>
          <p className="text-muted-foreground">{workflow.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runNow}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition"
            disabled={!workflow.isActive}
          >
            <RefreshCw className="w-4 h-4" /> Run Now
          </button>
          <button
            onClick={toggleWorkflow}
            className={`px-4 py-2 rounded-md font-medium text-sm transition ${
              workflow.isActive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {workflow.isActive ? "Disable" : "Enable"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="border p-6 rounded-lg">
          <p className="text-muted-foreground text-sm">Status</p>
          <p className="text-lg font-semibold mt-1">
            {workflow.isActive ? "Active" : "Inactive"}
          </p>
        </div>
        <div className="border p-6 rounded-lg">
          <p className="text-muted-foreground text-sm">Trigger Type</p>
          <p className="text-lg font-semibold mt-1">{workflow.triggerType}</p>
        </div>
        <div className="border p-6 rounded-lg">
          <p className="text-muted-foreground text-sm">Total Runs</p>
          <p className="text-lg font-semibold mt-1">{workflow._count.runs}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Execution History</h2>
        <button
          onClick={loadWorkflow}
          className="text-sm text-muted-foreground hover:text-primary transition"
        >
          Refresh
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-muted-foreground text-sm">
              <th className="p-4 font-medium">Run ID</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Started</th>
              <th className="p-4 font-medium">Completed</th>
              <th className="p-4 font-medium">Error</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No runs yet. Click "Run Now" to execute this workflow.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="border-b hover:bg-muted/50 transition">
                  <td className="p-4 text-sm font-mono">
                    {run.id.slice(0, 8)}...
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      run.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : run.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : run.status === "RUNNING"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {run.startedAt ? new Date(run.startedAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-4 text-sm">
                    {run.completedAt ? new Date(run.completedAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {run.error || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Workflow Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Owner</p>
              <p className="text-sm text-muted-foreground">{workflow.owner.email}</p>
            </div>
            <span className="text-sm text-muted-foreground">{workflow.owner.name || "No name"}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {new Date(workflow.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">
                {new Date(workflow.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            <Edit className="w-4 h-4" /> Edit Workflow
          </button>
          <button className="text-sm text-destructive hover:underline flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}
