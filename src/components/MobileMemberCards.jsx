import { getEntryExpiryStatus } from '../utils/membershipStatus'

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function shortDate(value) {
  if (!value) return ''

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
      <div className="simple-empty">
        No customer entries
      </div>
    )
  }

  return (
    <div className="simple-customer-list">

      {entries.map((entry) => {
        const { gym, pt } =
          getEntryExpiryStatus(entry)

        return (
          <article
            className="simple-customer-row"
            key={entry.id}
          >

            <div className="simple-customer-top">

              <div className="simple-customer-name">
                <strong>
                  {entry.customer_name}
                </strong>

                <span>
                  {entry.staff_profiles?.full_name || 'No trainer'}
                </span>
              </div>

              <span
                className={`simple-status ${entry.payment_status}`}
              >
                {entry.payment_status}
              </span>

            </div>

            <div className="simple-customer-values">

              <div>
                <span>Gym</span>
                <strong>
                  {money(entry.gym_amount)}
                </strong>

                {Number(entry.gym_amount || 0) > 0 && (
                  <small>
                    {shortDate(entry.gym_start)}
                    {' – '}
                    {shortDate(entry.gym_end)}
                  </small>
                )}

                {gym && (
                  <small>
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
                    {shortDate(entry.pt_start)}
                    {' – '}
                    {shortDate(entry.pt_end)}
                  </small>
                )}

                {pt && (
                  <small>
                    {pt.label}
                  </small>
                )}
              </div>

              <div>
                <span>Paid</span>
                <strong>
                  {money(entry.amount_paid)}
                </strong>
              </div>

              <div>
                <span>Trainer</span>
                <strong>
                  {money(entry.trainer_share)}
                </strong>
              </div>

            </div>

            <div className="simple-customer-actions">

              {!entry.is_cancelled ? (
                <>
                  <button
                    onClick={() => onRenew?.(entry)}
                  >
                    Renew
                  </button>

                  <button
                    onClick={() => onEdit?.(entry)}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onCancel?.(entry)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onRestore?.(entry)}
                >
                  Restore
                </button>
              )}

            </div>

          </article>
        )
      })}

    </div>
  )
}
