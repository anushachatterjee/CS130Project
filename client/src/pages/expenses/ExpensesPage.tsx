import { useEffect, useRef, useState } from "react";
import { CATEGORY_COLORS } from "../../constants/colors";
import { apiFetch } from '../../api';
import './ExpensesPage.css'

interface Expense {
  expense_id: string;
  user_id: string;
  expense_title: string;
  expense_category: string;
  expense_amount_cents: number;
  expense_date: string;
  expense_note: string | null;
  created_at: string;
}

interface ExpenseFormData {
  title: string;
  category: string;
  amount: string;
  date: string;
  note: string;
}

interface FilterState {
  search: string;
  category: string;
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
  sortBy: "date" | "amount" | "category";
  sortOrder: "asc" | "desc";
  page: number;
}

interface PendingFilterState {
  search: string;
  category: string;
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
  sortBy: "date" | "amount" | "category";
  sortOrder: "asc" | "desc";
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  // default to today's date for convenience
  const todayIso = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    category: 'Food',
    amount: '',
    date: todayIso,
    note: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState('');

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 0,
  });

  const [pendingFilters, setPendingFilters] = useState<PendingFilterState>({
    search: '',
    category: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const itemsPerPage = 10;

  const parseAmountToCents = (amount: string): number | null => {
    const trimmed = amount.trim();
    if (!trimmed) return null;

    const validMoney = /^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(trimmed);
    if (!validMoney) return null;

    const value = Number(trimmed);
    if (Number.isNaN(value) || value < 0) return null;
    return Math.round(value * 100);
  };

  const getDatePreset = (presetType: string): { from: string; to: string } => {
    const today = new Date();
    let from = '', to = todayIso;

    switch (presetType) {
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'last30Days':
        const date30 = new Date(today);
        date30.setDate(date30.getDate() - 30);
        from = date30.toISOString().split('T')[0];
        break;
      case 'thisYear':
        from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      case 'allTime':
        from = '';
        to = '';
        break;
    }

    return { from, to };
  };

  const fetchExpenses = async (filterState: FilterState) => {
    try {
      const isFirstLoad = !hasLoadedOnceRef.current;
      if (isFirstLoad) {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const params = new URLSearchParams();

      if (filterState.search) params.append('title', filterState.search);
      if (filterState.category) params.append('category', filterState.category);
      const minAmountCents = parseAmountToCents(filterState.minAmount);
      const maxAmountCents = parseAmountToCents(filterState.maxAmount);
      if (minAmountCents !== null) params.append('minAmount', minAmountCents.toString());
      if (maxAmountCents !== null) params.append('maxAmount', maxAmountCents.toString());
      if (filterState.dateFrom) params.append('from', filterState.dateFrom);
      if (filterState.dateTo) params.append('to', filterState.dateTo);
      params.append('sortBy', filterState.sortBy);
      params.append('sortOrder', filterState.sortOrder);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', (filterState.page * itemsPerPage).toString());

      const resp = await apiFetch(`/expenses?${params.toString()}`);
      if (!resp.ok) throw Error('Failed to load expenses');
      const data: Expense[] = await resp.json();
      setExpenses(data);
      setTotalCount(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      hasLoadedOnceRef.current = true;
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

    const handleEditClick = (expense: Expense) => {
    console.log('[client] edit click', expense.expense_id);
    setEditingExpense(expense);

    // Format date to yyyy-MM-dd for input[type="date"]
    let formattedDate = '';
    if (expense.expense_date) {
      const date = new Date(expense.expense_date);
      formattedDate = date.toISOString().split('T')[0];
    }

    setFormData({
      title: expense.expense_title,
      category: expense.expense_category,
      amount: (expense.expense_amount_cents / 100).toFixed(2),
      date: formattedDate,
      note: expense.expense_note || '',
    });
    setShowModal(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setDeletingId(expense.expense_id);
    setDeletingTitle(expense.expense_title);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await apiFetch(`/expenses/${deletingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete expense');
      setShowDeleteConfirm(false);
      setDeletingId(null);
      setDeletingTitle('');
      await fetchExpenses(filters);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete expense');
      console.error('Error deleting expense:', err);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingId(null);
    setDeletingTitle('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.category || !formData.amount || !formData.date) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount');
      return;
    }

    // convert dollars to integer cents
    const amountCents = Math.round(amount * 100);

    try {
      const payload = {
        title: formData.title,
        date: formData.date,
        amount_cents: amountCents,
        category: formData.category,
        ...(formData.note ? { note: formData.note } : {}),
      };

      const url = editingExpense
        ? `/expenses/${editingExpense.expense_id}`
        : `/expenses`;
      // server expects PATCH for updates
      const method = editingExpense ? 'PATCH' : 'POST';

      console.log('[client] submitting', { method, url, payload });

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[client] response body', text);
        throw new Error('Failed to save expense');
      }

      setShowModal(false);
      await fetchExpenses(filters);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save expense');
      console.error('Error saving expense:', err);
    }
  };

  const handleAddClick = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      category: 'Food',
      amount: '',
      note: '',
      date: ''
    });
    setShowModal(true);
  };

    const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    // return ISO yyyy-mm-dd (useful for display and for inputs)
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleInstantFilterChange = (changes: Partial<PendingFilterState>) => {
    const newPending = { ...pendingFilters, ...changes };
    setPendingFilters(newPending);
    setFilters({ ...newPending, search: filters.search, page: 0 }); // keep search from instant update
  };

  const handleApplySearch = () => {
    setFilters({ ...filters, search: pendingFilters.search, page: 0 });
  };

  useEffect(() => {
    fetchExpenses(filters);
  }, [filters]);

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div>
      <h1>Expense Management</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isInitialLoading ? (
        <div className="loading">Loading expenses...</div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <button style={{ padding: '0.5rem 1rem', cursor: 'pointer', marginBottom: '1rem' }} onClick={handleAddClick}>
            + Add Expense
          </button>
          <button className="toggle-filters-btn" onClick={() => setShowFilters(v => !v)}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {showFilters && (
            <div className="filters-panel">
              {/* Search Section */}
              <div className="search-section">
                <label>Search by Title</label>
                <div className="search-row">
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={pendingFilters.search}
                    onChange={e => setPendingFilters({ ...pendingFilters, search: e.target.value })}
                    className="filter-input"
                  />
                  <button className="apply-search-btn" onClick={handleApplySearch}>Apply Search</button>
                </div>
              </div>

              {/* Instant Filters Section */}
              <div className="instant-filters">
                {/* Date Range Row */}
                <div className="filter-row">
                  <div className="filter-row-title">Date Range</div>
                  <div className="date-presets">
                    <button className={`preset-btn ${pendingFilters.dateFrom === '' && pendingFilters.dateTo === '' ? 'active' : ''}`} onClick={() => handleInstantFilterChange({ dateFrom: '', dateTo: '' })}>All Time</button>
                    <button className={`preset-btn ${pendingFilters.dateFrom === getDatePreset('thisMonth').from ? 'active' : ''}`} onClick={() => { const { from, to } = getDatePreset('thisMonth'); handleInstantFilterChange({ dateFrom: from, dateTo: to }); }}>This Month</button>
                    <button className={`preset-btn ${pendingFilters.dateFrom === getDatePreset('last30Days').from ? 'active' : ''}`} onClick={() => { const { from, to } = getDatePreset('last30Days'); handleInstantFilterChange({ dateFrom: from, dateTo: to }); }}>Last 30 Days</button>
                    <button className={`preset-btn ${pendingFilters.dateFrom === getDatePreset('thisYear').from ? 'active' : ''}`} onClick={() => { const { from, to } = getDatePreset('thisYear'); handleInstantFilterChange({ dateFrom: from, dateTo: to }); }}>This Year</button>
                  </div>
                  <div className="custom-date-range">
                    <input type="date" value={pendingFilters.dateFrom} onChange={e => handleInstantFilterChange({ dateFrom: e.target.value })} className="filter-input" placeholder="From" title="From date" />
                    <span>to</span>
                    <input type="date" value={pendingFilters.dateTo} onChange={e => handleInstantFilterChange({ dateTo: e.target.value })} className="filter-input" placeholder="To" title="To date" />
                  </div>
                </div>

                {/* Filters Row */}
                <div className="filter-row">
                  <div className="filter-row-title">Filters</div>
                  <div className="filter-control">
                    <label className="filter-control-label">Category</label>
                    <select value={pendingFilters.category} onChange={e => handleInstantFilterChange({ category: e.target.value })} className="filter-input filter-select-sm">
                      <option value="">All</option>
                      <option value="Food">Food</option>
                      <option value="Housing">Housing</option>
                      <option value="Transportation">Transport</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="filter-control">
                    <label className="filter-control-label">Amount</label>
                    <div className="amount-range-inputs">
                      <input type="number" placeholder="Min" min="0" step="0.01" value={pendingFilters.minAmount} onChange={e => handleInstantFilterChange({ minAmount: e.target.value })} className="filter-input" title="Minimum amount" />
                      <span>–</span>
                      <input type="number" placeholder="Max" min="0" step="0.01" value={pendingFilters.maxAmount} onChange={e => handleInstantFilterChange({ maxAmount: e.target.value })} className="filter-input" title="Maximum amount" />
                    </div>
                  </div>
                  <div className="filter-control">
                    <label className="filter-control-label">Sort</label>
                    <div className="sort-controls">
                      <select value={pendingFilters.sortBy} onChange={e => handleInstantFilterChange({ sortBy: e.target.value as any })} className="filter-input">
                        <option value="date">Date</option>
                        <option value="amount">Amount</option>
                        <option value="category">Category</option>
                      </select>
                      <button className={`sort-order-btn ${pendingFilters.sortOrder === 'asc' ? 'active' : ''}`} onClick={() => handleInstantFilterChange({ sortOrder: pendingFilters.sortOrder === 'desc' ? 'asc' : 'desc' })} title={pendingFilters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}>{pendingFilters.sortOrder === 'asc' ? '↑' : '↓'}</button>
                    </div>
                  </div>
                  <button className="reset-all-btn" onClick={() => { setPendingFilters({ search: '', category: '', minAmount: '', maxAmount: '', dateFrom: '', dateTo: '', sortBy: 'date', sortOrder: 'desc' }); setFilters({ search: '', category: '', minAmount: '', maxAmount: '', dateFrom: '', dateTo: '', sortBy: 'date', sortOrder: 'desc', page: 0 }); }} title="Reset all filters">Reset All</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Amount</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Note</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length == 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
                      No expenses found. Try adjusting your filters or click "Add Expense" to create one.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.expense_id}>
                      <td>{formatDate(expense.expense_date)}</td>
                      <td>{expense.expense_title}</td>
                      <td>
                        <span
                          className="category-badge"
                          style={{
                            backgroundColor: CATEGORY_COLORS[expense.expense_category] || '#95a5a6',
                            color: '#ffffff',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-block'
                          }}
                        >
                          {expense.expense_category}
                        </span>
                      </td>
                      <td>${(expense.expense_amount_cents / 100).toFixed(2)}</td>
                      <td>{expense.expense_note}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditClick(expense)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteClick(expense)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button
              disabled={filters.page === 0}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="pagination-btn"
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Page {filters.page + 1} | Showing {expenses.length} of {totalCount}
            </span>
            <button
              disabled={expenses.length < itemsPerPage}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {showModal && (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
            <button className="btn-close" onClick={() => setShowModal(false)}>
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Coffee, Concert ticket"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              >
                <option value="Food">Food</option>
                <option value="Housing">Housing</option>
                <option value="Transportation">Transportation</option>
                <option value="Utilities">Utilities</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="amount">
                Amount ($) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">
                Date <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  placeholder="YYYY-MM-DD"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setFormData({ ...formData, date: todayIso })}
                  title="Set to today"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="note">Notes</label>
              <textarea
                id="note"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder="Optional notes about this expense"
                rows={3}
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingExpense ? 'Update' : 'Add'} Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showDeleteConfirm && (
      <div className="modal-overlay" onClick={cancelDelete}>
        <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Confirm Deletion</h2>
            <button className="btn-close" onClick={cancelDelete}>
              &times;
            </button>
          </div>
          <div className="delete-modal-body">
            <div className="delete-icon">⚠️</div>
            <p>Are you sure you want to delete <strong>{deletingTitle}</strong>?</p>
            <p className="delete-warning">This action cannot be undone.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={cancelDelete}>
              Cancel
            </button>
            <button type="button" className="btn-danger" onClick={confirmDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}
