import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';
import { CATEGORY_COLORS } from '../../constants/colors';
import './BudgetsPage.css';

interface Budget {
  budget_id: string;
  user_id: string;
  budget_category: string;
  monthly_limit_cents: number;
  budget_month: string;
  spent_cents: number;
  created_at: string;
}

interface BudgetFormData {
  category: string;
  amount: string;
}

const CATEGORIES = ['Food', 'Housing', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Other'];

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1 + delta);
  return date.toISOString().slice(0, 7);
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>({ category: 'Food', amount: '' });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth]);

  const fetchBudgets = async () => {
    try {
      setError(null);
      const response = await apiFetch(`/budgets?month=${selectedMonth}`);
      if (!response.ok) throw new Error('Failed to fetch budgets');
      const data = await response.json();
      setBudgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBudget(null);
    const usedCategories = budgets.map(b => b.budget_category);
    const available = CATEGORIES.filter(c => !usedCategories.includes(c));
    setFormData({ category: available[0] || 'Food', amount: '' });
    setShowModal(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.budget_category,
      amount: (budget.monthly_limit_cents / 100).toString(),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBudget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(formData.amount) * 100);
    if (isNaN(amountCents) || amountCents < 0) return;

    try {
      if (editingBudget) {
        const response = await apiFetch(`/budgets/${editingBudget.budget_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monthly_limit_cents: amountCents }),
        });
        if (!response.ok) throw new Error('Failed to update budget');
      } else {
        const response = await apiFetch('/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: formData.category,
            monthly_limit_cents: amountCents,
            budget_month: selectedMonth,
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create budget');
        }
      }
      closeModal();
      await fetchBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const confirmDelete = (budget: Budget) => {
    setDeletingBudget(budget);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingBudget) return;
    try {
      const response = await apiFetch(`/budgets/${deletingBudget.budget_id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) throw new Error('Failed to delete budget');
      setShowDeleteConfirm(false);
      setDeletingBudget(null);
      await fetchBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const usedCategories = budgets.map(b => b.budget_category);
  const availableCategories = CATEGORIES.filter(c => !usedCategories.includes(c));

  const totalBudget = budgets.reduce((sum, b) => sum + b.monthly_limit_cents, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_cents, 0);

  return (
    <div className="budgets-page">
      <div className="page-header">
        <h1>Budget and Goals</h1>
        <button className="add-budget-btn" onClick={openAddModal} disabled={availableCategories.length === 0}>
          + Set Budget
        </button>
      </div>

      {/* Month Navigation */}
      <div className="month-nav">
        <button className="month-nav-btn" onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}>
          &#8592;
        </button>
        <span className="month-nav-label">{formatMonth(selectedMonth)}</span>
        <button className="month-nav-btn" onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}>
          &#8594;
        </button>
      </div>

      {/* Summary Cards */}
      <div className="budget-summary">
        <div className="summary-card">
          <div className="summary-label">Total Budget</div>
          <div className="summary-value">${(totalBudget / 100).toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Spent</div>
          <div className="summary-value">${(totalSpent / 100).toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Remaining</div>
          <div className={`summary-value ${totalBudget - totalSpent < 0 ? 'over' : 'under'}`}>
            ${((totalBudget - totalSpent) / 100).toFixed(2)}
          </div>
        </div>
      </div>

      {error && <div className="budgets-error">{error}</div>}

      {/* Budgets Table */}
      <div className="budgets-card">
        <h3>Category Budgets</h3>
        {isLoading ? (
          <div className="budgets-loading">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="budgets-empty">
            No budgets set for {formatMonth(selectedMonth)}. Click "Set Budget" to get started.
          </div>
        ) : (
          <table className="budgets-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget) => {
                const remaining = budget.monthly_limit_cents - budget.spent_cents;
                const pct = budget.monthly_limit_cents > 0
                  ? Math.min((budget.spent_cents / budget.monthly_limit_cents) * 100, 100)
                  : 0;
                const isOver = budget.spent_cents > budget.monthly_limit_cents;
                const isNear = !isOver && pct >= 80;
                const color = CATEGORY_COLORS[budget.budget_category] || '#95a5a6';

                return (
                  <tr key={budget.budget_id}>
                    <td>
                      <span className="category-dot" style={{ backgroundColor: color }} />
                      {budget.budget_category}
                    </td>
                    <td className="budget-amount">${(budget.monthly_limit_cents / 100).toFixed(2)}</td>
                    <td className="budget-amount">${(budget.spent_cents / 100).toFixed(2)}</td>
                    <td className={`budget-amount ${isOver ? 'over' : ''}`}>
                      ${(remaining / 100).toFixed(2)}
                    </td>
                    <td>
                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar-fill ${isOver ? 'over' : isNear ? 'near' : ''}`}
                          style={{ width: `${pct}%`, backgroundColor: isOver ? undefined : isNear ? undefined : color }}
                        />
                      </div>
                      <span className="progress-pct">{Math.round(budget.monthly_limit_cents > 0 ? (budget.spent_cents / budget.monthly_limit_cents) * 100 : 0)}%</span>
                    </td>
                    <td>
                      <span className={`budget-status ${isOver ? 'budget-status-over' : isNear ? 'budget-status-near' : 'budget-status-under'}`}>
                        {isOver ? 'Over Budget' : isNear ? 'Near Limit' : 'Under Budget'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button className="btn-edit" onClick={() => openEditModal(budget)}>
                          Edit
                        </button>
                        <button className="btn-delete" onClick={() => confirmDelete(budget)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBudget ? 'Edit Budget' : 'Set Budget'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                {editingBudget ? (
                  <input type="text" value={editingBudget.budget_category} disabled className="form-input" />
                ) : (
                  <select
                    id="category"
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="amount">Monthly Limit ($)</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save">
                  {editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingBudget && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Budget</h2>
            <p>Remove the <strong>{deletingBudget.budget_category}</strong> budget for {formatMonth(selectedMonth)}?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-delete" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
