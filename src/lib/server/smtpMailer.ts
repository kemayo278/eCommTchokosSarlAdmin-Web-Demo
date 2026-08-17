import nodemailer from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"

export interface PreparedRecipient {
  contact: string
  fullName?: string | null
  patientId?: string | null
  subject?: string | null
  text: string
  html?: string | null
}

export interface SmtpConfiguration {
  host: string
  port: number
  authenticationEnabled: boolean
  username?: string | null
  password?: string | null
  encryptionMode?: number | null
}

export interface SendEmailPayload {
  smtp: SmtpConfiguration
  fromAddress: string
  fromName?: string | null
  recipients: PreparedRecipient[]
}

export interface SmtpSendResult {
  acceptedCount: number
  rejectedCount: number
  messageIds: string[]
}

type SentMailResponse = {
  accepted?: string[]
  rejected?: string[]
  messageId?: string
}

const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

export function normalizeEmailAddress(value?: string | null) {
  const email = String(value || "").trim()
  return EMAIL_PATTERN.test(email) ? email : ""
}

function buildTransportOptions(smtp: SmtpConfiguration): SMTPTransport.Options {
  const encryptionMode = Number(smtp.encryptionMode ?? 2)
  const secure = encryptionMode === 1 || smtp.port === 465
  const useStartTls = encryptionMode === 2 && !secure

  return {
    host: smtp.host,
    port: smtp.port,
    secure,
    requireTLS: useStartTls,
    ignoreTLS: encryptionMode === 0,
    auth: smtp.authenticationEnabled
      ? {
          user: smtp.username || "",
          pass: smtp.password || "",
        }
      : undefined,
  }
}

function assertSmtpConfiguration(smtp: SmtpConfiguration) {
  if (!smtp.host || !smtp.port) {
    throw new Error("Serveur SMTP ou port SMTP manquant dans les paramètres du praticien.")
  }

  if (smtp.authenticationEnabled && (!smtp.username || !smtp.password)) {
    throw new Error("Login ou mot de passe SMTP manquant dans les paramètres du praticien.")
  }
}

export async function sendEmailWithSmtp(payload: SendEmailPayload): Promise<SmtpSendResult> {
  assertSmtpConfiguration(payload.smtp)

  const fromAddress = normalizeEmailAddress(payload.fromAddress)
  if (!fromAddress) {
    throw new Error("Adresse mail d'envoi invalide.")
  }

  const transporter = nodemailer.createTransport(buildTransportOptions(payload.smtp))
  const messageIds: string[] = []
  let acceptedCount = 0
  let rejectedCount = 0

  try {
    // Envoi séquentiel: une erreur SMTP bloque l'écriture en base pour éviter un faux statut envoyé.
    for (const recipient of payload.recipients) {
      const recipientAddress = normalizeEmailAddress(recipient.contact)
      if (!recipientAddress) {
        throw new Error(`Adresse destinataire invalide pour ${recipient.fullName || recipient.patientId}.`)
      }

      const result = (await transporter.sendMail({
        from: `${payload.fromName || "GALA"} <${fromAddress}>`,
        to: recipient.fullName ? `${recipient.fullName} <${recipientAddress}>` : recipientAddress,
        subject: recipient.subject || "",
        text: recipient.text,
        html: recipient.html || undefined,
      })) as SentMailResponse

      if (!result.accepted?.length || result.rejected?.length) {
        throw new Error(`SMTP a refusé le destinataire ${recipientAddress}.`)
      }

      acceptedCount += result.accepted?.length || 0
      rejectedCount += result.rejected?.length || 0
      if (result.messageId) messageIds.push(result.messageId)
    }
  } finally {
    transporter.close()
  }

  return { acceptedCount, rejectedCount, messageIds }
}
