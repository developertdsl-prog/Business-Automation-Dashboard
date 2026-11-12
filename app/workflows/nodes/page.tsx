import Link from "next/link"
import { Clock, Zap, Play, Mail, ShieldAlert, Plus, ArrowRight } from "lucide-react"

const nodeCategories = [
  {
    title: "Triggers",
    description: "Start your workflow when an event occurs",
    icon: Clock,
    nodes: [
      {
        name: "Schedule Trigger",
        description: "Run workflow on a cron schedule (e.g. daily at 9am)",
        type: "SCHEDULE",
        configFields: ["cron expression"],
        icon: <Clock className="w-5 h-5" />,
      },
      {
        name: "Webhook Trigger",
        description: "Start workflow when an HTTP webhook is received",
        type: "WEBHOOK",
        configFields: ["webhook URL", "secret token"],
        icon: <Zap className="w-5 h-5" />,
      },
      {
        name: "Manual Trigger",
        description: "Start workflow manually from the dashboard",
        type: "MANUAL",
        configFields: [],
        icon: <Play className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "Actions",
    description: "Perform tasks in your workflow",
    icon: ShieldAlert,
    nodes: [
      {
        name: "Send Email",
        description: "Send an email via SMTP",
        type: "ACTION",
        configFields: ["recipient", "subject", "body", "SMTP connection"],
        icon: <Mail className="w-5 h-5" />,
      },
      {
        name: "Slack Message",
        description: "Post a message to a Slack channel",
        type: "ACTION",
        configFields: ["channel", "message", "Slack webhook"],
        icon: <ShieldAlert className="w-5 h-5" />,
      },
      {
        name: "HTTP Request",
        description: "Call an external REST API endpoint",
        type: "ACTION",
        configFields: ["URL", "method", "headers", "body"],
        icon: <ArrowRight className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "Conditions",
    description: "Add branching logic to your workflow",
    icon: Zap,
    nodes: [
      {
        name: "If / Else",
        description: "Branch execution based on a condition",
        type: "CONDITION",
        configFields: ["condition expression", "true branch", "false branch"],
        icon: <Zap className="w-5 h-5" />,
      },
      {
        name: "Delay",
        description: "Pause execution for a specified duration",
        type: "DELAY",
        configFields: ["duration"],
        icon: <Clock className="w-5 h-5" />,
      },
    ],
  },
]

export default function NodeLibraryPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Node Library</h1>
          <p className="text-muted-foreground">
            Available building blocks for your automation workflows
          </p>
        </div>
        <Link href="/workflows/new" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition">
          <Plus className="w-4 h-4 mr-2" /> Build Workflow
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {nodeCategories.map((category) => (
          <div key={category.title} className="border rounded-lg p-6 hover:border-primary/50 transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-muted rounded-lg">
                {category.icon}
              </div>
              <h2 className="font-semibold text-lg">{category.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {category.description}
            </p>
            <div className="space-y-4">
              {category.nodes.map((node) => (
                <div key={node.name} className="border p-3 rounded hover:bg-muted/50 cursor-pointer transition group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{node.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {node.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{node.description}</p>
                  <div className="flex gap-1">
                    {node.configFields.map((field) => (
                      <span key={field} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 border rounded-lg p-6 bg-muted/50">
        <h2 className="font-semibold mb-4">How to Build a Workflow</h2>
        <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
          <li>
            Go to <Link href="/workflows/new" className="text-primary hover:underline">
              Build Workflow
            </Link>
          </li>
          <li>
            Drag trigger, action, and condition nodes from the palette onto the canvas
          </li>
          <li>
            Connect nodes by dragging from one node's handle to another
          </li>
          <li>
            Configure each node's settings in the side panel
          </li>
          <li>
            Set a name, description, and trigger type for your workflow
          </li>
          <li>
            Click "Save Workflow" to publish and activate it
          </li>
        </ol>
      </div>
    </div>
  )
}
