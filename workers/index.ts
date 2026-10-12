import { createEmailWorker } from "./email.worker"
import { createSmsWorker } from "./sms.worker"

console.log("==================================================")
console.log("🚀 Starting Background Workers (Email & SMS)...")
console.log(`📦 Process PID: ${process.pid}`)
console.log(`📡 Redis Target: ${process.env.NUXT_REDIS_URL || process.env.REDIS_URL || "redis://localhost:6379"}`)
console.log("==================================================")

const emailWorker = createEmailWorker(5)
const smsWorker = createSmsWorker(5)

console.log("⚡ Email Worker is ready and listening for jobs...")
console.log("⚡ SMS Worker is ready and listening for jobs...")

async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Shutting down workers gracefully...`)
  try {
    await Promise.all([emailWorker.close(), smsWorker.close()])
    console.log("✅ All workers stopped cleanly.")
    process.exit(0)
  } catch (err) {
    console.error("❌ Error during shutdown:", err)
    process.exit(1)
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
