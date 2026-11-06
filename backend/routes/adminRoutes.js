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
      trackInventory: true,
      $expr: {
        $lte: ["$stock", "$lowStockThreshold"],
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
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = req.body.status;

    if (req.body.status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    await order.save();
    res.json(order);
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
