import { useEffect, useState } from "react";
import { getPublicCoupons } from "../../utils/api";

export default function AnnouncementBar() {
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCoupon = async () => {
      try {
        const { data } = await getPublicCoupons();

        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCoupon(data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch announcement coupon:", error);
      }
    };

    fetchCoupon();

    return () => {
      isMounted = false;
    };
  }, []);

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
