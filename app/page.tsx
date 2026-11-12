import Link from "next/link"
import { Mail, Slack, CheckCircle, Activity } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-xl tracking-tight">
          Business Automation
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/signin" className="px-4 py-2 border rounded-md hover:bg-muted">
            Sign in
          </Link>
        </div>
      </nav>

      <section className="px-6 py-12">
        <h1 className="text-4xl font-bold mb-6">Automate your business workflows</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Build, schedule, and monitor automations across your stack without writing code.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Scheduled Workflows",
              desc: "Run tasks on a cron schedule — daily reports, weekly digests, reminders.",
              icon: <Activity className="w-6 h-6" />,
            },
            {
              title: "Event Triggers",
              desc: "React to webhooks from Slack, email, Google Sheets, and your own APIs.",
              icon: <Slack className="w-6 h-6" />,
            },
            {
              title: "Execution Logs",
              desc: "Step-by-step run history with inputs, outputs, and error details.",
              icon: <Mail className="w-6 h-6" />,
            },
          ].map((item) => (
            <div key={item.title} className="border p-6 rounded-lg hover:bg-muted transition">
              {item.icon}
              <h3 className="font-semibold mt-4 mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link href="/auth/signin" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition">
            Get started →
          </Link>
        </div>
      </section>
    </main>
  )
}
