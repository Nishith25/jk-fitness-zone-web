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
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

export default function DashboardCharts({
  entries,
  selectedMonth,
}) {
  const revenueData = useMemo(() => {
    const monthEntries = entries.filter(
      (entry) =>
        !entry.is_cancelled &&
        entry.joined_on?.slice(0, 7) === selectedMonth
    )

    const gym = monthEntries.reduce(
      (sum, entry) =>
        sum + Number(entry.gym_amount || 0),
      0
    )

    const pt = monthEntries.reduce(
      (sum, entry) =>
        sum + Number(entry.pt_amount || 0),
      0
    )

    const jk = monthEntries.reduce(
      (sum, entry) =>
        sum + Number(entry.admin_share || 0),
      0
    )

    const trainer = monthEntries.reduce(
      (sum, entry) =>
        sum + Number(entry.trainer_share || 0),
      0
    )

    return [
      {
        name: 'Revenue',
        Gym: gym,
        PT: pt,
      },
      {
        name: 'Distribution',
        'JK Fitness': jk,
        Trainers: trainer,
      },
    ]
  }, [entries, selectedMonth])

  const trendData = useMemo(() => {
    const [year, month] =
      selectedMonth.split('-').map(Number)

    return Array.from({ length: 6 }).map(
      (_, index) => {
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
              entry.joined_on?.slice(0, 7) === key
          )

        const collected =
          monthEntries.reduce(
            (sum, entry) =>
              sum + Number(entry.amount_paid || 0),
            0
          )

        return {
          month: d.toLocaleDateString(
            'en-IN',
            { month: 'short' }
          ),
          Collected: collected,
          Joinings: monthEntries.length,
        }
      }
    )
  }, [entries, selectedMonth])

  return (
    <section className="dashboard-chart-grid">

      <div className="chart-card">

        <div className="chart-heading">
          <div>
            <span className="section-kicker">
              REVENUE
            </span>
            <h3>Monthly breakdown</h3>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData} barGap={8}>
              <CartesianGrid stroke="#1e1e1e" vertical={false} />

              <XAxis
                dataKey="name"
                tick={{ fill: '#8a8a8a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: '#727272', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  `₹${Math.round(value / 1000)}k`
                }
              />

              <Tooltip
                formatter={(value) => money(value)}
                contentStyle={{
                  background: '#101010',
                  border: '1px solid #2a2a2a',
                  borderRadius: 12,
                  color: '#f4f4f4',
                  fontSize: 11,
                }}
                labelStyle={{ color: '#dcdcdc' }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: 10,
                  color: '#bdbdbd',
                }}
              />

              <Bar
                dataKey="Gym"
                fill="#f2f2f2"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="PT"
                fill="#b8b8b8"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="JK Fitness"
                fill="#7c7c7c"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="Trainers"
                fill="#4a4a4a"
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
            <h3>Last 6 months</h3>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}>
              <CartesianGrid stroke="#1e1e1e" vertical={false} />

              <XAxis
                dataKey="month"
                tick={{ fill: '#8a8a8a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: '#727272', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  `₹${Math.round(value / 1000)}k`
                }
              />

              <Tooltip
                formatter={(value, name) =>
                  name === 'Collected'
                    ? money(value)
                    : value
                }
                contentStyle={{
                  background: '#101010',
                  border: '1px solid #2a2a2a',
                  borderRadius: 12,
                  color: '#f4f4f4',
                  fontSize: 11,
                }}
                labelStyle={{ color: '#dcdcdc' }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: 10,
                  color: '#bdbdbd',
                }}
              />

              <Bar
                dataKey="Collected"
                fill="#e8e8e8"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="Joinings"
                fill="#5b5b5b"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

    </section>
  )
}
