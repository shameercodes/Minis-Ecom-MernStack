import { createContext, useContext, useState, useEffect, useRef } from "react";

import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

import {
  getMyWishlistShare,
  createWishlistShare,
  syncWishlistShare,
  revokeWishlistShare,
} from "../utils/api";

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export function WishlistProvider({ children }) {
  const { user, sessionChecked } = useAuth();

  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("minis_wishlist") || "[]");
    } catch {
      return [];
    }
  });

  const [shareInfo, setShareInfo] = useState({
    isActive: false,
    shareUrl: null,
  });

  const [shareLoading, setShareLoading] = useState(false);

  const syncQueueRef = useRef(Promise.resolve());

  const userId = user?._id || user?.id;

  // Preserve existing localStorage behavior.
  useEffect(() => {
    localStorage.setItem("minis_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Load the authenticated user's existing sharing status.
  useEffect(() => {
    if (!sessionChecked) return;

    let cancelled = false;

    if (!userId) {
      setShareInfo({
        isActive: false,
        shareUrl: null,
      });
      return;
    }

    const loadShareStatus = async () => {
      try {
        const { data } = await getMyWishlistShare();

        if (!cancelled) {
          setShareInfo(data);
        }
      } catch (error) {
        if (!cancelled) {
          setShareInfo({
            isActive: false,
            shareUrl: null,
          });
        }

        console.error("Unable to load wishlist sharing status:", error);
      }
    };

    loadShareStatus();

    return () => {
      cancelled = true;
    };
  }, [userId, sessionChecked]);

  // Synchronize wishlist changes only when sharing is active.
  useEffect(() => {
    if (!userId || !shareInfo.isActive) return;

    const productIds = wishlist.map((product) => product._id).filter(Boolean);

    syncQueueRef.current = syncQueueRef.current
      .catch(() => {})
      .then(() => syncWishlistShare(productIds))
      .catch((error) => {
        console.error("Wishlist synchronization failed:", error);
      });
  }, [wishlist, userId, shareInfo.isActive]);

  // Create or enable a sharing link.
  const enableWishlistSharing = async () => {
    if (!userId) {
      toast.error("Please log in to share your wishlist");
      return null;
    }

    setShareLoading(true);

    try {
      const productIds = wishlist.map((product) => product._id).filter(Boolean);

      const { data } = await createWishlistShare(productIds);

      setShareInfo(data);
      toast.success("Wishlist sharing enabled!");

      return data;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to enable wishlist sharing",
      );

      return null;
    } finally {
      setShareLoading(false);
    }
  };

  // Revoke the current sharing link.
  const disableWishlistSharing = async () => {
    setShareLoading(true);

    try {
      await revokeWishlistShare();

      setShareInfo({
        isActive: false,
        shareUrl: null,
      });

      toast.success("Wishlist sharing disabled successfully");

      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to disable wishlist sharing",
      );

      return false;
    } finally {
      setShareLoading(false);
    }
  };

  // Existing wishlist functionality.
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => p._id === product._id);

      if (exists) {
        toast.success("Removed from wishlist");

        return prev.filter((p) => p._id !== product._id);
      }

      toast.success("Added to wishlist!");

      return [...prev, product];
    });
  };

  const isWishlisted = (id) => wishlist.some((p) => p._id === id);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isWishlisted,

        shareInfo,
        shareLoading,
        enableWishlistSharing,
        disableWishlistSharing,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
