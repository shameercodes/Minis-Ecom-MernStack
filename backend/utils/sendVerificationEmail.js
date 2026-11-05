const https = require("https");
const { isSendEmailReady } = require("./sendEmail");

function emailConfigured() {
  return isSendEmailReady();
}

async function sendViaBrevo({ to, subject, text, html }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: {
        name: process.env.APP_NAME || "MINIS App",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    });

    const req = https.request(
      {
        hostname: "api.brevo.com",
        path: "/v3/smtp/email",
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data ? JSON.parse(data) : {});
          } else {
            reject(new Error(`Brevo Error (${res.statusCode}): ${data}`));
          }
        });
      },
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function sendSignupVerificationEmail({
  to,
  otpCode,
  verifyUrl,
  otpExpiresMinutes,
}) {
  if (!isSendEmailReady()) {
    throw new Error("Brevo email configuration is missing.");
  }

  const mDisp =
    otpExpiresMinutes != null && Number.isFinite(Number(otpExpiresMinutes))
      ? Number(otpExpiresMinutes)
      : 60;

  const minWord = mDisp === 1 ? "minute" : "minutes";

  const subject = "Verify your MINIS email";

  const text = [
    `Your MINIS email verification code is: ${otpCode}`,
    `(Expires in ${mDisp} ${minWord}.)`,
    "",
    "Or open this link in your browser:",
    verifyUrl,
    "",
    "If you did not create an account, ignore this message.",
  ].join("\n");

  const html = `
    <p>Thanks for registering with MINIS.</p>
    <p style="font-size:1.25rem;font-weight:600;letter-spacing:0.2em;">
      ${otpCode}
    </p>
    <p>
      Enter this code on the verification page
      (expires in <strong>${mDisp}</strong> ${minWord}).
    </p>
    <p>
      Or verify in one tap:
      <a href="${verifyUrl}">confirm your email address</a>
    </p>
    <p>If you did not create an account, ignore this message.</p>
  `.trim();

  await sendViaBrevo({ to, subject, text, html });
}

module.exports = {
  sendSignupVerificationEmail,
  emailConfigured,
};
