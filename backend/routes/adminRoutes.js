const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const { protect, admin } = require("../middleware/auth");

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
router.get(
  "/stats",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const [totalOrders, totalUsers, totalProducts, orders] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ isAdmin: false }),
      Product.countDocuments({ isActive: true }),
      Order.find().select("totalPrice createdAt status isPaid"),
    ]);

    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const processingOrders = orders.filter(
      (o) => o.status === "processing",
    ).length;
    const shippedOrders = orders.filter((o) => o.status === "shipped").length;
    const deliveredOrders = orders.filter(
      (o) => o.status === "delivered",
    ).length;
    const cancelledOrders = orders.filter(
      (o) => o.status === "cancelled",
    ).length;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentOrders = orders.filter(
      (o) => new Date(o.createdAt) >= sixMonthsAgo && o.status !== "cancelled",
    );

    const monthlyRevenue = {};
    recentOrders.forEach((o) => {
      const key = new Date(o.createdAt).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + o.totalPrice;
    });

    const recentOrdersList = await Order.find()
      .populate("user", "name email")
      .populate("orderItems.product", "stock")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id totalPrice status createdAt user orderItems");

    res.json({
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      ordersByStatus: {
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      monthlyRevenue,
      recentOrders: recentOrdersList,
    });
  }),
);

// ─── LOW-STOCK INVENTORY ─────────────────────────────────────────────
router.get(
  "/inventory/low-stock",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const products = await Product.find({
      isActive: true,
      $expr: {
        $and: [
          {
            $eq: [{ $ifNull: ["$trackInventory", true] }, true],
          },
          {
            $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }],
          },
        ],
      },
    })
      .select("name slug images category price stock lowStockThreshold")
      .sort({ stock: 1 });

    res.json({
      count: products.length,
      products,
    });
  }),
);

// ─── PRODUCTS CRUD ────────────────────────────────────────────────────────────
router.get(
  "/products",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, category } = req.query;

    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }];
    if (category) query.category = category;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      products,
      total,
      pages: Math.ceil(total / limit),
      page: Number(page),
    });
  }),
);

router.post(
  "/products",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  }),
);

router.put(
  "/products/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  }),
);

router.delete(
  "/products/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deactivated" });
  }),
);

// ─── ORDERS MANAGEMENT ───────────────────────────────────────────────────────
router.get(
  "/orders",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status) query.status = status;

    let orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (search) {
      orders = orders.filter(
        (o) =>
          o._id.toString().includes(search) ||
          o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          o.user?.email?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      pages: Math.ceil(total / limit),
      page: Number(page),
    });
  }),
);

router.put(
  "/orders/:id/status",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const session = await mongoose.startSession();
    let updatedOrder;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(req.params.id).session(session);

        if (!order) {
          throw new Error("ORDER_NOT_FOUND");
        }

        // Never reactivate an already cancelled order.
        if (order.status === "cancelled" && status !== "cancelled") {
          throw new Error("CANCELLED_ORDER_CANNOT_BE_REACTIVATED");
        }

        // Repeated cancellation must never restore stock twice.
        if (order.status === "cancelled" && status === "cancelled") {
          updatedOrder = order;
          return;
        }

        // Only pending and processing orders can be cancelled automatically.
        if (
          status === "cancelled" &&
          !["pending", "processing"].includes(order.status)
        ) {
          throw new Error("ORDER_CANNOT_BE_CANCELLED");
        }

        // Restore inventory when cancelling an eligible order.
        if (status === "cancelled" && !order.stockRestored) {
          for (const item of order.orderItems) {
            const product = await Product.findById(item.product).session(
              session,
            );

            if (!product) {
              throw new Error("PRODUCT_NOT_FOUND_DURING_RESTORATION");
            }

            // Do not modify stock for products with inventory tracking disabled.
            if (product.trackInventory === false) {
              continue;
            }

            const result = await Product.updateOne(
              { _id: product._id },
              { $inc: { stock: item.quantity } },
              { session },
            );

            if (result.matchedCount !== 1) {
              throw new Error("STOCK_RESTORATION_FAILED");
            }
          }

          order.stockRestored = true;
        }

        order.status = status;

        if (status === "delivered") {
          order.isDelivered = true;
          order.deliveredAt = Date.now();
        }

        await order.save({ session });

        updatedOrder = order;
      });

      return res.json(updatedOrder);
    } catch (error) {
      if (error.message === "ORDER_NOT_FOUND") {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      if (error.message === "CANCELLED_ORDER_CANNOT_BE_REACTIVATED") {
        return res.status(400).json({
          message: "A cancelled order cannot be reactivated",
        });
      }

      if (error.message === "ORDER_CANNOT_BE_CANCELLED") {
        return res.status(400).json({
          message: "Only pending or processing orders can be cancelled",
        });
      }

      if (error.message === "PRODUCT_NOT_FOUND_DURING_RESTORATION") {
        return res.status(400).json({
          message:
            "A product could not be found. Stock restoration was cancelled",
        });
      }

      if (error.message === "STOCK_RESTORATION_FAILED") {
        return res.status(400).json({
          message: "Stock restoration failed",
        });
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }),
);

router.delete(
  "/orders/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order deleted" });
  }),
);

// ─── USERS MANAGEMENT ────────────────────────────────────────────────────────
router.get(
  "/users",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      users,
      total,
      pages: Math.ceil(total / limit),
      page: Number(page),
    });
  }),
);

router.put(
  "/users/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        isAdmin: req.body.isAdmin,
      },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  }),
);

router.delete(
  "/users/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted" });
  }),
);

module.exports = router;
