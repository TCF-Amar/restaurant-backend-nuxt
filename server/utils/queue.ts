import { Queue } from "bullmq"
import Redis, { type RedisOptions } from "ioredis"
import {
  QUEUE_NAMES,
  type EmailJobData,
  type SmsJobData,
  type OtpEmailPayload,
  type WelcomeEmailPayload,
  type GenericEmailPayload,
  type OtpSmsPayload,
  type AlertSmsPayload,
} from "../../workers/types"

// Cache connections on globalThis to prevent connection leaks during Nitro hot-reloading
const g = globalThis as unknown as {
  __queueRedis?: Redis
  __emailQueue?: Queue<EmailJobData>
  __smsQueue?: Queue<SmsJobData>
}

function getQueueRedis(): Redis {
  if (g.__queueRedis) return g.__queueRedis

  let url: string | undefined
  try {
    url = useRuntimeConfig().redisUrl
  } catch {
    // outside Nuxt context fallback
  }

  url =
    url ||
    process.env.NUXT_REDIS_URL ||
    process.env.REDIS_URL ||
    "redis://localhost:6379"

  const options: RedisOptions = {
    connectionName: `nuxt-queue-producer-${process.pid}`,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy: (attempt) => Math.min(attempt * 200, 3000),
  }

  g.__queueRedis = new Redis(url, options)
  return g.__queueRedis
}

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 2000,
  },
  removeOnComplete: 100, // retain last 100 completed jobs in Redis for monitoring
  removeOnFail: 500,     // retain failed jobs for debugging
}

export function getEmailQueue(): Queue<EmailJobData> {
  if (!g.__emailQueue) {
    g.__emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, {
      connection: getQueueRedis(),
      defaultJobOptions,
    })
  }
  return g.__emailQueue
}

export function getSmsQueue(): Queue<SmsJobData> {
  if (!g.__smsQueue) {
    g.__smsQueue = new Queue<SmsJobData>(QUEUE_NAMES.SMS, {
      connection: getQueueRedis(),
      defaultJobOptions,
    })
  }
  return g.__smsQueue
}

export const emailQueue = new Proxy({} as Queue<EmailJobData>, {
  get(_target, prop, receiver) {
    const queue = getEmailQueue()
    const value = Reflect.get(queue, prop, receiver)
    return typeof value === "function" ? value.bind(queue) : value
  },
})

export const smsQueue = new Proxy({} as Queue<SmsJobData>, {
  get(_target, prop, receiver) {
    const queue = getSmsQueue()
    const value = Reflect.get(queue, prop, receiver)
    return typeof value === "function" ? value.bind(queue) : value
  },
})

/**
 * Dispatch an OTP email job to the background worker
 */
export async function sendOtpEmailJob(to: string, code: string, expiresInMinutes = 5) {
  const payload: OtpEmailPayload = {
    type: "otp",
    to,
    code,
    expiresInMinutes,
  }
  const job = await emailQueue.add("send-otp", payload)
  console.info(`[Queue] Enqueued OTP email job ${job.id} for ${to}`)
  return job
}

/**
 * Dispatch a Welcome email job to the background worker
 */
export async function sendWelcomeEmailJob(to: string, name?: string) {
  const payload: WelcomeEmailPayload = {
    type: "welcome",
    to,
    name,
  }
  const job = await emailQueue.add("send-welcome", payload)
  console.info(`[Queue] Enqueued Welcome email job ${job.id} for ${to}`)
  return job
}

/**
 * Dispatch a generic email job to the background worker
 */
export async function sendGenericEmailJob(to: string, subject: string, html?: string, text?: string) {
  const payload: GenericEmailPayload = {
    type: "generic",
    to,
    subject,
    html,
    text,
  }
  const job = await emailQueue.add("send-generic", payload)
  console.info(`[Queue] Enqueued generic email job ${job.id} for ${to}`)
  return job
}

/**
 * Dispatch an OTP SMS job to the background worker
 */
export async function sendOtpSmsJob(to: string, code: string) {
  const payload: OtpSmsPayload = {
    type: "otp",
    to,
    code,
  }
  const job = await smsQueue.add("send-otp-sms", payload)
  console.info(`[Queue] Enqueued OTP SMS job ${job.id} for ${to}`)
  return job
}

/**
 * Dispatch an alert SMS job to the background worker
 */
export async function sendAlertSmsJob(to: string, message: string) {
  const payload: AlertSmsPayload = {
    type: "alert",
    to,
    message,
  }
  const job = await smsQueue.add("send-alert-sms", payload)
  console.info(`[Queue] Enqueued alert SMS job ${job.id} for ${to}`)
  return job
}
