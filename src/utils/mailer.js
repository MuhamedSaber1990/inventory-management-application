import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmailVerfication(toEmail, ActivateLink) {
  const msg = {
    to: toEmail,
    from: "Inventory App <pro.mohamed.refaey@gmail.com>",
    subject: "Email Verification",
    html: `
      <h1>Email Verification</h1>
      <p>Click the link below to activate your account:</p>
      <a href="${ActivateLink}" style="display:inline-block; padding:10px 20px; background-color:#6366f1; color:white; text-decoration:none; border-radius:5px;">Activate Account</a>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("SendGrid: Verification email sent");
  } catch (error) {
    console.error("SendGrid Error:", error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
}

export async function sendResetPWEmail(toEmail, resetLink) {
  const msg = {
    to: toEmail,
    from: "Inventory App <pro.mohamed.refaey@gmail.com>",
    subject: "Password Reset",
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log("SendGrid: Reset email sent");
  } catch (error) {
    console.error("SendGrid Reset Error:", error);
    throw error;
  }
}
