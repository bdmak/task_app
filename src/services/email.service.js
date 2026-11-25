const nodemailer = require("nodemailer");
const config = require("../config/config");
const logger = require("../config/logger");

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== "test") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch((err) =>
      logger.warn(
        "Unable to connect to email server. Make sure you have configured the SMTP options in .env"
      )
    );
}


const sendEmail = async (to, subject, html) => {
  const msg = { from: config.email.from, to, subject, html };
  await transport.sendMail(msg);
};

const sendEmailVerification = async (to, otp) => {
  console.log("sendEmailVerification", to, otp);
  const subject = "User verification code";
  const html = `
  <body style="background-color: #f3f4f6; padding: 2rem; font-family: Arial, sans-serif; color: #333;">
    <div
        style="max-width: 32rem; margin: 0 auto; background-color: #ffffff; padding: 2rem; border-radius: 0.75rem;  text-align: center;">
        <h1 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #1f2937;">Welcome to NEXMO TAG
        </h1>
        <p style="color: #4b5563; margin-bottom: 1.5rem;">Thank you for joining NEXMO TAG! Your account is almost
            ready.</p>
        <div
            style="background: #f0f4f9; color: #1f1f1f; padding: 1rem; border-radius: 0.5rem; font-size: 1rem; font-weight: 600; letter-spacing: 0.1rem; margin-bottom: 1.5rem;">
            ${otp}
        </div>
        <p style="color: #4b5563; margin-bottom: 1.5rem;">Collect this code to verify your account.</p>
        <p style="color: #ff0000; font-size: 0.85rem; margin-top: 1.5rem;">This code expires in <span
                id="timer">3:00</span>
            minutes.</p>
        <a href="https://github.com/bdmak" style="color: #888; font-size: 12px; text-decoration: none;"
            target="_blank">
            Develop by Bd MAK</a>
    </div>
</body>
`;
  await sendEmail(to, subject, html);
};


