"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  Edge,
  Node,
  useReactFlow,
  addEdge,
  Connection,
} from "reactflow-renderer"
import "reactflow-renderer/dist/style.css"
import { Plus, Save, Play, Mail, Clock, ShieldAlert, Zap } from "lucide-react"

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

const nodeTypes: { label: string; type: string; icon: React.ComponentType<any> }[] = [
  { label: "Schedule Trigger", type: "trigger", icon: Clock },
  { label: "Webhook Trigger", type: "trigger", icon: Zap },
  { label: "Manual Trigger", type: "trigger", icon: Play },
  { label: "Send Email", type: "action", icon: Mail },
  { label: "Slack Message", type: "action", icon: ShieldAlert },
  { label: "Condition (If/Else)", type: "condition", icon: Zap },
]

const DEFAULT_NODE_STYLE = {
  width: 200,
  padding: 10,
  borderRadius: 8,
  border: "2px solid #e2e8f0",
  background: "#ffffff",
  color: "#334155",
}

const TRIGGER_NODE_STYLE = { ...DEFAULT_NODE_STYLE, borderColor: "#3b82f6", background: "#eff6ff" }
const ACTION_NODE_STYLE = { ...DEFAULT_NODE_STYLE, borderColor: "#10b981", background: "#f0fdf4" }
const CONDITION_NODE_STYLE = { ...DEFAULT_NODE_STYLE, borderColor: "#f59e0b", background: "#fffbeb" }

function CustomNode({ data, type }: { data: any; type: string }) {
  const styleMap: Record<string, React.CSSProperties> = {
    trigger: TRIGGER_NODE_STYLE,
    action: ACTION_NODE_STYLE,
    condition: CONDITION_NODE_STYLE,
  }
  return (
    <div style={styleMap[type] || DEFAULT_NODE_STYLE} className="flex flex-col gap-2 shadow-sm border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="font-semibold text-sm">{data.label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          type === "trigger" ? "bg-blue-100 text-blue-700" : type === "action" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}>
          {type}
        </span>
      </div>
      <div className="p-3 text-xs text-gray-500">{data.description || ""}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypesMap: Record<string, React.ComponentType<any>> = {
  trigger: CustomNode,
  action: CustomNode,
  condition: CustomNode,
}

export default function WorkflowBuilder() {
  const router = useRouter()
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [workflowName, setWorkflowName] = useState("")
  const [workflowDesc, setWorkflowDesc] = useState("")
  const [triggerType, setTriggerType] = useState("MANUAL")
  const [cron, setCron] = useState("")
  const [saving, setSaving] = useState(false)
  const { addNodes } = useReactFlow()

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    []
  )

  const onNodesChange = useCallback((changes: any[]) => {
    // react-flow-renderer uses different applyNodeChanges signature
  }, [])

  const onEdgesChange = useCallback((changes: any[]) => {
    // react-flow-renderer uses different applyEdgeChanges signature
  }, [])

  const addNodeFromPalette = (type: string, label: string, description: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label, description },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      alert("Please enter a workflow name")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDesc,
          triggerType,
          cron: triggerType === "SCHEDULE" ? cron : null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/workflows/${data.id}`)
      } else {
        alert("Failed to save workflow")
      }
    } catch (error) {
      alert("Error saving workflow")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b px-6 py-4 flex items-center justify-between bg-background">
        <div>
          <h1 className="text-xl font-bold">Create Workflow</h1>
          <p className="text-sm text-muted-foreground">Drag nodes from the palette to build your automation</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" /> Save Workflow
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-muted/50 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Node Palette</h2>
          <div className="space-y-2">
            {nodeTypes.map((nt) => (
              <button
                key={nt.label}
                onClick={() => addNodeFromPalette(nt.type, nt.label, `${nt.label} node`)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-200 transition"
              >
                <nt.icon className="w-4 h-4" />
                <span>{nt.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onConnect={onConnect}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypesMap}
            fitViewOnInit={true}
            panOnScroll={true}
          >
            <Controls />
            <Background />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      <footer className="border-t p-6 bg-muted/30">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Workflow Name</label>
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="e.g. Daily Lead Follow-up"
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <textarea
              value={workflowDesc}
              onChange={(e) => setWorkflowDesc(e.target.value)}
              placeholder="Describe what this automation does"
              rows={2}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Trigger Type</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="MANUAL">Manual</option>
              <option value="SCHEDULE">Scheduled (Cron)</option>
              <option value="WEBHOOK">Webhook</option>
            </select>
            {triggerType === "SCHEDULE" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Cron Expression</label>
                <input
                  value={cron}
                  onChange={(e) => setCron(e.target.value)}
                  placeholder="e.g. 0 9 * * *"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
