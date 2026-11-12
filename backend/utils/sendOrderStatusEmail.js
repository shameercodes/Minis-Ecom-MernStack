const { sendEmail, isSendEmailReady } = require("./sendEmail");

const FRONTEND_URL = process.env.FRONTEND_URL;

if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL is missing from environment variables.");
}

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

const statusMessages = {
  processing: {
    subject: "Your MINIS order is being prepared",
    heading: "Your order is being prepared!",
    message: "Our team is preparing your order. We'll keep you updated.",
  },
  shipped: {
    subject: "Your MINIS order is on its way",
    heading: "Your order has been shipped!",
    message: "Your order is on its way. We hope you enjoy your purchase!",
  },
  delivered: {
    subject: "Your MINIS order has been delivered",
    heading: "Your order has been delivered!",
    message:
      "Your order has been successfully marked as delivered. Thank you for shopping with MINIS!",
  },
  cancelled: {
    subject: "Your MINIS order has been cancelled",
    heading: "Your order has been cancelled",
    message:
      "Your order has been cancelled. Please contact our support team if you have any questions.",
  },
};

async function sendOrderStatusEmail({ to, order, status, customerName }) {
  if (!isSendEmailReady()) {
    throw new Error("Brevo email configuration is missing.");
  }

  if (!to || !order || !status) {
    throw new Error("Customer email, order, and status are required.");
  }

  const notification = statusMessages[status];

  if (!notification) {
    throw new Error(`Unsupported order status: ${status}`);
  }

  const orderId = escapeHtml(order._id.toString());

  const trackingUrl = `${FRONTEND_URL.replace(/\/+$/, "")}/orders/${encodeURIComponent(order._id.toString())}`;

  const name = escapeHtml(
    customerName || order.shippingAddress?.fullName || "Customer",
  );

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(notification.subject)}</title>
  </head>

  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#222;">

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5;padding:30px 12px;">
      <tr>
        <td align="center">

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background-color:#ffffff;border-radius:12px;overflow:hidden;">

            <!-- Header -->
            <tr>
              <td align="center" style="background-color:#111111;padding:28px 20px;">
                <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:4px;">
                  MINIS
                </h1>
                <p style="margin:8px 0 0;color:#cccccc;font-size:12px;letter-spacing:1px;">
                  THANK YOU FOR SHOPPING WITH US
                </p>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding:32px 25px 20px;">

                <p style="margin:0 0 12px;font-size:15px;color:#555;">
                  Hello ${name},
                </p>

                <h2 style="margin:0 0 12px;font-size:23px;line-height:1.4;color:#111111;">
                  ${escapeHtml(notification.heading)}
                </h2>

                <p style="margin:0 0 25px;font-size:15px;line-height:1.7;color:#666666;">
                  ${escapeHtml(notification.message)}
                </p>

                <!-- Order Details -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border:1px solid #eeeeee;border-radius:8px;">
                  <tr>
                    <td style="padding:18px 16px;">
                      <p style="margin:0 0 12px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">
                        Order Information
                      </p>

                      <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#333333;">
                        <strong>Order ID:</strong><br>
                        <span style="color:#666666;word-break:break-all;">${orderId}</span>
                      </p>

                      <p style="margin:0;font-size:14px;line-height:1.5;color:#333333;">
                        <strong>Order Status:</strong><br>
                        <span style="display:inline-block;margin-top:6px;padding:6px 12px;background-color:#e8e8e8;border-radius:20px;font-size:12px;font-weight:bold;color:#222222;">
                          ${escapeHtml(status.toUpperCase())}
                        </span>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Tracking Button -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:25px;">
                  <tr>
                    <td align="center">
                      <a
                        href="${escapeHtml(trackingUrl)}"
                        target="_blank"
                        style="display:block;max-width:300px;margin:0 auto;padding:16px 20px;background-color:#111111;color:#ffffff;text-decoration:none;text-align:center;font-size:15px;font-weight:bold;border-radius:7px;"
                      >
                        Track Your Order
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:18px 0 0;text-align:center;font-size:12px;line-height:1.6;color:#999999;">
                  Click the button above to view your order details.
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:22px 20px;background-color:#fafafa;border-top:1px solid #eeeeee;">

                <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#222222;">
                  Thank you for choosing MINIS!
                </p>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#999999;">
                  We appreciate your trust in us.
                </p>

                <p style="margin:14px 0 0;font-size:11px;color:#aaaaaa;">
                  &copy; ${new Date().getFullYear()} MINIS. All rights reserved.
                </p>

              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;

  await sendEmail({
    to,
    subject: notification.subject,
    html,
  });
}

module.exports = { sendOrderStatusEmail };
