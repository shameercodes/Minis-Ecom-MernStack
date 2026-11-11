const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");

const {
  getMyShare,
  createOrUpdateShare,
  syncShare,
  getPublicShare,
  revokeShare,
} = require("../handlers/wishlistShareHandlers");

// Public route — no login required.
router.get("/public/:token", getPublicShare);

// Protected routes — login required.
router.get("/", protect, getMyShare);
router.post("/", protect, createOrUpdateShare);
router.put("/sync", protect, syncShare);
router.delete("/", protect, revokeShare);

module.exports = router;
