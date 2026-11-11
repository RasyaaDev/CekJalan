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

export async function kirimEmail({ ke, subjek, teks }) {
  if (!transport) {
    console.log(`[email belum dikonfigurasi] ke=${ke} subjek="${subjek}"\n${teks}`)
    return { terkirim: false }
  }
  await transport.sendMail({ to: ke, subject: subjek, text: teks })
  return { terkirim: true }
}

export function samarkanEmail(email) {
  if (!email) return null
  const [nama, domain] = String(email).split('@')
  if (!domain) return null
  return `${nama.slice(0, 2)}${'•'.repeat(Math.max(1, nama.length - 2))}@${domain}`
}
