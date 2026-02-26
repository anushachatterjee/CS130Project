import { useState, useEffect } from 'react';
import { CATEGORY_COLORS, STATUS_COLORS } from '../../constants/colors';
import { apiFetch } from '../../api';
import './SubscriptionsPage.css';

interface Subscription {
  subscription_id: string;
  subscription_title: string;
  subscription_category: string;
  subscription_amount: number;
  billing_cycle: string;
  next_renewal_date: string | null;
  subscription_status: string;
  subscription_note?: string;
}

interface SubscriptionFormData {
  subscription_title: string;
  subscription_category: string;
  subscription_amount: string;
  billing_cycle: string;
  next_renewal_date: string;
  subscription_status: string;
  subscription_note: string;
}


export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState<SubscriptionFormData>({
    subscription_title: '',
    subscription_category: 'Entertainment',
    subscription_amount: '',
    billing_cycle: 'monthly',
    next_renewal_date: '',
    subscription_status: 'active',
    subscription_note: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSubscriptionId, setDeletingSubscriptionId] = useState<string | null>(null);
  const [deletingSubscriptionName, setDeletingSubscriptionName] = useState<string>('');

  // Fetch subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const data = await response.json();
      setSubscriptions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingSubscription(null);
    setFormData({
      subscription_title: '',
      subscription_category: 'Entertainment',
      subscription_amount: '',
      billing_cycle: 'monthly',
      next_renewal_date: '',
      subscription_status: 'active',
      subscription_note: '',
    });
    setShowModal(true);
  };

  const handleEditClick = (subscription: Subscription) => {
    setEditingSubscription(subscription);

    // Format date to yyyy-MM-dd for input[type="date"]
    let formattedDate = '';
    if (subscription.next_renewal_date) {
      const date = new Date(subscription.next_renewal_date);
      formattedDate = date.toISOString().split('T')[0];
    }

    setFormData({
      subscription_title: subscription.subscription_title,
      subscription_category: subscription.subscription_category,
      subscription_amount: subscription.subscription_amount.toString(),
      billing_cycle: subscription.billing_cycle,
      next_renewal_date: formattedDate,
      subscription_status: subscription.subscription_status,
      subscription_note: subscription.subscription_note || '',
    });
    setShowModal(true);
  };

  const handleDeleteClick = (subscription: Subscription) => {
    setDeletingSubscriptionId(subscription.subscription_id);
    setDeletingSubscriptionName(subscription.subscription_title);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingSubscriptionId) return;

    try {
      const response = await apiFetch(`/subscriptions/${deletingSubscriptionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete subscription');
      setShowDeleteConfirm(false);
      setDeletingSubscriptionId(null);
      setDeletingSubscriptionName('');
      await fetchSubscriptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete subscription');
      console.error('Error deleting subscription:', err);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingSubscriptionId(null);
    setDeletingSubscriptionName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.subscription_title || !formData.subscription_category || !formData.subscription_amount) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.subscription_amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Validate renewal date based on billing cycle
    if (formData.billing_cycle !== 'none' && !formData.next_renewal_date) {
      alert('Please enter a renewal date for recurring subscriptions');
      return;
    }

    if (formData.billing_cycle === 'none' && formData.next_renewal_date) {
      alert('Renewal date should not be set for non-recurring subscriptions');
      return;
    }

    try {
      const payload = {
        subscription_title: formData.subscription_title,
        subscription_category: formData.subscription_category,
        subscription_amount: amount,
        billing_cycle: formData.billing_cycle,
        next_renewal_date: formData.next_renewal_date || null,
        subscription_status: formData.subscription_status,
        subscription_note: formData.subscription_note || null,
      };

      const url = editingSubscription
        ? `/subscriptions/${editingSubscription.subscription_id}`
        : `/subscriptions`;

      const method = editingSubscription ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save subscription');

      setShowModal(false);
      await fetchSubscriptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save subscription');
      console.error('Error saving subscription:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
  };

  const formatCycle = (cycle: string) => {
    return cycle.charAt(0).toUpperCase() + cycle.slice(1);
  };


  return (
    <div className="subscriptions-page">
      <div className="page-header">
        <h1>Subscriptions / Recurring Transactions</h1>
        <button className="btn-primary" onClick={handleAddClick}>
          + Add Subscription
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading subscriptions...</div>
      ) : (
        <div className="table-container">
          <table className="subscriptions-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Cycle</th>
                <th>Renewal</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No subscriptions yet. Click "Add Subscription" to get started.
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription.subscription_id}>
                    <td>{subscription.subscription_title}</td>
                    <td>
                      <span
                        className="category-badge"
                        style={{
                          backgroundColor: CATEGORY_COLORS[subscription.subscription_category] || '#95a5a6',
                          color: '#ffffff',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'inline-block'
                        }}
                      >
                        {subscription.subscription_category}
                      </span>
                    </td>
                    <td>${subscription.subscription_amount.toFixed(2)}</td>
                    <td>{formatCycle(subscription.billing_cycle)}</td>
                    <td>{formatDate(subscription.next_renewal_date)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: STATUS_COLORS[subscription.subscription_status as keyof typeof STATUS_COLORS]?.background || '#e5e7eb',
                          color: STATUS_COLORS[subscription.subscription_status as keyof typeof STATUS_COLORS]?.text || '#374151',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'capitalize' as const,
                          display: 'inline-block'
                        }}
                      >
                        {subscription.subscription_status.charAt(0).toUpperCase() +
                          subscription.subscription_status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEditClick(subscription)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteClick(subscription)}
                        >
                          Delete
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSubscription ? 'Edit Subscription' : 'Add Subscription'}</h2>
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
                  value={formData.subscription_title}
                  onChange={(e) =>
                    setFormData({ ...formData, subscription_title: e.target.value })
                  }
                  placeholder="e.g., Netflix, Spotify"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="category"
                  value={formData.subscription_category}
                  onChange={(e) =>
                    setFormData({ ...formData, subscription_category: e.target.value })
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
                  value={formData.subscription_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, subscription_amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cycle">
                  Billing Cycle <span className="required">*</span>
                </label>
                <select
                  id="cycle"
                  value={formData.billing_cycle}
                  onChange={(e) =>
                    setFormData({ ...formData, billing_cycle: e.target.value })
                  }
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="renewal">
                  Next Renewal Date
                  {formData.billing_cycle !== 'none' && <span className="required"> *</span>}
                </label>
                <input
                  type="date"
                  id="renewal"
                  value={formData.next_renewal_date}
                  onChange={(e) =>
                    setFormData({ ...formData, next_renewal_date: e.target.value })
                  }
                  required={formData.billing_cycle !== 'none'}
                />
                {formData.billing_cycle === 'none' && formData.next_renewal_date && (
                  <small style={{ color: '#dc2626' }}>
                    Clear this field for non-recurring subscriptions
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="status">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="status"
                  value={formData.subscription_status}
                  onChange={(e) =>
                    setFormData({ ...formData, subscription_status: e.target.value })
                  }
                  required
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="note">Notes</label>
                <textarea
                  id="note"
                  value={formData.subscription_note}
                  onChange={(e) =>
                    setFormData({ ...formData, subscription_note: e.target.value })
                  }
                  placeholder="Optional notes about this subscription"
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSubscription ? 'Update' : 'Add'} Subscription
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
              <p>Are you sure you want to delete <strong>{deletingSubscriptionName}</strong>?</p>
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
