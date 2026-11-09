import { useEffect, useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiImage,
  FiPackage,
} from "react-icons/fi";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "../../utils/api";
import toast from "react-hot-toast";

const EMPTY = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  category: "women",
  subcategory: "",
  stock: "",
  images: [""],
  sizes: "",
  colors: "",
  featured: false,
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

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminProducts({
        page,
        limit: 12,
        search,
        category,
      });
      setProducts(data.products);
      setPages(data.pages);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleFocus = () => fetchProducts();

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [page, category]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice || "",
      category: p.category,
      subcategory: p.subcategory || "",
      stock: p.stock,
      images: p.images?.length ? p.images : [""],
      sizes: p.sizes?.join(", ") || "",
      colors: p.colors?.join(", ") || "",
      featured: p.featured,
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice
          ? Number(form.originalPrice)
          : undefined,
        stock: Number(form.stock),
        images: form.images.filter(Boolean),
        sizes: form.sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        colors: form.colors
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      };
      if (editing) {
        await updateAdminProduct(editing._id, payload);
        toast.success("Product updated!");
      } else {
        await createAdminProduct(payload);
        toast.success("Product created!");
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdminProduct(id);
      toast.success("Product removed");
      setDeleteConfirm(null);
      fetchProducts();
    } catch {
      toast.error("Delete failed");
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setImg = (i, v) => {
    const a = [...form.images];
    a[i] = v;
    set("images", a);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-400">{total} total products</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <FiPlus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48 bg-gray-50">
          <FiSearch size={14} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="outline-none text-sm flex-1 bg-transparent text-gray-700 placeholder-gray-400"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-gray-50 text-gray-600 focus:border-amber-400"
        >
          <option value="">All Categories</option>
          {["women", "men", "kids", "accessories"].map((c) => (
            <option key={c} value={c} className="capitalize">
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table card */}
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
                    "Product",
                    "Category",
                    "Price",
                    "Stock",
                    "Status",
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
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400">
                      <FiPackage
                        size={32}
                        className="mx-auto mb-2 text-gray-200"
                      />
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr
                      key={p._id}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-10 h-12 object-cover rounded-lg bg-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-12 bg-amber-50 rounded-lg shrink-0 flex items-center justify-center">
                              <FiImage size={14} className="text-amber-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-700 line-clamp-1">
                              {p.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {p.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="capitalize text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-800">
                          PKR {p.price.toLocaleString()}
                        </p>
                        {p.originalPrice > p.price && (
                          <p className="text-xs text-gray-400 line-through">
                            PKR {p.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-bold text-sm ${p.stock === 0 ? "text-red-500" : p.stock < 10 ? "text-amber-500" : "text-green-500"}`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold w-fit ${p.isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}
                          >
                            {p.isActive ? "Active" : "Hidden"}
                          </span>
                          {p.featured && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-semibold w-fit">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(p._id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
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
                className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${p === page ? "bg-amber-400 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="font-bold text-lg text-gray-800">
                {editing ? "Edit Product" : "Add New Product"}
              </h2>
              <button
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
                    Product Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                    placeholder="e.g. Floral Wrap Dress"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50 resize-none"
                  />
                </div>
                {[
                  ["Price (PKR) *", "price", "1999"],
                  ["Original Price (PKR)", "originalPrice", "2499"],
                ].map(([label, key, ph]) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                      {label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required={key === "price"}
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                      placeholder={ph}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Category *
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                  >
                    {["women", "men", "kids", "accessories"].map((c) => (
                      <option key={c} value={c} className="capitalize">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Stock *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => set("stock", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Subcategory
                  </label>
                  <input
                    value={form.subcategory}
                    onChange={(e) => set("subcategory", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                    placeholder="dresses, tops..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Sizes (comma separated)
                  </label>
                  <input
                    value={form.sizes}
                    onChange={(e) => set("sizes", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                    placeholder="XS, S, M, L, XL"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Colors (comma separated)
                  </label>
                  <input
                    value={form.colors}
                    onChange={(e) => set("colors", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                    placeholder="Red, Blue, Black"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Image URLs
                  </label>
                  <div className="space-y-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={img}
                          onChange={(e) => setImg(i, e.target.value)}
                          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 bg-gray-50"
                          placeholder="https://images.unsplash.com/..."
                        />
                        {i === form.images.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => set("images", [...form.images, ""])}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 text-sm rounded-xl font-bold transition-colors"
                          >
                            +
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              set(
                                "images",
                                form.images.filter((_, j) => j !== i),
                              )
                            }
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-sm rounded-xl transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  {[
                    ["featured", "Featured"],
                    ["isActive", "Active"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <div
                        onClick={() => set(key, !form[key])}
                        className={`w-10 h-5 rounded-full transition-colors relative ${form[key] ? "bg-amber-400" : "bg-gray-200"}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key] ? "translate-x-5" : "translate-x-0.5"}`}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {label}
                      </span>
                    </label>
                  ))}
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
                      ? "Update Product"
                      : "Create Product"}
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

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-bold text-lg text-gray-800 text-center mb-1">
              Deactivate Product?
            </h3>
            <p className="text-sm text-gray-400 text-center mb-5">
              This product will be hidden from the store.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Yes, Deactivate
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
