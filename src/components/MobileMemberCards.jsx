import { getEntryExpiryStatus } from '../utils/membershipStatus'

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function date(value) {
  if (!value) return '—'

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
}

export default function MobileMemberCards({
  entries,
  onEdit,
  onRenew,
  onCancel,
  onRestore,
}) {
  if (!entries?.length) {
    return (
      <div className="mobile-empty-box">
        <strong>No entries</strong>
        <span>No customers found for this month.</span>
      </div>
    )
  }

  return (
    <div className="mobile-member-list">

      {entries.map((entry) => {
        const { gym, pt } =
          getEntryExpiryStatus(entry)

        return (
          <article
            className={
              entry.is_cancelled
                ? 'mobile-member-card cancelled'
                : 'mobile-member-card'
            }
            key={entry.id}
          >

            <div className="mobile-member-head">

              <div>
                <strong>
                  {entry.customer_name}
                </strong>

                <span>
                  {entry.customer_phone || 'No mobile number'}
                </span>
              </div>

              <span
                className={`mobile-payment-status ${entry.payment_status}`}
              >
                {entry.payment_status}
              </span>

            </div>

            <div className="mobile-member-grid">

              <div>
                <span>Gym</span>
                <strong>
                  {money(entry.gym_amount)}
                </strong>

                {Number(entry.gym_amount || 0) > 0 && (
                  <small>
                    {date(entry.gym_start)}
                    {' – '}
                    {date(entry.gym_end)}
                  </small>
                )}

                {gym && (
                  <small className={`mobile-membership-state ${gym.type}`}>
                    {gym.label}
                  </small>
                )}
              </div>

              <div>
                <span>PT</span>
                <strong>
                  {money(entry.pt_amount)}
                </strong>

                {Number(entry.pt_amount || 0) > 0 && (
                  <small>
                    {date(entry.pt_start)}
                    {' – '}
                    {date(entry.pt_end)}
                  </small>
                )}

                {pt && (
                  <small className={`mobile-membership-state ${pt.type}`}>
                    {pt.label}
                  </small>
                )}
              </div>

              <div>
                <span>JK Share</span>
                <strong>
                  {money(entry.admin_share)}
                </strong>
              </div>

              <div>
                <span>Trainer Share</span>
                <strong>
                  {money(entry.trainer_share)}
                </strong>

                <small>
                  {entry.staff_profiles?.full_name || 'No trainer'}
                </small>
              </div>

            </div>

            <div className="mobile-member-paid">
              <span>Amount received</span>

              <strong>
                {money(entry.amount_paid)}
              </strong>
            </div>

            {!entry.is_cancelled ? (
              <div className="mobile-member-actions">

                <button
                  onClick={() =>
                    onRenew?.(entry)
                  }
                >
                  Renew
                </button>

                <button
                  onClick={() =>
                    onEdit?.(entry)
                  }
                >
                  Edit
                </button>

                <button
                  className="danger"
                  onClick={() =>
                    onCancel?.(entry)
                  }
                >
                  Cancel
                </button>

              </div>
            ) : (
              <div className="mobile-member-actions">

                <button
                  onClick={() =>
                    onRestore?.(entry)
                  }
                >
                  Restore Entry
                </button>

              </div>
            )}

          </article>
        )
      })}

    </div>
  )
}
