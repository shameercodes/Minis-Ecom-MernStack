import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiEye } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { StarRating } from './Spinner';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const isSoldOut =
    product.trackInventory !== false && Number(product.stock) <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, product.sizes?.[0] || null, product.colors?.[0] || null);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group relative card-hover">
      <Link to={`/product/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50 aspect-[3/4]">
          <img
            src={
              product.images?.[0] ||
              "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
            }
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {discount > 0 && <span className="badge">-{discount}%</span>}
            {product.featured && (
              <span className="bg-dark text-white text-xs px-2 py-1 font-medium tracking-wider uppercase">
                New
              </span>
            )}
            {isSoldOut && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 font-medium tracking-wider uppercase">
                Sold Out
              </span>
            )}
          </div>

          {/* Actions overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300">
            <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-300">
              <button
                onClick={handleWishlist}
                className={`w-9 h-9 flex items-center justify-center rounded-none shadow-md transition-colors ${
                  wishlisted
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-700 hover:bg-primary-600 hover:text-white"
                }`}
              >
                <FiHeart
                  size={16}
                  fill={wishlisted ? "currentColor" : "none"}
                />
              </button>
              <Link
                to={`/product/${product.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 flex items-center justify-center bg-white text-gray-700 hover:bg-primary-600 hover:text-white shadow-md transition-colors"
              >
                <FiEye size={16} />
              </Link>
            </div>
          </div>

          {/* Add to cart */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={isSoldOut}
              className="w-full bg-dark text-white py-3 text-xs font-medium tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiShoppingBag size={14} />
              {isSoldOut ? "Sold Out" : "Add to Cart"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="pt-3 pb-1">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
            {product.subcategory || product.category}
          </p>
          <h3 className="text-sm font-medium text-dark group-hover:text-primary-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <StarRating rating={product.rating} count={product.numReviews} />
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-dark">
              PKR {product.price.toLocaleString()}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-gray-400 line-through text-sm">
                PKR {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
