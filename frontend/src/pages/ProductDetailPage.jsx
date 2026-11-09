import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiHeart,
  FiShoppingBag,
  FiTruck,
  FiShield,
  FiRefreshCw,
  FiShare2,
  FiStar,
} from "react-icons/fi";
import { getProduct, addReview, updateReview, getProducts } from "../utils/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { PageLoader, StarRating } from "../components/ui/Spinner";
import ProductCard from "../components/ui/ProductCard";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();

  const currentUserReview = product?.reviews?.find(
    (review) =>
      String(review.user?._id || review.user) === String(user?._id || user?.id),
  );

  useEffect(() => {
    setLoading(true);
    setIsEditingReview(false);
    setReviewForm({ rating: 5, comment: "" });
    getProduct(slug)
      .then(({ data }) => {
        setProduct(data);
        setSelectedSize(data.sizes?.[0] || null);
        setSelectedColor(data.colors?.[0] || null);
        // Load related
        getProducts({ category: data.category, limit: 4 }).then((r) =>
          setRelated(
            r.data.products.filter((p) => p._id !== data._id).slice(0, 4),
          ),
        );
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const refreshStock = async () => {
      try {
        const { data } = await getProduct(slug);

        setProduct((prev) => (prev ? { ...prev, ...data } : data));

        setQty((prev) =>
          data.trackInventory === false ? prev : Math.min(prev, data.stock),
        );
      } catch (error) {
        console.error("Failed to refresh product stock:", error);
      }
    };

    window.addEventListener("focus", refreshStock);

    return () => {
      window.removeEventListener("focus", refreshStock);
    };
  }, [slug]);

  if (loading) return <PageLoader />;
  if (!product)
    return (
      <div className="container-custom py-20 text-center">
        <h2 className="font-display text-3xl mb-4">Product Not Found</h2>
        <Link to="/shop" className="btn-primary">
          Back to Shop
        </Link>
      </div>
    );

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) {
      return toast.error("Please select a size");
    }

    if (product.colors?.length && !selectedColor) {
      return toast.error("Please select a color");
    }

    const inventoryTracked = product.trackInventory !== false;
    const availableStock = Number(product.stock) || 0;

    if (inventoryTracked && availableStock <= 0) {
      return toast.error("This product is out of stock");
    }

    if (inventoryTracked && qty > availableStock) {
      return toast.error(`Only ${availableStock} items are available`);
    }

    addToCart(product, qty, selectedSize, selectedColor);
  };

