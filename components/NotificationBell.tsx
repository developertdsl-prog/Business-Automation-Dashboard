"use client"

import { useEffect, useState } from "react"
import { Bell, Mail } from "lucide-react"

export default function NotificationBell() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data: any[]) => {
        const unread = data.filter((n) => !n.read).length
        setCount(unread)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="relative">
      <button className="relative p-2 text-muted-foreground hover:text-primary transition">
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border border-white border-2"></span>
        )}
      </button>
      {count > 0 && (
        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  )
}
