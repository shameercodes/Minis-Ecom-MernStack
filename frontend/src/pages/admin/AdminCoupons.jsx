import { useEffect, useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiTag,
  FiPercent,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";

import {
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
} from "../../utils/api";

import toast from "react-hot-toast";

const EMPTY = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minimumOrderAmount: "0",
  maximumDiscount: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true,
};

function Spinner() {
  return (
    <div
      className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"
      style={{ borderWidth: "3px" }}
    />
  );
}

function formatDate(date) {
  if (!date) return "No expiry";

  return new Date(date).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchCoupons = async () => {
    setLoading(true);

    try {
      const { data } = await getAdminCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const set = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);

    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue ?? ""),
      minimumOrderAmount: String(coupon.minimumOrderAmount ?? 0),
      maximumDiscount:
        coupon.maximumDiscount == null ? "" : String(coupon.maximumDiscount),
      usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
        : "",
      isActive: coupon.isActive,
    });

    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const value = Number(form.discountValue);
    const minimum = Number(form.minimumOrderAmount);

    if (!form.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid discount value");
      return;
    }

    if (form.discountType === "percentage" && value > 100) {
      toast.error("Percentage cannot exceed 100");
      return;
    }

    if (!Number.isFinite(minimum) || minimum < 0) {
      toast.error("Enter a valid minimum order amount");
      return;
    }

    if (
      form.maximumDiscount !== "" &&
      (!Number.isFinite(Number(form.maximumDiscount)) ||
        Number(form.maximumDiscount) < 0)
    ) {
      toast.error("Maximum discount must be zero or greater");
      return;
    }

    if (
      form.usageLimit !== "" &&
      (!Number.isInteger(Number(form.usageLimit)) ||
        Number(form.usageLimit) < 1)
    ) {
      toast.error("Usage limit must be a positive whole number");
      return;
    }

    if (
      form.expiresAt &&
      new Date(`${form.expiresAt}T23:59:59`) <= new Date()
    ) {
      toast.error("Expiry date must be in the future");
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        // The backend only permits updating these fields.
        const payload = {
          description: form.description.trim(),
          minimumOrderAmount: minimum,
          maximumDiscount:
            form.maximumDiscount === "" ? null : Number(form.maximumDiscount),
          usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
          expiresAt: form.expiresAt
            ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
            : null,
          isActive: form.isActive,
        };

        await updateAdminCoupon(editing._id, payload);
        toast.success("Coupon updated successfully!");
      } else {
        const payload = {
          code: form.code.trim().toUpperCase(),
          description: form.description.trim(),
          discountType: form.discountType,
          discountValue: value,
          minimumOrderAmount: minimum,
          maximumDiscount:
            form.maximumDiscount === "" ? null : Number(form.maximumDiscount),
          usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
          expiresAt: form.expiresAt
            ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
            : null,
        };

        await createAdminCoupon(payload);
        toast.success("Coupon created successfully!");
      }

      setModalOpen(false);
      await fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdminCoupon(id);

      toast.success("Coupon deleted successfully!");
      setDeleteConfirm(null);

      await fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete coupon");
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      await updateAdminCoupon(coupon._id, {
        isActive: !coupon.isActive,
      });

      toast.success(
        coupon.isActive ? "Coupon deactivated" : "Coupon activated",
      );

      await fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update coupon");
    }
  };

  const getStatus = (coupon) => {
    if (!coupon.isActive) {
      return {
        label: "Inactive",
        style: "bg-gray-100 text-gray-500",
      };
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) {
      return {
        label: "Expired",
        style: "bg-red-100 text-red-500",
      };
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return {
        label: "Limit reached",
        style: "bg-orange-100 text-orange-600",
      };
    }

    return {
      label: "Active",
      style: "bg-green-100 text-green-600",
    };
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
          <p className="text-sm text-gray-400">
            {coupons.length} total coupons
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <FiPlus size={16} />
          Create Coupon
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Coupons</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">
                {coupons.length}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <FiTag size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Coupons</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                {coupons.filter((c) => getStatus(c).label === "Active").length}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
              <FiPercent size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Redemptions</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">
                {coupons.reduce(
                  (sum, c) => sum + (Number(c.usedCount) || 0),
                  0,
                )}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <FiUsers size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Table */}
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
                    "Coupon",
                    "Discount",
                    "Min. Order",
                    "Usage",
                    "Expiry",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400">
                      <FiTag size={32} className="mx-auto mb-2 text-gray-200" />
                      No coupons created yet
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => {
                    const status = getStatus(coupon);

                    return (
                      <tr
                        key={coupon._id}
                        className="hover:bg-amber-50/30 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-800">
                            {coupon.code}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 max-w-44 truncate">
                            {coupon.description || "No description"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-bold text-amber-600">
                            {coupon.discountType === "percentage"
                              ? `${coupon.discountValue}%`
                              : `PKR ${Number(
                                  coupon.discountValue,
                                ).toLocaleString()}`}
                          </span>
                          {coupon.maximumDiscount != null && (
                            <p className="text-xs text-gray-400 mt-1">
                              Max PKR{" "}
                              {Number(coupon.maximumDiscount).toLocaleString()}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          PKR{" "}
                          {Number(
                            coupon.minimumOrderAmount || 0,
                          ).toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-700">
                            {coupon.usedCount || 0}
                            <span className="text-gray-400 font-normal">
                              {" "}
                              / {coupon.usageLimit ?? "∞"}
                            </span>
                          </p>
                        </td>

                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FiCalendar size={13} className="text-gray-400" />
                            {formatDate(coupon.expiresAt)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${status.style}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Edit coupon"
                              onClick={() => openEdit(coupon)}
                              className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <FiEdit2 size={14} />
                            </button>

                            <button
                              type="button"
                              title={
                                coupon.isActive
                                  ? "Deactivate coupon"
                                  : "Activate coupon"
                              }
                              onClick={() => handleToggleStatus(coupon)}
                              className="text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-lg px-2 py-2"
                            >
                              {coupon.isActive ? "Off" : "On"}
                            </button>

                            <button
                              type="button"
                              title="Delete coupon"
                              onClick={() => setDeleteConfirm(coupon)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="font-bold text-lg text-gray-800">
                {editing ? "Edit Coupon" : "Create New Coupon"}
              </h2>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Coupon Code *
                  </label>

                  <input
                    required
                    disabled={Boolean(editing)}
                    maxLength={30}
                    value={form.code}
                    onChange={(e) =>
                      set(
                        "code",
                        e.target.value.toUpperCase().replace(/\s/g, ""),
                      )
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50 disabled:opacity-60"
                    placeholder="e.g. MINIS10"
                  />
                  {editing && (
                    <p className="text-xs text-gray-400 mt-1">
                      Coupon codes cannot be changed after creation.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Description
                  </label>

                  <textarea
                    rows={2}
                    maxLength={200}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50 resize-none"
                    placeholder="Special discount for customers..."
                  />
                </div>

                {!editing && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                        Discount Type *
                      </label>

                      <select
                        value={form.discountType}
                        onChange={(e) => set("discountType", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (PKR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                        Discount Value *
                      </label>

                      <input
                        required
                        type="number"
                        min="0.01"
                        max={
                          form.discountType === "percentage" ? 100 : undefined
                        }
                        step="0.01"
                        value={form.discountValue}
                        onChange={(e) => set("discountValue", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                        placeholder={
                          form.discountType === "percentage" ? "10" : "500"
                        }
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Minimum Order (PKR)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minimumOrderAmount}
                    onChange={(e) => set("minimumOrderAmount", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Maximum Discount (PKR)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maximumDiscount}
                    onChange={(e) => set("maximumDiscount", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Total Usage Limit
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.usageLimit}
                    onChange={(e) => set("usageLimit", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Expiry Date
                  </label>

                  <input
                    type="date"
                    min={new Date().toLocaleDateString("en-CA")}
                    value={form.expiresAt}
                    onChange={(e) => set("expiresAt", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                  <input
                    id="coupon-active"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => set("isActive", e.target.checked)}
                    className="w-4 h-4 accent-amber-400"
                  />

                  <label
                    htmlFor="coupon-active"
                    className="text-sm font-medium text-gray-600 cursor-pointer"
                  >
                    Coupon is active
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Update Coupon"
                      : "Create Coupon"}
                </button>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={20} className="text-red-500" />
            </div>

            <h3 className="font-bold text-lg text-gray-800 text-center mb-1">
              Delete Coupon?
            </h3>

            <p className="text-sm text-gray-400 text-center mb-5">
              Are you sure you want to delete{" "}
              <strong className="text-gray-600">{deleteConfirm.code}</strong>?
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Yes, Delete
              </button>

              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
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
