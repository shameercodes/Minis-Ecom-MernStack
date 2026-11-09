import { createContext, useContext, useState, useEffect, useRef } from "react";
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

  const cartItemsRef = useRef(cartItems);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  // Keep cart saved in localStorage
  useEffect(() => {
    localStorage.setItem("minis_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Refresh stock when app loads, tab regains focus, or becomes visible
  useEffect(() => {
    let cancelled = false;

    const syncCartStock = async () => {
      const currentItems = cartItemsRef.current;

      if (!currentItems.length) return;

      const results = await Promise.all(
        currentItems.map(async (item) => {
          try {
            const { data } = await getProduct(item._id);

            return {
              id: item._id,
              product: data,
            };
          } catch (error) {
            return {
              id: item._id,
              product: null,
            };
          }
        }),
      );

      if (cancelled) return;

      setCartItems((prev) =>
        prev.map((item) => {
          const result = results.find((r) => r.id === item._id);

          if (!result?.product) return item;

          const latestProduct = result.product;

          const updatedQty =
            latestProduct.trackInventory === false
              ? item.qty
              : latestProduct.stock > 0
                ? Math.min(item.qty, latestProduct.stock)
                : item.qty;

          return {
            ...item,
            ...latestProduct,
            qty: updatedQty,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          };
        }),
      );
    };

    syncCartStock();

    const handleFocus = () => syncCartStock();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncCartStock();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
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
