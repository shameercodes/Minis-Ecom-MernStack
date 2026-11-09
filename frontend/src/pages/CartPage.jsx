import { Link } from "react-router-dom";
import { FiTrash2, FiArrowLeft, FiShoppingBag } from "react-icons/fi";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQty, cartTotal, clearCart } =
    useCart();

  const shipping = cartTotal >= 5000 ? 0 : 299;
  const tax = Math.round(cartTotal * 0.05);
  const orderTotal = cartTotal + shipping + tax;

  if (cartItems.length === 0)
    return (
      <div className="container-custom py-24 text-center animate-fade-in">
        <FiShoppingBag size={64} className="mx-auto text-gray-200 mb-6" />
        <h2 className="font-display text-3xl mb-3">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-8">
          Looks like you haven't added anything yet
        </p>
        <Link to="/shop" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    );

  return (
    <div className="container-custom py-8 animate-fade-in">
      <h1 className="font-display text-3xl md:text-4xl mb-8">
        Shopping Cart ({cartItems.length})
      </h1>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={`${item._id}-${item.selectedSize}-${item.selectedColor}`}
              className="flex gap-4 border border-gray-100 p-4"
            >
              <Link
                to={`/product/${item.slug}`}
                className="w-24 h-28 shrink-0
               overflow-hidden bg-gray-50"
              >
                <img
                  src={item.images?.[0]}
                  alt={item.name}
                  className="w-full h-full
                 object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item.slug}`}
                  className="font-medium text-dark hover:text-primary-600 transition-colors line-clamp-1"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-gray-400 mt-1">
                  {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                  {item.selectedSize && item.selectedColor && " · "}
                  {item.selectedColor && (
                    <span>Color: {item.selectedColor}</span>
                  )}
                </p>
                <p className="font-semibold mt-2">
                  PKR {item.price.toLocaleString()}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex border border-gray-300">
                    <button
                      onClick={() =>
                        updateQty(
                          item._id,
                          item.selectedSize,
                          item.selectedColor,
                          item.qty - 1,
                        )
                      }
                      className="px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="px-4 py-1 text-sm border-x border-gray-300">
                      {item.qty}
                    </span>
                    <button
                      onClick={() =>
                        updateQty(
                          item._id,
                          item.selectedSize,
                          item.selectedColor,
                          item.qty + 1,
                        )
                      }
                      disabled={
                        item.trackInventory !== false && item.qty >= item.stock
                      }
                      className="px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      removeFromCart(
                        item._id,
                        item.selectedSize,
                        item.selectedColor,
                      )
                    }
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold">
                  PKR {(item.price * item.qty).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <Link
              to="/shop"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              <FiArrowLeft size={14} /> Continue Shopping
            </Link>
            <button
              onClick={clearCart}
              className="text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-gray-50 p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>PKR {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span
                  className={shipping === 0 ? "text-green-600 font-medium" : ""}
                >
                  {shipping === 0 ? "FREE" : `PKR ${shipping}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (5%)</span>
                <span>PKR {tax.toLocaleString()}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-primary-600 bg-primary-50 p-2">
                  Add PKR {(5000 - cartTotal).toLocaleString()} more for free
                  shipping!
                </p>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>PKR {orderTotal.toLocaleString()}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-dark w-full text-center block">
              Proceed to Checkout
            </Link>
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                🔒 Secure, encrypted checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
