defineRouteMeta({
  openAPI: {
    tags: ["System"],
    summary: "System Health & Diagnostics",
    description: "Performs live checks on PostgreSQL, Redis, BullMQ workers, and server resources.",
    responses: {
      200: {
        description: "All services operational",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "healthy" },
                timestamp: { type: "string", example: "2026-10-12T12:00:00.000Z" },
                uptime: {
                  type: "object",
                  properties: {
                    seconds: { type: "number", example: 3600 },
                    formatted: { type: "string", example: "1h 0m 0s" },
                  },
                },
                services: {
                  type: "object",
                  properties: {
                    database: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "up" },
                        latencyMs: { type: "number", example: 4 },
                      },
                    },
                    redis: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "up" },
                        latencyMs: { type: "number", example: 2 },
                      },
                    },
                    queues: {
                      type: "object",
                      properties: {
                        email: { type: "object" },
                        sms: { type: "object" },
                      },
                    },
                  },
                },
                system: {
                  type: "object",
                  properties: {
                    nodeVersion: { type: "string", example: "v20.0.0" },
                    runtime: { type: "string", example: "Bun 1.4.2" },
                    memory: {
                      type: "object",
                      properties: {
                        rssMb: { type: "number", example: 64 },
                        heapUsedMb: { type: "number", example: 32 },
                        heapTotalMb: { type: "number", example: 48 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      503: {
        description: "One or more critical services are down",
      },
    },
  },
})

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(" ")
}

export default defineEventHandler(async (event) => {
  const startTime = performance.now()
  let hasCriticalFailure = false

  // 1. PostgreSQL Database Check
  let dbStatus = "down"
  let dbLatencyMs: number | null = null
  let dbError: string | null = null
  try {
    const t0 = performance.now()
    await prisma.$queryRawUnsafe("SELECT 1")
    dbLatencyMs = Math.round(performance.now() - t0)
    dbStatus = "up"
  } catch (err: unknown) {
    hasCriticalFailure = true
    dbError = err instanceof Error ? err.message : "Database connection failed"
  }

  // 2. Redis Connection Check
  let redisStatus = "down"
  let redisLatencyMs: number | null = null
  let redisError: string | null = null
  try {
    const t0 = performance.now()
    const pong = await redis.ping()
    if (pong === "PONG") {
      redisLatencyMs = Math.round(performance.now() - t0)
      redisStatus = "up"
    }
  } catch (err: unknown) {
    hasCriticalFailure = true
    redisError = err instanceof Error ? err.message : "Redis connection failed"
  }

  // 3. BullMQ Queues Check
  let emailQueueMetrics: Record<string, number> | null = null
  let smsQueueMetrics: Record<string, number> | null = null
  let queueStatus = "up"
  try {
    if (redisStatus === "up") {
      emailQueueMetrics = await emailQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed")
      smsQueueMetrics = await smsQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed")
    }
  } catch (err: unknown) {
    queueStatus = "degraded"
    console.warn("[Health] Failed reading queue metrics:", err)
  }

  // 4. Memory & Runtime Stats
  const mem = process.memoryUsage()
  const uptimeSeconds = Math.floor(process.uptime())
  const bunVersion = (process.versions as unknown as { bun?: string }).bun

  if (hasCriticalFailure) {
    setResponseStatus(event, 503)
  }

  const overallStatus = hasCriticalFailure
    ? "unhealthy"
    : queueStatus === "degraded"
      ? "degraded"
      : "healthy"

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    durationMs: Math.round(performance.now() - startTime),
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds),
    },
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs,
        ...(redisError ? { error: redisError } : {}),
      },
      queues: {
        status: queueStatus,
        email: emailQueueMetrics,
        sms: smsQueueMetrics,
      },
    },
    system: {
      environment: process.env.NODE_ENV || "development",
      runtime: bunVersion ? `Bun ${bunVersion}` : `Node ${process.version}`,
      memory: {
        rssMb: Math.round(mem.rss / (1024 * 1024)),
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
      },
    },
  }
})
