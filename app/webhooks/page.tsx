"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap, Clipboard, Plus, ArrowRight } from "lucide-react"

interface Webhook {
  id: string
  name: string
  webhookUrl: string
  isActive: boolean
  createdAt: string
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/webhooks")
      .then((res) => res.json())
      .then((data: Webhook[]) => {
        setWebhooks(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Receive external events to trigger your automation workflows
          </p>
        </div>
        <button
          onClick={() => router.push("/webhooks/new")}
          className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4 mr-2" /> New Webhook
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-8 w-32 rounded bg-muted" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-muted-foreground">No webhooks yet</h2>
          <p className="text-sm text-muted-foreground">
            Create a webhook to receive external events and trigger workflows.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {webhooks.map((wh) => (
            <div key={wh.id} className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{wh.name}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  wh.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {wh.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground">Webhook URL</p>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={wh.webhookUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded text-mono break-all"
                  />
                  <button
                    onClick={() => copyUrl(wh.webhookUrl)}
                    className="px-3 py-2 text-sm text-primary hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t">
                <Link
                  href={`/webhooks/${wh.id}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" /> View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
