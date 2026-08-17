const CHARS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%"

export function generatePassword(length = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length])
    .join("")
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function buildInfluencerHtml(name: string, email: string, password: string) {
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safePassword = escapeHtml(password)
  const year = new Date().getFullYear()

  return `<div style="margin:0;padding:0;background-color:#f1f5f9;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;">
  <tr>
    <td align="center" style="padding:48px 16px 40px;">

      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:540px;">

        <tr>
          <td align="center" style="padding-bottom:28px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 8px 0 0;vertical-align:middle;">
                  <div style="width:10px;height:10px;border-radius:50%;background-color:#10b981;"></div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-family:Georgia,Times,'Times New Roman',serif;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
                    Tchokos <span style="color:#10b981;">Sarl</span>
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background-color:#ffffff;border-radius:16px;border:1px solid #dbe4ef;overflow:hidden;">

            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="height:4px;background-color:#10b981;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>

            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:36px 40px 20px;">

                  <h1 style="margin:0 0 8px;font-family:Georgia,Times,'Times New Roman',serif;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
                    Bonjour ${safeName},
                  </h1>
                  <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;">
                    Votre compte Tchokos Sarl a été créé et vous donne accès au programme partenaire. Voici vos informations de connexion.
                  </p>

                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #dbe4ef;border-radius:10px;overflow:hidden;margin-bottom:24px;">
                    <tr>
                      <td style="padding:14px 18px 6px;background-color:#f8fafc;border-bottom:1px solid #f1f5f9;">
                        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;">Identifiant</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 18px 16px;background-color:#f8fafc;border-bottom:1px solid #dbe4ef;">
                        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#0f172a;">${safeEmail}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 18px 6px;">
                        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;">Clé d'accès provisoire</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 18px 18px;">
                        <span style="display:inline-block;font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;color:#059669;letter-spacing:.1em;border-bottom:2px solid #a7f3d0;padding-bottom:2px;">${safePassword}</span>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                    <tr>
                      <td width="4" style="background-color:#f59e0b;border-radius:4px 0 0 4px;">&nbsp;</td>
                      <td style="padding:12px 16px;background-color:#fffbeb;border-radius:0 8px 8px 0;border:1px solid #fde68a;border-left:none;">
                        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#78350f;line-height:1.6;">
                          Modifiez cette clé d'accès provisoire lors de votre première connexion.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:0;">
                    <tr>
                      <td width="4" style="background-color:#10b981;border-radius:4px 0 0 4px;">&nbsp;</td>
                      <td style="padding:12px 16px;background-color:#ecfdf5;border-radius:0 8px 8px 0;border:1px solid #a7f3d0;border-left:none;">
                        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#065f46;line-height:1.6;">
                          Votre lien partenaire est disponible depuis votre espace personnel. Chaque filleul validé génère automatiquement votre commission.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:20px 40px;border-top:1px solid #f1f5f9;">
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;line-height:1.6;">
                    Vous recevez ce message parce qu'un compte a été ouvert en votre nom sur Tchokos Sarl.<br />
                    Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#94a3b8;">
              &copy; ${year} Tchokos Sarl &mdash; Tous droits réservés
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</div>`
}

export async function sendInfluencerWelcomeEmail(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const [firstName, ...rest] = name.trim().split(" ")
  const lastName = rest.join(" ")

  const text = [
    `Bonjour ${name},`,
    "",
    "Votre compte Tchokos Sarl a été créé et vous donne accès au programme partenaire.",
    "",
    `Identifiant          : ${email}`,
    `Clé d'accès provisoire : ${password}`,
    "",
    "Modifiez cette clé lors de votre première connexion.",
    "",
    "Votre lien partenaire est disponible depuis votre espace personnel.",
    "Chaque filleul validé génère automatiquement votre commission.",
    "",
    "—",
    "Tchokos Sarl",
    "Ce message est automatique, merci de ne pas y répondre.",
  ].join("\n")

  const res = await fetch("/api/send-mail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName,
      lastName: lastName || firstName,
      email,
      subject: `Confirmation de compte — Tchokos Sarl`,
      text,
      html: buildInfluencerHtml(name, email, password),
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || "Échec de l'envoi de l'e-mail de bienvenue")
  }else{
    console.log(`Welcome email sent to ${email} successfully.`)
  }
}
