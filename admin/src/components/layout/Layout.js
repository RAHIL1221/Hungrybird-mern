import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const TITLES = {
  '/': 'Dashboard', '/orders': 'Orders', '/food': 'Food & Menu',
  '/restaurants': 'Restaurants', '/users': 'Customers', '/delivery': 'Delivery',
  '/admins': 'Admin Management', '/coupons': 'Coupons', '/reviews': 'Reviews',
  '/notifications': 'Notifications', '/settings': 'Settings',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const title = TITLES[pathname] || TITLES[Object.keys(TITLES).find(k => pathname.startsWith(k) && k !== '/') || '/'];

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
