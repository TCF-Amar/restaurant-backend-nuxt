import { appendFile, mkdir } from "node:fs/promises"
import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Log Directory Setup
 * Ensures `<project-root>/logs` exists synchronously on boot.
 */
const LOG_DIR = join(process.cwd(), "logs")
if (!existsSync(LOG_DIR)) {
  try {
    mkdirSync(LOG_DIR, { recursive: true })
  } catch (err) {
    console.warn("[logger] Failed to create logs directory:", err)
  }
}

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
}

function getFormattedDate(): string {
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

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
}

/**
 * Appends a plain-text log line into the specified log file in the `/logs` directory.
 */
export async function writeLogToFile(filename: string, content: string): Promise<void> {
  try {
    const cleanContent = stripAnsi(content) + "\n"
    const filePath = join(LOG_DIR, filename)
    await appendFile(filePath, cleanContent, "utf-8")
  } catch (err) {
    // Non-blocking fallback to avoid crashing requests
    console.warn(`[logger] Failed writing to logs/${filename}:`, err)
  }
}

function formatContext(context?: any): string {
  if (context === undefined) return ""
  if (context instanceof Error) {
    return `\n${context.stack || context.message}`
  }
  if (typeof context === "object") {
    try {
      return " " + JSON.stringify(context)
    } catch {
      return " [Circular / Unserializable Object]"
    }
  }
  return ` ${context}`
}

export const logger = {
  info(message: string, context?: any) {
    const dateStr = getFormattedDate()
    const ctx = formatContext(context)
    const fileLine = `[${dateStr}] [INFO] ${message}${ctx}`
    const consoleLine = `${colors.gray}[${dateStr}]${colors.reset} ${colors.cyan}${colors.bold}[INFO]${colors.reset} ${message}${ctx}`

    console.info(consoleLine)
    writeLogToFile("app.log", fileLine)
  },

  success(message: string, context?: any) {
    const dateStr = getFormattedDate()
    const ctx = formatContext(context)
    const fileLine = `[${dateStr}] [SUCCESS] ${message}${ctx}`
    const consoleLine = `${colors.gray}[${dateStr}]${colors.reset} ${colors.green}${colors.bold}[SUCCESS]${colors.reset} ${message}${ctx}`

    console.log(consoleLine)
    writeLogToFile("app.log", fileLine)
  },

  warn(message: string, context?: any) {
    const dateStr = getFormattedDate()
    const ctx = formatContext(context)
    const fileLine = `[${dateStr}] [WARN] ${message}${ctx}`
    const consoleLine = `${colors.gray}[${dateStr}]${colors.reset} ${colors.yellow}${colors.bold}[WARN]${colors.reset} ${message}${ctx}`

    console.warn(consoleLine)
    writeLogToFile("app.log", fileLine)
    writeLogToFile("error.log", fileLine)
  },

  error(message: string, error?: any) {
    const dateStr = getFormattedDate()
    const ctx = formatContext(error)
    const fileLine = `[${dateStr}] [ERROR] ${message}${ctx}`
    const consoleLine = `${colors.gray}[${dateStr}]${colors.reset} ${colors.red}${colors.bold}[ERROR]${colors.reset} ${message}${ctx}`

    console.error(consoleLine)
    writeLogToFile("app.log", fileLine)
    writeLogToFile("error.log", fileLine)
  },

  debug(message: string, context?: any) {
    const dateStr = getFormattedDate()
    const ctx = formatContext(context)
    const fileLine = `[${dateStr}] [DEBUG] ${message}${ctx}`

    if (process.env.NODE_ENV !== "production") {
      const consoleLine = `${colors.gray}[${dateStr}]${colors.reset} ${colors.magenta}${colors.bold}[DEBUG]${colors.reset} ${message}${ctx}`
      console.debug(consoleLine)
    }
    writeLogToFile("debug.log", fileLine)
  },
}
