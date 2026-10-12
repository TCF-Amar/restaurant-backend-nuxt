export const QUEUE_NAMES = {
  EMAIL: "email-queue",
  SMS: "sms-queue",
} as const

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]

export interface OtpEmailPayload {
  type: "otp"
  to: string
  code: string
  expiresInMinutes?: number
}

export interface WelcomeEmailPayload {
  type: "welcome"
  to: string
  name?: string
}

export interface GenericEmailPayload {
  type: "generic"
  to: string
  subject: string
  html?: string
  text?: string
}

export type EmailJobData = OtpEmailPayload | WelcomeEmailPayload | GenericEmailPayload

export interface OtpSmsPayload {
  type: "otp"
  to: string
  code: string
}

export interface AlertSmsPayload {
  type: "alert"
  to: string
  message: string
}

export type SmsJobData = OtpSmsPayload | AlertSmsPayload
