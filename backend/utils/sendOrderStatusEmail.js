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
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333;padding:20px;">
      <h2 style="color:#111;">MINIS</h2>

      <h2>Hello ${name}!</h2>

      <h3>${notification.heading}</h3>

      <p>${notification.message}</p>

      <div style="background:#f3f4f6;padding:18px;border-radius:8px;margin:20px 0;">
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Order Status:</strong> ${escapeHtml(status.toUpperCase())}</p>
      </div>

      <div style="text-align:center;margin:25px 0;">
  <a
    href="${trackingUrl}"
    style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:bold;"
  >
    Track Your Order
  </a>
</div>
      <p>Thank you for choosing MINIS!</p>
    </div>
  `;

//   await sendEmail({
//     to,
//     subject: notification.subject,
//     html,
//   });
    
    console.log("========== MINIS EMAIL DEBUG ==========");
    console.log("Frontend URL:", FRONTEND_URL);
    console.log("Tracking URL:", trackingUrl);
    console.log("Tracking button exists:", html.includes("Track Your Order"));
    console.log("=======================================");

    await sendEmail({
      to,
      subject: notification.subject,
      html,
    });

}

module.exports = { sendOrderStatusEmail };
