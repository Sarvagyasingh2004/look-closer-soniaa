import nodemailer from 'nodemailer';

// Emails each new clarity card to NOTIFY_EMAIL (anyone's address; change it in .env).
// Uses any SMTP account. With Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=465,
// SMTP_USER=your Gmail address, SMTP_PASS=a Gmail "App password" (not your normal password).
// If any of these are missing, no email is sent; the card is still saved and shows in /inbox.

const AREA = {
  brand: 'Brand → Revenue',
  messaging: 'Messaging → Conversion',
  operations: 'Operations → Execution',
  people: 'People → Everything',
};

let transporter = null;
function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!transporter) {
    const port = Number(SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Returns true when an email went out, false when email isn't set up. Throws if sending failed.
export async function notifyNewCard({ chaos, area, name, email }) {
  const to = process.env.NOTIFY_EMAIL;
  const mailer = getTransporter();
  if (!to || !mailer) return false;

  const lens = AREA[area] || area;
  const from = process.env.MAIL_FROM || `Look Closer <${process.env.SMTP_USER}>`;
  const who = name ? `${name} (${email})` : email; // name and email were cleaned and checked in the API route
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  await mailer.sendMail({
    from,
    to,
    replyTo: email, // pressing Reply answers the visitor directly
    subject: `New clarity card · ${lens}`,
    text: `Someone shared what feels messy for them.\n\n“${chaos}”\n\nThe lens: ${lens}\nFrom: ${who}\n\nReply to this email to answer them.\nAll cards: ${site}/inbox`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#0A0E1A">
      <p style="color:#6B7385;font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px">New clarity card</p>
      <p style="font-size:20px;line-height:1.45;margin:0 0 16px">“${escapeHtml(chaos)}”</p>
      <p style="margin:0 0 6px"><b>The lens:</b> ${escapeHtml(lens)}</p>
      <p style="margin:0 0 20px"><b>From:</b> ${escapeHtml(who)}</p>
      <p style="color:#6B7385;font-size:14px;margin:0">Reply to this email to answer them. All cards: <a href="${escapeHtml(site)}/inbox">${escapeHtml(site)}/inbox</a></p>
    </div>`,
  });
  return true;
}
