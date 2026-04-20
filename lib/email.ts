import { Resend } from 'resend'
import prisma from './prisma'

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailTemplate =
  | 'rfq-approved'
  | 'rfq-rejected'
  | 'rfq-unlocked'
  | 'quote-received'
  | 'quote-shortlisted'
  | 'credits-added'
  | 'account-approved'
  | 'account-pending'
  | 'admin-new-registration'

const subjects: Record<EmailTemplate, string> = {
  'rfq-approved':           'Your RFQ is now live — IT Bids Portal',
  'rfq-rejected':           'Your RFQ was not approved — IT Bids Portal',
  'rfq-unlocked':           'RFQ unlocked — IT Bids Portal',
  'quote-received':         'New quote received — IT Bids Portal',
  'quote-shortlisted':      'Your quote has been shortlisted — IT Bids Portal',
  'credits-added':          'Credits added to your account — IT Bids Portal',
  'account-approved':       'Account approved — IT Bids Portal',
  'account-pending':        'Application received — IT Bids Portal',
  'admin-new-registration': '[Admin] New registration pending approval',
}

function wrap(content: string) {
  const portal = process.env.NEXTAUTH_URL || 'https://itbids.pk'
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222">
    <div style="margin-bottom:20px"><span style="font-size:18px;font-weight:700;color:#185FA5">IT Bids Portal</span></div>
    ${content}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="font-size:11px;color:#aaa">IT Bids Portal · Pakistan · <a href="${portal}" style="color:#378ADD">Visit portal</a></p>
  </div>`
}

const btn = 'display:inline-block;background:#378ADD;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:13px;margin-top:14px'

function renderTemplate(template: EmailTemplate, data: Record<string, any>): string {
  const portal = process.env.NEXTAUTH_URL || 'https://itbids.pk'
  const map: Record<EmailTemplate, string> = {
    'rfq-approved': wrap(`<h2 style="color:#0F6E56">Your RFQ is now live</h2>
      <p>Your RFQ <strong>"${data.rfqTitle}"</strong> has been approved and is now visible to vendors.</p>
      <a href="${portal}/business/my-rfqs" style="${btn}">View your RFQs</a>`),
    'rfq-rejected': wrap(`<h2 style="color:#A32D2D">RFQ not approved</h2>
      <p>Your RFQ <strong>"${data.rfqTitle}"</strong> was not approved.${data.reason ? ` Reason: ${data.reason}` : ''}</p>`),
    'rfq-unlocked': wrap(`<h2 style="color:#185FA5">RFQ unlocked</h2>
      <p>You unlocked <strong>"${data.rfqTitle}"</strong> using <strong>${data.creditsUsed} credits</strong>.</p>
      <a href="${portal}/vendor/quotes/new?rfqId=${data.rfqId}" style="${btn}">Submit quote</a>`),
    'quote-received': wrap(`<h2 style="color:#185FA5">New quote received</h2>
      <p>A vendor submitted a quote for <strong>"${data.rfqTitle}"</strong>. Amount: <strong>PKR ${data.amount}</strong></p>
      <a href="${portal}/business/my-rfqs" style="${btn}">Review quote</a>`),
    'quote-shortlisted': wrap(`<h2 style="color:#185FA5">You have been shortlisted</h2>
      <p>Your quote for <strong>"${data.rfqTitle}"</strong> has been shortlisted by the buyer.</p>
      <a href="${portal}/vendor/quotes" style="${btn}">View my quotes</a>`),
    'credits-added': wrap(`<h2 style="color:#0F6E56">Credits added</h2>
      <p><strong>${data.credits} credits</strong> added. New balance: <strong>${data.balance} credits</strong></p>
      <a href="${portal}/vendor/rfqs" style="${btn}">Browse RFQs</a>`),
    'account-approved': wrap(`<h2 style="color:#0F6E56">Account approved</h2>
      <p>Your IT Bids Portal account for <strong>${data.companyName}</strong> has been approved.</p>
      <a href="${portal}/login" style="${btn}">Sign in now</a>`),
    'account-pending': wrap(`<h2>Application received</h2>
      <p>Thank you for registering. Your account is under review and will be approved within 24 hours.</p>`),
    'admin-new-registration': wrap(`<h2>New registration pending</h2>
      <p>Company: <strong>${data.companyName}</strong> · Role: ${data.role} · Email: ${data.email}</p>
      <a href="${portal}/admin/users" style="${btn}">Review in admin</a>`),
  }
  return map[template] || wrap(`<p>${JSON.stringify(data)}</p>`)
}

export async function sendEmail({
  to,
  template,
  data = {},
}: {
  to: string
  template: EmailTemplate
  data?: Record<string, any>
}) {
  try {
    const setting = await prisma.emailSettings.findUnique({ where: { key: template } })
    if (setting && !setting.value) return
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@itbids.pk',
      to,
      subject: subjects[template],
      html: renderTemplate(template, data),
    })
  } catch (error) {
    console.error(`Email failed: ${template} to ${to}:`, error)
  }
}
