import {
  Activity,
  Banknote,
  Download,
  FileSpreadsheet,
  Dumbbell,
  Edit3,
  LogOut,
  Menu,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  RefreshCw,
  UserCog,
  UserRound,
  Users,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import StatCard from '../components/StatCard'
import AddEntryModal from '../components/AddEntryModal'
import EditEntryModal from '../components/EditEntryModal'
import TrainerManagerModal from '../components/TrainerManagerModal'
import TrainerSettlements from '../components/TrainerSettlements'
import { exportAdminReport } from '../utils/exportAdminReport'
import { exportAdminExcel, exportAdminCSV } from '../utils/exportData'
import DashboardCharts from '../components/DashboardCharts'
import MobileExports from '../components/MobileExports'
import MobileMemberCards from '../components/MobileMemberCards'
import MobileBottomNav from '../components/MobileBottomNav'
import AppLogo from '../components/AppLogo'
import RenewEntryModal from '../components/RenewEntryModal'
import ExpirySummary from '../components/ExpirySummary'
import { getEntryExpiryStatus } from '../utils/membershipStatus'
import MasterDataManager from '../components/MasterDataManager'

function money(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value) {
  if (!value) return '—'

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value) {
  return new Date(value).toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }
  )
}

const FIELD_NAMES = {
  customer_name: 'Customer Name',
  customer_phone: 'Mobile',
  trainer_id: 'Trainer',
  joined_on: 'Joining Date',
  gym_amount: 'Gym Amount',
  gym_start: 'Gym Start',
  gym_end: 'Gym Expiry',
  pt_amount: 'PT Amount',
  pt_start: 'PT Start',
  pt_end: 'PT Expiry',
  payment_status: 'Payment Status',
  payment_mode: 'Payment Mode',
  amount_paid: 'Amount Paid',
  notes: 'Notes',
  admin_share: 'JK Share',
  trainer_share: 'Trainer Share',
  split_rule: 'Split Rule',
  is_cancelled: 'Cancelled',
  cancellation_reason: 'Cancellation Reason',
}

