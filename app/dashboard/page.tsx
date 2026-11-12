import { Activity, Mail, CheckCircle, Clock } from "lucide-react"

const stats = [
  { title: "Active Workflows", value: "12", icon: <Activity className="w-6 h-6" />, change: "+2" },
  { title: "Runs Today", value: "84", icon: <Clock className="w-6 h-6" />, change: "+12%" },
  { title: "Success Rate", value: "98.5%", icon: <CheckCircle className="w-6 h-6" />, change: "+0.5%" },
  { title: "Failed Runs", value: "3", icon: <Mail className="w-6 h-6" />, change: "-1" },
]

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="border p-6 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-sm">{stat.title}</p>
              {stat.icon}
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Recent Activity</h2>
        <p className="text-muted-foreground">
          No recent activity yet. Create your first workflow to get started.
        </p>
      </div>
    </div>
  )
}
