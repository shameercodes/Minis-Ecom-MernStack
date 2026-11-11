const PDFDocument = require("pdfkit");

const generateOrderInvoice = (order, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 42,
    bufferPages: true,
    autoFirstPage: true,
  });

  doc.pipe(res);

  // --------------------------------------------------
  // CONFIGURATION
  // --------------------------------------------------

  const W = doc.page.width;
  const H = doc.page.height;

  const LEFT = 42;
  const RIGHT = W - 42;
  const WIDTH = RIGHT - LEFT;
  const CONTENT_BOTTOM = H - 65;

  const C = {
    navy: "#172B4D",
    navyLight: "#263F64",
    blue: "#416FA5",
    accent: "#D7A85C",
    text: "#283548",
    muted: "#7B8797",
    border: "#E4E9F0",
    background: "#F5F7FA",
    white: "#FFFFFF",
    green: "#16845B",
    red: "#C0392B",
    orange: "#B7791F",
  };

  const money = (amount) =>
    `PKR ${Number(amount || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const date = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-PK", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const status = String(order.status || "pending").toUpperCase();

  const statusColor =
    status === "CANCELLED"
      ? C.red
      : status === "DELIVERED"
        ? C.green
        : status === "SHIPPED"
          ? C.blue
          : C.orange;

  const paymentStatus = order.isPaid ? "PAID" : "PENDING";

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const line = (x1, y1, x2, y2, color = C.border) => {
    doc
      .moveTo(x1, y1)
      .lineTo(x2, y2)
      .lineWidth(0.7)
      .strokeColor(color)
      .stroke();
  };

  const sectionTitle = (title, y) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(C.navy)
      .text(title.toUpperCase(), LEFT, y);

    return y + 23;
  };

  const drawPill = (text, x, y, color) => {
    const width =
      doc.widthOfString(text, {
        font: "Helvetica-Bold",
        fontSize: 7,
      }) + 18;

    doc.roundedRect(x, y, width, 19, 9).fillColor(color).fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor(C.white)
      .text(text, x + 9, y + 6);

    return width;
  };

  // --------------------------------------------------
  // PAGE HEADER
  // --------------------------------------------------

  const drawPageHeader = (continued = false) => {
    doc.rect(0, 0, W, 112).fill(C.navy);

    doc
      .font("Helvetica-Bold")
      .fontSize(29)
      .fillColor(C.white)
      .text("MINIS", LEFT, 31);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#D4DDE9")
      .text("FASHION  |  STYLE  |  LIFESTYLE", LEFT + 2, 68);

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor(C.white)
      .text(continued ? "ORDER DETAILS" : "INVOICE", 300, 34, {
        width: RIGHT - 300,
        align: "right",
      });

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#D4DDE9")
      .text(`INVOICE # ${String(order._id)}`, 280, 69, {
        width: RIGHT - 280,
        align: "right",
      });

    doc.rect(LEFT, 107, WIDTH, 3).fill(C.accent);
  };

  // --------------------------------------------------
  // INFORMATION CARDS
  // --------------------------------------------------

  const drawInfoCard = (x, y, width, title, rows) => {
    const padding = 13;
    const valueWidth = width - padding * 2;

    let height = 39;

    rows.forEach((row) => {
      const rowText = `${row.label}: ${row.value}`;

      height +=
        doc.heightOfString(rowText, {
          width: valueWidth,
          font: "Helvetica",
          fontSize: 8,
        }) + 9;
    });

    height = Math.max(height + 10, 90);

    doc.roundedRect(x, y, width, height, 7).fillColor(C.background).fill();

    doc
      .roundedRect(x, y, width, height, 7)
      .lineWidth(0.6)
      .strokeColor(C.border)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(C.navy)
      .text(title.toUpperCase(), x + padding, y + 13);

    line(x + padding, y + 32, x + width - padding, y + 32);

    let textY = y + 42;

    rows.forEach((row) => {
      const rowText = `${row.label}: ${row.value}`;

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(row.color || C.text)
        .text(rowText, x + padding, textY, {
          width: valueWidth,
        });

      textY +=
        doc.heightOfString(rowText, {
          width: valueWidth,
          font: "Helvetica",
          fontSize: 8,
        }) + 9;
    });

    return height;
  };

  // --------------------------------------------------
  // PRODUCT TABLE
  // --------------------------------------------------

  const getColumns = () => ({
    product: LEFT + 12,
    quantity: LEFT + 278,
    price: LEFT + 330,
    amount: LEFT + 423,
  });

  const drawTableHeader = (y) => {
    const col = getColumns();

    doc.roundedRect(LEFT, y, WIDTH, 29, 5).fillColor(C.navyLight).fill();

    doc.font("Helvetica-Bold").fontSize(7).fillColor(C.white);

    doc.text("PRODUCT DESCRIPTION", col.product, y + 10);
    doc.text("QTY", col.quantity, y + 10);
    doc.text("UNIT PRICE", col.price, y + 10);
    doc.text("TOTAL", col.amount, y + 10);

    return y + 29;
  };

  const drawContinuationHeader = () => {
    doc.addPage();
    drawPageHeader(true);

    let y = 133;

    y = sectionTitle("Order items (continued)", y);
    y = drawTableHeader(y);

    return y;
  };

  const drawProductRow = (item, index, y) => {
    const col = getColumns();

    const name = item.name || "Unnamed Product";

    const options = [
      item.size ? `Size: ${item.size}` : null,
      item.color ? `Color: ${item.color}` : null,
    ].filter(Boolean);

    const details = options.join("  |  ");

    const nameHeight = doc.heightOfString(name, {
      width: 245,
      font: "Helvetica-Bold",
      fontSize: 8.5,
    });

    const detailsHeight = details
      ? doc.heightOfString(details, {
          width: 245,
          font: "Helvetica",
          fontSize: 7,
        })
      : 0;

    const rowHeight = Math.max(43, nameHeight + detailsHeight + 19);

    if (index % 2 === 0) {
      doc.rect(LEFT, y, WIDTH, rowHeight).fillColor("#F7F9FC").fill();
    }

    const textY = y + 11;

    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(C.text)
      .text(name, col.product, textY, {
        width: 245,
      });

    if (details) {
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(C.muted)
        .text(details, col.product, textY + nameHeight + 3, {
          width: 245,
        });
    }

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(C.text)
      .text(String(item.quantity || 0), col.quantity, textY);

    doc.text(money(item.price), col.price, textY, {
      width: 87,
    });

    doc
      .font("Helvetica-Bold")
      .text(
        money(Number(item.price || 0) * Number(item.quantity || 0)),
        col.amount,
        textY,
        {
          width: 100,
        },
      );

    line(LEFT, y + rowHeight, RIGHT, y + rowHeight);

    return y + rowHeight;
  };

  // --------------------------------------------------
  // PAYMENT SUMMARY
  // --------------------------------------------------

  const drawPaymentSummary = (y) => {
    const summaryX = RIGHT - 240;
    const summaryWidth = RIGHT - summaryX;

    const rows = [["Subtotal", money(order.itemsPrice)]];

    if (order.couponCode) {
      rows.push(["Coupon", String(order.couponCode)]);
    }

    rows.push(
      ["Discount", `- ${money(order.discountAmount)}`],
      ["Shipping", money(order.shippingPrice)],
      ["Tax", money(order.taxPrice)],
    );

    const estimatedHeight = 38 + rows.length * 21 + 56;

    if (y + estimatedHeight > CONTENT_BOTTOM) {
      doc.addPage();
      drawPageHeader(true);
      y = 135;
    }

    y = sectionTitle("Payment summary", y);

    rows.forEach(([label, value]) => {
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(C.muted)
        .text(label, summaryX, y);

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(C.text)
        .text(value, summaryX + 90, y, {
          width: summaryWidth - 90,
          align: "right",
        });

      y += 21;
    });

    y += 5;

    doc
      .roundedRect(summaryX - 10, y, summaryWidth + 10, 47, 6)
      .fillColor(C.navy)
      .fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(C.white)
      .text("GRAND TOTAL", summaryX, y + 17);

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(C.white)
      .text(money(order.totalPrice), summaryX + 90, y + 16, {
        width: summaryWidth - 100,
        align: "right",
      });

    return y + 65;
  };

  // --------------------------------------------------
  // FOOTER
  // --------------------------------------------------

  const drawFooter = () => {
    const range = doc.bufferedPageRange();

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);

      // Keep footer safely inside the printable area
      line(LEFT, H - 95, RIGHT, H - 95);

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(C.muted)
        .text("MINIS | Thank you for shopping with us.", LEFT, H - 82, {
          lineBreak: false,
        });

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(C.muted)
        .text(`Page ${i + 1} of ${range.count}`, LEFT, H - 82, {
          width: WIDTH,
          align: "right",
          lineBreak: false,
        });
    }
  };

  // --------------------------------------------------
  // BUILD INVOICE
  // --------------------------------------------------

  drawPageHeader();

  let y = 132;

  // Invoice overview
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(C.muted)
    .text("ISSUED ON", LEFT, y);

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(C.text)
    .text(date(order.createdAt), LEFT, y + 14);

  const pillWidth =
    doc.widthOfString(status, {
      font: "Helvetica-Bold",
      fontSize: 7,
    }) + 18;

  drawPill(status, RIGHT - pillWidth, y + 7, statusColor);

  y += 44;

  const address = order.shippingAddress || {};

  const cardGap = 12;
  const cardWidth = (WIDTH - cardGap) / 2;

  const orderCardHeight = drawInfoCard(
    LEFT,
    y,
    cardWidth,
    "Order information",
    [
      { label: "Order ID", value: String(order._id) },
      { label: "Payment method", value: order.paymentMethod || "N/A" },
      { label: "Payment status", value: paymentStatus },
    ],
  );

  const customerCardHeight = drawInfoCard(
    LEFT + cardWidth + cardGap,
    y,
    cardWidth,
    "Customer & shipping",
    [
      { label: "Name", value: address.fullName || "N/A" },
      { label: "Address", value: address.address || "N/A" },
      {
        label: "City",
        value:
          [address.city, address.country].filter(Boolean).join(", ") || "N/A",
      },
      { label: "Postal code", value: address.postalCode || "N/A" },
      { label: "Phone", value: address.phone || "N/A" },
    ],
  );

  y += Math.max(orderCardHeight, customerCardHeight) + 27;

  // Items
  y = sectionTitle("Order items", y);
  y = drawTableHeader(y);

  const items = order.orderItems || [];

  items.forEach((item, index) => {
    const name = item.name || "Unnamed Product";

    const details = [
      item.size ? `Size: ${item.size}` : null,
      item.color ? `Color: ${item.color}` : null,
    ]
      .filter(Boolean)
      .join("  |  ");

    const rowHeight = Math.max(
      43,
      doc.heightOfString(name, {
        width: 245,
        font: "Helvetica-Bold",
        fontSize: 8.5,
      }) +
        (details
          ? doc.heightOfString(details, {
              width: 245,
              font: "Helvetica",
              fontSize: 7,
            }) + 3
          : 0) +
        19,
    );

    if (y + rowHeight > CONTENT_BOTTOM) {
      y = drawContinuationHeader();
    }

    y = drawProductRow(item, index, y);
  });

  y += 25;

  // Totals
  y = drawPaymentSummary(y);

  // Closing message
  if (y + 45 <= CONTENT_BOTTOM) {
    y += 7;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(C.navy)
      .text("Thank you for choosing MINIS.", LEFT, y, {
        width: WIDTH,
        align: "center",
      });

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(C.muted)
      .text(
        "We appreciate your order and hope to serve you again.",
        LEFT,
        y + 17,
        {
          width: WIDTH,
          align: "center",
        },
      );
  }

  // Page numbers and footer on every page
  drawFooter();

  doc.end();
};

module.exports = generateOrderInvoice;
