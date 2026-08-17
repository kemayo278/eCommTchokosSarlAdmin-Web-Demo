import { NextResponse } from 'next/server'
import { sendEmailWithSmtp } from '@/lib/server/smtpMailer'

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDate(value: unknown) {
  if (!value) return 'Non renseignée'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

function normalizeReservation(payload: Record<string, any>) {
  const firstName = payload.first_name || payload.firstName || ''
  const lastName = payload.last_name || payload.lastName || ''
  const email = payload.email || ''
  const phone = payload.phone || 'Non renseigné'
  const gender = payload.gender || 'Non renseigné'
  const country = payload.country || 'Non renseigné'
  const city = payload.city || 'Non renseignée'
  const numberOfTickets = Number(payload.number_of_tickets ?? payload.numberOfTickets ?? 0) || 0
  const unitPrice = Number(payload.unit_price ?? payload.unitPrice ?? 0) || 0
  const totalAmount = Number(payload.total_amount ?? payload.totalAmount ?? numberOfTickets * unitPrice) || 0
  const reservationStatus = payload.reservation_status || payload.reservationStatus || 'pending'
  const paymentStatus = payload.payment_status || payload.paymentStatus || 'pending'
  const transactionId = payload.transaction_id || payload.transactionId || 'Non renseigné'
  const proofFileName = payload.proof_file_name || payload.proofFileName || 'Aucun fichier'
  const createdAt = payload.created_at || payload.createdAt
  const reference = payload.reference || payload.id || 'N/A'

  return {
    id: payload.id,
    reference,
    firstName,
    lastName,
    email,
    phone,
    gender,
    country,
    city,
    numberOfTickets,
    unitPrice,
    totalAmount,
    reservationStatus,
    paymentStatus,
    transactionId,
    proofFileName,
    createdAt,
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  if (!payload) return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })

  const normalized = normalizeReservation(payload)

  const required = ['email', 'firstName', 'lastName']
  for (const k of required) {
    if (!(normalized as Record<string, unknown>)[k]) return NextResponse.json({ message: `${k} is required` }, { status: 422 })
  }

  try {
    const smtp = {
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(process.env.SMTP_PORT || 465),
      authenticationEnabled: true,
      username: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
      encryptionMode: 1,
    }

    const subject = payload.subject || `Confirmation et validation de votre réservation - ${normalized.firstName} ${normalized.lastName}`

    const text = payload.text || [
      `Bonjour ${normalized.firstName} ${normalized.lastName},`,
      '',
      'Votre réservation a bien été confirmée et validée.',
      `Référence: ${normalized.reference}`,
      `Nombre de places: ${normalized.numberOfTickets}`,
      `Montant total: ${normalized.totalAmount}€`,
      `Statut réservation: ${normalized.reservationStatus}`,
      `Transaction: ${normalized.transactionId}`,
      `Fichier preuve: ${normalized.proofFileName}`,
      '',
      'Vous pouvez conserver ce message comme confirmation officielle de votre réservation.',
    ].join('\n')

    const html = payload.html || `
      <div style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Segoe UI,Arial,Helvetica,sans-serif;color:#0f172a;">
        <div style="max-width:600px;margin:0 auto;padding:24px 14px;">
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:22px;overflow:hidden;box-shadow:0 16px 40px rgba(15,23,42,.08);">
            <div style="padding:28px 26px 20px;background:linear-gradient(135deg,#fff7ed 0%,#ffffff 55%,#fefce8 100%);border-bottom:1px solid #f3f4f6;text-align:center;">
              <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#fff7ed;color:#b45309;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;border:1px solid #fed7aa;">Soirée de Gala</div>
              <h1 style="margin:16px 0 8px;font-size:28px;line-height:1.1;color:#111827;font-weight:800;">Réservation confirmée</h1>
              <p style="margin:0 auto;max-width:460px;color:#475569;font-size:15px;line-height:1.7;">Bonjour ${escapeHtml(normalized.firstName)} ${escapeHtml(normalized.lastName)}, votre réservation a été confirmée et validée.</p>
            </div>

            <div style="padding:24px 24px 26px;">
              <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:22px;">
                ${[
                  ['Référence', normalized.reference],
                  ['Places', normalized.numberOfTickets],
                  ['Montant total', `${normalized.totalAmount}€`],
                  ['Statut réservation', normalized.reservationStatus],
                  ['Transaction', normalized.transactionId],
                ].map(([label, value]) => `
                  <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:13px 14px;">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">${escapeHtml(label)}</div>
                    <div style="font-size:15px;font-weight:700;color:#111827;line-height:1.35;">${escapeHtml(value)}</div>
                  </div>
                `).join('')}
              </div>

              <div style="border:1px solid #fde68a;border-radius:18px;padding:18px;background:#fffbeb;margin-bottom:18px;">
                <h2 style="margin:0 0 12px;font-size:17px;color:#b45309;">Détails du participant</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:7px 0;color:#64748b;width:38%;font-size:14px;">Nom complet</td><td style="padding:7px 0;color:#111827;font-weight:600;font-size:14px;">${escapeHtml(normalized.firstName)} ${escapeHtml(normalized.lastName)}</td></tr>
                  <tr><td style="padding:7px 0;color:#64748b;font-size:14px;">Email</td><td style="padding:7px 0;color:#111827;font-size:14px;">${escapeHtml(normalized.email)}</td></tr>
                  <tr><td style="padding:7px 0;color:#64748b;font-size:14px;">Téléphone</td><td style="padding:7px 0;color:#111827;font-size:14px;">${escapeHtml(normalized.phone)}</td></tr>
                  <tr><td style="padding:7px 0;color:#64748b;font-size:14px;">Genre</td><td style="padding:7px 0;color:#111827;font-size:14px;">${escapeHtml(normalized.gender)}</td></tr>
                  <tr><td style="padding:7px 0;color:#64748b;font-size:14px;">Pays / Ville</td><td style="padding:7px 0;color:#111827;font-size:14px;">${escapeHtml(normalized.country)} · ${escapeHtml(normalized.city)}</td></tr>
                  <tr><td style="padding:7px 0;color:#64748b;font-size:14px;">Preuve</td><td style="padding:7px 0;color:#111827;font-size:14px;">${escapeHtml(normalized.proofFileName)}</td></tr>
                  <tr><td style="padding:7px 0;color:#64748b;font-size:14px;">Créée le</td><td style="padding:7px 0;color:#111827;font-size:14px;">${escapeHtml(formatDate(normalized.createdAt))}</td></tr>
                </table>
              </div>

              <div style="padding:16px 18px;border-radius:16px;background:#ecfdf5;border:1px solid #bbf7d0;color:#065f46;font-size:14px;line-height:1.7;">
                Votre réservation est désormais confirmée. Conservez cet email comme preuve de validation.
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    const result = await sendEmailWithSmtp({
      smtp,
      fromAddress: smtp.username || process.env.SMTP_FROM || 'no-reply@example.com',
      fromName: process.env.SMTP_FROM_NAME || 'Soirée de Gala',
      recipients: [
        {
          contact: normalized.email,
          fullName: `${normalized.firstName} ${normalized.lastName}`,
          subject,
          text,
          html,
        },
      ],
    })

    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || String(err) }, { status: 500 })
  }
}
