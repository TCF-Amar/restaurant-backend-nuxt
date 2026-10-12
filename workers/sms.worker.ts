import { Worker, type Job } from "bullmq"
import { QUEUE_NAMES, type SmsJobData } from "./types"
import { createWorkerRedisConnection } from "./connection"
import { smsService } from "./services/sms.service"

export function createSmsWorker(concurrency = 5) {
  const connection = createWorkerRedisConnection("worker-sms")

  const worker = new Worker<SmsJobData>(
    QUEUE_NAMES.SMS,
    async (job: Job<SmsJobData>) => {
      console.log(`[SmsWorker] Processing job ${job.id} (type: ${job.data.type}, to: ${job.data.to})`)
      const result = await smsService.send(job.data)
      return result
    },
    {
      connection,
      concurrency,
    }
  )

  worker.on("completed", (job: Job) => {
    console.log(`[SmsWorker] ✅ Job ${job.id} completed successfully`)
  })

  worker.on("failed", (job: Job | undefined, err: Error) => {
    console.error(`[SmsWorker] ❌ Job ${job?.id} failed:`, err.message)
  })

  worker.on("error", (err: Error) => {
    console.error("[SmsWorker] ⚠️ Worker error:", err.message)
  })

  return worker
}
