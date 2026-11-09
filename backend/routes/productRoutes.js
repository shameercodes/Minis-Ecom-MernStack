const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Order = require("../models/Order");
const { protect, admin } = require('../middleware/auth');

// GET /api/products — list with filters
router.get('/', asyncHandler(async (req, res) => {
  const { category, subcategory, search, featured, sort, page = 1, limit = 12, minPrice, maxPrice } = req.query;
  const query = { isActive: true };

  if (category) query.category = category.toLowerCase();
  if (subcategory) query.subcategory = subcategory.toLowerCase();
  if (featured === 'true') query.featured = true;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
    { tags: { $regex: search, $options: 'i' } }
  ];
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1 },
    popular: { numReviews: -1 }
  };
  const sortBy = sortOptions[sort] || { createdAt: -1 };

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    products,
    page: Number(page),
    pages: Math.ceil(total / limit),
    total
  });
}));

// GET /api/products/featured
router.get('/featured', asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, featured: true }).limit(8);
  res.json(products);
}));

// GET /api/products/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { slug: req.params.id }],
    isActive: true
  });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
}));

// POST /api/products/:id/reviews
router.post(
  "/:id/reviews",
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    // Validate rating
    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be a whole number between 1 and 5",
      });
    }

    // Validate comment
    if (typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({
        message: "Review comment is required",
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        message: "Review cannot exceed 1000 characters",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    

    // Prevent duplicate reviews
    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString(),
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    // Verify that the user purchased and received this product
    const verifiedOrder = await Order.exists({
      user: req.user._id,
      status: "delivered",
      isDelivered: true,
      "orderItems.product": product._id,
    });

    if (!verifiedOrder) {
      return res.status(403).json({
        message: "You can review this product only after receiving your order",
      });
    }

    // Save verified review
    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating: numericRating,
      comment: comment.trim(),
      isVerifiedPurchase: true,
    });

    // Update average rating
    product.numReviews = product.reviews.length;

    const averageRating =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length;

    product.rating = Math.round(averageRating * 10) / 10;

    await product.save();

    res.status(201).json({
      message: "Verified review added successfully",
      rating: product.rating,
      numReviews: product.numReviews,
    });
  }),
);



// PUT /api/products/:id/reviews
router.put(
  "/:id/reviews",
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be a whole number between 1 and 5",
      });
    }

    if (typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({
        message: "Review comment is required",
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        message: "Review cannot exceed 1000 characters",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const existingReview = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString(),
    );

    if (!existingReview) {
      return res.status(404).json({
        message: "You have not reviewed this product yet",
      });
    }

    // Confirm the customer still has a delivered order for this product
    const verifiedOrder = await Order.exists({
      user: req.user._id,
      status: "delivered",
      isDelivered: true,
      "orderItems.product": product._id,
    });

    if (!verifiedOrder) {
      return res.status(403).json({
        message: "Only verified customers can edit this review",
      });
    }

    existingReview.rating = numericRating;
    existingReview.comment = comment.trim();

    product.numReviews = product.reviews.length;

    const averageRating =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length;

    product.rating = Math.round(averageRating * 10) / 10;

    await product.save();

    res.json({
      message: "Review updated successfully",
      rating: product.rating,
      numReviews: product.numReviews,
    });
  }),
);


// Admin: POST /api/products
router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
}));

// Admin: PUT /api/products/:id
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
}));

// Admin: DELETE /api/products/:id
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product removed' });
}));

module.exports = router;
