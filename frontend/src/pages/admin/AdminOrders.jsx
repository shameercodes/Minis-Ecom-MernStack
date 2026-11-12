import { useEffect, useState } from 'react';
import { FiSearch, FiEye, FiTrash2, FiX, FiPackage } from 'react-icons/fi';
import {
  getAdminOrders,
  updateAdminOrderStatus,
  deleteAdminOrder,
  markAdminOrderAsPaid,
} from "../../utils/api";
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
};
const ALL_STATUSES = ['pending','processing','shipped','delivered','cancelled'];

function Spinner() {
  return <div className="w-8 h-8 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" style={{border:'3px solid',borderTopColor:'transparent',borderRadius:'50%'}} />;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewOrder, setViewOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminOrders({ page, limit: 15, status: statusFilter, search });
      setOrders(data.orders); setPages(data.pages); setTotal(data.total);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetchOrders(); }, 400); return () => clearTimeout(t); }, [search]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateAdminOrderStatus(id, status);
      toast.success(`Marked as ${status}`);
      fetchOrders();
      if (viewOrder?._id === id) setViewOrder(o => ({ ...o, status }));
    } catch { toast.error('Update failed'); }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      const { data } = await markAdminOrderAsPaid(id);

      toast.success(data.message || "Payment confirmed successfully");

      setOrders((prev) =>
        prev.map((order) => (order._id === id ? data.order : order)),
      );

      setViewOrder((prev) => (prev?._id === id ? data.order : prev));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Payment confirmation failed",
      );
    }
  };

  const handleDelete = async (id) => {
    try { await deleteAdminOrder(id); toast.success('Order deleted'); setDeleteConfirm(null); fetchOrders(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-sm text-gray-400">{total} total orders</p>
        </div>
        {/* Status summary pills */}
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(statusFilter === s ? "" : s);
                setPage(1);
              }}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize transition-colors ${statusFilter === s ? "bg-amber-400 text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:border-amber-300"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48 bg-gray-50">
          <FiSearch size={14} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or customer..."
            className="outline-none text-sm flex-1 bg-transparent text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Order ID",
                    "Customer",
                    "Items",
                    "Total",
                    "Payment",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <FiPackage
                        size={32}
                        className="mx-auto mb-2 text-gray-200"
                      />
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500 font-semibold">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-700">
                          {order.user?.name || "Guest"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.user?.email}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 font-medium">
                        {order.orderItems?.length}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">
                        PKR {order.totalPrice?.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${order.isPaid ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-500"}`}
                        >
                          {order.isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value)
                          }
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border-0 outline-none cursor-pointer ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option
                              key={s}
                              value={s}
                              className="bg-white text-gray-800 capitalize"
                            >
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5 items-center">
                          <button
                            onClick={() => setViewOrder(order)}
                            className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Order"
                          >
                            <FiEye size={14} />
                          </button>

                          {order.paymentMethod === "Cash on Delivery" &&
                            order.status === "delivered" &&
                            !order.isPaid && (
                              <button
                                onClick={() => handleMarkAsPaid(order._id)}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors whitespace-nowrap"
                              >
                                Mark as Paid
                              </button>
                            )}

                          <button
                            onClick={() => setDeleteConfirm(order._id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Order"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${p === page ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View Order Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="font-bold text-lg text-gray-800">
                  Order #{viewOrder._id.slice(-8).toUpperCase()}
                </h2>
                <p className="text-xs text-gray-400">
                  {new Date(viewOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setViewOrder(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Customer
                  </p>
                  <p className="font-semibold text-gray-700">
                    {viewOrder.user?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {viewOrder.user?.email}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Shipping Address
                  </p>
                  <p className="text-sm text-gray-700">
                    {viewOrder.shippingAddress?.fullName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {viewOrder.shippingAddress?.address},{" "}
                    {viewOrder.shippingAddress?.city}
                  </p>
                  <p className="text-sm text-gray-500">
                    {viewOrder.shippingAddress?.country}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Order Items
                </p>
                {viewOrder.paymentMethod === "Cash on Delivery" &&
                  viewOrder.status === "delivered" &&
                  !viewOrder.isPaid && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Payment Confirmation
                      </p>

                      <button
                        onClick={() => handleMarkAsPaid(viewOrder._id)}
                        className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        Mark as Paid
                      </button>
                    </div>
                  )}
                <div className="space-y-2">
                  {viewOrder.orderItems?.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-12 object-cover rounded-lg shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.size && `Size: ${item.size}`}{" "}
                          {item.color && `· ${item.color}`} · Qty:{" "}
                          {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-gray-800 text-sm">
                        PKR {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>PKR {viewOrder.itemsPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span>
                    {viewOrder.shippingPrice === 0
                      ? "FREE"
                      : `PKR ${viewOrder.shippingPrice}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax</span>
                  <span>PKR {viewOrder.taxPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>PKR {viewOrder.totalPrice?.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(viewOrder._id, s)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl capitalize transition-colors ${viewOrder.status === s ? "bg-amber-400 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-bold text-lg text-center mb-1">
              Delete Order?
            </h3>
            <p className="text-sm text-gray-400 text-center mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
