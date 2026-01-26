import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendResetPWEmail(toEmail, resetLink) {
  const mailOptions = {
    from: `Inventory App <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "PasswordReset",
    html: `<h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 15 mintues.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };
  return transporter.sendMail(mailOptions);
}

export async function sendEmailVerfication(toEmail, ActivateLink) {
  const mailOptions = {
    from: `Inventory App <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "EmailVerification",
    html: `<h1>Email Verification</h1>
      <p>You Created New account. Click the link below to set a Activate it or you will not be able to use the service Fully:</p>
      <a href="${ActivateLink}">Activate your Email</a>
      <p>This link will expire in 24 h.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };
  return transporter.sendMail(mailOptions);
}
