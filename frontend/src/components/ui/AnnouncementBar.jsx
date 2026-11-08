import { useEffect, useState } from "react";
import { getPublicCoupons } from "../../utils/api";

export default function AnnouncementBar() {
  const [coupons, setCoupons] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch all eligible public coupons
  useEffect(() => {
    let isMounted = true;

    const fetchCoupons = async () => {
      try {
        const { data } = await getPublicCoupons();

        if (isMounted && Array.isArray(data)) {
          setCoupons(data);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error("Failed to fetch announcement coupons:", error);
      }
    };

    fetchCoupons();

    return () => {
      isMounted = false;
    };
  }, []);

  // Rotate only when there are multiple coupons
  useEffect(() => {
    if (coupons.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % coupons.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [coupons.length]);

  const coupon = coupons[currentIndex] || null;

  const discountText = coupon
    ? coupon.discountType === "percentage"
      ? `${coupon.discountValue}% Off`
      : `PKR ${coupon.discountValue} Off`
    : null;

  return (
    <div className="bg-dark text-white text-xs py-2 text-center tracking-widest font-medium uppercase">
      Free Shipping on Orders Over PKR 5,000
      {coupon && (
        <>
          &nbsp;·&nbsp; Use Code{" "}
          <span className="text-primary-300">{coupon.code}</span> for{" "}
          {discountText}
        </>
      )}
    </div>
  );
}
