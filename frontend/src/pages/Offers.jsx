import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCopy, FiClock } from "react-icons/fi";
import { getPublicCoupons } from "../utils/api";

export default function Offers() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState("");
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(Date.now());
      }, 60000);

      return () => clearInterval(timer);
    }, []);

  useEffect(() => {
    getPublicCoupons()
      .then(({ data }) => {
        setCoupons(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
    } catch {
      setCopiedCode("");
    }
  };

  const getRemainingTime = (expiresAt) => {
    if (!expiresAt) return "No expiry date";

     const difference = new Date(expiresAt).getTime() - currentTime;

    if (difference <= 0) return "Expired";

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    if (days > 0) return `${days} days ${hours} hours remaining`;
    return `${hours} hours remaining`;
  };

  return (
    <main className="min-h-screen bg-[#faf9f6]">
      {/* Page Header */}
      <section className="bg-[#f1eee7] py-16 md:py-24 text-center">
        <div className="container-custom">
          <p className="text-xs tracking-[0.3em] uppercase text-primary-700 mb-4">
            Special Deals
          </p>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-dark">
            Exclusive Offers
          </h1>

          <p className="text-gray-600 mt-4 max-w-xl mx-auto">
            Discover special discounts and make your next shopping experience
            even better.
          </p>
        </div>
      </section>

      {/* Offers */}
      <section className="container-custom py-14 md:py-20">
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading offers...
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="font-display text-2xl font-semibold text-dark">
              No Offers Available
            </h2>
            <p className="text-gray-500 mt-3">
              Please check back soon for exciting deals.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 mt-6 btn-primary"
            >
              Explore Shop <FiArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-semibold text-dark">
                Available Offers
              </h2>
              <span className="text-sm text-gray-500">
                {coupons.length} offers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => {
                const discount =
                  coupon.discountType === "percentage"
                    ? `${coupon.discountValue}% OFF`
                    : `PKR ${Number(coupon.discountValue).toLocaleString()} OFF`;

                const expiry = coupon.expiresAt
                  ? new Date(coupon.expiresAt).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : null;

                return (
                  <article
                    key={coupon._id}
                    className="bg-white border border-gray-200 p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <span className="text-2xl font-bold text-primary-700">
                        {discount}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest bg-[#f8f6f1] text-gray-600 px-3 py-2">
                        Special Offer
                      </span>
                    </div>

                    <h3 className="font-semibold text-lg text-dark mb-2">
                      {coupon.description || "Exclusive discount for you"}
                    </h3>

                    <div className="border border-dashed border-gray-300 p-3 flex items-center justify-between gap-3 mt-5">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                          Coupon Code
                        </p>
                        <p className="font-bold tracking-wider text-dark">
                          {coupon.code}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(coupon.code)}
                        className="flex items-center gap-2 text-xs font-semibold text-primary-700 hover:text-primary-900"
                      >
                        <FiCopy size={14} />
                        {copiedCode === coupon.code ? "Copied!" : "Copy Code"}
                      </button>
                    </div>

                    <div className="space-y-2 mt-5 text-xs text-gray-500">
                      {coupon.minimumOrderAmount > 0 && (
                        <p>
                          Minimum order: PKR{" "}
                          {Number(coupon.minimumOrderAmount).toLocaleString()}
                        </p>
                      )}

                      {coupon.maximumDiscount != null && (
                        <p>
                          Maximum discount: PKR{" "}
                          {Number(coupon.maximumDiscount).toLocaleString()}
                        </p>
                      )}

                      {expiry && (
                        <p className="flex items-center gap-2">
                          <FiClock size={13} />
                          Valid until {expiry}
                        </p>
                      )}

                      {coupon.expiresAt && (
                        <p className="text-primary-700 font-medium">
                          {getRemainingTime(coupon.expiresAt)}
                        </p>
                      )}
                    </div>

                    <Link
                      to="/shop"
                      className="mt-6 w-full flex items-center justify-center gap-2 bg-dark text-white py-3 text-xs font-semibold uppercase tracking-widest hover:bg-primary-700 transition-colors"
                    >
                      Shop Now <FiArrowRight size={14} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
