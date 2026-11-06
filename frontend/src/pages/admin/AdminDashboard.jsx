import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShoppingCart, FiUsers, FiPackage, FiTrendingUp,
  FiArrowRight, FiMoreVertical, FiSliders, FiBell, FiSearch
} from 'react-icons/fi';
import { getAdminStats, getAdminLowStockProducts } from "../../utils/api";
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function CircleProgress({ percent, color, size = 80 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={6} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

function StatMiniCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl px-3 sm:px-4 py-3 shadow-sm border border-gray-100 min-w-0">
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">{label}</p>
        <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);
  const [lowStockError, setLowStockError] = useState("");

useEffect(() => {
  getAdminStats()
    .then(({ data }) => setStats(data))
    .catch(console.error)
    .finally(() => setLoading(false));

  getAdminLowStockProducts()
    .then(({ data }) => {
      setLowStockProducts(data.products || []);
      setLowStockError("");
    })
    .catch((error) => {
      console.error("Low-stock fetch error:", error);
      setLowStockError(
        error.response?.data?.message || "Unable to load inventory alerts.",
      );
    })
    .finally(() => setLowStockLoading(false));
}, []);

  const monthEntries = stats ? Object.entries(stats.monthlyRevenue) : [];
  const maxRev = Math.max(...monthEntries.map(([, v]) => v), 1);

  // Fill up to 12 months display
  const allMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthMap = Object.fromEntries(monthEntries);
  const barData = allMonths.map(m => {
    const key = Object.keys(monthMap).find(k => k.startsWith(m)) || null;
    return { month: m, value: key ? monthMap[key] : 0 };
  });

  const categoryStats = [
    { label: 'Women', percent: 63, color: '#f59e0b' },
    { label: 'Men', percent: 88, color: '#ef4444' },
    { label: 'Kids', percent: 38, color: '#8b5cf6' },
  ];

  const customerCircles = stats ? [
    { label: 'Current Customers', percent: 85, color: '#8b5cf6' },
    { label: 'New Customers', percent: 66, color: '#f59e0b' },
    { label: 'Target Customers', percent: 90, color: '#f59e0b' },
    { label: 'Retarget Customers', percent: 30, color: '#ef4444' },
  ] : [];

  return (
    <div
      className="w-full max-w-full"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:gap-5 mb-6 md:mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 md:items-center">
          <div className="min-w-0 shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Overview
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate max-w-full">
              Welcome back, {user?.name} 👋
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:flex-1 md:max-w-md md:ml-auto">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 flex-1 min-w-0 shadow-sm">
              <FiSearch size={15} className="text-gray-400 shrink-0" />
              <input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search..."
                className="outline-none text-sm flex-1 min-w-0 bg-transparent text-gray-700 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 justify-end sm:justify-start shrink-0">
              <button
                type="button"
                className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                aria-label="More options"
              >
                <FiMoreVertical size={16} className="text-gray-500" />
              </button>
              <button
                type="button"
                className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors relative"
                aria-label="Notifications"
              >
                <FiBell size={16} className="text-gray-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* ── Revenue Chart ── */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  Total Revenue
                </p>
                <p className="text-xl sm:text-3xl font-bold text-gray-800 mt-1 break-all">
                  PKR {stats?.totalRevenue?.toLocaleString() || "0"}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 self-start">
                <span className="text-xs font-semibold text-amber-600">
                  THIS YEAR
                </span>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  className="shrink-0"
                  aria-hidden
                >
                  <path
                    d="M1 1l4 4 4-4"
                    stroke="#d97706"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Bar Chart — horizontal scroll on narrow screens */}
            <div className="mt-4 sm:mt-6 -mx-2 sm:mx-0 px-2 sm:px-0 overflow-x-auto overscroll-x-contain">
              <div className="flex items-end gap-1 sm:gap-2 min-w-[280px] sm:min-w-0 h-36 sm:h-44">
                {barData.map(({ month, value }) => {
                  const heightPct = maxRev > 0 ? (value / maxRev) * 100 : 0;
                  const isActive = heightPct > 60;
                  return (
                    <div
                      key={month}
                      className="flex-1 min-w-[1.25rem] sm:min-w-0 flex flex-col items-center gap-1 sm:gap-1.5"
                    >
                      <div
                        className="w-full flex flex-col justify-end"
                        style={{ height: "clamp(100px, 28vw, 152px)" }}
                      >
                        <div
                          className="w-full rounded-t-md relative group cursor-pointer transition-all duration-500"
                          style={{
                            height: `${Math.max(heightPct, 4)}%`,
                            background: isActive
                              ? "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)"
                              : "#f0f0f0",
                            minHeight: "6px",
                          }}
                        >
                          {value > 0 && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              PKR {Math.round(value / 1000)}k
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                        {month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Customer Circles ── */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <p className="text-base font-bold text-gray-800">Customers</p>
                <p className="text-xs text-gray-400">
                  Information About your Customers
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                aria-label="Customer stats options"
              >
                <FiSliders size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-5">
              {customerCircles.map(({ label, percent, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 min-w-0"
                >
                  <div className="relative scale-[0.82] sm:scale-100 origin-center">
                    <CircleProgress percent={percent} color={color} size={80} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700">
                        {percent}
                        <span className="text-xs">%</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-400 text-center leading-tight px-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mini Stat Cards + Top Products ── */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* 4 mini stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatMiniCard
                icon={FiUsers}
                label="Total Visits"
                value={`${((stats?.totalUsers || 0) * 5.4).toFixed(1)}k`}
                color="bg-amber-400"
              />
              <StatMiniCard
                icon={FiShoppingCart}
                label="Total Sales"
                value={(stats?.totalOrders || 0).toLocaleString()}
                color="bg-amber-500"
              />
              <StatMiniCard
                icon={FiTrendingUp}
                label="Total Revenue"
                value={`PKR ${Math.round((stats?.totalRevenue || 0) / 1000)}k`}
                color="bg-orange-400"
              />
              <StatMiniCard
                icon={FiPackage}
                label="Orders Done"
                value={stats?.ordersByStatus?.delivered || 0}
                color="bg-red-400"
              />
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <FiBell className="text-amber-500" size={17} />
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                      Low Stock Alerts
                    </h3>
                    {!lowStockLoading && (
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {lowStockProducts.length}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Products that need inventory replenishment
                  </p>
                </div>

                <Link
                  to="/admin/products"
                  className="text-xs text-amber-500 hover:text-amber-600 font-medium flex items-center gap-1 shrink-0"
                >
                  Manage <FiArrowRight size={12} />
                </Link>
              </div>

              <div className="p-4 sm:p-5">
                {lowStockLoading ? (
                  <p className="text-sm text-gray-400 text-center py-5">
                    Loading inventory alerts...
                  </p>
                ) : lowStockError ? (
                  <p className="text-sm text-red-500 text-center py-5">
                    {lowStockError}
                  </p>
                ) : lowStockProducts.length === 0 ? (
                  <div className="text-center py-6">
                    <FiPackage
                      className="mx-auto text-green-500 mb-2"
                      size={28}
                    />
                    <p className="text-sm font-semibold text-gray-700">
                      Inventory looks good!
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      No low-stock products found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.slice(0, 5).map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {product.category}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p
                            className={`text-sm font-bold ${
                              product.stock === 0
                                ? "text-red-600"
                                : "text-amber-600"
                            }`}
                          >
                            {product.stock === 0
                              ? "Out of stock"
                              : `${product.stock} left`}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Threshold: {product.lowStockThreshold}
                          </p>
                        </div>
                      </div>
                    ))}

                    {lowStockProducts.length > 5 && (
                      <p className="text-xs text-center text-gray-400 pt-1">
                        +{lowStockProducts.length - 5} more products need
                        attention
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                <p className="font-bold text-gray-800 text-sm sm:text-base">
                  Top Products
                </p>
                <Link
                  to="/admin/products"
                  className="text-xs text-amber-500 hover:text-amber-600 font-medium flex items-center gap-1 shrink-0"
                >
                  View All <FiArrowRight size={12} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 sm:px-5 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="text-center px-2 sm:px-3 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Inventory
                      </th>
                      <th className="text-center px-2 sm:px-3 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Sale
                      </th>
                      <th className="text-center px-2 sm:px-3 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="text-center px-2 sm:px-3 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats?.recentOrders?.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-gray-400 text-sm"
                        >
                          No data yet — seed your database
                        </td>
                      </tr>
                    ) : (
                      stats?.recentOrders?.slice(0, 5).map((order, i) => {
                        const item = order.orderItems?.[0];
                        return item ? (
                          <tr
                            key={order._id}
                            className="hover:bg-amber-50/40 transition-colors"
                          >
                            <td className="px-3 sm:px-5 py-3">
                              <div className="flex items-center gap-3">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-9 h-11 object-cover rounded-lg bg-gray-100 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-11 bg-amber-100 rounded-lg shrink-0 flex items-center justify-center text-amber-400 text-xs font-bold">
                                    {item.name?.[0]}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-gray-700 text-xs line-clamp-1">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {item.color || "N/A"} · {item.quantity}{" "}
                                    orders
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="font-bold text-gray-700">
                                {item.quantity * 10}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-500">
                              PKR {item.price?.toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-center font-semibold text-gray-700">
                              PKR{" "}
                              {(item.price * item.quantity)?.toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500"}`}
                              >
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ) : null;
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Stats Overview (category bars) ── */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-base font-bold text-gray-800">
                  Stats Overview
                </p>
                <p className="text-xs text-gray-400">
                  Information about store visits
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                aria-label="Stats options"
              >
                <FiSliders size={16} />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {categoryStats.map(({ label, percent, color }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-600">
                      {label}
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      {percent}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Order status summary */}
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Order Summary
              </p>
              {stats &&
                Object.entries(stats.ordersByStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          status === "delivered"
                            ? "bg-green-400"
                            : status === "pending"
                              ? "bg-yellow-400"
                              : status === "processing"
                                ? "bg-blue-400"
                                : status === "shipped"
                                  ? "bg-purple-400"
                                  : "bg-red-400"
                        }`}
                      />
                      <span className="text-xs text-gray-500 capitalize">
                        {status}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
