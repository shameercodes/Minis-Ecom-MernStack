import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, downloadOrderInvoice } from '../utils/api';
import { PageLoader } from '../components/ui/Spinner';
import { FiPackage } from 'react-icons/fi';
import toast from "react-hot-toast";
import { FiDownload } from "react-icons/fi";

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadInvoice = async (orderId) => {
    try {
      setDownloadingId(orderId);

      const { data } = await downloadOrderInvoice(orderId);

      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `MINIS-Invoice-${orderId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Invoice download failed:", error);
      toast.error("Unable to download invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    getMyOrders().then(({ data }) => setOrders(data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="container-custom py-10 animate-fade-in">
      <h1 className="font-display text-3xl mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <FiPackage size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="font-display text-2xl mb-2">No Orders Yet</h2>
          <Link to="/shop" className="btn-primary inline-block mt-4">Start Shopping</Link>
        </div>
      ) : (
<div className="space-y-4">
  {orders.map(order => (
    <div key={order._id} >
    <Link to={`/orders/${order._id}`} className="block border border-gray-200 p-5 hover:border-primary-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 font-medium capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                  <span className="font-semibold">PKR {order.totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {order.orderItems.slice(0, 4).map((item, i) => (
                  <img key={i} src={item.image} alt={item.name} className="w-12 h-14 object-cover
                  bg-gray-100" />
                ))}
                {order.orderItems.length > 4 && (
                  <div className="w-12 h-14 bg-gray-100 flex items-center justify-center
                  text-xs text-gray-400">
                    +{order.orderItems.length - 4}
                  </div>
                )}
              </div>
            </Link>

            <div className="flex justify-end -mt-4">
              <button
                onClick={() => handleDownloadInvoice(order._id)}
                disabled={downloadingId === order._id}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-primary-500 text-primary-600 hover:bg-primary-50 disabled:opacity-50 transition-colors"
              >
                <FiDownload size={16} />
                {downloadingId === order._id
                  ? 'Downloading...'
                  : 'Download Invoice'}
              </button>
            </div>
          </div>
  ))}
            </div>
      )}
    </div>
  );
}
