import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };
  return transporter.sendMail(mailOptions);
}
