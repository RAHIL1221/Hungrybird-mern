import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../api';
import { fmt } from '../../utils/helpers';
import { LoadingCenter } from '../../components/ui/Loaders';
import { Badge } from '../../components/ui/Badge';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const STAT_CARDS = (d) => [
  { label: 'Total Orders', value: fmt.number(d.totalOrders), icon: 'fa-solid fa-receipt', color: '#6366f1', bg: '#ede9fe', change: d.orderGrowth, sub: 'This month: ' + d.monthOrders },
  { label: 'Total Revenue', value: fmt.currency(d.totalRevenue), icon: 'fa-solid fa-dollar-sign', color: '#22c55e', bg: '#dcfce7', change: d.revenueGrowth, sub: 'This month: ' + fmt.currency(d.monthRevenue) },
  { label: 'Customers', value: fmt.number(d.totalUsers), icon: 'fa-solid fa-users', color: '#3b82f6', bg: '#dbeafe', sub: 'Registered users' },
  { label: 'Restaurants', value: fmt.number(d.totalRestaurants), icon: 'fa-solid fa-store', color: '#f59e0b', bg: '#fef3c7', sub: 'Active & approved' },
  { label: 'Menu Items', value: fmt.number(d.totalFoods), icon: 'fa-solid fa-burger', color: '#ec4899', bg: '#fce7f3', sub: 'Total food items' },
];

const PIE_COLORS = ['#6366f1','#22c55e','#f59e0b','#3b82f6','#ef4444','#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCenter />;
  if (!data) return <div className="empty-state"><div className="empty-state-text">Failed to load dashboard</div></div>;

  const { stats, recentOrders, ordersByStatus, dailyRevenue } = data;

  return (
    <div>
      {/* Stat Cards */}
      <div className="stats-grid">
        {STAT_CARDS(stats).map(({ label, value, icon, color, bg, change, sub }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg, color }}><i className={icon} /></div>
            <div className="stat-info">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
              {change !== undefined ? (
                <div className={`stat-change ${parseFloat(change) >= 0 ? 'up' : 'down'}`}>
                  {parseFloat(change) >= 0 ? <i className="fa-solid fa-arrow-up" /> : <i className="fa-solid fa-arrow-down" />} {Math.abs(change)}% vs last month
                </div>
              ) : (
                <div className="stat-change" style={{ color: 'var(--text-muted)' }}>{sub}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Revenue & Orders (Last 30 Days)</span></div>
          <div className="chart-container" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? fmt.currency(v) : v, n]} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="orders" stroke="#22c55e" fill="none" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Orders by Status</span></div>
          <div className="chart-container" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ordersByStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label={({ _id, percent }) => `${_id?.replace(/_/g,' ')} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Orders</span>
          <a href="/orders" className="btn btn-ghost btn-sm">View All →</a>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order #</th><th>Customer</th><th>Restaurant</th>
                <th>Total</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o._id}>
                  <td><span className="fw-600">{o.orderNumber}</span></td>
                  <td>{o.user?.name || '—'}</td>
                  <td>{o.restaurant?.name || '—'}</td>
                  <td>{fmt.currency(o.total)}</td>
                  <td><Badge status={o.status} /></td>
                  <td className="text-muted">{fmt.ago(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
