import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import { getProducts } from '../utils/api';
import ProductCard from '../components/ui/ProductCard';
import { PageLoader } from '../components/ui/Spinner';

const CATEGORIES = ['women', 'men', 'kids', 'accessories'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export default function ShopPage() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

useEffect(() => {
  let cancelled = false;

  const fetchProducts = async () => {
    setLoading(true);

    const params = { sort, page, limit: 12 };
    if (category) params.category = category;
    if (search) params.search = search;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    try {
      const { data } = await getProducts(params);

      if (!cancelled) {
        setProducts(data.products);
        setTotal(data.total);
        setPages(data.pages);
      }
    } catch (error) {
      if (!cancelled) console.error(error);
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  const handleFocus = () => fetchProducts();

  fetchProducts();
  window.addEventListener("focus", handleFocus);

  return () => {
    cancelled = true;
    window.removeEventListener("focus", handleFocus);
  };
}, [category, search, sort, page, minPrice, maxPrice]);

  const title = category ? category.charAt(0).toUpperCase() + category.slice(1) : (search ? `Search: "${search}"` : 'All Products');

  return (
    <div className="container-custom py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-primary-600">Shop</Link>
        {category && <><span>/</span><span className="text-dark capitalize">{category}</span></>}
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className={`lg:w-56 shrink-0 ${filterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="lg:sticky lg:top-24 space-y-6">
            <div>
              <h4 className="font-semibold text-sm tracking-wider uppercase mb-3">Category</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/shop" className={`text-sm hover:text-primary-600
                    ransition-colors ${!category ? 'text-primary-600 font-medium' : 'text-gray-600'}`}>
                    All Products ({total})
                  </Link>
                </li>
                {CATEGORIES.map(c => (
                  <li key={c}>
                    <Link to={`/shop/${c}`} className={`text-sm hover:text-primary-600 transition-colors capitalize ${category === c ? 'text-primary-600 font-medium' : 'text-gray-600'}`}>
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm tracking-wider uppercase mb-3">
                Price Range</h4>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setParam('minPrice', e.target.value)}
                  className="input-field text-xs py-2"
                />
                <span className="text-gray-400 text-sm">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setParam('maxPrice', e.target.value)}
                  className="input-field text-xs py-2"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setFilterOpen(!filterOpen)} className="lg:hidden flex items-center gap-1 text-sm font-medium border px-3 py-2">
                <FiFilter size={14} /> Filters
              </button>
              <h1 className="font-display text-2xl md:text-3xl capitalize">{title}</h1>
              <span className="text-sm text-gray-500">({total})</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 hidden sm:block">Sort:</label>
              <select
                value={sort}
                onChange={e => setParam('sort', e.target.value)}
                className="border border-gray-300 text-sm px-3 py-2 outline-none focus:border-primary-500"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active search/filter chips */}
          {(search || minPrice || maxPrice) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {search && (
                <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-3 py-1 border border-primary-200">
                  Search: {search}
                  <button onClick={() => setParam('search', '')}><FiX size={12} /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-3 py-1 border border-primary-200">
                  PKR {minPrice || '0'} – {maxPrice || '∞'}
                  <button onClick={() => { setParam('minPrice', ''); setParam('maxPrice', ''); }}><FiX size={12} /></button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <PageLoader />
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-gray-400 mb-2">No products found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
              <Link to="/shop" className="btn-primary inline-block mt-6">Browse All</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => { const n = new URLSearchParams(searchParams); n.set('page', p); setSearchParams(n); }}
                      className={`w-9 h-9 text-sm font-medium transition-colors ${p === page ? 'bg-primary-600 text-white' : 'border border-gray-300 hover:border-primary-600 hover:text-primary-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