function getChanges(item) {
  if (
    item.action !== 'update' ||
    !item.old_data ||
    !item.new_data
  ) {
    return []
  }

  return Object.keys(FIELD_NAMES)
    .filter((key) => {
      useEffect(() => {
    if (!month) return

    loadData()
  }, [month])

  return (
        JSON.stringify(item.old_data[key]) !==
        JSON.stringify(item.new_data[key])
      )
    })
    .map((key) => ({
      key,
      label: FIELD_NAMES[key],
      before: item.old_data[key],
      after: item.new_data[key],
    }))
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const now = new Date()

  const defaultMonth =
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`

  const [entries, setEntries] = useState([])
  const [activities, setActivities] =
    useState([])
  const [trainers, setTrainers] =
    useState([])

  const [settlements, setSettlements] =
    useState([])
  const [profile, setProfile] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [modalOpen, setModalOpen] =
    useState(false)

  const [saveMessage, setSaveMessage] =
    useState('')

  const [trainerModalOpen, setTrainerModalOpen] =
    useState(false)

  const [editingEntry, setEditingEntry] =
    useState(null)

  const [renewingEntry, setRenewingEntry] =
    useState(null)

  const [tab, setTab] =
    useState('dashboard')

  const [search, setSearch] =
    useState('')

  const [month, setMonth] =
    useState(defaultMonth)

  const [mobileMenu, setMobileMenu] =
    useState(false)

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
      trainerResult,
      settlementResult,
    ] = await Promise.all([
      supabase
        .from('staff_profiles')
        .select(
          'id, full_name, role, is_active'
        )
        .eq('id', user.id)
        .single(),

      supabase
        .from('member_entries')
        .select(`
          *,
          staff_profiles (
            full_name
          )
        `)
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(250),

      supabase
        .from('staff_profiles')
        .select(
          'id, full_name, role, is_active, monthly_salary, created_at'
        )
        .eq('role', 'trainer')
        .order('full_name'),

      supabase
        .from('trainer_settlements')
        .select('*'),
    ])

    setProfile(profileResult.data)
    setEntries(entriesResult.data || [])
    setActivities(
      activityResult.data || []
    )
    setTrainers(
      trainerResult.data || []
    )

    setSettlements(
      settlementResult.data || []
    )

    setLoading(false)
  }, [navigate])

  useEffect(() => {
    loadData()

    const members = supabase
      .channel('admin-members-live')
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

    const logs = supabase
      .channel('admin-logs-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
        },
        loadData
      )
      .subscribe()

    return () => {
      supabase.removeChannel(members)
      supabase.removeChannel(logs)
    }
  }, [loadData])

  const monthEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (!entry.joined_on) return false

      return (
        entry.joined_on.slice(0, 7) === month
      )
    })
  }, [entries, month])

  const activeMonthEntries =
    useMemo(() => {
      return monthEntries.filter(
        (entry) => !entry.is_cancelled
      )
    }, [monthEntries])

  const stats = useMemo(() => {
    const totalCollected =
      activeMonthEntries.reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.amount_paid || 0
          ),
        0
      )

    const gymRevenue =
      activeMonthEntries.reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.gym_amount || 0
          ),
        0
      )

    const ptRevenue =
      activeMonthEntries.reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.pt_amount || 0
          ),
        0
      )

    const adminShare =
      activeMonthEntries.reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.admin_share || 0
          ),
        0
      )

    const trainerShare =
      activeMonthEntries.reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.trainer_share || 0
          ),
        0
      )

    const pending =
      activeMonthEntries.reduce(
        (sum, entry) => {
          const total =
            Number(
              entry.gym_amount || 0
            ) +
            Number(
              entry.pt_amount || 0
            )

          return (
            sum +
            Math.max(
              total -
                Number(
                  entry.amount_paid || 0
                ),
              0
            )
          )
        },
        0
      )

    return {
      joinings:
        activeMonthEntries.length,

      totalCollected,
      gymRevenue,
      ptRevenue,
      adminShare,
      trainerShare,
      pending,
    }
  }, [activeMonthEntries])

  const filteredEntries =
    useMemo(() => {
      const q = search
        .trim()
        .toLowerCase()

      return monthEntries.filter(
        (entry) => {
          if (!q) return true

          return (
            entry.customer_name
              ?.toLowerCase()
              .includes(q) ||
            entry.customer_phone
              ?.toLowerCase()
              .includes(q) ||
            entry.staff_profiles
              ?.full_name
              ?.toLowerCase()
              .includes(q)
          )
        }
      )
    }, [monthEntries, search])

  async function logout() {
    try {
      await supabase.rpc('log_staff_event', {
        event_action: 'logout',
        event_details: {
          portal: 'admin',
        },
      })
    } catch (error) {
      console.error('Unable to record logout:', error)
    }

    await supabase.auth.signOut()
    navigate('/')
  }

  async function cancelEntry(entry) {
    const reason = window.prompt(
      `Reason for cancelling ${entry.customer_name}'s entry?`
    )

    if (reason === null) return

    if (!reason.trim()) {
      alert(
        'Cancellation reason is required.'
      )
      return
    }

    const { error } = await supabase
      .from('member_entries')
      .update({
        is_cancelled: true,
        cancellation_reason:
          reason.trim(),

        cancelled_at:
          new Date().toISOString(),

        cancelled_by:
          profile.id,
      })
      .eq('id', entry.id)

    if (error) {
      alert(error.message)
      return
    }

    await loadData()
  }

  async function restoreEntry(entry) {
    const confirmed =
      window.confirm(
        `Restore ${entry.customer_name}'s cancelled entry?`
      )

    if (!confirmed) return

    const { data, error } =
      await supabase.rpc(
        'restore_member_entry',
        {
          entry_id: entry.id,
        }
      )

    if (error) {
      alert(
        error.message ||
        'Unable to restore entry.'
      )
      return
    }

    if (!data) {
      alert(
        'Entry was not restored.'
      )
      return
    }

    await loadData()
  }

  function navItem(
    id,
    label,
    Icon
  ) {
    return (
      <button
        className={
          tab === id
            ? 'side-nav-item active'
            : 'side-nav-item'
        }
        onClick={() => {
          setTab(id)
          setMobileMenu(false)
        }}
      >
        <Icon size={18} />
        {label}
      </button>
    )
  }

  if (loading) {
    return (
      <div className="screen-loader">
        <div className="loader-ring" />
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="app-layout">

      <aside
        className={
          mobileMenu
            ? 'sidebar mobile-open'
            : 'sidebar'
        }
      >

        <div className="sidebar-top">

          <AppLogo compact />

          <button
            className="mobile-close"
            onClick={() =>
              setMobileMenu(false)
            }
          >
            <X size={20} />
          </button>

        </div>

        <div className="sidebar-label">
          MANAGEMENT
        </div>

        <nav className="side-nav">

          {navItem(
            'dashboard',
            'Dashboard',
            Activity
          )}

          {navItem(
            'members',
            'Member Entries',
            Users
          )}

          {navItem(
            'trainers',
            'Trainers',
            UserCog
          )}

          {navItem(
            'settlements',
            'Settlements',
            WalletCards
          )}

          {navItem(
            'activity',
            'Activity Log',
            RefreshCcw
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="admin-profile">

            <div className="avatar-circle">
              {profile?.full_name?.[0] ||
                'A'}
            </div>

            <div>
              <strong>
                {profile?.full_name ||
                  'Admin'}
              </strong>

              <span>
                Administrator
              </span>
            </div>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </aside>

      <main className="main-content">

        <header className="dashboard-header">

          <div className="header-left">

            <button
              className="mobile-menu-button"
              onClick={() =>
                setMobileMenu(true)
              }
            >
              <Menu size={21} />
            </button>

            <div>
              <span className="section-kicker">
                ADMIN PORTAL
              </span>

              <h1>
                {tab === 'dashboard' &&
                  'Overview'}

                {tab === 'members' &&
                  'Member Entries'}

                {tab === 'trainers' &&
                  'Trainers'}

                {tab === 'settlements' &&
                  'Settlements'}

                {tab === 'activity' &&
                  'Activity Log'}

                {tab === 'masters' &&
                  'Masters'}
              </h1>
            </div>

          </div>

          <button
            className="mobile-logout-top"
            onClick={logout}
          >
            Logout
          </button>

          <div className="header-actions">

            <input
              className="month-picker"
              type="month"
              value={month}
              onChange={(e) =>
                setMonth(e.target.value)
              }
            />

            <div className="export-group">

              <button
                className="secondary-button export-button"
                onClick={() =>
                  exportAdminReport({
                    month,
                    entries,
                    trainers,
                    settlements,
                  })
                }
              >
                <Download size={16} />
                PDF
              </button>

              <button
                className="secondary-button export-button"
                onClick={() =>
                  exportAdminExcel({
                    month,
                    entries,
                    trainers,
                    settlements,
                  })
                }
              >
                <FileSpreadsheet size={16} />
                Excel
              </button>

              <button
                className="secondary-button export-button"
                onClick={() =>
                  exportAdminCSV({
                    month,
                    entries,
                  })
                }
              >
                CSV
              </button>

            </div>

            <button
              className="secondary-button"
              onClick={() =>
                setTab('masters')
              }
            >
              Masters
            </button>

            <button
              className="primary-button"
              onClick={() =>
                setModalOpen(true)
              }
            >
              <Plus size={18} />
              Add Entry
            </button>

          </div>

        </header>

        {saveMessage && (
          <div className="save-success-message">
            {saveMessage}
          </div>
        )}

        <div className="mobile-tab-strip">
          <button
            className={tab === 'dashboard' ? 'mobile-tab-chip active' : 'mobile-tab-chip'}
            onClick={() => setTab('dashboard')}
          >
            Dashboard
          </button>

          <button
            className={tab === 'members' ? 'mobile-tab-chip active' : 'mobile-tab-chip'}
            onClick={() => setTab('members')}
          >
            Members
          </button>

          <button
            className={tab === 'trainers' ? 'mobile-tab-chip active' : 'mobile-tab-chip'}
            onClick={() => setTab('trainers')}
          >
            Trainers
          </button>

          <button
            className={tab === 'settlements' ? 'mobile-tab-chip active' : 'mobile-tab-chip'}
            onClick={() => setTab('settlements')}
          >
            Settlements
          </button>

          <button
            className={tab === 'activity' ? 'mobile-tab-chip active' : 'mobile-tab-chip'}
            onClick={() => setTab('activity')}
          >
            Activity
          </button>

          <button
            className={tab === 'masters' ? 'mobile-tab-chip active' : 'mobile-tab-chip'}
            onClick={() => setTab('masters')}
          >
            Masters
          </button>
        </div>


        {tab === 'dashboard' && (
          <>

            <section className="stats-grid">

              <StatCard
                label="Month Joinings"
                value={stats.joinings}
                subtext="Active entries"
                icon={Users}
              />

              <StatCard
                label="Amount Collected"
                value={money(
                  stats.totalCollected
                )}
                subtext="Actual received"
                icon={Banknote}
              />

              <StatCard
                label="JK Fitness Share"
                value={money(
                  stats.adminShare
                )}
                subtext="Auto calculated"
                icon={Dumbbell}
              />

              <StatCard
                label="Trainer Share"
                value={money(
                  stats.trainerShare
                )}
                subtext="Trainer earnings"
                icon={UserRound}
              />

            </section>

            <ExpirySummary
              entries={entries}
            />

            <MobileExports
              onPDF={() =>
                exportAdminReport({
                  month,
                  entries,
                  trainers,
                  settlements,
                })
              }
              onExcel={() =>
                exportAdminExcel({
                  month,
                  entries,
                  trainers,
                  settlements,
                })
              }
              onCSV={() =>
                exportAdminCSV({
                  month,
                  entries,
                })
              }
            />

            <DashboardCharts
              entries={entries}
              selectedMonth={month}
            />

            <section className="revenue-strip">

              <div>
                <span>Gym Value</span>
                <strong>
                  {money(
                    stats.gymRevenue
                  )}
                </strong>
              </div>

              <div>
                <span>PT Value</span>
                <strong>
                  {money(
                    stats.ptRevenue
                  )}
                </strong>
              </div>

              <div>
                <span>Pending</span>
                <strong>
                  {money(stats.pending)}
                </strong>
              </div>

            </section>

            <section className="content-card">

              <div className="card-heading">

                <div>
                  <span className="section-kicker">
                    LIVE
                  </span>

                  <h2>
                    Recent entries
                  </h2>
                </div>

                <button
                  className="text-button"
                  onClick={() =>
                    setTab('members')
                  }
                >
                  View all
                </button>

              </div>

              <div className="desktop-member-view">
                <EntriesTable
                  entries={
                    activeMonthEntries.slice(
                      0,
                      8
                    )
                  }
                  onEdit={setEditingEntry}
                  onCancel={cancelEntry}
                  onRestore={restoreEntry}
                  onRenew={setRenewingEntry}
                />
              </div>

              <div className="mobile-member-view">
                <MobileMemberCards
                  entries={
                    activeMonthEntries.slice(
                      0,
                      8
                    )
                  }
                  onEdit={setEditingEntry}
                  onCancel={cancelEntry}
                  onRestore={restoreEntry}
                  onRenew={setRenewingEntry}
                />
              </div>

            </section>

          </>
        )}

        {tab === 'members' && (
          <section className="content-card">

            <div className="card-heading responsive-heading">

              <div>
                <span className="section-kicker">
                  DATABASE
                </span>

                <h2>
                  Customer entries
                </h2>
              </div>

              <div className="search-box">
                <Search size={17} />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search..."
                />
              </div>

            </div>

            <div className="desktop-member-view">
              <EntriesTable
                entries={filteredEntries}
                onEdit={setEditingEntry}
                onCancel={cancelEntry}
                onRestore={restoreEntry}
                onRenew={setRenewingEntry}
              />
            </div>

            <div className="mobile-member-view">
              <MobileMemberCards
                entries={filteredEntries}
                onEdit={setEditingEntry}
                onCancel={cancelEntry}
                onRestore={restoreEntry}
                onRenew={setRenewingEntry}
              />
            </div>

          </section>
        )}

        {tab === 'trainers' && (
          <section className="content-card">

            <div className="card-heading">

              <div>
                <span className="section-kicker">
                  STAFF
                </span>

                <h2>
                  Trainer accounts
                </h2>
              </div>

              <button
                className="primary-button"
                onClick={() =>
                  setTrainerModalOpen(
                    true
                  )
                }
              >
                <Plus size={17} />
                Manage Trainers
              </button>

            </div>

            {!trainers.length ? (
              <div className="empty-state">
                <UserCog size={34} />
                <strong>
                  No trainers
                </strong>

                <span>
                  Create your first trainer.
                </span>
              </div>
            ) : (
              <div className="admin-trainer-grid">

                {trainers.map(
                  (trainer) => {

                    const trainerEntries =
                      entries.filter(
                        (entry) =>
                          entry.trainer_id ===
                            trainer.id &&
                          !entry.is_cancelled
                      )

                    const revenueShare =
                      trainerEntries.reduce(
                        (sum, entry) =>
                          sum +
                          Number(
                            entry.trainer_share ||
                              0
                          ),
                        0
                      )

                    const salary =
                      Number(
                        trainer.monthly_salary || 0
                      )

                    const totalEarnings =
                      revenueShare + salary

                    return (
                      <div
                        className="admin-trainer-card"
                        key={trainer.id}
                      >
                        <div className="avatar-circle big">
                          {trainer.full_name?.[0] ||
                            'T'}
                        </div>

                        <strong>
                          {trainer.full_name}
                        </strong>

                        <span
                          className={
                            trainer.is_active
                              ? 'trainer-status active'
                              : 'trainer-status'
                          }
                        >
                          {trainer.is_active
                            ? 'Active'
                            : 'Disabled'}
                        </span>

                        <div className="trainer-card-stats trainer-card-stats-four">

                          <div>
                            <span>Entries</span>
                            <strong>
                              {trainerEntries.length}
                            </strong>
                          </div>

                          <div>
                            <span>Share</span>
                            <strong>
                              {money(revenueShare)}
                            </strong>
                          </div>

                          <div>
                            <span>Salary</span>
                            <strong>
                              {money(salary)}
                            </strong>
                          </div>

                          <div>
                            <span>Total Earnings</span>
                            <strong className="trainer-total-highlight">
                              {money(totalEarnings)}
                            </strong>
                          </div>

                        </div>
                      </div>
                    )
                  }
                )}

              </div>
            )}

          </section>
        )}


        {tab === 'settlements' && (
          <TrainerSettlements
            trainers={trainers}
            entries={entries}
            selectedMonth={month}
            onChanged={loadData}
          />
        )}

        {tab === 'activity' && (
          <section className="content-card">

            <div className="card-heading">

              <div>
                <span className="section-kicker">
                  AUDIT TRAIL
                </span>

                <h2>
                  All changes
                </h2>
              </div>

            </div>

            <ActivityList
              activities={
                activities
              }
            />

          </section>
        )}

      </main>

      <AddEntryModal
        open={modalOpen}

        onClose={() =>
          setModalOpen(false)
        }

        onSaved={(saved) => {
          const savedMonth =
            saved?.joined_on?.slice(0, 7)

          if (savedMonth) {
            const [year, monthNumber] =
              savedMonth.split('-')

            const monthName =
              new Date(
                Number(year),
                Number(monthNumber) - 1,
                1
              ).toLocaleString('en-IN', {
                month: 'long',
                year: 'numeric',
              })

            setMonth(savedMonth)
            setTab('members')

            setSaveMessage(
              `Entry saved under ${monthName}`
            )

            window.setTimeout(() => {
              setSaveMessage('')
            }, 3500)
          }

          loadData()
        }}

        currentUserId={profile?.id}
        currentRole="admin"
      />

      <EditEntryModal
        open={
          Boolean(editingEntry)
        }
        entry={editingEntry}
        trainers={trainers}
        onClose={() =>
          setEditingEntry(null)
        }
        onSaved={loadData}
      />

      <RenewEntryModal
        open={Boolean(renewingEntry)}
        entry={renewingEntry}
        currentRole="admin"
        currentUserId={profile?.id}
        onClose={() =>
          setRenewingEntry(null)
        }
        onSaved={loadData}
      />

      <MobileBottomNav
        active={tab}
        onChange={setTab}
      />

      <TrainerManagerModal
        open={trainerModalOpen}
        onClose={() =>
          setTrainerModalOpen(false)
        }
        onChanged={loadData}
      />

    </div>
  )
}

function EntriesTable({
  entries,
  onEdit,
  onCancel,
  onRestore,
  onRenew,
}) {
  if (!entries.length) {
    return (
      <div className="empty-state">
        <Users size={34} />
        <strong>No entries</strong>
        <span>
          No entries for this month.
        </span>
      </div>
    )
  }

  return (
    <div className="table-wrap">

      <table className="data-table">

        <thead>
          <tr>
            <th>Customer</th>
            <th>Gym</th>
            <th>PT</th>
            <th>Split</th>
            <th>JK Share</th>
            <th>Trainer Share</th>
            <th>Paid</th>
            <th>Status</th>
            <th>Membership</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {entries.map((entry) => (
            <tr
              key={entry.id}
              className={
                entry.is_cancelled
                  ? 'cancelled-row'
                  : ''
              }
            >

              <td>
                <div className="customer-cell">

                  <strong>
                    {entry.customer_name}
                  </strong>

                  <span>
                    {formatDate(entry.joined_on)}
                  </span>

                  {entry.is_cancelled && (
                    <small className="cancelled-label">
                      Cancelled
                    </small>
                  )}

                </div>
              </td>

              <td>
                <strong>
                  {entry.gym_fee_paid
                    ? 'Paid'
                    : 'Not Paid'}
                </strong>

                {entry.gym_fee_paid &&
                  entry.gym_start &&
                  entry.gym_end && (
                    <small className="date-small">
                      {formatDate(
                        entry.gym_start
                      )}
                      {' → '}
                      {formatDate(
                        entry.gym_end
                      )}
                    </small>
                  )}
              </td>

              <td>
                <strong>
                  {money(
                    entry.pt_amount
                  )}
                </strong>

                {Number(
                  entry.pt_amount
                ) > 0 && (
                  <small className="date-small">
                    {formatDate(
                      entry.pt_start
                    )}
                    {' → '}
                    {formatDate(
                      entry.pt_end
                    )}
                  </small>
                )}
              </td>

              <td>
                <span className="split-pill">

                  {Number(entry.pt_amount || 0) > 0
                    ? entry.gym_fee_paid
                      ? '50 / 50'
                      : '60 / 40'
                    : '—'}

                </span>
              </td>

              <td>
                {money(
                  entry.admin_share
                )}
              </td>

              <td>
                <div className="customer-cell">

                  <strong>
                    {money(
                      entry.trainer_share
                    )}
                  </strong>

                  <span>
                    {entry.staff_profiles
                      ?.full_name ||
                      'No trainer'}
                  </span>

                </div>
              </td>

              <td>
                {money(
                  entry.amount_paid
                )}
              </td>

              <td>
                <span
                  className={`status-pill ${entry.payment_status}`}
                >
                  {entry.payment_status}
                </span>
              </td>

              <td>
                <MembershipStatusCell entry={entry} />
              </td>

              <td>
                <div className="table-actions">

                  {!entry.is_cancelled && (
                    <>
                      <button
                        title="Renew"
                        onClick={() =>
                          onRenew(entry)
                        }
                      >
                        <RefreshCw size={15} />
                      </button>

                      <button
                        title="Edit"
                        onClick={() =>
                          onEdit(entry)
                        }
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        className="danger"
                        title="Cancel Entry"
                        onClick={() =>
                          onCancel(entry)
                        }
                      >
                        <XCircle size={15} />
                      </button>
                    </>
                  )}

                  {entry.is_cancelled && (
                    <button
                      title="Restore"
                      onClick={() =>
                        onRestore(entry)
                      }
                    >
                      <RotateCcw size={15} />
                    </button>
                  )}

                </div>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}


function MembershipStatusCell({ entry }) {
  const { gym, pt } =
    getEntryExpiryStatus(entry)

  return (
    <div className="membership-status-stack">

      {gym && (
        <div>
          <span className="membership-type">
            Gym
          </span>

          <span
            className={`membership-status ${gym.type}`}
          >
            {gym.label}
          </span>
        </div>
      )}

      {pt && (
        <div>
          <span className="membership-type">
            PT
          </span>

          <span
            className={`membership-status ${pt.type}`}
          >
            {pt.label}
          </span>
        </div>
      )}

    </div>
  )
}

function ActivityList({
  activities,
}) {
  if (!activities.length) {
    return (
      <div className="empty-state">
        <Activity size={34} />
        <strong>
          No activity yet
        </strong>
      </div>
    )
  }

  return (
    <div className="activity-list">

      {activities.map((item) => {

        const isSessionEvent =
          item.table_name === 'staff_session'

        const customer =
          item.new_data?.customer_name ||
          item.old_data?.customer_name ||
          (isSessionEvent ? '' : 'Customer')

        const changes =
          getChanges(item)

        return (
          <div
            className="activity-detailed-row"
            key={item.id}
          >

            <div
              className={`activity-dot ${item.action}`}
            />

            <div className="activity-detailed-content">

              <div className="activity-title">

                <strong>
                  {item.actor_name ||
                    (item.actor_role === 'admin'
                      ? 'Admin'
                      : item.actor_role === 'trainer'
                        ? 'Trainer'
                        : 'System')}
                </strong>

                <span>
                  {item.action === 'login' && ' logged in'}
                  {item.action === 'logout' && ' logged out'}

                  {item.action === 'insert' && item.table_name === 'member_entries' && ' added '}
                  {item.action === 'update' &&
                    item.table_name === 'member_entries' &&
                    item.old_data?.is_cancelled === false &&
                    item.new_data?.is_cancelled === true &&
                    ' cancelled '}

                  {item.action === 'update' &&
                    item.table_name === 'member_entries' &&
                    item.old_data?.is_cancelled === true &&
                    item.new_data?.is_cancelled === false &&
                    ' restored '}

                  {item.action === 'update' &&
                    item.table_name === 'member_entries' &&
                    item.old_data?.is_cancelled === item.new_data?.is_cancelled &&
                    ' updated '}
                  {item.action === 'delete' && item.table_name === 'member_entries' && ' deleted '}

                  {item.action === 'insert' && item.table_name === 'trainer_settlements' && ' created a trainer settlement'}
                  {item.action === 'update' && item.table_name === 'trainer_settlements' && ' updated a trainer settlement'}
                  {item.action === 'delete' && item.table_name === 'trainer_settlements' && ' deleted a trainer settlement'}

                  {item.action === 'insert' && item.table_name === 'staff_profiles' && ' created a staff profile'}
                  {item.action === 'update' && item.table_name === 'staff_profiles' && ' updated a staff profile'}
                  {item.action === 'delete' && item.table_name === 'staff_profiles' && ' deleted a staff profile'}

                  {customer && <b>{customer}</b>}
                </span>

              </div>

              {item.table_name === 'staff_session' && (
                <div className="session-detail">
                  <span>
                    {item.new_data?.portal
                      ? `Portal: ${item.new_data.portal}`
                      : 'Staff session'}
                  </span>
                </div>
              )}

              {changes.length > 0 && (
                <div className="change-list">

                  {changes.map(
                    (change) => (
                      <div
                        className="change-item"
                        key={change.key}
                      >
                        <span>
                          {change.label}
                        </span>

                        <del>
                          {String(
                            change.before ??
                              '—'
                          )}
                        </del>

                        <span className="change-arrow">
                          →
                        </span>

                        <ins>
                          {String(
                            change.after ??
                              '—'
                          )}
                        </ins>
                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            <time>
              {formatTime(
                item.created_at
              )}
            </time>

          </div>
        )
      })}

    </div>
  )
}