const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatMoney = (symbol, amount) => {
  const num = Number(amount ?? 0);
  const isNegative = num < 0;
  const formatted = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? "-" : ""}${symbol}${formatted}`;
};

const sendQuotationEmail = async (to, data) => {
  console.log("Quotation Request", to, data);

  const customerName = escapeHtml(data?.customerName || "Valued Customer");
  const customerEmail = escapeHtml(data?.customerEmail || to || "N/A");
  const quoteId = escapeHtml(data?.quoteId || "N/A");
  const createdDate = escapeHtml(
    data?.createdAt
      ? new Date(data.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
  );

  const countryInfo = data?.countryInfo || {};
  const pricing = data?.pricing || {};
  const currencySymbol = escapeHtml(pricing[0].currencySymbol || countryInfo.currencySymbol || "$");
  const currencyCode = escapeHtml(pricing[0].currencyCode || countryInfo.currencyCode || "USD");
  const countryLabel = escapeHtml(
    [countryInfo[0].name, countryInfo[0].code].filter(Boolean).join(" • ") || "N/A"
  );

  console.log("PP pricing ");
  console.log(pricing);
  console.log(pricing[0].subtotal);
  console.log(countryInfo);

  const items = Array.isArray(data?.items) ? data.items : [];

  const itemsRowsHtml = items
    .map((item, idx) => {
      const unitVal = item.unitPriceLocal ?? item.basePriceUSD ?? 0;
      const lineVal = item.lineTotalLocal ?? unitVal * (item.quantity ?? 1);
      const rowBg = idx % 2 === 1 ? "#f8fafc" : "#ffffff";

      return `
        <tr style="background-color: ${rowBg};">
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top;">
            <div style="font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.4;">
              ${escapeHtml(item.name || "Item")}
            </div>
            <div style="font-size: 11px; font-family: monospace; color: #64748b; margin-top: 2px;">
              SKU: ${escapeHtml(item.sku || "N/A")}
            </div>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #334155; vertical-align: middle;">
            ${escapeHtml(item.quantity ?? 1)}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; color: #334155; white-space: nowrap; vertical-align: middle;">
            ${escapeHtml(formatMoney(currencySymbol, unitVal))}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; font-weight: 600; color: #0f172a; white-space: nowrap; vertical-align: middle;">
            ${escapeHtml(formatMoney(currencySymbol, lineVal))}
          </td>
        </tr>
      `;
    })
    .join("");

  const subject = `Quotation #${quoteId} — ${customerName} (${currencyCode})`;

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quotation ${quoteId}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #eef2f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #eef2f7; padding: 28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);">

            <!-- Top Brand Header -->
            <tr>
              <td style="background-color: #06101d; padding: 24px 28px; color: #ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" valign="middle">
                      <div style="font-size: 11px; font-family: monospace; letter-spacing: 1.5px; text-transform: uppercase; color: #38bdf8; margin-bottom: 4px;">
                        QuoteFlow Summary
                      </div>
                      <div style="font-size: 22px; font-weight: 700; letter-spacing: -0.3px; color: #ffffff;">
                        Quotation Request
                      </div>
                    </td>
                    <td align="right" valign="middle">
                      <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.14); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.35); padding: 6px 12px; border-radius: 999px; font-family: monospace; font-size: 12px; font-weight: 600;">
                        ID: ${quoteId}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding: 24px 28px;">

                <!-- Customer & Market Meta Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 22px;">
                  <tr>
                    <td style="padding: 16px 18px; width: 52%; vertical-align: top; border-right: 1px solid #e2e8f0;">
                      <div style="font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">
                        Customer Details
                      </div>
                      <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">
                        ${customerName}
                      </div>
                      <div style="font-size: 13px; color: #475569; word-break: break-all;">
                        ${customerEmail}
                      </div>
                    </td>
                    <td style="padding: 16px 18px; width: 48%; vertical-align: top;">
                      <div style="font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">
                        Destination &amp; Currency
                      </div>
                      <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">
                        ${countryLabel}
                      </div>
                      <div style="font-size: 12px; color: #475569;">
                        Currency: <strong>${currencyCode} (${currencySymbol})</strong> &bull; ${createdDate}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Section Title -->
                <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #334155; margin-bottom: 10px;">
                  Selected Items (${items.length})
                </div>

                <!-- Items Table -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 22px;">
                  <thead>
                    <tr style="background-color: #0f172a; color: #ffffff;">
                      <th style="padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase;">
                        Product
                      </th>
                      <th style="padding: 11px 10px; text-align: center; font-size: 11px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase;">
                        Qty
                      </th>
                      <th style="padding: 11px 10px; text-align: right; font-size: 11px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase;">
                        Unit Price
                      </th>
                      <th style="padding: 11px 14px; text-align: right; font-size: 11px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase;">
                        Line Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      itemsRowsHtml ||
                      `<tr>
                        <td colspan="4" style="padding: 20px; text-align: center; font-size: 13px; color: #64748b;">
                          No items included in this quotation.
                        </td>
                      </tr>`
                    }
                  </tbody>
                </table>

                <!-- Pricing Breakdown -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px;">
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #475569;">Subtotal</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 600; color: #0f172a;">
                      ${escapeHtml(formatMoney(currencySymbol, pricing[0].subtotal))}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 12px; font-size: 15px; font-weight: 700; color: #0f172a;">
                      Estimated Total (${currencyCode})
                    </td>
                    <td align="right" style="padding-top: 12px; font-size: 18px; font-weight: 700; color: #0284c7;">
                      ${escapeHtml(formatMoney(currencySymbol, pricing[0].totalPrice))}
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center;">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
                  Generated automatically by QuoteFlow
                </div>
                <a href="https://github.com/bdmak" style="color: #0284c7; font-size: 12px; font-weight: 500; text-decoration: none;" target="_blank">
                  Develop by Bd MAK
                </a>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  await sendEmail(to, subject, html);
};

const sendResetPasswordEmail = async (to, otp) => {
  console.log("Password Reset Email", to, otp);
  const subject = "Password Reset Email";
  const html = `
      <body style="background-color: #f3f4f6; padding: 2rem; font-family: Arial, sans-serif; color: #333;">
          <div
              style="max-width: 32rem; margin: 0 auto; background-color: #ffffff; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15); text-align: center;">
              <img src="https://raw.githubusercontent.com/shadat-hossan/Image-server/refs/heads/main/NEXMOTAG.jpeg"
                  alt="NEXMO-TAG" style="max-width: 8rem; margin-bottom: 1.5rem;">
              <h1 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #1f2937;">Password Reset Request
              </h1>
              <p style="color: #4b5563; margin-bottom: 1.5rem;">You requested a password reset for your account. Use the code
                  below to reset your password:</p>
              <div
                  style="background: linear-gradient(135deg, #3d56ad, #0032D3); color: #ffffff; padding: 1rem; border-radius: 0.5rem; font-size: 2rem; font-weight: 800; letter-spacing: 0.1rem; margin-bottom: 1.5rem;">
                  ${otp}
              </div>
              <p style="color: #d6471c; margin-bottom: 1.5rem;">Collect this code to reset your password. This code is valid
                  for
                  3
                  minutes.</p>
              <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1.5rem;">If you did not request a password reset,
                  please ignore this email.</p>
              <a href="https://shadat-hossain.netlify.app" style="color: #888; font-size: 12px; text-decoration: none;"
                  target="_blank">ᯤ
                  Develop by ᯤ</a>
          </div>
      </body>
`;
  await sendEmail(to, subject, html);
};


const sendVerificationEmail = async (to, token) => {
  const subject = "Email Verification";
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendEmailVerification,
  sendQuotationEmail
};
