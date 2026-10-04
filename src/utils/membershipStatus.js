function todayOnly() {
  const now = new Date()
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
}

function parseDate(value) {
  if (!value) return null

  const [year, month, day] =
    value.split('-').map(Number)

  return new Date(
    year,
    month - 1,
    day
  )
}

export function daysUntil(value) {
  const target = parseDate(value)

  if (!target) return null

  const diff =
    target.getTime() -
    todayOnly().getTime()

  return Math.ceil(
    diff / (1000 * 60 * 60 * 24)
  )
}

export function getMembershipStatus(
  start,
  end
) {
  if (!start || !end) {
    return {
      type: 'none',
      label: 'Not Active',
      days: null,
    }
  }

  const startDate = parseDate(start)
  const endDate = parseDate(end)
  const today = todayOnly()

  if (today < startDate) {
    return {
      type: 'upcoming',
      label: 'Upcoming',
      days: Math.ceil(
        (startDate - today) /
          (1000 * 60 * 60 * 24)
      ),
    }
  }

  const remaining = daysUntil(end)

  if (remaining < 0) {
    return {
      type: 'expired',
      label: 'Expired',
      days: remaining,
    }
  }

  if (remaining <= 3) {
    return {
      type: 'critical',
      label: `${remaining} day${
        remaining === 1 ? '' : 's'
      } left`,
      days: remaining,
    }
  }

  if (remaining <= 7) {
    return {
      type: 'warning',
      label: `${remaining} days left`,
      days: remaining,
    }
  }

  if (remaining <= 15) {
    return {
      type: 'notice',
      label: `${remaining} days left`,
      days: remaining,
    }
  }

  return {
    type: 'active',
    label: 'Active',
    days: remaining,
  }
}

export function getEntryExpiryStatus(
  entry
) {
  const gym =
    Number(entry.gym_amount || 0) > 0
      ? getMembershipStatus(
          entry.gym_start,
          entry.gym_end
        )
      : null

  const pt =
    Number(entry.pt_amount || 0) > 0
      ? getMembershipStatus(
          entry.pt_start,
          entry.pt_end
        )
      : null

  return { gym, pt }
}
