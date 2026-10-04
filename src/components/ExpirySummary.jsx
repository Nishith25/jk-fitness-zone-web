import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from 'lucide-react'

import {
  getEntryExpiryStatus,
} from '../utils/membershipStatus'

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
      const { gym, pt } =
        getEntryExpiryStatus(
          entry
        )

      ;[gym, pt]
        .filter(Boolean)
        .forEach((status) => {
          if (
            Object.prototype.hasOwnProperty.call(
              counts,
              status.type
            )
          ) {
            counts[
              status.type
            ] += 1
          }
        })
    })

  return (
    <section className="expiry-grid">

      <div className="expiry-card critical">
        <AlertCircle size={18} />

        <div>
          <strong>
            {counts.critical}
          </strong>

          <span>
            Expiring 1–3 days
          </span>
        </div>
      </div>

      <div className="expiry-card warning">
        <AlertTriangle
          size={18}
        />

        <div>
          <strong>
            {counts.warning}
          </strong>

          <span>
            Expiring 4–7 days
          </span>
        </div>
      </div>

      <div className="expiry-card notice">
        <Clock3 size={18} />

        <div>
          <strong>
            {counts.notice}
          </strong>

          <span>
            Expiring 8–15 days
          </span>
        </div>
      </div>

      <div className="expiry-card expired">
        <CheckCircle2
          size={18}
        />

        <div>
          <strong>
            {counts.expired}
          </strong>

          <span>Expired</span>
        </div>
      </div>

    </section>
  )
}
