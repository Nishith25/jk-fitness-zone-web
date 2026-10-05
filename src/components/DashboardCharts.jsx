import { useMemo } from 'react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function money(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString('en-IN')}`
}

export default function DashboardCharts({
  entries,
  selectedMonth,
}) {
  const revenueData = useMemo(() => {
    const monthEntries =
      entries.filter(
        (entry) =>
          !entry.is_cancelled &&
          entry.joined_on?.slice(0, 7) ===
            selectedMonth
      )

    const ptBusiness =
      monthEntries.reduce(
        (sum, entry) =>
          sum +
          Number(entry.pt_amount || 0),
        0
      )

    const jkShare =
      monthEntries.reduce(
        (sum, entry) =>
          sum +
          Number(entry.admin_share || 0),
        0
      )

    const trainerShare =
      monthEntries.reduce(
        (sum, entry) =>
          sum +
          Number(entry.trainer_share || 0),
        0
      )

    return [
      {
        name: 'Selected Month',
        'PT Business': ptBusiness,
        'JK Fitness Share': jkShare,
        'Package Trainer Share':
          trainerShare,
      },
    ]
  }, [entries, selectedMonth])

  const trendData = useMemo(() => {
    const [year, month] =
      selectedMonth
        .split('-')
        .map(Number)

    return Array.from({
      length: 6,
    }).map((_, index) => {
      const d = new Date(
        year,
        month - 1 - (5 - index),
        1
      )

      const key =
        `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, '0')}`

      const monthEntries =
        entries.filter(
          (entry) =>
            !entry.is_cancelled &&
            entry.joined_on?.slice(0, 7) ===
              key
        )

      return {
        month:
          d.toLocaleDateString(
            'en-IN',
            { month: 'short' }
          ),

        'PT Business':
          monthEntries.reduce(
            (sum, entry) =>
              sum +
              Number(
                entry.pt_amount || 0
              ),
            0
          ),

        'JK Share':
          monthEntries.reduce(
            (sum, entry) =>
              sum +
              Number(
                entry.admin_share || 0
              ),
            0
          ),

        'Package Trainer Share':
          monthEntries.reduce(
            (sum, entry) =>
              sum +
              Number(
                entry.trainer_share || 0
              ),
            0
          ),
      }
    })
  }, [entries, selectedMonth])

  return (
    <section className="dashboard-chart-grid">

      <div className="chart-card">

        <div className="chart-heading">
          <div>
            <span className="section-kicker">
              BUSINESS
            </span>

            <h3>
              Monthly package breakdown
            </h3>
          </div>
        </div>

        <div className="chart-container">

          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <BarChart
              data={revenueData}
              barGap={10}
            >

              <CartesianGrid
                stroke="#1e1e1e"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#8a8a8a',
                  fontSize: 10,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#727272',
                  fontSize: 9,
                }}
                tickFormatter={(value) =>
                  `₹${Math.round(
                    value / 1000
                  )}k`
                }
              />

              <Tooltip
                formatter={(value) =>
                  money(value)
                }
                contentStyle={{
                  background: '#101010',
                  border:
                    '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#f4f4f4',
                }}
              />

              <Legend />

              <Bar
                dataKey="PT Business"
                fill="#d9d9d9"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="JK Fitness Share"
                fill="#8d8d8d"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="Package Trainer Share"
                fill="#555555"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>


      <div className="chart-card">

        <div className="chart-heading">
          <div>
            <span className="section-kicker">
              TREND
            </span>

            <h3>
              Last 6 months
            </h3>
          </div>
        </div>

        <div className="chart-container">

          <ResponsiveContainer
            width="100%"
            height={280}
          >

            <BarChart
              data={trendData}
            >

              <CartesianGrid
                stroke="#1e1e1e"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#8a8a8a',
                  fontSize: 10,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#727272',
                  fontSize: 9,
                }}
                tickFormatter={(value) =>
                  `₹${Math.round(
                    value / 1000
                  )}k`
                }
              />

              <Tooltip
                formatter={(value) =>
                  money(value)
                }
                contentStyle={{
                  background: '#101010',
                  border:
                    '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#f4f4f4',
                }}
              />

              <Legend />

              <Bar
                dataKey="PT Business"
                fill="#d9d9d9"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="JK Share"
                fill="#858585"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="Package Trainer Share"
                fill="#505050"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </section>
  )
}
