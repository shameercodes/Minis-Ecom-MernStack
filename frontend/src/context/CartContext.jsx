import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getProduct } from "../utils/api";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("minis_cart") || "[]");
    } catch {
      return [];
    }
  });

  // Keep cart saved in localStorage
  useEffect(() => {
    localStorage.setItem("minis_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Refresh stock and product information from backend
  useEffect(() => {
    let cancelled = false;

    const syncCartStock = async () => {
      if (!cartItems.length) return;

      const results = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const { data } = await getProduct(item._id);

            return {
              id: item._id,
              product: data,
              error: null,
            };
          } catch (error) {
            return {
              id: item._id,
              product: null,
              error,
            };
          }
        }),
      );

      if (cancelled) return;

      setCartItems((prev) =>
        prev
          .map((item) => {
            const result = results.find((r) => r.id === item._id);

            if (!result || !result.product) return item;

            const latestProduct = result.product;
            const updatedQty =
              latestProduct.trackInventory === false
                ? item.qty
                : Math.min(item.qty, latestProduct.stock);

            return {
              ...item,
              ...latestProduct,
              qty: updatedQty,
              selectedSize: item.selectedSize,
              selectedColor: item.selectedColor,
            };
          })
          .filter((item) => item.qty > 0),
      );
    };

    syncCartStock();

    return () => {
      cancelled = true;
    };
  }, []);

  // Add product with latest stock validation
  const addToCart = async (
    product,
    quantity = 1,
    size = null,
    color = null,
  ) => {
    try {
      const { data: latestProduct } = await getProduct(product._id);

      if (latestProduct.trackInventory !== false && latestProduct.stock <= 0) {
        toast.error("This product is currently out of stock.");
        return;
      }

      const key = `${latestProduct._id}-${size}-${color}`;

      setCartItems((prev) => {
        const exists = prev.find(
          (i) => `${i._id}-${i.selectedSize}-${i.selectedColor}` === key,
        );

        const currentQty = exists ? exists.qty : 0;
        const requestedQty = currentQty + quantity;

        if (
          latestProduct.trackInventory !== false &&
          requestedQty > latestProduct.stock
        ) {
          toast.error(`Only ${latestProduct.stock} items are available.`);
          return prev;
        }

        if (exists) {
          toast.success("Cart updated!");

          return prev.map((i) =>
            `${i._id}-${i.selectedSize}-${i.selectedColor}` === key
              ? {
                  ...i,
                  ...latestProduct,
                  qty: requestedQty,
                  selectedSize: size,
                  selectedColor: color,
                }
              : i,
          );
        }

        toast.success("Added to cart!");

        return [
          ...prev,
          {
            ...latestProduct,
            qty: quantity,
            selectedSize: size,
            selectedColor: color,
          },
        ];
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to check product availability. Please try again.",
      );
    }
  };

  const removeFromCart = (id, size, color) => {
    setCartItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i._id === id &&
            i.selectedSize === size &&
            i.selectedColor === color
          ),
      ),
    );

    toast.success("Removed from cart");
  };

  // Update quantity with latest backend stock
  const updateQty = async (id, size, color, qty) => {
    if (qty < 1) {
      return removeFromCart(id, size, color);
    }

    try {
      const { data: latestProduct } = await getProduct(id);

      if (latestProduct.trackInventory !== false && qty > latestProduct.stock) {
        toast.error(`Only ${latestProduct.stock} items are available.`);
        return;
      }

      setCartItems((prev) =>
        prev.map((i) =>
          i._id === id && i.selectedSize === size && i.selectedColor === color
            ? {
                ...i,
                ...latestProduct,
                qty,
                selectedSize: size,
                selectedColor: color,
              }
            : i,
        ),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to verify stock. Please try again.",
      );
    }
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((a, i) => a + i.qty, 0);
  const cartTotal = cartItems.reduce((a, i) => a + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
