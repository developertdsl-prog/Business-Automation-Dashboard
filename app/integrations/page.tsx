import Link from "next/link"
import { useEffect, useState } from "react"
import { Mail, Clock, ShieldAlert, CheckCircle, ArrowRight } from "lucide-react"
import { INTEGRATIONS } from "@/lib/oauth"

const connectedIntegrations = ["google"]

export default function IntegrationsPage() {
  const [connected, setConnected] = useState<string[]>(connectedIntegrations)

  useEffect(() => {
    // In production, fetch connected integrations from API
    setConnected(connectedIntegrations)
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect external services to power your automation workflows
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {INTEGRATIONS.map((integration) => {
          const isConnected = connected.includes(integration.id)
          return (
            <div key={integration.id} className="border rounded-lg p-6 hover:border-primary/50 transition flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${integration.color}`}>
                  {integration.icon}
                </div>
                {isConnected && (
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    Connected
                  </span>
                )}
              </div>
              <h2 className="font-semibold text-lg mb-2">{integration.name}</h2>
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                {integration.description}
              </div>
              <div className="mt-auto pt-4 border-t">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  {integration.scopes.map((scope) => (
                    <span key={scope} className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200">
                      {scope}
                    </span>
                  ))}
                </div>
                {isConnected ? (
                  <button
                    onClick={() => {
                      setConnected(connected.filter((id) => id !== integration.id))
                    }}
                    className="w-full py-2 px-4 border border-destructive text-destructive rounded-md text-sm font-medium hover:bg-red-50 transition"
                  >
                    Disconnect
                  </button>
                ) : (
                  <Link
                    href={integration.setupUrl}
                    className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" /> Connect
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-12 border rounded-lg p-6 bg-muted/50">
        <h2 className="font-semibold mb-4">Connected Accounts</h2>
        <div className="space-y-3">
          {connected.map((id) => {
            const integration = INTEGRATIONS.find((i) => i.id === id)
            return (
              <div key={id} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${integration?.color}`}>
                    {integration?.icon}
                  </div>
                  <span className="font-medium">{integration?.name}</span>
                </div>
                <span className="text-xs text-green-600 font-medium">Active</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
