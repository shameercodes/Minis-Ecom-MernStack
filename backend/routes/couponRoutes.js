const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");

const Coupon = require("../models/Coupon");
const { protect, admin } = require("../middleware/auth");

// GET /api/coupons - Admin: get all coupons
router.get(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  }),
);

// GET /api/coupons/public - Customer: get available public coupons
router.get(
  "/public",
  asyncHandler(async (req, res) => {
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      showOnStore: true,

      $and: [
        {
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        },
        {
          $or: [
            { usageLimit: null },
            { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
          ],
        },
      ],
    })
      .select(
        "code description discountType discountValue minimumOrderAmount maximumDiscount expiresAt featuredOnHome",
      )
      .sort({ createdAt: -1 })
      .lean();

    res.json(coupons);
  }),
);

// POST /api/coupons - Admin: create coupon
router.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      expiresAt,
      showOnStore,
      featuredOnHome,
    } = req.body;

    if (!code || !String(code).trim()) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({ message: "Invalid discount type" });
    }

    const value = Number(discountValue);

    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ message: "Invalid discount value" });
    }

    if (discountType === "percentage" && value > 100) {
      return res.status(400).json({
        message: "Percentage discount cannot exceed 100",
      });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    const existingCoupon = await Coupon.findOne({ code: normalizedCode });

    if (existingCoupon) {
      return res.status(409).json({
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      description,
      discountType,
      discountValue: value,
      minimumOrderAmount: Number(minimumOrderAmount) || 0,
      showOnStore: showOnStore === true,
      featuredOnHome: featuredOnHome === true,
      maximumDiscount:
        maximumDiscount === null ||
        maximumDiscount === undefined ||
        maximumDiscount === ""
          ? null
          : Number(maximumDiscount),
      usageLimit:
        usageLimit === null || usageLimit === undefined || usageLimit === ""
          ? null
          : Number(usageLimit),
      expiresAt: expiresAt || null,
    });

    res.status(201).json(coupon);
  }),
);

// POST /api/coupons/validate - Customer: validate coupon
router.post(
  "/validate",
  protect,
  asyncHandler(async (req, res) => {
    const { code, itemsPrice } = req.body;

    const subtotal = Number(itemsPrice);

    if (!code || !Number.isFinite(subtotal) || subtotal < 0) {
      return res.status(400).json({
        message: "Valid coupon code and order subtotal are required",
      });
    }

    const coupon = await Coupon.findOne({
      code: String(code).trim().toUpperCase(),
    });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({
        message: "Invalid or inactive coupon",
      });
    }

    if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
      return res.status(400).json({
        message: "This coupon has expired",
      });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        message: "This coupon has reached its usage limit",
      });
    }

    const alreadyUsed = (coupon.usedBy || []).some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    if (alreadyUsed) {
      return res.status(400).json({
        message: "You have already used this coupon",
      });
    }

    if (subtotal < coupon.minimumOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount is Rs. ${coupon.minimumOrderAmount}`,
      });
    }

    let discountAmount =
      coupon.discountType === "percentage"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;

    if (coupon.maximumDiscount !== null) {
      discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
    }

    discountAmount = Math.min(discountAmount, subtotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    res.json({
      message: "Coupon applied successfully",
      code: coupon.code,
      discountAmount,
      itemsPrice: subtotal,
      discountedItemsPrice: Math.round((subtotal - discountAmount) * 100) / 100,
    });
  }),
);

// PATCH /api/coupons/:id - Admin: update coupon
router.patch(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    if (!require("mongoose").isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const allowedFields = [
      "description",
      "isActive",
      "showOnStore",
      "featuredOnHome",
      "minimumOrderAmount",
      "maximumDiscount",
      "usageLimit",
      "expiresAt",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        coupon[field] = req.body[field];
      }
    }

    await coupon.save();

    res.json(coupon);
  }),
);

// DELETE /api/coupons/:id - Admin: delete coupon
router.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    if (!require("mongoose").isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    await coupon.deleteOne();

    res.json({ message: "Coupon deleted successfully" });
  }),
);

module.exports = router;
