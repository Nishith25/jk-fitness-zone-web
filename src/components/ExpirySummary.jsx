export default function ExpirySummary({
  entries,
}) {
  const counts = {
    critical: 0,
    warning: 0,
    notice: 0,
    expired: 0,
  }

  entries
    .filter(
      (entry) =>
        !entry.is_cancelled
    )
    .forEach((entry) => {
      const gym =
        Number(entry.gym_amount || 0) > 0 &&
        entry.gym_end
          ? getDaysType(entry.gym_end)
          : null

      const pt =
        Number(entry.pt_amount || 0) > 0 &&
        entry.pt_end
          ? getDaysType(entry.pt_end)
          : null

      ;[gym, pt]
        .filter(Boolean)
        .forEach((type) => {
          counts[type] += 1
        })
    })

  return (
    <section className="expiry-grid">

      <div className="expiry-card">
        <strong>
          {counts.critical}
        </strong>
        <span>
          Expiring 1–3 days
        </span>
      </div>

      <div className="expiry-card">
        <strong>
          {counts.warning}
        </strong>
        <span>
          Expiring 4–7 days
        </span>
      </div>

      <div className="expiry-card">
        <strong>
          {counts.notice}
        </strong>
        <span>
          Expiring 8–15 days
        </span>
      </div>

      <div className="expiry-card">
        <strong>
          {counts.expired}
        </strong>
        <span>
          Expired
        </span>
      </div>

    </section>
  )
}

function getDaysType(dateString) {
  const today = new Date()
  const now = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  const [y, m, d] = dateString
    .split('-')
    .map(Number)

  const end = new Date(y, m - 1, d)

  const days = Math.ceil(
    (end - now) / (1000 * 60 * 60 * 24)
  )

  if (days < 0) return 'expired'
  if (days <= 3) return 'critical'
  if (days <= 7) return 'warning'
  if (days <= 15) return 'notice'
  return null
}