const handleReview = async (e) => {
  e.preventDefault();

  if (!user) return toast.error("Please login to leave a review");

  setReviewLoading(true);

  try {
    if (isEditingReview) {
      await updateReview(product._id, reviewForm);
      toast.success("Review updated successfully!");
    } else {
      await addReview(product._id, reviewForm);
      toast.success("Review submitted successfully!");
    }

    const { data } = await getProduct(slug);

    setProduct(data);
    setReviewForm({ rating: 5, comment: "" });
    setIsEditingReview(false);
  } catch (err) {
    toast.error(err.response?.data?.message || "Review failed");
  } finally {
    setReviewLoading(false);
  }
};

  return (
    <div className="animate-fade-in">
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-8 flex items-center gap-2">
          <Link to="/" className="hover:text-primary-600">
            Home
          </Link>
          <span>/</span>
          <Link
            to={`/shop/${product.category}`}
            className="hover:text-primary-600
          capitalize"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-dark">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden bg-gray-50">
              <img
                src={
                  product.images?.[selectedImage] ||
                  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"
                }
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 overflow-hidden border-2 transition-colors
                      ${selectedImage === i ? "border-primary-500" : "border-transparent"}`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-xs tracking-widest uppercase text-primary-600 mb-2">
              {product.subcategory || product.category}
            </p>
            <h1 className="font-display text-3xl md:text-4xl text-dark mb-3">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mb-4">
              <StarRating
                rating={product.rating}
                count={product.numReviews}
                size="md"
              />
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-bold text-dark">
                PKR {product.price.toLocaleString()}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-gray-400 line-through">
                    PKR {product.originalPrice.toLocaleString()}
                  </span>
                  <span className="badge">-{discount}%</span>
                </>
              )}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium mb-2">
                  Color: <span className="text-gray-500">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-4 py-2 text-xs border transition-colors ${selectedColor === c ? "border-primary-600 bg-primary-50 text-primary-700" : "border-gray-300 hover:border-primary-400"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium mb-2">
                  Size: <span className="text-gray-500">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-12 h-10 text-sm border transition-colors ${selectedSize === s ? "border-primary-600 bg-primary-600 text-white" : "border-gray-300 hover:border-primary-400"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex border border-gray-300">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 hover:bg-gray-50 text-lg"
                >
                  −
                </button>
                <span className="px-5 py-2 border-x border-gray-300 text-sm font-medium">
                  {qty}
                </span>
                <button
                  onClick={() =>
                    setQty((q) =>
                      product.trackInventory === false
                        ? q + 1
                        : Math.min(product.stock, q + 1),
                    )
                  }
                  disabled={
                    product.trackInventory !== false && qty >= product.stock
                  }
                  className="px-4 py-2 hover:bg-gray-50 text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {" "}
                  +{" "}
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {product.trackInventory === false
                  ? "Available"
                  : product.stock > 0
                    ? `${product.stock} in stock`
                    : "Out of stock"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={
                  product.trackInventory !== false && product.stock <= 0
                }
                className="flex-1 btn-dark flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiShoppingBag size={16} />
                {product.trackInventory !== false && product.stock <= 0
                  ? "Sold Out"
                  : "Add to Cart"}
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`w-12 h-12 flex items-center justify-center border transition-colors ${isWishlisted(product._id) ? "bg-primary-600 border-primary-600 text-white" : "border-gray-300 hover:border-primary-600"}`}
              >
                <FiHeart
                  size={18}
                  fill={isWishlisted(product._id) ? "currentColor" : "none"}
                />
              </button>
            </div>

            {/* Trust badges */}
            <div className="border-t border-gray-100 pt-6 space-y-2">
              {[
                [FiTruck, "Free delivery on orders over PKR 5,000"],
                [FiShield, "100% authentic products guaranteed"],
                [FiRefreshCw, "30-day easy returns"],
              ].map(([Icon, text]) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <Icon size={14} className="text-primary-600" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16 border-t pt-12">
          <h2 className="font-display text-2xl mb-8">
            Customer Reviews ({product.numReviews})
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            {/* Review list */}
            <div className="space-y-5">
              {product.reviews?.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No reviews yet. Be the first!
                </p>
              ) : (
                product.reviews.map((r) => (
                  <div key={r._id} className="border-b border-gray-100 pb-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.name}</span>

                        {r.isVerifiedPurchase && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                            ✓ Verified Purchase
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <StarRating rating={r.rating} />

                    <p className="text-sm text-gray-600 mt-2">{r.comment}</p>

                    {user &&
                      String(r.user?._id || r.user) ===
                        String(user._id || user.id) && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewForm({
                              rating: r.rating,
                              comment: r.comment,
                            });
                            setIsEditingReview(true);
                          }}
                          className="text-sm text-primary-600 font-medium mt-3 hover:underline"
                        >
                          Edit Review
                        </button>
                      )}
                  </div>
                ))
              )}
            </div>

            {/* Review form */}
            <div>
              <h3 className="font-semibold mb-4">
                {isEditingReview ? "Edit Your Review" : "Write a Review"}
              </h3>

              {!user ? (
                <p className="text-sm text-gray-500">
                  <Link to="/login" className="text-primary-600 font-medium">
                    Sign in
                  </Link>{" "}
                  to leave a review
                </p>
              ) : currentUserReview && !isEditingReview ? (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    You have already reviewed this product.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewForm({
                        rating: currentUserReview.rating,
                        comment: currentUserReview.comment,
                      });
                      setIsEditingReview(true);
                    }}
                    className="text-sm text-primary-600 font-medium mt-2 hover:underline"
                  >
                    Edit Your Review
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReview} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Rating
                    </label>

                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setReviewForm((f) => ({ ...f, rating: s }))
                          }
                        >
                          <FiStar
                            size={22}
                            className={
                              s <= reviewForm.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }
                            fill={
                              s <= reviewForm.rating ? "currentColor" : "none"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Comment
                    </label>

                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm((f) => ({
                          ...f,
                          comment: e.target.value,
                        }))
                      }
                      rows={4}
                      maxLength={1000}
                      required
                      placeholder="Share your experience..."
                      className="input-field resize-none"
                    />

                    <p className="text-xs text-gray-400 mt-1">
                      Maximum 1000 characters.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {reviewLoading
                        ? isEditingReview
                          ? "Saving..."
                          : "Submitting..."
                        : isEditingReview
                          ? "Save Changes"
                          : "Submit Review"}
                    </button>

                    {isEditingReview && (
                      <button
                        type="button"
                        disabled={reviewLoading}
                        onClick={() => {
                          setIsEditingReview(false);
                          setReviewForm({ rating: 5, comment: "" });
                        }}
                        className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
