const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:25px 10px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#333;">

  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;">

    <div style="background:#111;padding:28px 20px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:4px;">MINIS</h1>
      <p style="margin:8px 0 0;color:#ccc;font-size:11px;letter-spacing:2px;">YOUR STYLE, YOUR STORY</p>
    </div>

    <div style="padding:30px 25px 15px;">
      <p style="font-size:15px;color:#555;">Hello ${name},</p>

      <h2 style="font-size:23px;color:#111;margin:18px 0 12px;">
        ${notification.heading}
      </h2>

      <p style="font-size:14px;line-height:1.7;color:#666;">
        ${notification.message}
      </p>
    </div>

    <div style="margin:15px 25px 25px;padding:20px;background:#f7f7f7;border:1px solid #eee;border-radius:8px;">
      <h3 style="margin:0 0 18px;font-size:14px;color:#111;">ORDER INFORMATION</h3>

      <p style="margin:0 0 7px;font-size:12px;color:#888;">Order ID</p>
      <p style="margin:0 0 18px;font-size:14px;font-weight:bold;color:#222;word-break:break-all;">
        #${orderId}
      </p>

      <p style="margin:0 0 8px;font-size:12px;color:#888;">Order Status</p>
      <span style="display:inline-block;background:#111;color:#fff;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:bold;">
        ${escapeHtml(status.toUpperCase())}
      </span>
    </div>

    <div style="padding:5px 25px 30px;text-align:center;">
      <a href="${trackingUrl}"
         style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:15px 30px;border-radius:6px;font-size:14px;font-weight:bold;">
        Track Your Order
      </a>

      <p style="margin:15px 0 0;font-size:12px;color:#888;">
        Click above to view your order details.
      </p>
    </div>

    <div style="background:#f7f7f7;border-top:1px solid #eee;padding:22px;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#222;">
        Thank you for choosing MINIS!
      </p>
      <p style="margin:0;font-size:12px;color:#888;">
        We appreciate your trust in us.
      </p>
      <p style="margin:15px 0 0;font-size:11px;color:#aaa;">
        &copy; ${new Date().getFullYear()} MINIS. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
`;
