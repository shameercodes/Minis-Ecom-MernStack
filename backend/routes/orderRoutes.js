const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { protect, admin } = require("../middleware/auth");
const { sendOrderConfirmationEmail,} = require("../utils/sendVerificationEmail");
const generateOrderInvoice = require("../utils/generateOrderInvoice");

const NAME_RE = /^[A-Za-z\s]+$/;
const PHONE_RE = /^[0-9]+$/;

const STREET_RE = /^[a-zA-Z0-9\s,.'#\-\/()]+$/;
const CITY_RE = /^[a-zA-Z\s\-'.]+$/;
const COUNTRY_RE = /^[a-zA-Z\s,.-]+$/;

function validateShippingAddress(addr) {
  const errors = {};

  const fullName =
    typeof addr.fullName === "string" ? addr.fullName.trim() : "";

  if (!fullName) errors.fullName = "Full name is required";
  else if (!NAME_RE.test(fullName))
    errors.fullName = "Name may only contain letters and spaces";

  const phoneRaw = typeof addr.phone === "string" ? addr.phone.trim() : "";

  if (!phoneRaw) errors.phone = "Phone is required";
  else if (!PHONE_RE.test(phoneRaw))
    errors.phone = "Phone must contain only numbers";

  const street = typeof addr.address === "string" ? addr.address.trim() : "";

  if (!street) errors.address = "Street address is required";
  else if (/[\r\n]/.test(street))
    errors.address = "Street address must be a single line";
  else if (street.length < 5) errors.address = "Street address is too short";
  else if (street.length > 180) errors.address = "Street address is too long";
  else if (!STREET_RE.test(street))
    errors.address = "Invalid street address characters";

  const city = typeof addr.city === "string" ? addr.city.trim() : "";

  if (!city) errors.city = "City is required";
  else if (/[\r\n]/.test(city)) errors.city = "City must be a single line";
  else if (city.length < 2 || city.length > 80)
    errors.city = "City must be 2–80 characters";
  else if (!CITY_RE.test(city)) errors.city = "Invalid city characters";

  const postalRaw =
    typeof addr.postalCode === "string"
      ? addr.postalCode.trim().toUpperCase().replace(/\s+/g, " ")
      : "";

  if (!postalRaw) errors.postalCode = "Postal code is required";
  else if (/[^A-Z0-9\s-]/.test(postalRaw))
    errors.postalCode = "Invalid postal code characters";
  else if (postalRaw.length > 15) errors.postalCode = "Postal code is too long";
  else if (postalRaw.replace(/[\s-]/g, "").length < 3)
    errors.postalCode = "Postal code must have at least 3 letters or digits";

  const country = typeof addr.country === "string" ? addr.country.trim() : "";

  if (!country) errors.country = "Country is required";
  else if (/[\r\n]/.test(country))
    errors.country = "Country must be a single line";
  else if (country.length < 2 || country.length > 80)
    errors.country = "Country must be 2–80 characters";
  else if (!COUNTRY_RE.test(country))
    errors.country = "Invalid country characters";

  return errors;
}

// POST /api/orders
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      shippingPrice = 0,
      taxPrice = 0,
      notes,
      couponCode,
    } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    const shipErrors = validateShippingAddress(shippingAddress);

    if (Object.keys(shipErrors).length) {
      return res.status(400).json({
        message: "Invalid shipping details",
        errors: shipErrors,
      });
    }

    const shippingAmount = Number(shippingPrice);
    const taxAmount = Number(taxPrice);

    if (
      !Number.isFinite(shippingAmount) ||
      shippingAmount < 0 ||
      !Number.isFinite(taxAmount) ||
      taxAmount < 0
    ) {
      return res.status(400).json({
        message: "Invalid shipping or tax amount",
      });
    }

    // Validate product IDs and quantities
    for (const item of orderItems) {
      if (
        !item ||
        typeof item !== "object" ||
        !mongoose.isValidObjectId(item.product) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          message: "Invalid product ID or quantity",
        });
      }
    }

    const productIdSet = new Set(
      orderItems.map((item) => item.product.toString()),
    );

    if (productIdSet.size !== orderItems.length) {
      return res.status(400).json({
        message: "Duplicate products are not allowed",
      });
    }

    const normalizedShipping = {
      fullName: shippingAddress.fullName.trim(),
      address: String(shippingAddress.address).trim(),
      city: String(shippingAddress.city).trim(),
      postalCode: String(shippingAddress.postalCode)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, " "),
      country: String(shippingAddress.country).trim(),
      phone: String(shippingAddress.phone).trim(),
    };

    const session = await mongoose.startSession();

    let createdOrder;

    try {
      await session.withTransaction(async () => {
        const productIds = orderItems.map((item) => item.product);

        const products = await Product.find({
          _id: { $in: productIds },
          isActive: true,
        }).session(session);

        const productMap = new Map(
          products.map((product) => [product._id.toString(), product]),
        );

        const preparedItems = [];
        let calculatedItemsPrice = 0;

        for (const item of orderItems) {
          const product = productMap.get(item.product.toString());

          if (!product) {
            throw new Error("PRODUCT_NOT_FOUND");
          }

          if (product.trackInventory) {
            const result = await Product.updateOne(
              {
                _id: product._id,
                stock: { $gte: item.quantity },
              },
              {
                $inc: { stock: -item.quantity },
              },
              { session },
            );

            if (result.matchedCount !== 1) {
              throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
            }
          }

          const itemTotal = product.price * item.quantity;
          calculatedItemsPrice += itemTotal;

          preparedItems.push({
            product: product._id,
            name: product.name,
            image: product.images?.[0] || "",
            price: product.price,
            size: item.size || undefined,
            color: item.color || undefined,
            quantity: item.quantity,
          });
        }

        // Calculate coupon discount using trusted database prices
        let discountAmount = 0;
        let appliedCouponCode = null;

        if (couponCode) {
          const normalizedCode = String(couponCode).trim().toUpperCase();

          const coupon = await Coupon.findOne({
            code: normalizedCode,
          }).session(session);

          if (!coupon || !coupon.isActive) {
            throw new Error("COUPON_ERROR:Invalid or inactive coupon");
          }

          const now = new Date();

          if (coupon.expiresAt && coupon.expiresAt <= now) {
            throw new Error("COUPON_ERROR:This coupon has expired");
          }

          if (
            coupon.usageLimit !== null &&
            coupon.usedCount >= coupon.usageLimit
          ) {
            throw new Error(
              "COUPON_ERROR:This coupon has reached its usage limit",
            );
          }

          const alreadyUsed = (coupon.usedBy || []).some(
            (userId) => userId.toString() === req.user._id.toString(),
          );

          if (alreadyUsed) {
            throw new Error("COUPON_ERROR:You have already used this coupon");
          }

          if (calculatedItemsPrice < coupon.minimumOrderAmount) {
            throw new Error(
              `COUPON_ERROR:Minimum order amount is Rs. ${coupon.minimumOrderAmount}`,
            );
          }

          discountAmount =
            coupon.discountType === "percentage"
              ? (calculatedItemsPrice * coupon.discountValue) / 100
              : coupon.discountValue;

          if (coupon.maximumDiscount !== null) {
            discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
          }

          discountAmount = Math.min(discountAmount, calculatedItemsPrice);

          discountAmount = Math.round(discountAmount * 100) / 100;

          // Atomically record coupon usage inside the same transaction
          const usageResult = await Coupon.updateOne(
            {
              _id: coupon._id,
              isActive: true,
              usedBy: { $ne: req.user._id },
              $and: [
                {
                  $or: [
                    { usageLimit: null },
                    {
                      $expr: {
                        $lt: ["$usedCount", "$usageLimit"],
                      },
                    },
                  ],
                },
                {
                  $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
                },
              ],
            },
            {
              $inc: { usedCount: 1 },
              $addToSet: { usedBy: req.user._id },
            },
            { session },
          );

          if (usageResult.matchedCount !== 1) {
            throw new Error(
              "COUPON_ERROR:Coupon is no longer available. Please try another coupon",
            );
          }

          appliedCouponCode = coupon.code;
        }

        const discountedItemsPrice = calculatedItemsPrice - discountAmount;

        const calculatedTotal =
          discountedItemsPrice + shippingAmount + taxAmount;

        const order = new Order({
          user: req.user._id,
          orderItems: preparedItems,
          shippingAddress: normalizedShipping,
          paymentMethod: paymentMethod || "Cash on Delivery",
          itemsPrice: calculatedItemsPrice,
          shippingPrice: shippingAmount,
          taxPrice: taxAmount,
          couponCode: appliedCouponCode,
          discountAmount,
          totalPrice: calculatedTotal,
          notes,
        });

        await order.save({ session });

        createdOrder = order;
      }); // Close withTransaction here
      // Send order confirmation email after transaction commits
      try {
        await sendOrderConfirmationEmail({
          to: req.user.email,
          order: createdOrder,
        });

        console.log("[ORDER CONFIRMATION EMAIL] Sent successfully");
      } catch (emailError) {
        console.error("[ORDER CONFIRMATION EMAIL ERROR]", emailError.message);
      }

      // Return successful order response
      return res.status(201).json(createdOrder);
    } catch (error) {
      if (error.message.startsWith("COUPON_ERROR:")) {
        return res.status(400).json({
          message: error.message.replace("COUPON_ERROR:", ""),
        });
      }

      if (error.message === "PRODUCT_NOT_FOUND") {
        return res.status(400).json({
          message: "One or more products are unavailable",
        });
      }

      if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
        const productName = error.message.split(":")[1];

        return res.status(400).json({
          message: `Insufficient stock for ${productName}`,
        });
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }),
);


