import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiGrid, FiShoppingBag, FiPackage, FiUsers, FiLogOut, FiExternalLink, FiTruck, FiCreditCard, FiSettings, FiMenu, FiX, FiTag } from 'react-icons/fi';

const navLinks = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/admin/products', label: 'Products', icon: FiShoppingBag },
  { to: '/admin/users', label: 'Customers', icon: FiUsers },
  { to: '/admin/orders', label: 'Orders', icon: FiPackage },
  { to: '/admin/shipments', label: 'Shipments', icon: FiTruck },
  { to: '/admin/transactions', label: 'Transactions', icon: FiCreditCard },
  { to: '/admin/coupons', label: 'Coupons', icon: FiTag },
  { to: '/admin/settings', label: 'Settings', icon: FiSettings },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div
      className="flex h-[100dvh] overflow-hidden relative"
      style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8f8fb' }}
    >
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[60] h-14 flex items-center justify-between px-4 bg-white border-b border-gray-100 shadow-sm">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <FiMenu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center shadow-sm">
            <FiShoppingBag size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-800 text-sm tracking-tight">MINIS Admin</span>
        </div>
        <span className="w-9" aria-hidden />
      </header>

      {/* Dim background when drawer open */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="lg:hidden fixed inset-0 z-[70] bg-black/40"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-[80] w-[min(17rem,calc(100vw-2.5rem))] max-w-[85vw]
          shrink-0 bg-white border-r border-gray-100 flex flex-col shadow-sm
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:w-52 lg:max-w-none`}
      >
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center shadow-sm">
              <FiShoppingBag size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-base tracking-tight">MINIS</span>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeSidebar}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <FiX size={22} />
          </button>
        </div>
        <div className="hidden lg:block px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center shadow-sm">
              <FiShoppingBag size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-base tracking-tight">MINIS</span>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto overscroll-contain min-h-0">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive ? 'bg-amber-400 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`
              }
            >
              <Icon size={17} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100 space-y-0.5 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FiExternalLink size={16} />
            <span>View Store</span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 pt-14 lg:pt-0 p-4 sm:p-5 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
