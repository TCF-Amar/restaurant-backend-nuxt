import { getRequestIP } from "h3"
import { writeLogToFile } from "../utils/logger"

const methodColors: Record<string, string> = {
  GET: "\x1b[36m",    // Cyan
  POST: "\x1b[32m",   // Green
  PUT: "\x1b[33m",    // Yellow
  PATCH: "\x1b[35m",  // Magenta
  DELETE: "\x1b[31m", // Red
}

function getStatusColor(status: number): string {
  if (status >= 500) return "\x1b[31m" // Red
  if (status >= 400) return "\x1b[33m" // Yellow
  if (status >= 300) return "\x1b[36m" // Cyan
  if (status >= 200) return "\x1b[32m" // Green
  return "\x1b[37m"
}

function getIsoTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")
  const ms = String(now.getMilliseconds()).padStart(3, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`
}

function getTimeOnly(): string {
  const now = new Date()
  return now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0")
}

export default defineEventHandler(async (event) => {
  const path = event.path

  // Only log API routes - skip static assets, documentation, and dev internals
  if (!path.startsWith("/api")) {
    return
  }

  const startTime = performance.now()
  const method = (event.method || "GET").toUpperCase()
  const methodColor = methodColors[method] || "\x1b[37m"
  const ip = getRequestIP(event, { xForwardedFor: true }) || "127.0.0.1"

  // Capture response finish event
  event.node.res.on("finish", () => {
    const duration = Math.round(performance.now() - startTime)
    const statusCode = event.node.res.statusCode
    const statusColor = getStatusColor(statusCode)
    const consoleTimestamp = `\x1b[90m[${getTimeOnly()}]\x1b[0m`
    const fileTimestamp = `[${getIsoTimestamp()}]`

    // Authenticated user/role details if attached to context
    const auth = event.context.auth
    const consoleUserTag = auth
      ? ` \x1b[90m(user: ${auth.sub}, role: \x1b[35m${auth.role}\x1b[90m)\x1b[0m`
      : ""
    const fileUserTag = auth ? ` (user: ${auth.sub}, role: ${auth.role})` : ""

    const formattedMethod = `${methodColor}\x1b[1m${method.padEnd(6)}\x1b[0m`
    const formattedStatus = `${statusColor}\x1b[1m${statusCode}\x1b[0m`
    const durationStr = `\x1b[90m+${duration}ms\x1b[0m`

    // 1. Output colorized log to terminal console
    console.log(
      `${consoleTimestamp} \x1b[34m\x1b[1m[API]\x1b[0m ${formattedMethod} ${path} -> ${formattedStatus} ${durationStr} \x1b[90m[${ip}]\x1b[0m${consoleUserTag}`
    )

    // 2. Persist clean plain-text log to logs/access.log
    const logLine = `${fileTimestamp} [API] ${method.padEnd(6)} ${path} -> ${statusCode} +${duration}ms [${ip}]${fileUserTag}`
    writeLogToFile("access.log", logLine)

    // 3. If request failed (4xx or 5xx), also record in logs/error.log
    if (statusCode >= 400) {
      writeLogToFile("error.log", `${fileTimestamp} [API_ERROR] ${method.padEnd(6)} ${path} -> ${statusCode} +${duration}ms [${ip}]${fileUserTag}`)
    }
  })
})
