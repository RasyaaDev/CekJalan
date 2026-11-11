import nodemailer from 'nodemailer'

const pengguna = process.env.GMAIL_USER
const sandi = process.env.GMAIL_APP_PASSWORD

const transport =
  pengguna && sandi
    ? nodemailer.createTransport(
        { host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: pengguna, pass: sandi } },
        { from: `CekJalan Sidoarjo <${pengguna}>` },
      )
    : null

const aman = (teks) =>
  String(teks ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const FONT = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

export function htmlEmail({ judul, teks, kode, tombol, catatan }) {
  const paragraf = String(teks ?? '')
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2B1714">${aman(p).replace(/\n/g, '<br>')}</p>`)
    .join('')

  const blokKode = kode
    ? `<p style="margin:6px 0 20px;padding:18px 0;background:#FFF4EC;border:1px dashed #C4420E;border-radius:6px;text-align:center;font-size:34px;font-weight:700;letter-spacing:10px;color:#9F1717;font-family:Consolas,'Courier New',monospace">${aman(kode)}</p>`
    : ''

  const blokTombol = tombol
    ? `<p style="margin:8px 0 20px"><a href="${aman(tombol.url)}" style="display:inline-block;background:#C4420E;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:4px">${aman(tombol.label)}</a></p>`
    : ''

  const blokCatatan = catatan
    ? `<p style="margin:0;font-size:13px;line-height:1.5;color:#6B5A55">${aman(catatan)}</p>`
    : ''

  return `<!doctype html><html lang="id"><body style="margin:0;padding:0;background:#F3F1EE;${FONT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F1EE;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #E2DDD8">
<tr><td style="background:#9F1717;padding:18px 28px"><span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:.3px">CekJalan</span><span style="font-size:13px;color:#F6DCD6;padding-left:8px">Sidoarjo</span></td></tr>
<tr><td style="height:4px;background:#F2B400;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:#9F1717">${aman(judul)}</h1>
${paragraf}${blokKode}${blokTombol}${blokCatatan}
</td></tr>
<tr><td style="padding:16px 28px;background:#FAF8F6;border-top:1px solid #E2DDD8;font-size:12px;line-height:1.5;color:#6B5A55">Email otomatis dari CekJalan, transparansi proyek jalan Kabupaten Sidoarjo. Tidak perlu dibalas.</td></tr>
</table></td></tr></table></body></html>`
}

export async function kirimEmail({ ke, subjek, teks, judul = subjek, kode, tombol, catatan }) {
  const polos = [teks, kode && `Kode: ${kode}`, tombol && `${tombol.label}: ${tombol.url}`, catatan].filter(Boolean).join('\n\n')
  if (!transport) {
    console.log(`[email belum dikonfigurasi] ke=${ke} subjek="${subjek}"\n${polos}`)
    return { terkirim: false }
  }
  await transport.sendMail({ to: ke, subject: subjek, text: polos, html: htmlEmail({ judul, teks, kode, tombol, catatan }) })
  return { terkirim: true }
}

export function samarkanEmail(email) {
  if (!email) return null
  const [nama, domain] = String(email).split('@')
  if (!domain) return null
  return `${nama.slice(0, 2)}${'•'.repeat(Math.max(1, nama.length - 2))}@${domain}`
}
