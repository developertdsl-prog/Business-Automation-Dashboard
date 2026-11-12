import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"

export const oauthProviders: NextAuthOptions["providers"] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        scope:
          "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
      },
    },
  }),
]

export const INTEGRATIONS = [
  {
    id: "google",
    name: "Google",
    description: "Connect Google Sheets, Drive, and Gmail for automation workflows",
    icon: "G",
    color: "bg-blue-500",
    scopes: ["Sheets", "Drive", "Gmail"],
    setupUrl: "/integrations/google",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages and receive events from Slack channels",
    icon: "S",
    color: "bg-purple-500",
    scopes: ["chat:write", "channels:read"],
    setupUrl: "/integrations/slack",
  },
  {
    id: "http",
    name: "HTTP Webhook",
    description: "Send and receive HTTP requests to external APIs",
    icon: "H",
    color: "bg-gray-500",
    scopes: ["REST API"],
    setupUrl: "/integrations/webhook",
  },
] as const

export type IntegrationId = (typeof INTEGRATIONS)[number]["id"]
