import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiShoppingBag, FiHeart, FiUser, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

const categories = [
  {
    label: 'Women', slug: 'women',
    featured: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=300&auto=format&fit=crop',
    subs: [{ label: 'All Women', slug: '' },{ label: 'Dresses', slug: 'dresses' },{ label: 'Tops & Blouses', slug: 'tops' },{ label: 'Bottoms', slug: 'bottoms' },{ label: 'Outerwear', slug: 'outerwear' },{ label: 'Activewear', slug: 'activewear' }],
  },
  {
    label: 'Men', slug: 'men',
    featured: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=300&auto=format&fit=crop',
    subs: [{ label: 'All Men', slug: '' },{ label: 'Shirts', slug: 'shirts' },{ label: 'T-Shirts', slug: 'tshirts' },{ label: 'Pants', slug: 'pants' },{ label: 'Outerwear', slug: 'outerwear' },{ label: 'Suits', slug: 'suits' }],
  },
  {
    label: 'Kids', slug: 'kids',
    featured: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&auto=format&fit=crop',
    subs: [{ label: 'All Kids', slug: '' },{ label: 'Girls', slug: 'girls' },{ label: 'Boys', slug: 'boys' },{ label: 'Dresses', slug: 'dresses' },{ label: 'Tops', slug: 'tops' },{ label: 'Hoodies', slug: 'hoodies' }],
  },
  {
    label: 'Accessories', slug: 'accessories',
    featured: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&auto=format&fit=crop',
    subs: [{ label: 'All Accessories', slug: '' },{ label: 'Bags', slug: 'bags' },{ label: 'Scarves', slug: 'scarves' },{ label: 'Belts', slug: 'belts' },{ label: 'Jewelry', slug: 'jewelry' },{ label: 'Hats', slug: 'hats' }],
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout, sessionChecked } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setUserMenuOpen(false); setSearchOpen(false); }, [location]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) setMobileExpanded(null);
  }, [menuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false); setSearchQuery('');
    }
  };

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          <button
            type="button"
            className="md:hidden p-2 -ml-2 rounded-lg transition-colors hover:bg-gray-100"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>

          <Link to="/" className="font-display text-2xl md:text-3xl font-bold
          text-dark tracking-tight">MINIS</Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0">
            {categories.map(cat => (
              <div key={cat.slug} className="group relative">
                <Link to={`/shop/${cat.slug}`}
                  className="flex items-center gap-1 px-3 py-7 text-sm font-medium 
                  tracking-wider uppercase hover:text-primary-600 transition-colors">
                  {cat.label}
                  <FiChevronDown size={11} className="group-hover:rotate-180 
                  transition-transform duration-200 mt-0.5" />
                </Link>
                {/* Mega dropdown */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full bg-white shadow-2xl border-t-2 border-primary-500 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-72 p-5">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Shop {cat.label}</p>
                      <ul className="space-y-2">
                        {cat.subs.map(sub => (
                          <li key={sub.label}>
                            <Link
                              to={sub.slug ? `/shop/${cat.slug}?subcategory=${sub.slug}` : `/shop/${cat.slug}`}
                              className={`text-sm transition-colors hover:text-primary-600 ${sub.slug === '' ? 'font-semibold text-dark' : 'text-gray-600'}`}>
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="w-24 shrink-0">
                      <img src={cat.featured} alt={cat.label} className="w-full h-32 object-cover" />
                      <p className="text-xs text-gray-400 mt-1 text-center">New In</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Link to="/sale" className="px-3 py-7 text-sm font-bold tracking-wider uppercase text-primary-600 hover:text-primary-800 transition-colors">Sale</Link>
            <Link to="/offers" className="px-3 py-7 text-sm font-bold tracking-wider uppercase text-primary-700 hover:text-primary-900 transition-colors" > Offers </Link>
            <Link to="/blog" className="px-3 py-7 text-sm font-medium tracking-wider uppercase hover:text-primary-600 transition-colors">Blog</Link>
            <Link to="/about" className="px-3 py-7 text-sm font-medium tracking-wider uppercase hover:text-primary-600 transition-colors">About</Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:text-primary-600 transition-colors"><FiSearch size={20} /></button>
            <Link to="/wishlist" className="relative p-2 hover:text-primary-600 transition-colors">
              <FiHeart size={20} />
              {wishlist.length > 0 && <span className="absolute top-0.5 right-0.5 bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{wishlist.length}</span>}
            </Link>
            <Link to="/cart" className="relative p-2 hover:text-primary-600 transition-colors">
              <FiShoppingBag size={20} />
              {cartCount > 0 && <span className="absolute top-0.5 right-0.5 bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
            </Link>
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-2 hover:text-primary-600 transition-colors"><FiUser size={20} /></button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl border border-gray-100 z-50 py-1">
                  {!sessionChecked ? (
                    <div className="px-4 py-6 flex justify-center" aria-busy="true">
                      <div className="w-8 h-8 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
                    </div>
                  ) : user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-semibold truncate text-dark">{user.name}</p>
                      </div>
                      {user.isAdmin && (
                        <Link to="/admin" className="block px-4 py-2.5 text-sm text-primary-600 font-semibold hover:bg-primary-50 transition-colors">⚙ Admin Dashboard</Link>
                      )}
                      <Link to="/profile" className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">My Profile</Link>
                      <Link to="/orders" className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">My Orders</Link>
                      <Link to="/wishlist" className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">Wishlist</Link>
                      <div className="border-t border-gray-100 mt-1">
                        <button onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">Sign Out</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors">Sign In</Link>
                      <Link to="/register" className="block px-4 py-3 text-sm text-primary-600 font-semibold hover:bg-primary-50 transition-colors">Create Account</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t py-4 animate-slide-up">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for products, styles, categories..." className="input-field flex-1" />
              <button type="submit" className="btn-primary px-5 py-3"><FiSearch size={18} /></button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu — always mounted for smooth height/opacity transition */}
      <div
        id="mobile-nav"
        aria-hidden={!menuOpen}
        className={`md:hidden border-t bg-white transition-[max-height,opacity] duration-[420ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
          menuOpen
            ? 'max-h-[min(85vh,640px)] opacity-100 overflow-y-auto overscroll-contain shadow-[inset_0_1px_0_0_rgba(0,0,0,0.06)] pointer-events-auto'
            : 'max-h-0 opacity-0 overflow-hidden pointer-events-none border-transparent'
        }`}
      >
          {categories.map(cat => (
            <div key={cat.slug}>
              <button
                type="button"
                className="w-full flex items-center justify-between px-6 py-3.5 font-semibold border-b border-gray-50 uppercase text-sm tracking-wider text-left"
                onClick={() => setMobileExpanded(mobileExpanded === cat.slug ? null : cat.slug)}
              >
                {cat.label}
                <FiChevronDown size={14} className={`shrink-0 transition-transform duration-300 ease-out ${mobileExpanded === cat.slug ? 'rotate-180' : ''}`} />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
                  mobileExpanded === cat.slug ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="bg-gray-50 px-8 py-3 border-b border-gray-100 space-y-2">
                    {cat.subs.map(sub => (
                      <Link
                        key={sub.label}
                        to={sub.slug ? `/shop/${cat.slug}?subcategory=${sub.slug}` : `/shop/${cat.slug}`}
                        className={`block py-1.5 text-sm transition-colors hover:text-primary-600 ${sub.slug === '' ? 'font-semibold text-dark' : 'text-gray-600'}`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        <Link to="/sale" className="block px-6 py-3.5 font-bold border-b border-gray-50 uppercase text-sm tracking-wider text-primary-600">Sale</Link>
        <Link to="/offers" className="block px-6 py-3.5 font-bold border-b border-gray-50 uppercase text-sm tracking-wider text-primary-700" > Offers </Link>
          <Link to="/blog" className="block px-6 py-3.5 font-medium border-b border-gray-50 uppercase text-sm tracking-wider">Blog</Link>
          <Link to="/about" className="block px-6 py-3.5 font-medium border-b border-gray-50 uppercase text-sm tracking-wider">About</Link>
          <Link to="/contact" className="block px-6 py-3.5 font-medium border-b border-gray-50 uppercase text-sm tracking-wider">Contact</Link>
          <Link to="/faq" className="block px-6 py-3.5 font-medium border-b border-gray-50 uppercase text-sm tracking-wider">FAQ</Link>
          <div className="px-6 py-4 space-y-1 border-t">
            {!sessionChecked ? (
              <div className="py-4 flex justify-center" aria-busy="true">
                <div className="w-7 h-7 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : user ? (
              <>
                {user.isAdmin && <Link to="/admin" className="block py-2 text-sm font-semibold text-primary-600">⚙ Admin Dashboard</Link>}
                <Link to="/profile" className="block py-2 text-sm">My Profile</Link>
                <Link to="/orders" className="block py-2 text-sm">My Orders</Link>
                <button type="button" onClick={logout} className="block w-full text-left py-2 text-sm text-red-500">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-sm font-medium">Sign In</Link>
                <Link to="/register" className="block py-2 text-sm text-primary-600 font-semibold">Create Account</Link>
              </>
            )}
          </div>
      </div>
    </header>
  );
}
