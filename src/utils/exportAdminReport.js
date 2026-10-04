import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    }
  )}`
}

function formatDate(value) {
  if (!value) return '-'

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )
}

export function exportAdminReport({
  month,
  entries,
  trainers,
  settlements = [],
}) {
  const doc =
    new jsPDF({
      orientation:
        'landscape',
      format: 'a4',
    })

  const activeEntries =
    entries.filter(
      (entry) =>
        !entry.is_cancelled &&
        entry.joined_on?.slice(
          0,
          7
        ) === month
    )

  const [
    year,
    monthNumber,
  ] = month
    .split('-')
    .map(Number)

  const monthName =
    new Date(
      year,
      monthNumber - 1,
      1
    ).toLocaleDateString(
      'en-IN',
      {
        month: 'long',
        year: 'numeric',
      }
    )

  const gym =
    activeEntries.reduce(
      (sum, e) =>
        sum +
        Number(
          e.gym_amount || 0
        ),
      0
    )

  const pt =
    activeEntries.reduce(
      (sum, e) =>
        sum +
        Number(
          e.pt_amount || 0
        ),
      0
    )

  const collected =
    activeEntries.reduce(
      (sum, e) =>
        sum +
        Number(
          e.amount_paid || 0
        ),
      0
    )

  const jk =
    activeEntries.reduce(
      (sum, e) =>
        sum +
        Number(
          e.admin_share || 0
        ),
      0
    )

  const trainerShare =
    activeEntries.reduce(
      (sum, e) =>
        sum +
        Number(
          e.trainer_share || 0
        ),
      0
    )

  const pending =
    activeEntries.reduce(
      (sum, e) => {
        const total =
          Number(
            e.gym_amount || 0
          ) +
          Number(
            e.pt_amount || 0
          )

        return (
          sum +
          Math.max(
            total -
              Number(
                e.amount_paid ||
                  0
              ),
            0
          )
        )
      },
      0
    )

  doc.setFillColor(
    10,
    10,
    10
  )

  doc.rect(
    0,
    0,
    297,
    40,
    'F'
  )

  doc.setFillColor(
    255,
    106,
    0
  )

  doc.rect(
    0,
    0,
    7,
    40,
    'F'
  )

  doc.setTextColor(
    255,
    255,
    255
  )

  doc.setFont(
    'helvetica',
    'bold'
  )

  doc.setFontSize(22)

  doc.text(
    'JK FITNESS ZONE',
    15,
    17
  )

  doc.setFontSize(11)

  doc.text(
    'Monthly Management Report',
    15,
    25
  )

  doc.setFont(
    'helvetica',
    'normal'
  )

  doc.setFontSize(8)

  doc.setTextColor(
    180,
    180,
    180
  )

  doc.text(
    monthName,
    15,
    32
  )

  doc.setTextColor(
    20,
    20,
    20
  )

  autoTable(doc, {
    startY: 48,

    head: [[
      'Joinings',
      'Gym Value',
      'PT Value',
      'Collected',
      'JK Share',
      'Trainer Share',
      'Pending',
    ]],

    body: [[
      activeEntries.length,
      money(gym),
      money(pt),
      money(collected),
      money(jk),
      money(
        trainerShare
      ),
      money(pending),
    ]],

    theme: 'grid',

    headStyles: {
      fillColor:
        [255, 106, 0],

      textColor:
        [10, 10, 10],

      fontStyle:
        'bold',
    },

    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
  })

  doc.setFontSize(13)

  doc.setFont(
    'helvetica',
    'bold'
  )

  doc.text(
    'Customer Entries',
    14,
    doc.lastAutoTable
      .finalY + 11
  )

  autoTable(doc, {
    startY:
      doc.lastAutoTable
        .finalY + 15,

    head: [[
      'Customer',
      'Mobile',
      'Trainer',
      'Gym',
      'Gym Period',
      'PT',
      'PT Period',
      'JK Share',
      'Trainer Share',
      'Paid',
      'Status',
    ]],

    body:
      activeEntries.map(
        (e) => [
          e.customer_name,
          e.customer_phone ||
            '-',

          e.staff_profiles
            ?.full_name ||
            '-',

          money(
            e.gym_amount
          ),

          Number(
            e.gym_amount ||
              0
          ) > 0
            ? `${formatDate(
                e.gym_start
              )} - ${formatDate(
                e.gym_end
              )}`
            : '-',

          money(
            e.pt_amount
          ),

          Number(
            e.pt_amount ||
              0
          ) > 0
            ? `${formatDate(
                e.pt_start
              )} - ${formatDate(
                e.pt_end
              )}`
            : '-',

          money(
            e.admin_share
          ),

          money(
            e.trainer_share
          ),

          money(
            e.amount_paid
          ),

          e.payment_status,
        ]
      ),

    theme: 'striped',

    headStyles: {
      fillColor:
        [25, 25, 25],
    },

    styles: {
      fontSize: 6.6,
      cellPadding: 2,
    },
  })

  doc.addPage()

  doc.setFillColor(
    10,
    10,
    10
  )

  doc.rect(
    0,
    0,
    297,
    30,
    'F'
  )

  doc.setTextColor(
    255,
    255,
    255
  )

  doc.setFont(
    'helvetica',
    'bold'
  )

  doc.setFontSize(17)

  doc.text(
    'TRAINER EARNINGS',
    14,
    18
  )

  doc.setFontSize(9)

  doc.setTextColor(
    190,
    190,
    190
  )

  doc.text(
    monthName,
    14,
    24
  )

  const trainerRows =
    trainers.map(
      (trainer) => {
        const trainerEntries =
          activeEntries.filter(
            (e) =>
              e.trainer_id ===
              trainer.id
          )

        const share =
          trainerEntries.reduce(
            (sum, e) =>
              sum +
              Number(
                e.trainer_share ||
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
                trainer
                  .monthly_salary ||
                  0
              )

        const finalShare =
          settlement?.status ===
          'paid'
            ? Number(
                settlement
                  .share_amount ||
                  share
              )
            : share

        return [
          trainer.full_name,
          trainerEntries.length,
          money(finalShare),
          money(salary),
          money(
            finalShare +
              salary
          ),
          settlement?.status ===
          'paid'
            ? 'Paid'
            : 'Pending',
        ]
      }
    )

  autoTable(doc, {
    startY: 38,

    head: [[
      'Trainer',
      'Entries',
      'Revenue Share',
      'Salary',
      'Total Earnings',
      'Settlement',
    ]],

    body:
      trainerRows,

    theme: 'grid',

    headStyles: {
      fillColor:
        [255, 106, 0],

      textColor:
        [10, 10, 10],
    },

    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
  })

  const pages =
    doc.getNumberOfPages()

  for (
    let i = 1;
    i <= pages;
    i++
  ) {
    doc.setPage(i)

    doc.setDrawColor(
      220,
      220,
      220
    )

    doc.line(
      14,
      198,
      283,
      198
    )

    doc.setFontSize(7)

    doc.setTextColor(
      120,
      120,
      120
    )

    doc.text(
      'JK Fitness Zone · Internal Management Report',
      14,
      203
    )

    doc.text(
      `Page ${i} of ${pages}`,
      270,
      203
    )
  }

  doc.save(
    `JK-Fitness-Zone-${month}-Report.pdf`
  )
}
