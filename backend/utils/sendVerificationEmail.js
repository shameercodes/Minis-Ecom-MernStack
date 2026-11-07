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


// Email comfirmation for order placement
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

async function sendOrderConfirmationEmail({ to, order }) {
  if (!isSendEmailReady()) {
    throw new Error("Brevo email configuration is missing.");
  }

  if (!to || !order) {
    throw new Error("Customer email and order are required.");
  }

  const orderId = order._id.toString();

  const customerName = escapeHtml(
    order.shippingAddress?.fullName || "Customer",
  );

  const items = order.orderItems
    .map((item) => {
      return `${item.name} x ${item.quantity} - Rs. ${Number(
        item.price * item.quantity,
      ).toFixed(2)}`;
    })
    .join("\n");

  const subject = `MINIS - Order Confirmed (#${orderId})`;

  const text = `
Hello ${order.shippingAddress?.fullName || "Customer"},

Thank you for shopping with MINIS!

Your order has been successfully placed and confirmed.

Order ID: ${orderId}

Your Items:
${items}

Subtotal: Rs. ${Number(order.itemsPrice).toFixed(2)}
Shipping: Rs. ${Number(order.shippingPrice).toFixed(2)}
Tax: Rs. ${Number(order.taxPrice).toFixed(2)}
Total: Rs. ${Number(order.totalPrice).toFixed(2)}

Estimated delivery: 4-8 days.

We will keep you updated about your order.

Thank you for choosing MINIS!
  `.trim();

  const htmlItems = order.orderItems
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;">
            ${item.quantity}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;">
            Rs. ${(Number(item.price) * item.quantity).toFixed(2)}
          </td>
        </tr>
      `,
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333;">
      <h2 style="color:#111;">MINIS</h2>

      <h2>Thank you for your order, ${customerName}!</h2>

      <p>Your order has been successfully placed and confirmed.</p>

      <p>
        <strong>Order ID:</strong> ${escapeHtml(orderId)}
      </p>

      <h3>Order Details</h3>

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th align="left" style="padding:10px;">Product</th>
            <th align="left" style="padding:10px;">Quantity</th>
            <th align="left" style="padding:10px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${htmlItems}
        </tbody>
      </table>

      <div style="margin-top:20px;">
        <p>Subtotal: Rs. ${Number(order.itemsPrice).toFixed(2)}</p>
        <p>Shipping: Rs. ${Number(order.shippingPrice).toFixed(2)}</p>
        <p>Tax: Rs. ${Number(order.taxPrice).toFixed(2)}</p>
        <h3>Total: Rs. ${Number(order.totalPrice).toFixed(2)}</h3>
      </div>

      <div style="background:#f3f4f6;padding:18px;border-radius:8px;margin-top:20px;">
        <h3>Estimated Delivery: 4–8 Days</h3>
        <p>Our team is preparing your order for delivery.</p>
      </div>

      <p>We will keep you updated about your order status.</p>

      <p>Thank you for choosing MINIS!</p>
    </div>
  `;

  await sendViaBrevo({ to, subject, text, html });
}


module.exports = {
  sendSignupVerificationEmail,
  sendOrderConfirmationEmail,
  emailConfigured,
};
