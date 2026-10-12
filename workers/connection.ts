import Redis, { type RedisOptions } from "ioredis"

export function getRedisUrl(): string {
  return (
    process.env.NUXT_REDIS_URL ||
    process.env.REDIS_URL ||
    "redis://localhost:6379"
  )
}

export function createWorkerRedisConnection(name = "worker"): Redis {
  const url = getRedisUrl()
  const options: RedisOptions = {
    connectionName: `${name}-${process.pid}`,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy: (attempt) => Math.min(attempt * 200, 3000),
  }

  const client = new Redis(url, options)

  client.on("error", (err) => {
    console.error(`[Redis:${name}] Connection error:`, err.message)
  })

  return client
}
