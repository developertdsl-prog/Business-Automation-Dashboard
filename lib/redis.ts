import { createClient } from "redis"

let redisClient: ReturnType<typeof createClient> | null = null

export function getRedisClient() {
  if (!redisClient) {
    const url = process.env.REDIS_URL || "redis://localhost:6379"
    redisClient = createClient({ url })
    redisClient.on("error", (err) => console.error("Redis Client Error", err))
  }
  return redisClient
}

export async function connectRedis() {
  const client = getRedisClient()
  if (!client.isOpen) {
    await client.connect()
  }
  return client
}
