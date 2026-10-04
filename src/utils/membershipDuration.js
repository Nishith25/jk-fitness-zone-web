export const MEMBERSHIP_DURATIONS = [
  { value: '1M', label: '1 Month', months: 1 },
  { value: '2M', label: '2 Months', months: 2 },
  { value: '3M', label: '3 Months', months: 3 },
  { value: '4M', label: '4 Months', months: 4 },
  { value: '5M', label: '5 Months', months: 5 },
  { value: '6M', label: '6 Months', months: 6 },
  { value: '7M', label: '7 Months', months: 7 },
  { value: '8M', label: '8 Months', months: 8 },
  { value: '9M', label: '9 Months', months: 9 },
  { value: '10M', label: '10 Months', months: 10 },
  { value: '11M', label: '11 Months', months: 11 },
  { value: '12M', label: '12 Months', months: 12 },

  { value: '1Y', label: '1 Year', months: 12 },
  { value: '1.5Y', label: '1.5 Years', months: 18 },
  { value: '2Y', label: '2 Years', months: 24 },
  { value: '2.5Y', label: '2.5 Years', months: 30 },
  { value: '3Y', label: '3 Years', months: 36 },
]

export function calculateExpiryDate(startDate, durationValue) {
  if (!startDate || !durationValue) return ''

  const duration =
    MEMBERSHIP_DURATIONS.find(
      (item) => item.value === durationValue
    )

  if (!duration) return ''

  const [year, month, day] =
    startDate.split('-').map(Number)

  const source = new Date(
    year,
    month - 1,
    day
  )

  const originalDay =
    source.getDate()

  const target = new Date(
    year,
    month - 1 + duration.months,
    1
  )

  const lastDayOfTargetMonth =
    new Date(
      target.getFullYear(),
      target.getMonth() + 1,
      0
    ).getDate()

  target.setDate(
    Math.min(
      originalDay,
      lastDayOfTargetMonth
    )
  )

  const yyyy =
    target.getFullYear()

  const mm =
    String(
      target.getMonth() + 1
    ).padStart(2, '0')

  const dd =
    String(
      target.getDate()
    ).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

export function detectDuration(startDate, endDate) {
  if (!startDate || !endDate) {
    return '1M'
  }

  for (const option of MEMBERSHIP_DURATIONS) {
    if (
      calculateExpiryDate(
        startDate,
        option.value
      ) === endDate
    ) {
      return option.value
    }
  }

  return '1M'
}
