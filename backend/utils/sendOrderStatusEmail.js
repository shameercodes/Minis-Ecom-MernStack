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
  const trackingUrl = `${FRONTEND_URL}/orders/${order._id}`;
  const name = escapeHtml(
    customerName || order.shippingAddress?.fullName || "Customer",
  );


const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MINIS Order Update</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#222;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#f4f4f5;padding:30px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#111111;padding:28px 20px;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:4px;">
                MINIS
              </h1>
              <p style="margin:8px 0 0;color:#d4d4d4;font-size:12px;letter-spacing:2px;">
                YOUR STYLE, YOUR STORY
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:35px 28px 20px;">

              <p style="margin:0 0 12px;font-size:15px;color:#555;">
                Hello ${name},
              </p>

              <h2 style="margin:0 0 14px;font-size:24px;line-height:1.4;color:#111;">
                ${notification.heading}
              </h2>

              <p style="margin:0;font-size:15px;line-height:1.7;color:#666;">
                ${notification.message}
              </p>

            </td>
          </tr>

          <!-- Order Information -->
          <tr>
            <td style="padding:10px 28px 25px;">

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8f8f8;border:1px solid #eeeeee;border-radius:8px;">

                <tr>
                  <td style="padding:20px;">

                    <p style="margin:0 0 14px;font-size:14px;font-weight:bold;color:#111;">
                      ORDER INFORMATION
                    </p>

                    <p style="margin:0 0 12px;font-size:13px;color:#777;">
                      Order ID
                    </p>

                    <p style="margin:0 0 18px;font-size:14px;font-weight:bold;color:#222;word-break:break-all;">
                      #${orderId}
                    </p>

                    <p style="margin:0 0 10px;font-size:13px;color:#777;">
                      Current Status
                    </p>

                    <span style="display:inline-block;padding:8px 14px;background:#111;color:#ffffff;border-radius:20px;font-size:12px;font-weight:bold;letter-spacing:1px;">
                      ${escapeHtml(status.toUpperCase())}
                    </span>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Tracking Button -->
          <tr>
            <td align="center" style="padding:5px 28px 35px;">

              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#111111" style="border-radius:6px;">
                    <a href="${escapeHtml(trackingUrl)}"
                      target="_blank"
                      style="display:inline-block;padding:15px 32px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                      Track Your Order
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#888;">
                Click the button above to view your order details.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#f8f8f8;padding:24px 20px;border-top:1px solid #eeeeee;">

              <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#111;">
                Thank you for choosing MINIS!
              </p>

              <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
                We appreciate your trust in us.
              </p>

              <p style="margin:18px 0 0;font-size:11px;color:#aaa;">
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
