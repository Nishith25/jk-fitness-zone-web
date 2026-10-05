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

import useMonthlyFinancials
  from '../hooks/useMonthlyFinancials'

function money(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString('en-IN')}`
}

export default function DashboardCharts({
  selectedMonth,
}) {
  const {
    rows,
    totals,
  } = useMonthlyFinancials(
    selectedMonth
  )

  const revenueData =
    useMemo(
      () => [
        {
          name: 'Selected Month',

          'PT Business':
            totals.ptBusiness,

          'JK Fitness Share':
            totals.adminShare,

          'Trainer Share':
            totals.trainerShare,
        },
      ],
      [totals]
    )

  return (
    <section className="dashboard-chart-grid">

      <div className="chart-card">

        <div className="chart-heading">
          <div>
            <span className="section-kicker">
              PT REVENUE
            </span>

            <h3>
              Monthly breakdown
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
                dataKey="Trainer Share"
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
              MONTH SUMMARY
            </span>

            <h3>
              Final values
            </h3>
          </div>
        </div>

        <div className="chart-summary-values">

          <div>
            <span>
              Active PT allocations
            </span>

            <strong>
              {rows.length}
            </strong>
          </div>

          <div>
            <span>
              PT Business
            </span>

            <strong>
              {money(
                totals.ptBusiness
              )}
            </strong>
          </div>

          <div>
            <span>
              JK Fitness
            </span>

            <strong>
              {money(
                totals.adminShare
              )}
            </strong>
          </div>

          <div>
            <span>
              Trainers
            </span>

            <strong>
              {money(
                totals.trainerShare
              )}
            </strong>
          </div>

        </div>

      </div>

    </section>
  )
}
