import {
  Activity,
  Banknote,
  CheckCircle2,
  Clock3,
  Dumbbell,
  LogOut,
  Plus,
  Search,
  Users,
} from 'lucide-react'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useMonthlyFinancials from '../hooks/useMonthlyFinancials'
import StatCard from '../components/StatCard'
import AddEntryModal from '../components/AddEntryModal'
import AppLogo from '../components/AppLogo'

import {
  getMonthlyAllocations,
} from '../utils/monthlyAllocation'

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function shortDate(value) {
  if (!value) return '—'

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
}

export default function TrainerDashboard() {
  const navigate = useNavigate()

  const now = new Date()

  const defaultMonth =
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`

  const [profile, setProfile] = useState(null)
  const [entries, setEntries] = useState([])
  const [activities, setActivities] = useState([])
  const [settlements, setSettlements] = useState([])
  const [month, setMonth] = useState(defaultMonth)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [trainerTab, setTrainerTab] = useState('home')

  const [customerSearch, setCustomerSearch] = useState('')
  const [gymFilter, setGymFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [ptFilter, setPtFilter] = useState('all')

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate('/')
      return
    }

    const [
      profileResult,
      entriesResult,
      activityResult,
      settlementResult,
    ] = await Promise.all([
      supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', user.id)
        .single(),

      supabase
        .from('member_entries')
        .select('*')
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(50),

      supabase
        .from('trainer_settlements')
        .select('*')
        .eq('trainer_id', user.id)
        .order('month_start', {
          ascending: false,
        }),
    ])

    setProfile(profileResult.data)
    setEntries(entriesResult.data || [])
    setActivities(activityResult.data || [])
    setSettlements(settlementResult.data || [])
    setLoading(false)
  }, [navigate])

  useEffect(() => {
    loadData()

    const entriesChannel = supabase
      .channel('trainer-live-entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_entries',
        },
        loadData
      )
      .subscribe()

    const settlementChannel = supabase
      .channel('trainer-live-settlements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trainer_settlements',
        },
        loadData
      )
      .subscribe()

    return () => {
      supabase.removeChannel(entriesChannel)
      supabase.removeChannel(settlementChannel)
    }
  }, [loadData])

  const {
    rows: monthlyFinancialRows,
    totals: monthlyFinancialTotals,
  } = useMonthlyFinancials(month)

  const monthEntries = useMemo(() => {
    return monthlyFinancialRows
  }, [monthlyFinancialRows])

  const filteredMonthEntries = useMemo(() => {
    const query =
      customerSearch.trim().toLowerCase()

    return monthEntries.filter((entry) => {
      const matchesName =
        !query ||
        entry.customer_name
          ?.toLowerCase()
          .includes(query)

      const matchesGym =
        gymFilter === 'all' ||
        (gymFilter === 'paid' &&
          Boolean(entry.gym_fee_paid)) ||
        (gymFilter === 'not_paid' &&
          !entry.gym_fee_paid)

      const matchesPayment =
        paymentFilter === 'all' ||
        entry.payment_status === paymentFilter

      const matchesPt =
        ptFilter === 'all' ||
        Number(entry.pt_amount || 0) ===
          Number(ptFilter)

      return (
        matchesName &&
        matchesGym &&
        matchesPayment &&
        matchesPt
      )
    })
  }, [
    monthEntries,
    customerSearch,
    gymFilter,
    paymentFilter,
    ptFilter,
  ])

  const stats = useMemo(() => {
    return {
      customers:
        monthEntries.length,

      total:
        monthlyFinancialTotals.ptBusiness,

      earning:
        monthlyFinancialTotals.trainerShare,
    }
  }, [
    monthEntries,
    monthlyFinancialTotals,
  ])

  const settlement = settlements.find(
    (item) =>
      item.month_start === `${month}-01`
  )

  async function logout() {
    try {
      await supabase.rpc('log_staff_event', {
        event_action: 'logout',
        event_details: {
          portal: 'trainer',
        },
      })
    } catch (error) {
      console.error('Unable to record logout:', error)
    }

    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="screen-loader">
        <div className="loader-ring" />
        Loading trainer portal...
      </div>
    )
  }

  return (
    <div className="trainer-page">

      <header className="trainer-header">

        <AppLogo compact />

        <button
          className="logout-button compact"
          onClick={logout}
        >
          <LogOut size={17} />
          Logout
        </button>

      </header>

      <main className="trainer-main">

        {trainerTab === 'home' && (
          <>
        <div className="trainer-welcome">

          <div>
            <span className="section-kicker">
              TRAINER PORTAL
            </span>

            <h1>
              Welcome, {profile?.full_name || 'Trainer'}
            </h1>

            <p>
              Manage your monthly customer entries and earnings.
            </p>
          </div>

          <div className="trainer-header-actions">

            <input
              className="month-picker"
              type="month"
              value={month}
              onChange={(e) =>
                setMonth(e.target.value)
              }
            />

            <button
              className="primary-button"
              onClick={() =>
                setModalOpen(true)
              }
            >
              <Plus size={18} />
              Add Joining
            </button>

          </div>

        </div>

        <section className="stats-grid trainer-stats">

          <StatCard
            label="My Entries"
            value={stats.customers}
            icon={Users}
          />

          <StatCard
            label="PT Business"
            value={money(stats.total)}
            icon={Banknote}
          />

          <StatCard
            label="Revenue Share"
            value={money(stats.earning)}
            icon={Activity}
          />

          <StatCard
            label="Salary"
            value={money(profile?.monthly_salary || 0)}
            icon={Banknote}
          />

          <StatCard
            label="Total Earnings"
            value={money(
              stats.earning +
              Number(profile?.monthly_salary || 0)
            )}
            icon={Activity}
          />

        </section>

        <section className="trainer-payment-card">

          <div>

            <span className="section-kicker">
              MONTHLY SETTLEMENT
            </span>

            <h3>
              Payment status
            </h3>

          </div>

          {settlement?.status === 'paid' ? (
            <div className="trainer-paid-status">

              <CheckCircle2 size={20} />

              <div>
                <strong>Paid</strong>

                <span>
                  {money(settlement.amount)}
                  {settlement.paid_at
                    ? ` · ${new Date(
                        settlement.paid_at
                      ).toLocaleDateString('en-IN')}`
                    : ''}
                </span>
              </div>

            </div>
          ) : (
            <div className="trainer-pending-status">

              <Clock3 size={20} />

              <div>
                <strong>Pending</strong>

                <span>
                  {money(
                    stats.earning +
                    Number(profile?.monthly_salary || 0)
                  )} payable
                </span>
              </div>

            </div>
          )}

        </section>

        <section className="content-card trainer-customers-section">

          <div className="card-heading">

            <div>
              <span className="section-kicker">
                MY CUSTOMERS
              </span>

              <h2>
                Monthly entries
              </h2>

              <p className="section-subtext">
                Customers assigned to you for the selected month.
              </p>
            </div>

            <div className="customer-count-box">
              <span>Customers</span>
              <strong>
                {filteredMonthEntries.length}
                {filteredMonthEntries.length !== monthEntries.length
                  ? ` / ${monthEntries.length}`
                  : ''}
              </strong>
            </div>

          </div>

          <div className="trainer-entry-filters">

            <div className="trainer-filter-search">
              <Search size={16} />

              <input
                value={customerSearch}
                onChange={(e) =>
                  setCustomerSearch(e.target.value)
                }
                placeholder="Search customer..."
              />
            </div>

            <select
              value={gymFilter}
              onChange={(e) =>
                setGymFilter(e.target.value)
              }
            >
              <option value="all">
                All Gym
              </option>

              <option value="paid">
                Gym Paid
              </option>

              <option value="not_paid">
                Gym Not Paid
              </option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(e.target.value)
              }
            >
              <option value="all">
                All Payments
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="partial">
                Partial
              </option>

              <option value="pending">
                Pending
              </option>
            </select>

            <select
              value={ptFilter}
              onChange={(e) =>
                setPtFilter(e.target.value)
              }
            >
              <option value="all">
                All PT Amounts
              </option>

              <option value="5000">₹5,000</option>
              <option value="6000">₹6,000</option>
              <option value="7000">₹7,000</option>
              <option value="8000">₹8,000</option>
              <option value="12000">₹12,000</option>
              <option value="14000">₹14,000</option>
              <option value="16000">₹16,000</option>
              <option value="21000">₹21,000</option>
            </select>

            {(customerSearch ||
              gymFilter !== 'all' ||
              paymentFilter !== 'all' ||
              ptFilter !== 'all') && (
              <button
                type="button"
                className="trainer-filter-clear"
                onClick={() => {
                  setCustomerSearch('')
                  setGymFilter('all')
                  setPaymentFilter('all')
                  setPtFilter('all')
                }}
              >
                Clear
              </button>
            )}

          </div>

          {!filteredMonthEntries.length ? (
            <div className="empty-state">
              <strong>No customer entries</strong>

              <span>
                No customers match the selected filters.
              </span>
            </div>
          ) : (
            <div className="trainer-customer-grid">

              {filteredMonthEntries.map((entry) => (
                <article
                  className="trainer-customer-card"
                  key={`${entry.entry_id}-${entry.allocation_month}`}
                >

                  <div className="trainer-customer-head">

                    <div>
                      <span className="trainer-customer-label">
                        CUSTOMER
                      </span>

                      <strong>
                        {entry.customer_name}
                      </strong>
                    </div>

                    <span className={`trainer-customer-payment ${entry.payment_status}`}>
                      {entry.payment_status}
                    </span>

                  </div>

                  <div className="trainer-customer-metrics">

                    <div>
                      <span>Gym</span>
                      <strong>
                        {entry.gym_fee_paid ? 'Paid' : 'Not Paid'}
                      </strong>

                      {entry.gym_fee_paid &&
                        entry.gym_start &&
                        entry.gym_end && (
                          <small>
                            {shortDate(entry.gym_start)} – {shortDate(entry.gym_end)}
                          </small>
                        )}
                    </div>

                    <div>
                      <span>PT</span>
                      <strong>
                        {money(entry.monthly_pt_amount)}
                      </strong>

                      <small>
                        Monthly · Package {money(entry.final_pt_amount)}
                        {' / '}
                        {entry.duration_months}M
                      </small>

                      {Number(entry.pt_amount || 0) > 0 && (
                        <small>
                          {shortDate(entry.pt_start)} – {shortDate(entry.pt_end)}
                        </small>
                      )}
                    </div>

                    <div className="trainer-share-box">
                      <span>My Share</span>
                      <strong>
                        {money(entry.monthly_trainer_share)}
                      </strong>
                    </div>

                  </div>

                  <div className="trainer-customer-footer">

                    <div>
                      <span>Amount received</span>
                      <strong>
                        {money(entry.amount_paid)}
                      </strong>
                    </div>

                    <div>
                      <span>Payment mode</span>
                      <strong>
                        {entry.payment_mode || '—'}
                      </strong>
                    </div>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

          </>
        )}

        {trainerTab === 'activity' && (
          <section className="content-card trainer-activity-page">

            <div className="card-heading">

              <div>
                <span className="section-kicker">
                  ACTIVITY LOG
                </span>

                <h2>
                  My activity
                </h2>

                <p className="section-subtext">
                  Login, logout and customer changes made by you.
                </p>
              </div>

            </div>

            {!activities.length ? (
              <div className="empty-state">
                <strong>No activity yet</strong>
              </div>
            ) : (
              <div className="trainer-activity-list">

                {activities.map((item) => (
                  <div
                    className="trainer-activity-item"
                    key={item.id}
                  >
                    <div className="trainer-activity-copy">

                      <strong>
                        {item.action === 'login' && 'Logged in'}
                        {item.action === 'logout' && 'Logged out'}

                        {item.action === 'insert' &&
                          item.table_name === 'member_entries' &&
                          `Added ${item.new_data?.customer_name || 'customer'}`}

                        {item.action === 'update' &&
                          item.table_name === 'member_entries' &&
                          `Updated ${
                            item.new_data?.customer_name ||
                            item.old_data?.customer_name ||
                            'customer'
                          }`}

                        {item.action === 'delete' &&
                          item.table_name === 'member_entries' &&
                          `Deleted ${item.old_data?.customer_name || 'customer'}`}

                        {item.action === 'insert' &&
                          item.table_name === 'trainer_settlements' &&
                          'Settlement created'}

                        {item.action === 'update' &&
                          item.table_name === 'trainer_settlements' &&
                          'Settlement updated'}
                      </strong>

                      <span>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString('en-IN')
                          : ''}
                      </span>

                    </div>
                  </div>
                ))}

              </div>
            )}

          </section>
        )}
        <div className="trainer-mobile-nav">
          <button
            className={trainerTab === 'home' ? 'active' : ''}
            onClick={() => setTrainerTab('home')}
          >
            Home
          </button>

          <button
            className={trainerTab === 'activity' ? 'active' : ''}
            onClick={() => setTrainerTab('activity')}
          >
            Activity
          </button>
        </div>

      </main>

      <AddEntryModal
        open={modalOpen}
        onClose={() =>
          setModalOpen(false)
        }
        onSaved={loadData}
        currentUserId={profile?.id}
        currentRole="trainer"
      />

    </div>
  )
}
