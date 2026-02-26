import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CATEGORY_COLORS, STATUS_COLORS } from '../../constants/colors';
import { apiFetch } from '../../api';
import './DashboardPage.css';

interface CategorySpending {
  category: string;
  amount: number;
}

interface BudgetUsage {
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  status: 'good' | 'warning' | 'over';
}

interface UpcomingRenewal {
  id: string;
  title: string;
  amount: number;
  renewalDate: string;
  billingCycle: string;
  status: string;
}

interface DashboardData {
  totalSpending: number;
  categorySpending: CategorySpending[];
  budgetUsage: BudgetUsage[];
  upcomingRenewals: UpcomingRenewal[];
  currentMonth: string;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/dashboard/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const renewalDate = new Date(dateString);
    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-page">
        <div className="error">No data available</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>

      {/* Total Spending Summary */}
      <div className="summary-card">
        <div className="summary-header">
          <h2>Total Spending This Month</h2>
          <span className="month-label">{dashboardData.currentMonth}</span>
        </div>
        <div className="total-amount">{formatCurrency(dashboardData.totalSpending)}</div>
      </div>

      <div className="dashboard-grid">
        {/* Category Spending - Pie Chart */}
        <div className="card">
          <h3>Spending by Category</h3>
          {dashboardData.categorySpending.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={dashboardData.categorySpending.map(item => ({
                      name: item.category,
                      value: item.amount,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.categorySpending.map((entry) => (
                      <Cell key={`cell-${entry.category}`} fill={CATEGORY_COLORS[entry.category] || '#95a5a6'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="category-summary">
                {dashboardData.categorySpending.map((item) => (
                  <div key={item.category} className="category-summary-item">
                    <div className="category-color" style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#95a5a6' }} />
                    <span className="category-name">{item.category}</span>
                    <div className="category-bar-mini">
                      <div
                        className="category-bar-mini-fill"
                        style={{
                          width: `${(item.amount / dashboardData.totalSpending) * 100}%`,
                          backgroundColor: CATEGORY_COLORS[item.category] || '#95a5a6'
                        }}
                      />
                    </div>
                    <span className="category-amount">{formatCurrency(item.amount)}</span>
                    <span className="category-percentage">
                      {((item.amount / dashboardData.totalSpending) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="empty-message">No expenses recorded this month</p>
          )}
        </div>

        {/* Budget Usage */}
        <div className="card">
          <h3>Budget Status</h3>
          <div className="budget-list">
            {dashboardData.budgetUsage.length > 0 ? (
              dashboardData.budgetUsage.map((budget) => (
                <div key={budget.category} className="budget-item">
                  <div className="budget-header">
                    <span className="budget-category">{budget.category}</span>
                    <span className="budget-amounts">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </span>
                  </div>
                  <div className={`budget-bar budget-${budget.status}`}>
                    <div
                      className="budget-bar-fill"
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="budget-percentage">
                    {budget.percentage}% used
                    {budget.status === 'over' && ' - Over budget!'}
                    {budget.status === 'warning' && ' - Approaching limit'}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-message">No budgets set for this month</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Renewals */}
      <div className="card">
        <h3>Upcoming Subscription Renewals</h3>
        <div className="renewals-list">
          {dashboardData.upcomingRenewals.length > 0 ? (
            dashboardData.upcomingRenewals.map((renewal) => {
              const daysUntil = getDaysUntil(renewal.renewalDate);
              return (
                <div key={renewal.id} className="renewal-item">
                  <div className="renewal-info">
                    <div className="renewal-title">{renewal.title}</div>
                    <div className="renewal-details">
                      <span className="renewal-cycle">{renewal.billingCycle}</span>
                      <span
                        className="renewal-status"
                        style={{
                          backgroundColor: STATUS_COLORS[renewal.status as keyof typeof STATUS_COLORS]?.background || '#e5e7eb',
                          color: STATUS_COLORS[renewal.status as keyof typeof STATUS_COLORS]?.text || '#374151'
                        }}
                      >
                        {renewal.status}
                      </span>
                    </div>
                  </div>
                  <div className="renewal-right">
                    <div className="renewal-amount">{formatCurrency(renewal.amount)}</div>
                    <div className={`renewal-date ${daysUntil <= 7 ? 'urgent' : ''}`}>
                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="empty-message">No upcoming renewals</p>
          )}
        </div>
      </div>
    </div>
  );
}
