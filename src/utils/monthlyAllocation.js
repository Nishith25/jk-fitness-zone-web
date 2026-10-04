function monthKey(value) {
  if (!value) return ''
  return String(value).slice(0, 7)
}

export function durationMonths(entry) {
  if (!entry?.pt_start || !entry?.pt_end) {
    return 1
  }

  const start = new Date(`${entry.pt_start}T00:00:00`)
  const end = new Date(`${entry.pt_end}T00:00:00`)

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())

  if (months < 1) months = 1

  return months
}

export function entryMonthlyAllocation(entry, selectedMonth) {
  if (
    !entry ||
    entry.is_cancelled ||
    !entry.pt_start ||
    !entry.pt_end ||
    Number(entry.pt_amount || 0) <= 0
  ) {
    return null
  }

  const months = durationMonths(entry)

  const start = new Date(`${entry.pt_start}T00:00:00`)

  const allocations = Array.from(
    { length: months },
    (_, index) => {
      const d = new Date(
        start.getFullYear(),
        start.getMonth() + index,
        1
      )

      return `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`
    }
  )

  if (!allocations.includes(selectedMonth)) {
    return null
  }

  const monthlyPt =
    Number(entry.pt_amount || 0) / months

  const trainerPercent =
    entry.gym_fee_paid ? 0.5 : 0.4

  const adminPercent =
    entry.gym_fee_paid ? 0.5 : 0.6

  return {
    ...entry,

    allocation_month: selectedMonth,

    duration_months: months,

    monthly_pt_amount:
      Math.round(monthlyPt * 100) / 100,

    monthly_trainer_share:
      Math.round(
        monthlyPt *
        trainerPercent *
        100
      ) / 100,

    monthly_admin_share:
      Math.round(
        monthlyPt *
        adminPercent *
        100
      ) / 100,
  }
}

export function getMonthlyAllocations(
  entries,
  selectedMonth
) {
  return (entries || [])
    .map((entry) =>
      entryMonthlyAllocation(
        entry,
        selectedMonth
      )
    )
    .filter(Boolean)
}

export function getMonthlyTotals(
  entries,
  selectedMonth
) {
  const allocations =
    getMonthlyAllocations(
      entries,
      selectedMonth
    )

  return allocations.reduce(
    (totals, entry) => {
      totals.ptBusiness +=
        Number(
          entry.monthly_pt_amount || 0
        )

      totals.adminShare +=
        Number(
          entry.monthly_admin_share || 0
        )

      totals.trainerShare +=
        Number(
          entry.monthly_trainer_share || 0
        )

      return totals
    },
    {
      ptBusiness: 0,
      adminShare: 0,
      trainerShare: 0,
    }
  )
}

export function getJoinedEntries(
  entries,
  selectedMonth
) {
  return (entries || []).filter(
    (entry) =>
      !entry.is_cancelled &&
      monthKey(entry.joined_on) ===
        selectedMonth
  )
}
