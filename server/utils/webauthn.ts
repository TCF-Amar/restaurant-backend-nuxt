import type { H3Event } from "h3"
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server"

export function getWebAuthnConfig(event: H3Event) {
  const host = getHeader(event, "host") || "localhost:3000"
  const hostname = host.split(":")[0] // 'localhost' or domain name without port
  const proto = getHeader(event, "x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")
  const origin = `${proto}://${host}`

  return {
    rpName: "FoodHub",
    rpID: hostname,
    origin,
  }
}

export {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
}
