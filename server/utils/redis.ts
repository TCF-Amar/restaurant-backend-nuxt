import Redis, { type RedisOptions } from "ioredis"

// Cached on globalThis so Nitro hot reload doesn't leak connections
const g = globalThis as unknown as { __redis?: Redis }

let lastErrorLog = 0

function createRedis(): Redis {
  let url: string | undefined

  try {
    url = useRuntimeConfig().redisUrl
  } catch {
    // fallback outside of Nuxt context
  }

  url =
    url ||
    process.env.NUXT_REDIS_URL ||
    process.env.REDIS_URL ||
    "redis://localhost:6379"

  const options: RedisOptions = {
    connectionName: `nuxt-${process.pid}`,
    connectTimeout: 5_000,
    commandTimeout: 300,
    maxRetriesPerRequest: 1,
    keepAlive: 10_000,
    retryStrategy: (attempt) =>
      Math.min(attempt * 200, 3_000) + Math.floor(Math.random() * 200),
    reconnectOnError: (err) => err.message.includes("READONLY"),
  }

  const client = new Redis(url, options)

  client.on("error", (err) => {
    if (Date.now() - lastErrorLog > 10_000) {
      lastErrorLog = Date.now()
      console.error("[redis] error:", err.message)
    }
  })

  client.on("ready", () => console.info("[redis] ready"))

  return client
}

export const useRedis = (): Redis => (g.__redis ??= createRedis())

export const redis = new Proxy({} as Redis, {
  get(_target, prop, receiver) {
    const client = useRedis()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === "function" ? value.bind(client) : value
  },
})

export async function closeRedis() {
  const client = g.__redis
  if (!client) return
  g.__redis = undefined
  try {
    await client.quit()
  } catch {
    client.disconnect()
  }
}
