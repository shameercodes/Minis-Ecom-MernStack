const https = require("https");

const APP_SENDER_NAME = process.env.APP_NAME || "MINIS App";

function isSendEmailReady() {
  return Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);
}

async function sendEmail({ to, subject, html }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: {
        name: APP_SENDER_NAME,
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    const options = {
      hostname: "api.brevo.com",
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        "content-length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
        } else {
          reject(new Error(`Brevo API Error (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

module.exports = {
  sendEmail,
  isSendEmailReady,
};
