import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { getPublicWishlistShare } from "../utils/api";

export default function SharedWishlistPage() {
  const { token } = useParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const { data } = await getPublicWishlistShare(token);
        setProducts(data.products || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load this shared wishlist.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [token]);

  if (loading) {
    return (
      <div className="container-custom py-24 text-center">
        <p className="text-gray-500">Loading shared wishlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-24 text-center">
        <FiHeart size={55} className="mx-auto text-gray-300 mb-5" />
        <h2 className="font-display text-3xl mb-3">Wishlist Unavailable</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/shop" className="btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-10 animate-fade-in">
      <div className="text-center mb-10">
        <FiHeart size={35} className="mx-auto text-primary-600 mb-3" />
        <h1 className="font-display text-3xl md:text-4xl mb-2">
          Shared Wishlist
        </h1>
        <p className="text-gray-500">Discover these favorite products.</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-6">
            This wishlist currently has no available products.
          </p>
          <Link to="/shop" className="btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product._id} className="group">
              <Link
                to={`/product/${product.slug}`}
                className="block overflow-hidden bg-gray-50 aspect-[3/4]"
              >
                <img
                  src={
                    product.images?.[0] ||
                    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
                  }
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>

              <div className="pt-3">
                <p className="text-xs text-gray-400 uppercase mb-1">
                  {product.subcategory || product.category}
                </p>

                <Link
                  to={`/product/${product.slug}`}
                  className="text-sm font-medium text-dark hover:text-primary-600"
                >
                  {product.name}
                </Link>

                <p className="font-semibold text-dark mt-1">
                  PKR {product.price.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
