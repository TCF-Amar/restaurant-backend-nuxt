import { Worker, type Job } from "bullmq"
import { QUEUE_NAMES, type EmailJobData } from "./types"
import { createWorkerRedisConnection } from "./connection"
import { emailService } from "./services/email.service"

export function createEmailWorker(concurrency = 5) {
  const connection = createWorkerRedisConnection("worker-email")

  const worker = new Worker<EmailJobData>(
    QUEUE_NAMES.EMAIL,
    async (job: Job<EmailJobData>) => {
      console.log(`[EmailWorker] Processing job ${job.id} (type: ${job.data.type}, to: ${job.data.to})`)
      const result = await emailService.send(job.data)
      return result
    },
    {
      connection,
      concurrency,
    }
  )

  worker.on("completed", (job: Job) => {
    console.log(`[EmailWorker] ✅ Job ${job.id} completed successfully`)
  })

  worker.on("failed", (job: Job | undefined, err: Error) => {
    console.error(`[EmailWorker] ❌ Job ${job?.id} failed:`, err.message)
  })

  worker.on("error", (err: Error) => {
    console.error("[EmailWorker] ⚠️ Worker error:", err.message)
  })

  return worker
}
