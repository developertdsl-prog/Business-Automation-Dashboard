"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Clock, CheckCircle, RefreshCw, ArrowRight, Code } from "lucide-react"

interface RunStep {
  id: string
  nodeId: string
  nodeType: string
  status: string
  input: any
  output: any
  error: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

interface WorkflowRun {
  id: string
  workflowId: string
  status: string
  startedAt: string | null
  completedAt: string | null
  triggerPayload: any
  error: string | null
  createdAt: string
}

export default function RunDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [run, setRun] = useState<WorkflowRun | null>(null)
  const [steps, setSteps] = useState<RunStep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRun()
  }, [params.runId])

  const loadRun = async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        fetch(`/api/runs/${params.runId}`),
        fetch(`/api/runs/${params.runId}/steps`),
      ])
      const rData = await rRes.json()
      const sData = await sRes.json()
      setRun(rData)
      setSteps(sData)
    } catch (error) {
      console.error("Failed to load run", error)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await loadRun()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-8 w-32 rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="p-6">
        <div className="border rounded-lg p-12 text-center">
          <h2 className="text-muted-foreground">Run not found</h2>
        </div>
      </div>
    )
  }

  const duration = run.startedAt && run.completedAt
    ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
    : null

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Run Execution</h1>
          <p className="text-muted-foreground">
            Workflow run details and step-by-step logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-primary transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => router.push(`/workflows/${run.workflowId}`)}
            className="text-sm text-primary hover:underline"
          >
            ← Back to Workflow
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="border p-6 rounded-lg">
          <p className="text-muted-foreground text-sm">Status</p>
          <p className={`text-lg font-semibold mt-1 ${
            run.status === "COMPLETED" ? "text-green-700" :
            run.status === "FAILED" ? "text-red-700" :
            run.status === "RUNNING" ? "text-blue-700" : "text-gray-700"
          }`}>
            {run.status}
          </p>
        </div>
        <div className="border p-6 rounded-lg">
          <p className="text-muted-foreground text-sm">Duration</p>
          <p className="text-lg font-semibold mt-1">
            {duration !== null ? `${duration}ms` : "—"}
          </p>
        </div>
        <div className="border p-6 rounded-lg">
          <p className="text-muted-foreground text-sm">Steps</p>
          <p className="text-lg font-semibold mt-1">{steps.length}</p>
        </div>
        <div className="border p-6 rounded-lg">
          <p className="text-muted-foreground text-sm">Started</p>
          <p className="text-lg font-semibold mt-1">
            {run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}
          </p>
        </div>
      </div>

      {run.error && (
        <div className="mb-6 border border-red-100 bg-red-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Code className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">{run.error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="border-b bg-muted px-4 py-3">
          <h2 className="font-semibold text-sm">Execution Steps</h2>
        </div>
        <div className="divide-y">
          {steps.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No steps executed yet.
            </div>
          ) : (
            steps.map((step) => (
              <div key={step.id} className="px-4 py-4 hover:bg-muted/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      step.nodeType === "TRIGGER" ? "bg-blue-50 text-blue-700" :
                      step.nodeType === "ACTION" ? "bg-green-50 text-green-700" :
                      step.nodeType === "CONDITION" ? "bg-yellow-50 text-yellow-700" :
                      "bg-gray-50 text-gray-700"
                    } px-2 py-1 rounded`}>
                      {step.nodeType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Node: {step.nodeId.slice(0, 8)}...
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    step.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                    step.status === "FAILED" ? "bg-red-100 text-red-700" :
                    step.status === "RUNNING" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {step.status}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto border border-gray-200">
                      {JSON.stringify(step.input, null, 2)}
                    </pre>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto border border-gray-200">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    Started: {step.startedAt ? new Date(step.startedAt).toLocaleTimeString() : "—"}
                  </span>
                  {step.completedAt && (
                    <>
                      <ArrowRight className="w-3 h-3" />
                      <span>Completed: {new Date(step.completedAt).toLocaleTimeString()}</span>
                    </>
                  )}
                </div>
                {step.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700">
                    Error: {step.error}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
