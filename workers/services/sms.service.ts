import type { SmsJobData } from "../types"

export interface SmsSendResult {
  success: boolean
  messageId: string
  provider: string
}

export class SmsService {
  async send(data: SmsJobData): Promise<SmsSendResult> {
    let body = ""

    switch (data.type) {
      case "otp":
        body = `Your Projet 1 verification code is ${data.code}. Do not share this code with anyone.`
        break
      case "alert":
        body = data.message
        break
    }

    const messageId = `sms_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    console.log(`\n=================== [SMS WORKER DISPATCH] ===================`)
    console.log(`📱 To:       ${data.to}`)
    console.log(`💬 Message:  ${body}`)
    console.log(`🆔 ID:       ${messageId}`)
    console.log(`⏰ Time:     ${new Date().toISOString()}`)
    console.log(`============================================================\n`)

    // NOTE: Pluggable provider integration:
    // If TWILIO_ACCOUNT_SID is configured:
    // await twilioClient.messages.create({ from: process.env.TWILIO_PHONE, to: data.to, body })

    return {
      success: true,
      messageId,
      provider: "mock-logger",
    }
  }
}

export const smsService = new SmsService()