// Download Order Invoice PDF
router.get(
  "/:id/invoice",
  protect,
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid order ID");
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const isOwner =
      order.user.toString() === req.user._id.toString();

    const isAdmin = req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error("Not authorized to download this invoice");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="MINIS-Invoice-${order._id}.pdf"`
    );

    generateOrderInvoice(order, res);
  })
);

// GET /api/orders/my - Get logged-in customer's orders
router.get(
  "/my",
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(orders);
  }),
);

// GET /api/orders/:id - Get a single user's order
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("orderItems.product", "name images");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Customers can only access their own orders.
    // Admins can access any order.
    const isOwner = order.user?._id.toString() === req.user._id.toString();

    const isAdmin = req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to access this order",
      });
    }

    res.json(order);
  }),
);


// @desc    Confirm Cash on Delivery payment
// @route   PATCH /api/orders/:id/pay
// @access  Admin
router.patch("/:id/pay", protect, admin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid order ID");
  }

  const order = await Order.findById(id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.paymentMethod !== "Cash on Delivery") {
    res.status(400);
    throw new Error("This action is only available for Cash on Delivery orders");
  }

  if (order.status !== "delivered") {
    res.status(400);
    throw new Error("Only delivered orders can be marked as paid");
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error("This order is already marked as paid");
  }

  order.isPaid = true;
  order.paidAt = new Date();

  const updatedOrder = await order.save();

  res.json({
    message: "Payment confirmed successfully",
    order: updatedOrder,
  });
}));


module.exports = router;
