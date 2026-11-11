const crypto = require("crypto");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const WishlistShare = require("../models/WishlistShare");
const Product = require("../models/Product");

const generateToken = () => crypto.randomBytes(32).toString("hex");

const normalizeProductIds = (productIds) => {
  if (!Array.isArray(productIds)) {
    return null;
  }

  const ids = productIds.map(String);

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    return null;
  }

  return [...new Set(ids)];
};

const getShareUrl = (token) => {
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");

  return `${frontendUrl}/shared-wishlist/${token}`;
};

// Get the current user's sharing status.
const getMyShare = asyncHandler(async (req, res) => {
  const share = await WishlistShare.findOne({
    user: req.user._id,
    isActive: true,
  }).select("token productIds");

  if (!share) {
    return res.json({
      isActive: false,
      shareUrl: null,
    });
  }

  res.json({
    isActive: true,
    shareUrl: getShareUrl(share.token),
    productCount: share.productIds.length,
  });
});

// Create or update a shared wishlist.
const createOrUpdateShare = asyncHandler(async (req, res) => {
  const productIds = normalizeProductIds(req.body.productIds);

  if (!productIds) {
    return res.status(400).json({
      message: "Invalid product IDs",
    });
  }

  let share = await WishlistShare.findOne({
    user: req.user._id,
  });

  if (share) {
    if (!share.isActive) {
      share.token = generateToken();
    }

    share.productIds = productIds;
    share.isActive = true;

    await share.save();
  } else {
    share = await WishlistShare.create({
      user: req.user._id,
      token: generateToken(),
      productIds,
      isActive: true,
    });
  }

  res.status(200).json({
    message: "Wishlist sharing enabled successfully",
    isActive: true,
    shareUrl: getShareUrl(share.token),
    productCount: share.productIds.length,
  });
});

// Synchronize changes while sharing is active.
const syncShare = asyncHandler(async (req, res) => {
  const productIds = normalizeProductIds(req.body.productIds);

  if (!productIds) {
    return res.status(400).json({
      message: "Invalid product IDs",
    });
  }

  const share = await WishlistShare.findOneAndUpdate(
    {
      user: req.user._id,
      isActive: true,
    },
    {
      $set: { productIds },
    },
    { new: true },
  );

  if (!share) {
    return res.status(404).json({
      message: "No active shared wishlist found",
    });
  }

  res.json({
    message: "Wishlist synchronized successfully",
  });
});

// Get a public shared wishlist.
const getPublicShare = asyncHandler(async (req, res) => {
  const share = await WishlistShare.findOne({
    token: req.params.token,
    isActive: true,
  }).select("productIds");

  if (!share) {
    return res.status(404).json({
      message: "This wishlist link is invalid or disabled",
    });
  }

  const products = await Product.find({
    _id: { $in: share.productIds },
    isActive: true,
  }).select(
    "name slug price originalPrice images category subcategory sizes colors stock rating numReviews",
  );

  const productMap = new Map(
    products.map((product) => [String(product._id), product]),
  );

  const orderedProducts = share.productIds
    .map((id) => productMap.get(String(id)))
    .filter(Boolean);

  res.json({
    products: orderedProducts,
    count: orderedProducts.length,
  });
});

// Revoke the current user's sharing link.
const revokeShare = asyncHandler(async (req, res) => {
  const share = await WishlistShare.findOneAndUpdate(
    {
      user: req.user._id,
      isActive: true,
    },
    {
      $set: { isActive: false },
    },
    { new: true },
  );

  if (!share) {
    return res.status(404).json({
      message: "No active shared wishlist found",
    });
  }

  res.json({
    message: "Wishlist sharing disabled successfully",
    isActive: false,
  });
});

module.exports = {
  getMyShare,
  createOrUpdateShare,
  syncShare,
  getPublicShare,
  revokeShare,
};
