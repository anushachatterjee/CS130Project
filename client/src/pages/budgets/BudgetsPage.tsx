import './BudgetsPage.css';

export default function BudgetsPage() {
  return (
    <div className="budgets-page">
      <div className="page-header">
        <h1>Budget and Goals</h1>
      </div>
      <p className="budgets-placeholder">This page will be implemented by Roan</p>

      <div className="budgets-card">
        <h3>Category Budgets</h3>
        <table className="budgets-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Budget</th>
              <th>Used</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Food</td>
              <td className="budget-amount">$300</td>
              <td className="budget-amount">$250</td>
              <td><span className="budget-status-under">Under Budget</span></td>
            </tr>
            <tr>
              <td>Travel</td>
              <td className="budget-amount">$100</td>
              <td className="budget-amount">$120</td>
              <td><span className="budget-status-over">Over Budget</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
