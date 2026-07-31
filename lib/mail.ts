// lib/mail.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST,
  port: Number(process.env.ZOHO_SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_SMTP_USER,
    pass: process.env.ZOHO_SMTP_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Apex Vault" <${process.env.ZOHO_SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email via Zoho:', error);
    return { success: false, error };
  }
}