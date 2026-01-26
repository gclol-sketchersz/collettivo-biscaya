import nodemailer from "nodemailer";
import type { CallForEntry } from "../drizzle/schema";

/**
 * Email service for sending notifications
 * Uses Nodemailer with SMTP configuration
 */

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send email with HTML template
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn("[Email] SMTP credentials not configured, skipping email send");
      return false;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

/**
 * HTML template for new calls notification
 */
function getNewCallsEmailTemplate(
  userName: string,
  calls: CallForEntry[]
): string {
  const callsHtml = calls
    .map(
      (call) => `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; color: #1e40af;">${call.title}</h3>
      <p style="margin: 5px 0; color: #666;">
        <strong>Ente:</strong> ${call.entity}
      </p>
      <p style="margin: 5px 0; color: #666;">
        <strong>Tipo:</strong> ${call.callType.replace(/_/g, " ")}
      </p>
      <p style="margin: 5px 0; color: #666;">
        <strong>Livello:</strong> ${call.geographicLevel}
      </p>
      <p style="margin: 5px 0; color: #666;">
        <strong>Scadenza:</strong> ${new Date(call.deadline).toLocaleDateString("it-IT")}
      </p>
      <p style="margin: 10px 0 0 0;">
        <a href="https://collettivo-biscaya.manus.space/calls/${call.id}" style="color: #1e40af; text-decoration: none; font-weight: bold;">
          Visualizza dettagli →
        </a>
      </p>
    </div>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .content { margin-bottom: 20px; }
        .footer { border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #999; text-align: center; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌊 Nuovi Bandi Disponibili</h1>
          <p>Ciao ${userName}! Abbiamo trovato nuovi bandi che potrebbero interessarti.</p>
        </div>

        <div class="content">
          <p>Scopri ${calls.length} nuovi bandi culturali:</p>
          ${callsHtml}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://collettivo-biscaya.manus.space/calls" class="button">
            Esplora Tutti i Bandi
          </a>
        </div>

        <div class="footer">
          <p>Ricevi questa email perché hai abilitato le notifiche per nuovi bandi.</p>
          <p>
            <a href="https://collettivo-biscaya.manus.space/dashboard" style="color: #1e40af; text-decoration: none;">
              Gestisci le tue preferenze di notifica
            </a>
          </p>
          <p>&copy; 2026 Collettivo Biscaya. Tutti i diritti riservati.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * HTML template for deadline reminder notification
 */
function getDeadlineReminderEmailTemplate(
  userName: string,
  calls: CallForEntry[]
): string {
  const callsHtml = calls
    .map(
      (call) => {
        const daysUntilDeadline = Math.ceil(
          (new Date(call.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const urgency =
          daysUntilDeadline <= 3
            ? "🔴 URGENTE"
            : daysUntilDeadline <= 7
            ? "🟠 PROSSIMAMENTE"
            : "🟡 RICORDA";

        return `
      <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid ${
        daysUntilDeadline <= 3
          ? "#dc2626"
          : daysUntilDeadline <= 7
          ? "#ea580c"
          : "#eab308"
      }; background: #f9fafb; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #1e40af;">
          ${urgency} ${call.title}
        </h3>
        <p style="margin: 5px 0; color: #666;">
          <strong>Scadenza:</strong> ${new Date(call.deadline).toLocaleDateString("it-IT")} (tra ${daysUntilDeadline} giorni)
        </p>
        <p style="margin: 5px 0; color: #666;">
          <strong>Ente:</strong> ${call.entity}
        </p>
        <p style="margin: 10px 0 0 0;">
          <a href="https://collettivo-biscaya.manus.space/calls/${call.id}" style="color: #1e40af; text-decoration: none; font-weight: bold;">
            Candidati ora →
          </a>
        </p>
      </div>
    `;
      }
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .content { margin-bottom: 20px; }
        .footer { border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #999; text-align: center; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Scadenze Imminenti</h1>
          <p>Ciao ${userName}! Alcuni bandi stanno per scadere.</p>
        </div>

        <div class="content">
          <p>Hai ${calls.length} bando/i con scadenza imminente:</p>
          ${callsHtml}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://collettivo-biscaya.manus.space/calls" class="button">
            Visualizza Tutti i Bandi
          </a>
        </div>

        <div class="footer">
          <p>Ricevi questa email perché hai abilitato i promemoria di scadenza.</p>
          <p>
            <a href="https://collettivo-biscaya.manus.space/dashboard" style="color: #1e40af; text-decoration: none;">
              Gestisci le tue preferenze di notifica
            </a>
          </p>
          <p>&copy; 2026 Collettivo Biscaya. Tutti i diritti riservati.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send new calls notification email
 */
export async function sendNewCallsEmail(
  email: string,
  userName: string,
  calls: CallForEntry[]
): Promise<boolean> {
  if (calls.length === 0) return false;

  const htmlContent = getNewCallsEmailTemplate(userName, calls);
  return await sendEmail(
    email,
    `🌊 ${calls.length} nuovo bando${calls.length > 1 ? "i" : ""} su Collettivo Biscaya`,
    htmlContent
  );
}

/**
 * Send deadline reminder email
 */
export async function sendDeadlineReminderEmail(
  email: string,
  userName: string,
  calls: CallForEntry[]
): Promise<boolean> {
  if (calls.length === 0) return false;

  const htmlContent = getDeadlineReminderEmailTemplate(userName, calls);
  return await sendEmail(
    email,
    `⏰ Scadenze imminenti su Collettivo Biscaya`,
    htmlContent
  );
}

/**
 * Test email sending
 */
export async function sendTestEmail(email: string): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌊 Email di Test</h1>
        </div>
        <p>Se stai leggendo questo, il sistema email è configurato correttamente!</p>
        <p>Questo è un email di test da Collettivo Biscaya.</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, "🌊 Test Email - Collettivo Biscaya", htmlContent);
}
