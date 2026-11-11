import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiTrash2, FiShare2, FiCopy, FiX,} from "react-icons/fi";
import toast from "react-hot-toast";
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export default function WishlistPage() {
  const {
    wishlist,
    toggleWishlist,
    shareInfo,
    shareLoading,
    enableWishlistSharing,
    disableWishlistSharing,
  } = useWishlist();
  const { addToCart } = useCart();

  const handleEnableSharing = async () => {
    await enableWishlistSharing();
  };

  const handleCopyLink = async () => {
    if (!shareInfo.shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareInfo.shareUrl);
      toast.success("Wishlist link copied!");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const handleDisableSharing = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to disable wishlist sharing?",
    );

    if (confirmed) {
      await disableWishlistSharing();
    }
  };

  if (wishlist.length === 0) return (
    <div className="container-custom py-24 text-center animate-fade-in">
      <FiHeart size={64} className="mx-auto text-gray-200 mb-6" />
      <h2 className="font-display text-3xl mb-3">Your Wishlist is Empty</h2>
      <p className="text-gray-500 mb-8">Save items you love to come back to them later</p>
      <Link to="/shop" className="btn-primary">Browse Products</Link>
    </div>
  );

  return (
    <div className="container-custom py-10 animate-fade-in">
      <h1 className="font-display text-3xl md:text-4xl mb-8">
        My Wishlist{" "}
        <span className="text-gray-400 text-2xl">({wishlist.length})</span>
      </h1>

      {/* Wishlist Sharing */}
      <div className="mb-8 border border-gray-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <FiShare2 size={20} />
          <h2 className="font-semibold text-lg">Share Your Wishlist</h2>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Create a public link to let others view your wishlist.
        </p>

        {shareInfo.isActive ? (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={shareInfo.shareUrl || ""}
                className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
              />

              <button
                onClick={handleCopyLink}
                className="bg-dark text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
              >
                <FiCopy size={15} />
                Copy Link
              </button>
            </div>

            <button
              onClick={handleDisableSharing}
              disabled={shareLoading}
              className="mt-4 text-red-500 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <FiX size={15} />
              Disable Sharing
            </button>
          </>
        ) : (
          <button
            onClick={handleEnableSharing}
            disabled={shareLoading || wishlist.length === 0}
            className="bg-dark text-white px-5 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
          >
            <FiShare2 size={15} />
            {shareLoading ? "Creating Link..." : "Enable Wishlist Sharing"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {wishlist.map((product) => {
          const discount = product.originalPrice
            ? Math.round(
                ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100,
              )
            : 0;

          return (
            <div key={product._id} className="group relative">
              {/* Image */}
              <Link
                to={`/product/${product.slug}`}
                className="block relative overflow-hidden bg-gray-50 aspect-[3/4]"
              >
                <img
                  src={
                    product.images?.[0] ||
                    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
                  }
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {discount > 0 && (
                  <span className="absolute top-3 left-3 badge">
                    -{discount}%
                  </span>
                )}
              </Link>

              {/* Info */}
              <div className="pt-3">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                  {product.subcategory || product.category}
                </p>
                <Link
                  to={`/product/${product.slug}`}
                  className="text-sm font-medium
                text-dark hover:text-primary-600 transition-colors line-clamp-1 block"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold text-dark">
                    PKR {product.price.toLocaleString()}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-gray-400 line-through text-xs">
                      PKR {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() =>
                      addToCart(
                        product,
                        1,
                        product.sizes?.[0],
                        product.colors?.[0],
                      )
                    }
                    disabled={product.stock === 0}
                    className="flex-1 bg-dark text-white py-2 text-xs font-medium tracking-wider
                    uppercase flex items-center justify-center gap-1 hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    <FiShoppingBag size={12} />
                    {product.stock === 0 ? "Sold Out" : "Add to Cart"}
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="w-9 h-9 flex items-center justify-center border border-gray-300 
                    text-red-400 hover:bg-red-50 hover:border-red-300 transition-colors"
                    title="Remove from wishlist"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link to="/shop" className="btn-outline inline-block">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
