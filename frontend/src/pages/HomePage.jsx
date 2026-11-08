import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiTruck,
  FiRefreshCw,
  FiShield,
  FiHeadphones,
} from "react-icons/fi";
import { FiCopy, FiClock } from "react-icons/fi";
import { getFeaturedProducts, getPublicCoupons } from "../utils/api";
import ProductCard from "../components/ui/ProductCard";
import { PageLoader } from "../components/ui/Spinner";

const heroSlides = [
  {
    title: "New Season Arrivals",
    subtitle: "Discover the latest trends curated just for you",
    cta: "Shop Women",
    link: "/shop/women",
    bg: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&auto=format&fit=crop",
    align: "left",
  },
  {
    title: "Men's Essentials",
    subtitle: "Timeless pieces for the modern man",
    cta: "Shop Men",
    link: "/shop/men",
    bg: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1400&auto=format&fit=crop",
    align: "right",
  },
];

const categoryBanners = [
  {
    label: "Women",
    img: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&auto=format&fit=crop",
    link: "/shop/women",
  },
  {
    label: "Men",
    img: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&auto=format&fit=crop",
    link: "/shop/men",
  },
  {
    label: "Kids",
    img: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&auto=format&fit=crop",
    link: "/shop/kids",
  },
  {
    label: "Accessories",
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop",
    link: "/shop/accessories",
  },
];

const features = [
  { icon: FiTruck, title: "Free Shipping", desc: "On orders over PKR 5,000" },
  { icon: FiRefreshCw, title: "Easy Returns", desc: "30-day return policy" },
  { icon: FiShield, title: "Secure Payment", desc: "100% secure transactions" },
  { icon: FiHeadphones, title: "24/7 Support", desc: "Always here to help" },
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [featuredCoupons, setFeaturedCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    getFeaturedProducts()
      .then(({ data }) => setFeatured(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getPublicCoupons()
      .then(({ data }) => {
        const featuredOffers = Array.isArray(data)
          ? data.filter((coupon) => coupon.featuredOnHome).slice(0, 3)
          : [];

        setFeaturedCoupons(featuredOffers);
      })
      .catch(console.error)
      .finally(() => setCouponsLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setSlide((s) => (s + 1) % heroSlides.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);

  const current = heroSlides[slide];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
        <img
          key={slide}
          src={current.bg}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        <div
          className={`relative h-full flex items-center container-custom ${current.align === "right" ? "justify-end" : "justify-start"}`}
        >
          <div className="max-w-xl text-white animate-slide-up">
            <p className="text-xs tracking-widest uppercase mb-3 text-primary-300 font-medium">
              2025 Collection
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-4">
              {current.title}
            </h1>
            <p className="text-lg text-gray-200 mb-8">{current.subtitle}</p>
            <div className="flex gap-4">
              <Link
                to={current.link}
                className="btn-primary inline-flex items-center gap-2"
              >
                {current.cta} <FiArrowRight size={16} />
              </Link>
              <Link
                to="/shop"
                className="btn-outline border-white text-white hover:bg-white hover:text-dark"
              >
                View All
              </Link>
            </div>
          </div>
        </div>
        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`w-8 h-0.5 transition-all ${i === slide ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      </section>

      {/* Features bar */}
      <section className="border-b border-gray-100">
        <div className="container-custom py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <Icon className="text-primary-600 shrink-0" size={22} />
                <div>
                  <p className="text-sm font-semibold text-dark">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive Offers */}
      {!couponsLoading && featuredCoupons.length > 0 && (
        <section className="py-16 bg-[#f8f6f1]">
          <div className="container-custom">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs tracking-[0.25em] uppercase text-primary-600 mb-3">
                  Special Deals For You
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-dark">
                  Exclusive Offers
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Enjoy special discounts on your next order.
                </p>
              </div>

              <Link
                to="/offers"
                className="inline-flex items-center gap-2 text-sm font-semibold text-dark hover:text-primary-600 transition-colors"
              >
                View All Offers <FiArrowRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCoupons.map((coupon) => {
                const discount =
                  coupon.discountType === "percentage"
                    ? `${coupon.discountValue}% OFF`
                    : `PKR ${Number(coupon.discountValue).toLocaleString()} OFF`;

                const expiryDate = coupon.expiresAt
                  ? new Date(coupon.expiresAt)
                  : null;

                const expiry = expiryDate
                  ? expiryDate.toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : null;

                const remainingTime = expiryDate
                  ? Math.max(0, expiryDate.getTime() - Date.now())
                  : null;

                const remainingDays =
                  remainingTime !== null
                    ? Math.ceil(remainingTime / (1000 * 60 * 60 * 24))
                    : null;

                return (
                  <div
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
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(coupon.code);
                            setCopiedCode(coupon.code);

                            setTimeout(() => {
                              setCopiedCode("");
                            }, 2000);
                          } catch {
                            setCopiedCode("");
                            window.alert(
                              "Unable to copy. Please copy the code manually.",
                            );
                          }
                        }}
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
                        <>
                          <p className="flex items-center gap-2">
                            <FiClock size={13} />
                            Valid until {expiry}
                          </p>

                          <p className="text-primary-700 font-medium">
                            {remainingDays === 0
                              ? "Expires in less than a day"
                              : `${remainingDays} days remaining`}
                          </p>
                        </>
                      )}
                    </div>

                    <Link
                      to="/shop"
                      className="mt-6 w-full flex items-center justify-center gap-2 bg-dark text-white py-3 text-xs font-semibold uppercase tracking-widest hover:bg-primary-700 transition-colors"
                    >
                      Shop Now <FiArrowRight size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Category Banners */}
      <section className="py-14 container-custom">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-primary-600 mb-2">
            Browse by Category
          </p>
          <h2 className="section-title">Shop The Collection</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryBanners.map((cat) => (
            <Link
              key={cat.label}
              to={cat.link}
              className="group relative overflow-hidden aspect-[3/4]"
            >
              <img
                src={cat.img}
                alt={cat.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
                <h3 className="font-display text-white text-2xl font-semibold">
                  {cat.label}
                </h3>
                <span
                  className="text-white/80 text-xs tracking-widest uppercase 
                mt-1 group-hover:text-primary-300 transition-colors"
                >
                  Shop Now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-14">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p
                className="text-xs tracking-widest uppercase text-primary-600 
              mb-2"
              >
                Hand-Picked For You
              </p>
              <h2 className="section-title">Featured Products</h2>
            </div>
            <Link
              to="/shop"
              className="text-sm text-dark hover:text-primary-600
             transition-colors flex items-center gap-1 font-medium"
            >
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <PageLoader />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featured.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sale Banner */}
      <section className="relative py-24 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&auto=format&fit=crop"
          alt="Sale"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary-900/70" />
        <div className="relative container-custom text-center text-white">
          <p className="text-xs tracking-widest uppercase mb-3 text-primary-200">
            Limited Time Offer
          </p>
          <h2 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Up to 50% Off
          </h2>
          <p className="text-lg text-pink-100 mb-8">
            Shop our end-of-season sale before it's gone
          </p>
          <Link
            to="/shop"
            className="btn-primary bg-white text-dark hover:bg-gray-100 inline-flex items-center gap-2"
          >
            Shop Sale <FiArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
