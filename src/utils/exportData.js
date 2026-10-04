import * as XLSX from 'xlsx'

function getMonthEntries(
  entries,
  month
) {
  return entries.filter(
    (entry) =>
      !entry.is_cancelled &&
      entry.joined_on?.slice(0, 7) === month
  )
}

export function exportAdminExcel({
  month,
  entries,
  trainers,
  settlements,
}) {
  const monthEntries =
    getMonthEntries(
      entries,
      month
    )

  const summary = [
    {
      Metric: 'Month',
      Value: month,
    },
    {
      Metric: 'Joinings',
      Value:
        monthEntries.length,
    },
    {
      Metric: 'Gym Value',
      Value:
        monthEntries.reduce(
          (sum, e) =>
            sum +
            Number(
              e.gym_amount || 0
            ),
          0
        ),
    },
    {
      Metric: 'PT Value',
      Value:
        monthEntries.reduce(
          (sum, e) =>
            sum +
            Number(
              e.pt_amount || 0
            ),
          0
        ),
    },
    {
      Metric:
        'Amount Collected',
      Value:
        monthEntries.reduce(
          (sum, e) =>
            sum +
            Number(
              e.amount_paid || 0
            ),
          0
        ),
    },
    {
      Metric:
        'JK Fitness Share',
      Value:
        monthEntries.reduce(
          (sum, e) =>
            sum +
            Number(
              e.admin_share || 0
            ),
          0
        ),
    },
    {
      Metric:
        'Trainer Revenue Share',
      Value:
        monthEntries.reduce(
          (sum, e) =>
            sum +
            Number(
              e.trainer_share || 0
            ),
          0
        ),
    },
  ]

  const customerRows =
    monthEntries.map(
      (entry) => ({
        Customer:
          entry.customer_name,

        Trainer:
          entry.staff_profiles
            ?.full_name ||
          '',

        'Joining Date':
          entry.joined_on,

        'Gym Amount':
          Number(
            entry.gym_amount ||
              0
          ),

        'Gym Start':
          entry.gym_start ||
          '',

        'Gym Expiry':
          entry.gym_end ||
          '',

        'PT Amount':
          Number(
            entry.pt_amount ||
              0
          ),

        'PT Start':
          entry.pt_start ||
          '',

        'PT Expiry':
          entry.pt_end ||
          '',

        'JK Share':
          Number(
            entry.admin_share ||
              0
          ),

        'Trainer Share':
          Number(
            entry.trainer_share ||
              0
          ),

        'Amount Paid':
          Number(
            entry.amount_paid ||
              0
          ),

        Status:
          entry.payment_status,

        'Payment Mode':
          entry.payment_mode,

        Notes:
          entry.notes || '',
      })
    )

  const trainerRows =
    trainers.map(
      (trainer) => {
        const trainerEntries =
          monthEntries.filter(
            (entry) =>
              entry.trainer_id ===
              trainer.id
          )

        const share =
          trainerEntries.reduce(
            (sum, entry) =>
              sum +
              Number(
                entry.trainer_share ||
                  0
              ),
            0
          )

        const settlement =
          settlements.find(
            (item) =>
              item.trainer_id ===
                trainer.id &&
              item.month_start ===
                `${month}-01`
          )

        const salary =
          settlement?.status ===
          'paid'
            ? Number(
                settlement
                  .salary_amount ||
                  0
              )
            : Number(
                trainer.monthly_salary ||
                  0
              )

        const savedShare =
          settlement?.status ===
          'paid'
            ? Number(
                settlement
                  .share_amount ||
                  share
              )
            : share

        return {
          Trainer:
            trainer.full_name,

          Entries:
            trainerEntries.length,

          'Revenue Share':
            savedShare,

          Salary:
            salary,

          'Total Earnings':
            savedShare +
            salary,

          Settlement:
            settlement?.status ||
            'pending',
        }
      }
    )

  const workbook =
    XLSX.utils.book_new()

  const summarySheet =
    XLSX.utils.json_to_sheet(
      summary
    )

  const entriesSheet =
    XLSX.utils.json_to_sheet(
      customerRows
    )

  const trainersSheet =
    XLSX.utils.json_to_sheet(
      trainerRows
    )

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    'Summary'
  )

  XLSX.utils.book_append_sheet(
    workbook,
    entriesSheet,
    'Customer Entries'
  )

  XLSX.utils.book_append_sheet(
    workbook,
    trainersSheet,
    'Trainer Earnings'
  )

  XLSX.writeFile(
    workbook,
    `JK-Fitness-Zone-${month}.xlsx`
  )
}

export function exportAdminCSV({
  month,
  entries,
}) {
  const rows =
    getMonthEntries(
      entries,
      month
    )

  const worksheet =
    XLSX.utils.json_to_sheet(
      rows.map(
        (entry) => ({
          Customer:
            entry.customer_name,

          Trainer:
            entry.staff_profiles
              ?.full_name ||
            '',

          Joining:
            entry.joined_on,

          Gym:
            entry.gym_amount,

          PT:
            entry.pt_amount,

          'JK Share':
            entry.admin_share,

          'Trainer Share':
            entry.trainer_share,

          Paid:
            entry.amount_paid,

          Status:
            entry.payment_status,
        })
      )
    )

  const csv =
    XLSX.utils.sheet_to_csv(
      worksheet
    )

  const blob =
    new Blob(
      [csv],
      {
        type:
          'text/csv;charset=utf-8;',
      }
    )

  const url =
    URL.createObjectURL(
      blob
    )

  const link =
    document.createElement(
      'a'
    )

  link.href = url

  link.download =
    `JK-Fitness-Zone-${month}.csv`

  link.click()

  URL.revokeObjectURL(
    url
  )
}
