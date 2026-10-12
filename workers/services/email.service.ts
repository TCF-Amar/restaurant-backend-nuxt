import type { EmailJobData, OtpEmailPayload, WelcomeEmailPayload, GenericEmailPayload } from "../types"

export interface EmailSendResult {
  success: boolean
  messageId: string
  provider: string
}

export class EmailService {
  /**
   * Render modern responsive HTML template for OTP verification
   */
  private renderOtpTemplate(payload: OtpEmailPayload): string {
    const { code, expiresInMinutes = 5 } = payload
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
          <tr>
            <td style="padding: 36px 32px; text-align: center;">
              <div style="display: inline-block; padding: 10px 16px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 12px; margin-bottom: 24px;">
                <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Projet 1</span>
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #ffffff;">Verification Code</h1>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #94a3b8; line-height: 1.5;">Use the one-time security code below to complete your verification.</p>
              
              <div style="background-color: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; display: block;">
                  ${code}
                </span>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">
                ⏱️ This code will expire in <strong>${expiresInMinutes} minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                If you did not request this verification code, please ignore this email or reach out to support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">&copy; ${new Date().getFullYear()} Projet 1. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }

  /**
   * Render template for Welcome email
   */
  private renderWelcomeTemplate(payload: WelcomeEmailPayload): string {
    const name = payload.name || "there"
    return `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 520px; margin: auto; background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155;">
    <h2 style="color: #6366f1;">Welcome to Projet 1, ${name}! 🎉</h2>
    <p style="color: #94a3b8; line-height: 1.6;">We're thrilled to have you on board. Your account is verified and ready to go.</p>
  </div>
</body>
</html>`
  }

  /**
   * Main dispatch function for Email jobs
   */
  async send(data: EmailJobData): Promise<EmailSendResult> {
    let subject = ""
    let htmlContent = ""
    let textContent = ""

    switch (data.type) {
      case "otp":
        subject = `Your Verification Code: ${data.code}`
        htmlContent = this.renderOtpTemplate(data)
        textContent = `Your verification code is ${data.code}. It will expire in ${data.expiresInMinutes || 5} minutes.`
        break

      case "welcome":
        subject = `Welcome to Projet 1!`
        htmlContent = this.renderWelcomeTemplate(data)
        textContent = `Welcome to Projet 1! We are thrilled to have you.`
        break

      case "generic":
        subject = data.subject
        htmlContent = data.html || `<p>${data.text || ""}</p>`
        textContent = data.text || ""
        break
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    // Log email details to terminal / logs
    console.log(`\n================== [EMAIL WORKER DISPATCH] ==================`)
    console.log(`📨 To:       ${data.to}`)
    console.log(`📋 Subject:  ${subject}`)
    console.log(`🆔 ID:       ${messageId}`)
    console.log(`⏰ Time:     ${new Date().toISOString()}`)
    if (data.type === "otp") {
      console.log(`🔑 OTP Code: ${data.code}`)
    }
    console.log(`------------------------------------------------------------`)
    console.log(`[Preview Text]:\n${textContent}`)
    console.log(`============================================================\n`)

    // NOTE: Pluggable provider integration:
    // If RESEND_API_KEY is configured:
    // await resend.emails.send({ from: 'noreply@yourdomain.com', to: data.to, subject, html: htmlContent })
    // If SMTP_HOST / NODEMAILER is configured:
    // await transporter.sendMail({ from: '...', to: data.to, subject, html: htmlContent, text: textContent })

    return {
      success: true,
      messageId,
      provider: "mock-logger",
    }
  }
}

export const emailService = new EmailService()
